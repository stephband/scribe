#!/usr/bin/env node

/**
sequencejson-to-musicxml.js
Converts Sequence JSON to MusicXML 4.0 format.

Usage:
    node scripts/sequencejson-to-musicxml.js input.json [output.xml]
    deno run --allow-read --allow-write scripts/sequencejson-to-musicxml.js input.json [output.xml]
**/

import './shim.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderMusicXML } from '../modules/render-xml.js';


// Parse arguments
const args = process.argv.slice(2);

if (args.length === 0) {
    console.error('Usage: sequencejson-to-musicxml.js <input.json> [output.xml]');
    process.exit(1);
}

const inputPath = resolve(args[0]);
const outputPath = args[1] ? resolve(args[1]) : inputPath.replace(/\.json$/, '.xml');

try {
    // Read input JSON
    const jsonString = readFileSync(inputPath, 'utf-8');
    const data = JSON.parse(jsonString);

    // Convert to MusicXML
    const xml = renderMusicXML(data);

    // Write output
    writeFileSync(outputPath, xml, 'utf-8');

    console.log(`Converted: ${inputPath} → ${outputPath}`);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
