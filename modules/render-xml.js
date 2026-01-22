
import { toRootName, toRootNumber } from 'midi/note.js';
import SequenceIterator from 'sequence/sequence-iterator.js';
import Stave            from './stave.js';
import createBars       from './create-bars.js';
import createXML        from './create-xml.js';
import config           from './config.js';


/**
Helpers
**/

function isInitialMeterEvent(event) {
    return event[0] <= 0 && event[1] === 'meter';
}

function isInitialKeyEvent(event) {
    return event[0] <= 0 && event[1] === 'key';
}

function keyNumberToFifths(keyNumber) {
    // Key number in Scribe is on circle of fifths where C=0
    // MusicXML fifths: -7 to 7 (flats negative, sharps positive)
    return keyNumber;
}

function getPartNames(bars) {
    // Collect all unique part names from symbols
    const partNames = new Set();
    bars.forEach((bar) => {
        bar.symbols.forEach((symbol) => {
            if (symbol.part && typeof symbol.part === 'object' && symbol.part.name) {
                partNames.add(symbol.part.name);
            }
        });
    });
    // If no parts found, default to 'main'
    return partNames.size > 0 ? Array.from(partNames) : ['main'];
}

function shouldCombineParts(staveType) {
    // Piano and drum staves have multiple Scribe parts that should be
    // combined into one MusicXML part with multiple staves
    return staveType === 'piano' || staveType === 'drum' || staveType === 'percussion';
}

function getStaffNumber(partName, staveType) {
    // Map Scribe part names to staff numbers for multi-staff instruments
    if (staveType === 'piano') {
        // Right hand parts: rh, soprano, alto, tenor (upper staff)
        // Left hand parts: lh, bass (lower staff)
        if (partName === 'rh' || partName === 'soprano' || partName === 'alto' || partName === 'tenor') {
            return 1;
        }
        if (partName === 'lh' || partName === 'bass') {
            return 2;
        }
        // Default based on part name containing these keywords
        if (partName.includes('right') || partName.includes('upper') || partName.includes('treble')) {
            return 1;
        }
        return 2;
    }
    if (staveType === 'drum' || staveType === 'percussion') {
        // All drum parts go on staff 1
        return 1;
    }
    return 1;
}

function groupSymbolsByPart(symbols, partName) {
    // Get note and rest symbols for this part, grouped by beat
    const noteSymbols = symbols.filter(s =>
        (s.type === 'note' || s.type === 'rest') &&
        s.part && s.part.name && s.part.name === partName
    );

    // Group by beat for chord detection
    const groups = {};
    noteSymbols.forEach((symbol) => {
        const beat = symbol.beat.toFixed(4);
        if (!groups[beat]) groups[beat] = [];
        groups[beat].push(symbol);
    });

    // Convert to array and sort by beat
    return Object.keys(groups)
        .sort((a, b) => parseFloat(a) - parseFloat(b))
        .map(beat => groups[beat]);
}


/**
renderMusicXML(data, excludes, clef, keyname, meter, duration, transpose, displace, settings)
Generates MusicXML 4.0 string from sequence data. Returns a complete
score-partwise document.
**/

