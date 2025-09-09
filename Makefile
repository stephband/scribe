DEBUG=

# Tell make to ignore existing folders and allow overwriting existing files
.PHONY: literal modules

# Must format with tabs not spaces
#literal:
#	deno run --allow-read --allow-env --allow-net --allow-write --allow-run --unstable ./lib/literal/deno/make-literal.js ./ debug

modules:
	@rm -f deno.lock
	rm -rf ./build

	deno run --allow-read --allow-write --allow-net --allow-env --allow-run --no-lock --reload --config ./deno.json https://cdn.jsdelivr.net/gh/stephband/fn@master/deno/make-modules.js ./build/ \
		module.js \
		scribe-music/element.js
	deno run --allow-read --allow-write --allow-net --allow-env --allow-run --no-lock --reload --config ./deno.json https://cdn.jsdelivr.net/gh/stephband/fn@master/deno/make-css.js ./build/ \
		module.css \
		fonts/ash.css \
		fonts/bravura.css \
		fonts/broadway.css \
		fonts/jazz.css \
		fonts/leipzig.css \
		fonts/petaluma.css \
		scribe-music/element.css \
		scribe-music/shadow.css

	@rm -f deno.lock
