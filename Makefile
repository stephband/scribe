DEBUG=

# Tell make to ignore existing folders and allow overwriting existing files
.PHONY: literal modules

# Must format with tabs not spaces
#literal:
#	deno run --allow-read --allow-env --allow-net --allow-write --allow-run --unstable ./lib/literal/deno/make-literal.js ./ debug

modules:
	rm -rf ./build
	deno run --allow-read --allow-env --allow-net --allow-write --allow-run ./lib/fn/deno/make-modules.js build \
		module.js \
		module.css \
		fonts/ash.css \
		fonts/bravura.css \
		fonts/broadway.css \
		fonts/jazz.css \
		fonts/leipzig.css \
		fonts/petaluma.css \
		scribe-music/module.js \
		scribe-music/module.css \
		scribe-music/shadow.css
