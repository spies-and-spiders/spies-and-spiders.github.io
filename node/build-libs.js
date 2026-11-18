import fs from "fs";
import path from "path";
import {build} from "esbuild";

const OUT = "lib";

const COPIES = [
	...["ace", "ext-language_tools", "ext-searchbox", "mode-html", "mode-json", "mode-markdown", "theme-tomorrow", "theme-tomorrow_night"]
		.map(name => [`ace-builds/src-min-noconflict/${name}.js`, `${name}.js`]),
	...["ace-linters", "json-service", "service-manager"]
		.map(name => [`ace-linters/build/${name}.js`, `ace-linters/${name}.js`]),
	["dom-to-image-more/dist/dom-to-image-more.min.js", "dom-to-image-more.min.js"],
	["elasticlunr/elasticlunr.js", "elasticlunr.js"],
	["localforage/dist/localforage.js", "localforage.js"],
	["lzma/src/lzma_worker-min.js", "lzma.js"],
	["peerjs/dist/peerjs.min.js", "peerjs.js"],
];

fs.rmSync(OUT, {recursive: true, force: true});

COPIES.forEach(([from, to]) => {
	const dest = path.join(OUT, to);
	fs.mkdirSync(path.dirname(dest), {recursive: true});
	fs.copyFileSync(path.join("node_modules", from), dest);
});

// `polylabel` imports `tinyqueue` by bare specifier, which browsers cannot resolve
await build({
	stdin: {contents: `export {default as polylabel} from "polylabel";`, resolveDir: "."},
	bundle: true,
	format: "esm",
	minify: true,
	outfile: path.join(OUT, "polylabel.js"),
});

console.log(`Built ${COPIES.length + 1} libraries into ${OUT}/`);