export function renderMusicXML(data, excludes = [], clef = 'treble', keyname = 'C', meter, duration = Infinity, transpose = 0, displace = 0, settings = config) {
    const events = data.events;

    // If events contains no initial meter and meter is set, insert a meter event
    const meterEvent = events.find(isInitialMeterEvent);
    if (!meterEvent && meter) events.unshift([0, 'meter', meter[2], meter[3]]);

    // If events contains no initial key and keyname is set, insert a key event
    const keyEvent = events.find(isInitialKeyEvent);
    if (!keyEvent && keyname) events.unshift([0, 'key', keyname]);

    // Get the stave controller
    const stave = Stave[clef || 'treble'];

    // Make transforms list
    const transforms = [];
    if (transpose) transforms.push("transpose", transpose);
    if (displace)  transforms.push("displace", displace);

    // Create sequence object
    const sequence = new SequenceIterator(events, data.sequences, transforms);

    // Create bar objects
    const bars = createBars(sequence, excludes, stave, settings);

    // Determine divisions - use 4 for sixteenth note resolution
    const divisions = 4;

    // Get part names
    const partNames = getPartNames(bars);
    if (partNames.length === 0) partNames.push('main');

    // For drum/piano staves, combine all parts into one MusicXML part
    const combineParts = shouldCombineParts(stave.type);
    const xmlPartNames = combineParts ? [stave.type] : partNames;

    // Build part-list
    const partListXML = xmlPartNames.map((name, index) => {
        const partId = `P${ index + 1 }`;
        const displayName = name === 'drum' ? 'Drums' :
                           name === 'percussion' ? 'Percussion' :
                           name === 'piano' ? 'Piano' :
                           name;
        return `    <score-part id="${ partId }">
      <part-name>${ displayName }</part-name>
    </score-part>`;
    }).join('\n');

    // Build parts (score-partwise: parts contain measures)
    const partsXML = xmlPartNames.map((xmlPartName, partIndex) => {
        const partId = `P${ partIndex + 1 }`;

        // Get the list of Scribe parts to include in this XML part
        const scribePartsForXMLPart = combineParts ? partNames : [xmlPartName];

        // Track where bar repeat sections start for proper symbol placement
        let repeatSectionStart = -1;

        // Build measures for this part, expanding barrepeats into multiple measures
        const measuresXML = [];
        let outputMeasureNumber = 1;

        bars.forEach((bar, barIndex) => {
            // Build attributes for first measure
            const attributesXML = outputMeasureNumber === 1 ? (() => {
                const fifths = keyNumberToFifths(bar.key);
                const timesig = bar.symbols.find((s) => s.type === 'timesig');

                // For piano, add staves count and multiple clefs
                const stavesCount = stave.type === 'piano' ? 2 : 1;
                const stavesXML = stavesCount > 1 ? `        <staves>${ stavesCount }</staves>\n` : '';

                // Generate clef XML - for piano, need two clefs
                let clefXML;
                if (stave.type === 'piano') {
                    clefXML = `        <clef number="1">
          <sign>G</sign>
          <line>2</line>
        </clef>
        <clef number="2">
          <sign>F</sign>
          <line>4</line>
        </clef>
`;
                } else {
                    clefXML = createXML({ type: 'clef', clef: bar.stave.type }, divisions, stave.type)
                        .split('\n')
                        .map(line => '      ' + line)
                        .join('\n');
                }

                const timeXML = timesig ? createXML(timesig, divisions, stave.type)
                    .split('\n')
                    .map(line => '      ' + line)
                    .join('\n') : '';

                return `      <attributes>
        <divisions>${ divisions }</divisions>
${ stavesXML }        <key>
          <fifths>${ fifths }</fifths>
        </key>
${ timeXML }${ clefXML }      </attributes>
`;
            })() : '';

            // Check if this bar contains a bar repeat symbol
            const barRepeat = bar.symbols.find(s => s.type === 'barrepeat');

            // Track start of repeat section
            if (barRepeat && repeatSectionStart === -1) {
                repeatSectionStart = barIndex;
            } else if (!barRepeat && repeatSectionStart !== -1) {
                repeatSectionStart = -1;
            }

            // For multi-bar repeats, show symbol on first bar of each repeat cycle
            // e.g., for 2-bar repeat starting at bar 10: show on bars 10, 12, 14, etc.
            const shouldShowRepeat = barRepeat &&
                (barRepeat.count === 1 ||
                 (barIndex - repeatSectionStart) % barRepeat.count === 0);

            // Collect harmony symbols by beat for proper positioning
            const harmoniesByBeat = {};
            const seenChordBeats = new Set();
            bar.symbols.filter(s => s.type === 'chord').forEach(symbol => {
                const beatKey = symbol.beat.toFixed(4);
                if (!seenChordBeats.has(beatKey)) {
                    seenChordBeats.add(beatKey);
                    if (!harmoniesByBeat[beatKey]) harmoniesByBeat[beatKey] = [];
                    harmoniesByBeat[beatKey].push(symbol);
                }
            });

            // For multi-staff parts like piano, need to write each staff sequentially
            // with <backup> elements between them
            const notesByStaff = {};
            scribePartsForXMLPart.forEach((scribePartName) => {
                const staffNumber = getStaffNumber(scribePartName, stave.type);
                if (!notesByStaff[staffNumber]) notesByStaff[staffNumber] = [];

                const noteGroups = groupSymbolsByPart(bar.symbols, scribePartName);
                noteGroups.forEach(group => {
                    group.staffNumber = staffNumber;
                    group.partName = scribePartName;
                });
                notesByStaff[staffNumber] = notesByStaff[staffNumber].concat(noteGroups);
            });

            // Sort notes within each staff by beat
            Object.keys(notesByStaff).forEach(staffNum => {
                notesByStaff[staffNum].sort((a, b) => {
                    const beatA = a[0] ? parseFloat(a[0].beat) : 0;
                    const beatB = b[0] ? parseFloat(b[0].beat) : 0;
                    return beatA - beatB;
                });
            });

            const notesXML = barRepeat ?
                (shouldShowRepeat ?
                    `      <attributes>
        <measure-style>
          <measure-repeat type="start" slashes="${ barRepeat.count || 1 }">${ barRepeat.count || 1 }</measure-repeat>
        </measure-style>
      </attributes>
      <note>
        <rest measure="yes"/>
        <duration>${ Math.round(bar.duration * divisions) }</duration>
      </note>
` :
                    `      <note>
        <rest measure="yes"/>
        <duration>${ Math.round(bar.duration * divisions) }</duration>
      </note>
`) :
                Object.keys(notesByStaff).length > 0 ? (() => {
                    // Write notes for each staff, using <backup> between staves
                    const staffNumbers = Object.keys(notesByStaff).sort();
                    let xml = '';

                    staffNumbers.forEach((staffNum, staffIndex) => {
                        const noteGroups = notesByStaff[staffNum];

                        // Write notes for this staff, interleaving harmonies
                        let currentBeat = 0;
                        noteGroups.forEach((group) => {
                            const groupBeat = group[0] ? parseFloat(group[0].beat) : 0;
                            const beatKey = groupBeat.toFixed(4);

                            // Insert harmonies for this beat (only on first staff)
                            if (staffIndex === 0 && harmoniesByBeat[beatKey]) {
                                harmoniesByBeat[beatKey].forEach(harmonySymbol => {
                                    xml += createXML(harmonySymbol, divisions, stave.type).split('\n').map(line => '      ' + line).join('\n');
                                });
                                delete harmoniesByBeat[beatKey]; // Mark as written
                            }

                            group.forEach((symbol, i) => {
                                let noteXML = createXML(symbol, divisions, stave.type);
                                // Add <chord/> element for notes after the first
                                if (i > 0 && symbol.type === 'note') {
                                    noteXML = noteXML.replace('<note>\n', '<note>\n    <chord/>\n');
                                }
                                // Add staff number for multi-staff parts
                                if (parseInt(staffNum) > 1 || (combineParts && stave.type === 'piano')) {
                                    noteXML = noteXML.replace('</note>\n', `    <staff>${ staffNum }</staff>\n  </note>\n`);
                                }
                                xml += noteXML.split('\n').map(line => '      ' + line).join('\n');
                            });
                        });

                        // Add <backup> to return to start of measure for next staff
                        // (except after the last staff)
                        if (staffIndex < staffNumbers.length - 1) {
                            const measureDuration = Math.round(bar.duration * divisions);
                            xml += `      <backup>
        <duration>${ measureDuration }</duration>
      </backup>
`;
                        }
                    });

                    return xml;
                })() :
                // Empty part - add a measure rest
                `      <note>
        <rest measure="yes"/>
        <duration>${ Math.round(bar.duration * divisions) }</duration>
      </note>
`;

            // Harmonies are now interleaved with notes above
            const harmonyXML = '';

            // If barrepeat, expand it into count measures
            if (barRepeat) {
                const repeatCount = barRepeat.count || 1;
                for (let i = 0; i < repeatCount; i++) {
                    const isFirstInGroup = (outputMeasureNumber - repeatSectionStart - 1) % repeatCount === 0;
                    const measureRepeatXML = isFirstInGroup && shouldShowRepeat ? `      <attributes>
        <measure-style>
          <measure-repeat type="start" slashes="${ repeatCount }">${ repeatCount }</measure-repeat>
        </measure-style>
      </attributes>
` : '';

                    measuresXML.push(`    <measure number="${ outputMeasureNumber }">
${ attributesXML }${ measureRepeatXML }      <note>
        <rest measure="yes"/>
        <duration>${ Math.round(bar.duration * divisions) }</duration>
      </note>
${ harmonyXML }    </measure>`);
                    outputMeasureNumber++;
                }
            } else {
                measuresXML.push(`    <measure number="${ outputMeasureNumber }">
${ attributesXML }${ notesXML }${ harmonyXML }    </measure>`);
                outputMeasureNumber++;
            }
        });

        return `  <part id="${ partId }">
${ measuresXML.join('\n') }
  </part>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC
    "-//Recordare//DTD MusicXML 4.0 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">${ data.name ? `
  <work>
    <work-title>${ data.name }</work-title>
  </work>` : '' }
  <part-list>
${ partListXML }
  </part-list>
${ partsXML }
</score-partwise>
`;
}


/**
renderXML(data, excludes, clef, keyname, meter, duration, transpose, displace, settings)
Alias for renderMusicXML for consistency with render.js naming.
**/

export function renderXML(data, excludes, clef, keyname, meter, duration, transpose, displace, settings) {
    return renderMusicXML(data, excludes, clef, keyname, meter, duration, transpose, displace, settings);
}
