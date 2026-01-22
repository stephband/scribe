#!/usr/bin/env node

/**
test-musicxml.js
Tests MusicXML conversion by converting all test JSON files.
**/

import '../shim.js';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { renderMusicXML } from '../../modules/render-xml.js';


const dataDir = resolve('data');
const outputDir = resolve('scripts/test/output');

// Ensure output directory exists
import { mkdirSync } from 'node:fs';
try {
    readdirSync(outputDir);
} catch {
    mkdirSync(outputDir, { recursive: true });
}

console.log('Testing MusicXML conversion...\n');

// Find all JSON files in data directory
const files = readdirSync(dataDir).filter(f => f.endsWith('.json'));

let passed = 0;
let failed = 0;

files.forEach((file) => {
    const inputPath = resolve(dataDir, file);
    const outputPath = resolve(outputDir, file.replace('.json', '.xml'));

    try {
        // Read and parse JSON
        const jsonString = readFileSync(inputPath, 'utf-8');
        const data = JSON.parse(jsonString);

        // Detect clef type based on filename
        let clef = 'treble';
        if (['ae-fond-kiss.json', 'in-the-bleak-midwinter.json'].includes(file)) {
            clef = 'piano';
        } else if (file.includes('drum')) {
            clef = 'drum';
        }

        // Convert to MusicXML
        const xml = renderMusicXML(data, [], clef);

        // Basic validation checks
        const checks = [
            { test: xml.includes('<?xml version'), msg: 'Has XML declaration' },
            { test: xml.includes('<score-partwise'), msg: 'Has score-partwise root' },
            { test: xml.includes('<part-list>'), msg: 'Has part-list' },
            { test: xml.includes('<measure'), msg: 'Has measures' },
            { test: xml.includes('</score-partwise>'), msg: 'Closes properly' }
        ];

        const checkResults = checks.map(c => c.test);
        const allPassed = checkResults.every(r => r);

        if (allPassed) {
            // Write output file
            writeFileSync(outputPath, xml, 'utf-8');
            console.log(`✓ ${file}`);
            checks.forEach(c => console.log(`  - ${c.msg}`));
            passed++;
        } else {
            console.log(`✗ ${file}`);
            checks.forEach((c, i) => {
                console.log(`  ${checkResults[i] ? '✓' : '✗'} ${c.msg}`);
            });
            failed++;
        }

        console.log('');
    } catch (error) {
        console.log(`✗ ${file}`);
        console.log(`  Error: ${error.message}`);
        console.log(`  Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
        console.log('');
        failed++;
    }
});

console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`Output files written to: ${outputDir}`);

process.exit(failed > 0 ? 1 : 0);
