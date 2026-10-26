import Sequence from "sequence/module.js";
import { toNoteNumber } from "midi/note.js";

function convertPitch(name) {
    return name
        .replace("n", "")
        .replace("ss", "𝄪")
        .replace("s", "♯")
        .replace("ff", "𝄫")
        .replace("f", "♭");
}

const dir = "data/opnd-m-noisy";
const files = [];

for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile && entry.name.endsWith(".opnd-m")) {
        files.push(entry.name);
    }
}

files.sort();
console.log(`Found ${files.length} .opnd-m files to process.`);

let totalProcessedFiles = 0;
let totalProcessedNotes = 0;
let parseErrors = 0;

const startTime = performance.now();

for (const filename of files) {
    const basename = filename.replace(/\.opnd-m$/, "");
    const raw = await Deno.readTextFile(`${dir}/${filename}`);

    const regex = /\((\d+)\s+"([^"]+)"\s+(\d+)\s+(\d+)\)/g;
    const voices = new Map();
    let match;
    let fileNoteCount = 0;

    while ((match = regex.exec(raw)) !== null) {
        const onset = parseInt(match[1], 10);
        const pitchStr = convertPitch(match[2]);
        const duration = parseInt(match[3], 10);
        const voice = parseInt(match[4], 10);
        const pitchNum = toNoteNumber(pitchStr);

        if (!voices.has(voice)) {
            voices.set(voice, []);
        }
        voices.get(voice).push({ onset, pitch: pitchStr, pitchNum, duration });
        fileNoteCount++;
    }

    const voiceIds = Array.from(voices.keys()).sort((a, b) => a - b);

    // Build Sequence txt lines
    const lines = [];
    lines.push(`# ${basename}`);

    // Top-level cues for each voice from beat 0
    for (const v of voiceIds) {
        lines.push(`0 sequence ${v} voice-${v} 0`);
    }

    // Voice sub-sequences
    for (const v of voiceIds) {
        lines.push(`\n#${v} Voice ${v}`);
        const notes = voices.get(v);
        notes.sort((a, b) => a.onset - b.onset || a.pitchNum - b.pitchNum);
        for (const note of notes) {
            lines.push(`${note.onset} ${note.pitch} ${note.duration}`);
        }
    }

    const sequenceText = lines.join("\n") + "\n";
    const outPath = `${dir}/${basename}.sequence`;
    await Deno.writeTextFile(outPath, sequenceText);

    // Validate with Sequence.parse
    try {
        const parsed = Sequence.parse(sequenceText);
        let parsedNotes = 0;
        if (parsed.sequences) {
            for (const s of parsed.sequences) {
                parsedNotes += s.events.length;
            }
        }
        if (parsedNotes !== fileNoteCount) {
            console.error(`Count mismatch in ${filename}: raw=${fileNoteCount}, parsed=${parsedNotes}`);
            parseErrors++;
        }
    } catch (err) {
        console.error(`Failed to parse ${outPath}:`, err.message);
        parseErrors++;
    }

    totalProcessedFiles++;
    totalProcessedNotes += fileNoteCount;
}

const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
console.log(`\n========================================`);
console.log(`Conversion Complete!`);
console.log(`Files converted: ${totalProcessedFiles}`);
console.log(`Total notes:     ${totalProcessedNotes}`);
console.log(`Parse errors:    ${parseErrors}`);
console.log(`Elapsed time:    ${elapsed}s`);
console.log(`========================================`);
