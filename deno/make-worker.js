import * as es        from 'https://deno.land/x/esbuild@v0.28.1/mod.js';
import { denoPlugin } from 'jsr:@deno/esbuild-plugin@^1.2.1';


const workingdir = Deno.cwd() + '/';
const args       = Deno.args.slice();
const configArg  = args[0] && args[0].startsWith('--config=') ? args.shift().slice(9) : 'deno.json';
const [outModule, inModule] = args;

if (!outModule || !inModule) {
    console.error('Usage: deno run -A make-worker.js [--config=deno.json] <outModule> <inModule>');
    Deno.exit(1);
}

const workingUrl    = new URL(`file://${ encodeURI(workingdir) }`);
const entryUrl      = new URL(inModule, workingUrl).href;

const result = await es.build({
    define:      { 'globalThis.WORKER': 'true' },
    stdin: {
        contents: `
            import process from ${ JSON.stringify(entryUrl) };

            self.onmessage = async ({ data: { id, data } }) => {
                try {
                    self.postMessage({ id, data: await process(data) });
                }
                catch (error) {
                    self.postMessage({ id, error });
                }
            };
        `,
        resolveDir: workingdir,
        loader: 'js'
    },
    bundle:      true,
    minify:      true,
    write:       false,
    metafile:    true,
    sourcemap:   false,
    platform:    'browser',
    format:      'esm',
    treeShaking: true,
    charset:     'utf8',
    target:      ['es2025'],
    plugins: [denoPlugin({
        configPath: workingdir + configArg
    })]
});

const code = result.outputFiles[0].text;

await Deno.writeTextFile(
    outModule,
`/*
Compiled from ${ inModule }
Imports
${ Object.keys(result.metafile.inputs)
    .filter((k) => k !== '<stdin>')
    .sort()
    .map((k) => `${ k.replaceAll('*/', '* /') }`)
    .join('\n') }
*/
export default ${ JSON.stringify(code) };
`
);
console.log(`  ${ outModule } (${ (code.length / 1024).toFixed(1) }kb worker string)`);
es.stop();

