import fs from "fs";
import "../js/parser.js";
import "../js/utils.js";
import "../js/render.js";
import "../js/render-dice.js";
import "../js/hist.js";
import "../js/utils-dataloader.js";
import "../js/utils-config.js";
import * as utS from "../node/util-search-index.js";
import "../js/omnidexer.js";
import * as ut from "../node/util.js";
import {DataTesterBase, DataTester, ObjectWalker, BraceCheck, EscapeCharacterCheck} from "5etools-utils";

// TODO(Future) make this an arg/add Commander
const _IS_LOG_SIMILAR = false;

const TIME_TAG = "\tRun duration";
console.time(TIME_TAG);

const WALKER = MiscUtil.getWalker({
	keyBlocklist: MiscUtil.GENERIC_WALKER_ENTRIES_KEY_BLOCKLIST,
	isNoModification: true,
});

const DATA_DIRS = ["./data", "./sns"];

const IGNORED_FILE_NAMES = new Set([
	"changelog.json",
	"index.json",
	"renderdemo.json", // TODO could be good to update this and then include it in the test, useful as a reference for future work?
	"optionalfeatures.json", // generated from `sns/**`
	"class-sns.json", // generated from `sns/**`
]);

function isIgnoredDataFile (filePath) {
	return IGNORED_FILE_NAMES.has(filePath.split("/").pop());
}

class DataFileFinder {
	static _ALL_FILE_METAS = null;

	/** Parse every `.json` file under the data dirs once, ignoring index/changelog and non-object payloads. */
	static _getAllFileMetas () {
		if (this._ALL_FILE_METAS) return this._ALL_FILE_METAS;

		const filePaths = DATA_DIRS
			.flatMap(dir => {
				try {
					return ut.listFiles({dir});
				} catch (e) {
					return [];
				}
			})
			.filter(filePath => filePath.endsWith(".json"))
			.filter(filePath => !isIgnoredDataFile(filePath));

		this._ALL_FILE_METAS = filePaths
			.map(filePath => {
				let json;
				try {
					json = ut.readJson(filePath);
				} catch (e) {
					return null;
				}
				if (!json || typeof json !== "object" || Array.isArray(json)) return null;
				// Normalise the display path (strip any leading "./") to match the messages emitted by the checks.
				return {file: filePath.replace(/^\.\//, ""), json};
			})
			.filter(Boolean);

		return this._ALL_FILE_METAS;
	}

	/** All `{file, json}` metas whose JSON has the given prop as an array. */
	static getWithProp (prop) {
		return this._getAllFileMetas()
			.filter(({json}) => Array.isArray(json[prop]));
	}

	/** Convenience: iterate every entity under `prop` across all relevant files, with its owning file. */
	static forEachEntity (prop, fn) {
		this.getWithProp(prop)
			.forEach(({file, json}) => json[prop].forEach(ent => fn(ent, file, json)));
	}
}

class TagTestUrlLookup {
	static _ALL_URLS_SET = new Set();
	static _ALL_URLS_LIST = [];

	static _CAT_ID_BLOCKLIST = new Set([
		Parser.CAT_ID_PAGE,
	]);

	static addIndexItem (indexItem) {
		if (this._CAT_ID_BLOCKLIST.has(indexItem.c)) return;

		const url = `${UrlUtil.categoryToPage(indexItem.c).toLowerCase()}#${(indexItem.u).toLowerCase().trim()}`;

		this._ALL_URLS_SET.add(url);
		this._ALL_URLS_LIST.push(url);
	}

	static addEntityItem (ent, page) {
		const url = `${page.toLowerCase()}#${(UrlUtil.URL_TO_HASH_BUILDER[page](ent)).toLowerCase().trim()}`;

		this._ALL_URLS_SET.add(url);
		this._ALL_URLS_LIST.push(url);
	}

	static hasUrl (url) { return this._ALL_URLS_SET.has(url); }

	static getSimilarUrls (url) {
		const mSimilar = /^\w+\.html#\w+/.exec(url);
		if (!mSimilar) return [];

		return this._ALL_URLS_LIST
			.filter(url => url.startsWith(mSimilar[0]))
			.map(url => `\t${url}`)
			.join("\n");
	}
}

class TagTestUtil {
	static _CLASS_SUBCLASS_LOOKUP = {};

	static async pInit () {
		await this._pInit_pPopulateUrls();
		await this._pInit_pPopulateClassSubclassIndex();
	}

	static async _pInit_pPopulateUrls () {
		const primaryIndex = Omnidexer.decompressIndex(await utS.UtilSearchIndex.pGetIndex({doLogging: false, noFilter: true}));
		primaryIndex
			.forEach(indexItem => TagTestUrlLookup.addIndexItem(indexItem));
		const highestId = primaryIndex.last().id;
		const secondaryIndexItem = Omnidexer.decompressIndex(await utS.UtilSearchIndex.pGetIndexAdditional(Parser.CAT_ID_ITEM, {baseIndex: highestId + 1, doLogging: false}));
		secondaryIndexItem
			.forEach(indexItem => TagTestUrlLookup.addIndexItem(indexItem));

		(await DataLoader.pCacheAndGetAllSite("itemProperty"))
			.forEach(ent => TagTestUrlLookup.addEntityItem(ent, "itemProperty"));
	}

	static async _pInit_pPopulateClassSubclassIndex () {
		const classData = await DataUtil.class.loadJSON();

		const tmpClassIxFeatures = {};
		classData.class.forEach(cls => {
			cls.name = cls.name.toLowerCase();
			cls.source = (cls.source || Parser.SRC_PHB).toLowerCase();

			this._CLASS_SUBCLASS_LOOKUP[cls.source] = this._CLASS_SUBCLASS_LOOKUP[cls.source] || {};
			this._CLASS_SUBCLASS_LOOKUP[cls.source][cls.name] = {};

			const ixFeatures = [];
			cls.classFeatures.forEach((levelFeatures, ixLevel) => {
				levelFeatures.forEach((_, ixFeature) => {
					ixFeatures.push(`${ixLevel}-${ixFeature}`);
				});
			});
			MiscUtil.set(tmpClassIxFeatures, cls.source, cls.name, ixFeatures);
		});

		classData.subclass.forEach(sc => {
			sc.shortName = (sc.shortName || sc.name).toLowerCase();
			sc.source = (sc.source || sc.classSource).toLowerCase();
			sc.className = sc.className.toLowerCase();
			sc.classSource = sc.classSource.toLowerCase();

			if (sc.className === VeCt.STR_GENERIC.toLowerCase() && sc.classSource === VeCt.STR_GENERIC.toLowerCase()) return;

			this._CLASS_SUBCLASS_LOOKUP[sc.classSource][sc.className][sc.source] = this._CLASS_SUBCLASS_LOOKUP[sc.classSource][sc.className][sc.source] || {};
			this._CLASS_SUBCLASS_LOOKUP[sc.classSource][sc.className][sc.source][sc.shortName] = MiscUtil.copyFast(MiscUtil.get(tmpClassIxFeatures, sc.classSource, sc.className));
		});
	}

	static getSubclassFeatureIndex (className, classSource, subclassName, subclassSource) {
		classSource = classSource || Parser.getTagSource("class");
		subclassSource = subclassSource || Parser.SRC_PHB;

		className = className.toLowerCase();
		classSource = classSource.toLowerCase();
		subclassName = subclassName.toLowerCase();
		subclassSource = subclassSource.toLowerCase();

		return MiscUtil.get(this._CLASS_SUBCLASS_LOOKUP, classSource, className, subclassSource, subclassName);
	}

	static getLogPtSimilarUrls ({url}) {
		if (!_IS_LOG_SIMILAR) return "";

		const ptSimilarUrls = TagTestUrlLookup.getSimilarUrls(url);
		if (!ptSimilarUrls) return "";
		return `Similar URLs were:\n${ptSimilarUrls}\n`;
	}
}

class GenericDataCheck extends DataTesterBase {
	_doCheckSeeAlso ({entity, prop, tag, file}) {
		if (!entity[prop]) return;

		const defaultSource = Parser.getTagSource(tag).toLowerCase();

		const deduped = entity[prop].map(it => {
			it = it.toLowerCase();
			if (!it.includes("|")) it += `|${defaultSource}`;
			return it;
		}).unique();
		if (deduped.length !== entity[prop].length) {
			this._addMessage(`Duplicate "${prop}" in ${file} for ${entity.source}, ${entity.name}\n`);
		}

		entity[prop].forEach(s => {
			const url = getEncoded(s, tag);
			if (!TagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${s} in file ${file} (evaluates to "${url}") in "${prop}"\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
		});
	}

	_testAdditionalSpells_testSpellExists (file, spellOrObj) {
		if (typeof spellOrObj === "object") {
			if (spellOrObj.choose != null || spellOrObj.all != null) {
				// e.g. "level=0|class=Sorcerer"
				return;
			}

			throw new Error(`Unhandled additionalSpells special object in "${file}": ${JSON.stringify(spellOrObj)}`);
		}

		spellOrObj = spellOrObj.split("#")[0]; // An optional "cast at spell level" can be added with a "#", remove it
		const url = getEncoded(spellOrObj, "spell");

		if (!TagTestUrlLookup.hasUrl(url)) {
			this._addMessage(`Missing link: ${url} in file ${file} (evaluates to "${url}") in "additionalSpells"\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
		}
	}

	_ADDITIONAL_SPELLS_IGNORED_KEYS = new Set([
		"ability",
		"name",
		"resourceName",
	]);

	_testAdditionalSpells (file, obj) {
		if (!obj.additionalSpells) return;
		obj.additionalSpells
			.forEach(additionalSpellOption => {
				Object.entries(additionalSpellOption)
					.forEach(([k, levelToSpells]) => {
						if (this._ADDITIONAL_SPELLS_IGNORED_KEYS.has(k)) return;

						Object.values(levelToSpells).forEach(spellListOrMeta => {
							if (spellListOrMeta instanceof Array) {
								return spellListOrMeta.forEach(sp => this._testAdditionalSpells_testSpellExists(file, sp));
							}

							Object.entries(spellListOrMeta)
								.forEach(([prop, val]) => {
									switch (prop) {
										case "daily":
										case "rest":
										case "resource":
											Object.values(val).forEach(spellList => spellList.forEach(sp => this._testAdditionalSpells_testSpellExists(file, sp)));
											break;
										case "will":
										case "ritual":
										case "_":
											val.forEach(sp => this._testAdditionalSpells_testSpellExists(file, sp));
											break;
										default: throw new Error(`Unhandled additionalSpells prop "${prop}"`);
									}
								});
						});
					});
			});
	}

	_testAdditionalFeats (file, obj) {
		if (!obj.feats) return;

		obj.feats.forEach(featsObj => {
			Object.entries(featsObj)
				.forEach(([k, v]) => {
					if (["any", "anyFromCategory"].includes(k)) return;

					const url = getEncoded(k, "feat");
					if (!TagTestUrlLookup.hasUrl(url)) {
						this._addMessage(`Missing link: ${url} in file ${file} (evaluates to "${url}") in "feats"\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
					}
				});
		});
	}

	_testReprintedAs (file, obj, tag) {
		if (!obj.reprintedAs) return;

		obj.reprintedAs
			.forEach(rep => {
				const _tag = rep.tag ?? tag;
				const _uid = rep.uid ?? rep;

				// FIXME(Future)
				const url = tag === "subclass"
					? getEncodedSubclass(_uid, _tag)
					: tag === "deity"
						? getEncodedDeity(_uid, _tag)
						: getEncoded(_uid, _tag);

				if (TagTestUrlLookup.hasUrl(url)) return;

				this._addMessage(`Missing link: ${url} in file ${file} (evaluates to "${url}") in "${_tag}"\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
			});
	}
}

function getEncoded (str, tag, {prop = null} = {}) {
	const [name, source] = str.split("|");
	return `${Renderer.tag.getPage(tag) || prop}#${UrlUtil.encodeForHash([name, Parser.getTagSource(tag, source)])}`.toLowerCase().trim();
}

function getEncodedDeity (str, tag) {
	const [name, pantheon, source] = str.split("|");
	return `${Renderer.tag.getPage(tag)}#${UrlUtil.encodeForHash([name, pantheon, Parser.getTagSource(tag, source)])}`.toLowerCase().trim();
}

function getEncodedSubclass (str, tag) {
	const unpacked = DataUtil.class.unpackUidSubclass(str);
	const hash = UrlUtil.URL_TO_HASH_BUILDER["subclass"](unpacked);
	return `${UrlUtil.PG_CLASSES}#${hash}`.toLowerCase().trim();
}

class LinkCheck extends DataTesterBase {
	registerParsedPrimitiveHandlers (parsedJsonChecker) {
		parsedJsonChecker.addPrimitiveHandler("string", this._checkString.bind(this));
		parsedJsonChecker.addPrimitiveHandler("object", this._checkObject.bind(this));
	}

	_checkString (str, {filePath, isStatblock = false}) {
		let match;
		while ((match = this.RE.exec(str))) {
			const [, tag, text] = match;

			let encoded;
			switch (tag) {
				// FIXME(Future)
				case "classFeature": {
					const {name, source, className, classSource, level} = DataUtil.class.unpackUidClassFeature(text);
					encoded = UrlUtil.encodeForHash([name, className, classSource, level, source]);
					break;
				}
				// FIXME(Future)
				case "subclassFeature": {
					const {name, source, className, classSource, subclassShortName, subclassSource, level} = DataUtil.class.unpackUidSubclassFeature(text);
					encoded = UrlUtil.encodeForHash([name, className, classSource, subclassShortName, subclassSource, level, source]);
					break;
				}
				default: {
					encoded = Renderer.utils.getTagMeta(`@${tag}`, text).hash;
					break;
				}
			}

			const url = `${Renderer.tag.getPage(tag)}#${encoded}`.toLowerCase().trim();
			if (TagTestUrlLookup.hasUrl(url)) return;

			this._addMessage(`Missing link: ${isStatblock ? `(as "statblock" entry) ` : ""}${match[0]} in file ${filePath} (evaluates to "${url}")\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
		}
	}

	_checkObject (obj, {filePath}) {
		if (obj.type !== "statblock") return obj;

		// TODO(Future) expand/tweak support as required
		const asStr = `{@${obj.tag} ${obj.name}|${obj.source || ""}}`;
		this._checkString(asStr, {filePath, isStatblock: true});

		return obj;
	}
}
LinkCheck.prototype._RE_TAG_BLOCKLIST = new Set(["quickref"]);
LinkCheck.prototype.RE = RegExp(`{@(${Renderer.tag.TAGS.filter(it => it.defaultSource).map(it => it.tagName).filter(tag => !LinkCheck.prototype._RE_TAG_BLOCKLIST.has(tag)).join("|")}) ([^}]*?)}`, "g");

class ClassLinkCheck extends DataTesterBase {
	registerParsedPrimitiveHandlers (parsedJsonChecker) {
		parsedJsonChecker.addPrimitiveHandler("string", this._checkString.bind(this));
	}

	_checkString (str, {filePath}) {
		// e.g. "{@class fighter|phb|and class feature added|Eldritch Knight|phb|2-0}"

		let match;
		while ((match = this.RE.exec(str))) {
			const className = match[1];
			const classSource = match[3];
			const subclassShortName = match[7];
			const subclassSource = match[9];
			const ixFeature = match[11];

			if (!subclassShortName) return; // Regular tags will be handled by the general tag checker

			const featureIndex = TagTestUtil.getSubclassFeatureIndex(className, classSource, subclassShortName, subclassSource);
			if (!featureIndex) {
				this._addMessage(`Missing subclass link: ${match[0]} in file ${filePath} -- could not find subclass with matching shortname/source\n`);
			}

			if (featureIndex && ixFeature && !featureIndex.includes(ixFeature)) {
				this._addMessage(`Malformed subclass link: ${match[0]} in file ${filePath} -- feature index "${ixFeature}" was outside expected range\n`);
			}
		}
	}
}
ClassLinkCheck.prototype.RE = /{@class (.*?)(\|(.*?))?(\|(.*?))?(\|(.*?))?(\|(.*?))?(\|(.*?))?(\|(.*?))?}/g;

class ItemDataCheck extends GenericDataCheck {
	_checkArrayDuplicates (file, name, source, arr, prop, tag) {
		const asUrls = arr
			.map(it => {
				if (it.item) it = it.item;
				if (it.special) return null;

				return getEncoded(it, tag);
			})
			.filter(Boolean);

		if (asUrls.length !== new Set(asUrls).size) {
			this._addMessage(`Duplicate ${prop} in ${file} for ${source}, ${name}: ${asUrls.filter(s => asUrls.filter(it => it === s).length > 1).join(", ")}\n`);
		}
	}

	_checkArrayItemsExist (file, name, source, arr, prop, tag) {
		arr.forEach(s => {
			if (s.item) s = s.item;
			if (s.special) return;

			const url = getEncoded(s, tag);
			if (!TagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${s} in file ${file} (evaluates to "${url}") in "${prop}"\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
		});
	}

	_checkReqAttuneTags (file, root, name, source, prop) {
		const tagsArray = root[prop];

		tagsArray.forEach(tagBlock => {
			Object.entries(tagBlock)
				.forEach(([prop, val]) => {
					switch (prop) {
						case "background":
						case "class": {
							const url = getEncoded(val, prop);
							if (!TagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${val} in file ${file} "${prop}" (evaluates to "${url}")\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
						}
					}
				});
		});
	}

	_checkRoot (file, root, name, source) {
		if (!root) return;

		if (root.attachedSpells) {
			this._checkArrayDuplicates(file, name, source, root.attachedSpells, "attachedSpells", "spell");
			this._checkArrayItemsExist(file, name, source, root.attachedSpells, "attachedSpells", "spell");
		}

		if (root.optionalfeatures) {
			this._checkArrayDuplicates(file, name, source, root.optionalfeatures, "optionalfeatures", "optfeature");
			this._checkArrayItemsExist(file, name, source, root.optionalfeatures, "optionalfeatures", "optfeature");
		}

		if (root.items) {
			this._checkArrayDuplicates(file, name, source, root.items, "items", "item");
			this._checkArrayItemsExist(file, name, source, root.items, "items", "item");
		}

		if (root.packContents) {
			this._checkArrayDuplicates(file, name, source, root.packContents, "packContents", "item");
			this._checkArrayItemsExist(file, name, source, root.packContents, "packContents", "item");
		}

		if (root.containerCapacity && root.containerCapacity.item) {
			root.containerCapacity.item.forEach(itemToCount => {
				this._checkArrayItemsExist(file, name, source, Object.keys(itemToCount), "containerCapacity", "item");
			});
		}

		if (root.ammoType) {
			this._checkArrayItemsExist(file, name, source, [root.ammoType], "ammoType", "item");
		}

		if (root.baseItem) {
			const url = `${Renderer.tag.getPage("item")}#${UrlUtil.encodeForHash(root.baseItem.split("|"))}`
				.toLowerCase()
				.trim()
				.replace(/%5c/gi, "");

			if (!TagTestUrlLookup.hasUrl(url)) {
				this._addMessage(`Missing link: ${root.baseItem} in file ${file} (evaluates to "${url}")\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
			}
		}

		this._doCheckSeeAlso({entity: root, prop: "seeAlsoDeck", tag: "deck", file});
		this._doCheckSeeAlso({entity: root, prop: "seeAlsoVehicle", tag: "vehicle", file});

		if (root.reqAttuneTags) this._checkReqAttuneTags(file, root, name, source, "reqAttuneTags");
		if (root.reqAttuneAltTags) this._checkReqAttuneTags(file, root, name, source, "reqAttuneAltTags");

		if (root.mastery) {
			this._checkArrayDuplicates(file, name, source, root.mastery, "mastery", "itemMastery");
			this._checkArrayItemsExist(file, name, source, root.mastery, "mastery", "itemMastery");
		}
	}

	pRun () {
		DataFileFinder.forEachEntity("baseitem", (it, file) => this._checkRoot(file, it, it.name, it.source));
		DataFileFinder.forEachEntity("item", (it, file) => this._checkRoot(file, it, it.name, it.source));
		DataFileFinder.forEachEntity("itemGroup", (it, file) => this._checkRoot(file, it, it.name, it.source));
		DataFileFinder.forEachEntity("magicvariant", (va, file) => this._checkRoot(file, va, va.name, va.source) || (va.inherits && this._checkRoot(file, va.inherits, `${va.name} (inherits)`, va.source)));
	}
}

class ActionDataCheck extends GenericDataCheck {
	pRun () {
		DataFileFinder.forEachEntity("action", (it, file) => {
			if (it.fromVariant) {
				const url = getEncoded(it.fromVariant, "variantrule");
				if (!TagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${it.fromVariant} in file ${file} (evaluates to "${url}")\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
			}

			this._doCheckSeeAlso({entity: it, prop: "seeAlsoAction", tag: "action", file});

			this._testReprintedAs(file, it, "action");
		});
	}
}

class DeityDataCheck extends GenericDataCheck {
	pRun () {
		DataFileFinder.forEachEntity("deity", (it, file) => {
			if (!it.customExtensionOf) return;

			const url = getEncodedDeity(it.customExtensionOf, "deity");
			if (!TagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${it.customExtensionOf} in file ${file} (evaluates to "${url}")\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
		});
	}
}

class FilterCheck extends DataTesterBase {
	registerParsedPrimitiveHandlers (parsedJsonChecker) {
		parsedJsonChecker.addPrimitiveHandler("string", this._checkString.bind(this));
	}

	_checkString (str, {filePath}) {
		str.replace(/{@filter ([^}]*)}/g, (m0, m1) => {
			const spl = m1.split("|");
			if (spl.length < 3) {
				this._addMessage(`Invalid filter tag in file ${filePath}: "${str}" was too short!\n`);
				return m0;
			}

			if (!UrlUtil.pageToDisplayPage(`${spl[1]}.html`)) {
				this._addMessage(`Invalid filter tag in file ${filePath}: unknown page in "${str}"\n`);
			}

			const missingEq = [];
			for (let i = 2; i < spl.length; ++i) {
				const part = spl[i];
				if (!part.includes("=")) {
					missingEq.push(part);
				}

				const hasOpenRange = part.startsWith("[");
				const hasCloseRange = part.startsWith("]");
				if (hasOpenRange || hasCloseRange) {
					if (!(hasOpenRange && hasCloseRange)) {
						this._addMessage(`Invalid filter tag in file ${filePath}: malformed range expression in  "${str}"\n`);
					}

					const [header, values] = part.split("=");
					const valuesSpl = values.replace(/^\[/, "").replace(/]$/, "").split(";");
					if (valuesSpl.length > 2) {
						this._addMessage(`Invalid filter tag in file ${filePath}: too many values in range expression in "${str}" (expected 1-2)\n`);
					}
				}
			}
			if (missingEq.length) {
				this._addMessage(`Invalid filter tag in file ${filePath}: missing equals in "${str}" in part${missingEq.length > 1 ? "s" : ""} ${missingEq.join(", ")}\n`);
			}

			return m0;
		});
	}
}

class ScaleDiceCheck extends DataTesterBase {
	registerParsedPrimitiveHandlers (parsedJsonChecker) {
		parsedJsonChecker.addPrimitiveHandler("string", this._checkString.bind(this));
	}

	_checkString (str, {filePath}) {
		str.replace(/{@(scaledice|scaledamage) ([^}]*)}/g, (m0, m1, m2) => {
			const spl = m2.split("|");
			if (spl.length < 3) {
				this._addMessage(`${m1} tag "${str}" was too short!\n`);
			} else if (spl.length > 5) {
				this._addMessage(`${m1} tag "${str}" was too long!\n`);
			} else {
				let range;
				try {
					range = MiscUtil.parseNumberRange(spl[1], 1, 9);
				} catch (e) {
					this._addMessage(`Range "${spl[1]}" is invalid!\n`);
					return;
				}
				if (range.size < 2) this._addMessage(`Invalid scaling dice in file ${filePath}: range "${spl[1]}" has too few entries! Should be 2 or more.\n`);
				if (spl[3] && spl[3] !== "psi") this._addMessage(`Unknown mode "${spl[4]}".\n`);
			}
			return m0;
		});
	}
}

class StripTagTest extends DataTesterBase {
	_seenErrors = new Set();

	registerParsedPrimitiveHandlers (parsedJsonChecker) {
		parsedJsonChecker.addPrimitiveHandler("string", this._checkString.bind(this));
	}

	_checkString (str, {filePath}) {
		if (filePath === "./data/bestiary/template.json") return;

		try {
			Renderer.stripTags(str);
		} catch (e) {
			if (!this._seenErrors.has(e.message)) {
				this._seenErrors.add(e.message);
				this._addMessage(`Tag stripper error: ${e.message} (${filePath})\n`);
			}
		}
	}
}

class TableDiceTest extends DataTesterBase {
	registerParsedPrimitiveHandlers (parsedJsonChecker) {
		parsedJsonChecker.addPrimitiveHandler("object", this._checkTable.bind(this));
	}

	_checkTable (obj, {filePath}) {
		if (obj.type !== "table") return;

		const headerRowMetas = Renderer.table.getHeaderRowMetas(obj);
		const autoRollMode = Renderer.table.getAutoConvertedRollMode(obj, {headerRowMetas});
		if (!autoRollMode) return;

		const toRenderLabel = autoRollMode ? RollerUtil.getFullRollCol(headerRowMetas.last()[0]) : null;
		const isInfiniteResults = autoRollMode === RollerUtil.ROLL_COL_VARIABLE;

		const possibleResults = new Set();
		const errors = [];
		const cbErr = (cell, e) => this._addMessage(`Row parse failed! Cell was: "${JSON.stringify(cell)}"; error was: "${e.message}"\n`);

		const len = obj.rows.length;
		obj.rows.forEach((r, i) => {
			const row = Renderer.getRollableRow(r, {cbErr, isForceInfiniteResults: isInfiniteResults, isFirstRow: i === 0, isLastRow: i === len - 1});
			const cell = row[0].roll;
			if (!cell) return;
			if (cell.exact != null) {
				if (cell.exact === 0 && cell.pad) cell.exact = 100;
				if (possibleResults.has(cell.exact)) errors.push(`"exact" value "${cell.exact}" was repeated!`);
				possibleResults.add(cell.exact);
			} else {
				if (cell.max === 0) cell.max = 100;
				// convert inf to a reasonable range (no official table goes to 999+ or into negatives as of 2020-09-19)
				if (cell.min === -Renderer.dice.POS_INFINITE) cell.min = cell.displayMin; // Restore the original minimum
				if (cell.max === Renderer.dice.POS_INFINITE) cell.max = this._INF_CAP;
				for (let i = cell.min; i <= cell.max; ++i) {
					if (possibleResults.has(i)) {
						// if the table is e.g. 0-110, avoid double-counting the 0
						if (!(i === 100 && cell.max > 100)) errors.push(`"min-max" value "${i}" was repeated!`);
					}
					possibleResults.add(i);
				}
			}
		});

		const tmpParts = [];
		let cleanHeader = toRenderLabel
			.trim()
			.replace(/^{@dice ([^}]+)}/g, (...m) => {
				tmpParts.push(m[1].split("|")[0]);
				return `__TMP_DICE__${tmpParts.length - 1}__`;
			});
		cleanHeader = Renderer.stripTags(cleanHeader).replace(/__TMP_DICE__(\d+)__/g, (...m) => tmpParts[Number(m[1])]);
		const possibleRolls = new Set();
		let hasPrompt = false;

		cleanHeader.split(";").forEach(rollable => {
			if (rollable.includes("#$prompt_")) hasPrompt = true;

			const wrpRollTree = Renderer.dice.lang.getTree3(rollable);
			if (wrpRollTree) {
				const min = wrpRollTree.tree.min({});
				const max = wrpRollTree.tree.max({});
				for (let i = min; i < max + 1; ++i) possibleRolls.add(i);
			} else {
				if (!hasPrompt) errors.push(`${JSON.stringify(obj.colLabels[0])} was not a valid rollable header?!`);
			}
		});

		if (!CollectionUtil.setEq(possibleResults, possibleRolls) && !hasPrompt) {
			errors.push(`Possible results did not match possible rolls!\nPossible results: (${this._flattenSequence([...possibleResults])})\nPossible rolls: (${this._flattenSequence([...possibleRolls])})`);
		}

		if (errors.length) this._addMessage(`Errors in ${obj.caption ? `table "${obj.caption}"` : `${JSON.stringify(obj.rows[0]).substring(0, 30)}...`} in ${filePath}:\n${errors.map(it => `\t${it}`).join("\n")}\n`);
	}

	_flattenSequence (nums) {
		const out = [];
		let l = null; let r = null;
		nums.sort(SortUtil.ascSort).forEach(n => {
			if (l == null) {
				l = n;
				r = n;
			} else if (n === (r + 1)) {
				r = n;
			} else {
				if (l === r) out.push(`${l}`);
				else out.push(`${l}-${r}`);
				l = n;
				r = n;
			}
		});
		if (l === r) out.push(`${l}`);
		else out.push(`${l}-${r}`);
		return out.join(", ");
	}
}
TableDiceTest.prototype._INF_CAP = 999;

class AreaCheck extends DataTesterBase {
	registerParsedFileCheckers (parsedJsonChecker) {
		parsedJsonChecker.registerFileHandler(this);
	}

	_buildMap (file, data) {
		this.headerMap = Renderer.adventureBook.getEntryIdLookup(data, false);
	}

	_checkString (str) {
		str.replace(/{@area ([^}]*)}/g, (m0, m1) => {
			const [text, areaId, ...otherData] = m1.split("|");
			if (!this.headerMap[areaId]) {
				this.errorSet.add(m0);
			}
			return m0;
		});
	}

	handleFile (file, contents) {
		if (!this.fileMatcher.test(file)) return;

		this.errorSet = new Set();
		this._buildMap(file, contents.data || (contents.bookData || []).flatMap(it => it.data));
		ObjectWalker.walk({
			obj: contents,
			filePath: file,
			primitiveHandlers: {
				string: this._checkString.bind(this),
			},
		});

		if (this.errorSet.size || this.headerMap.__BAD?.length) this._addMessage(`Errors in ${file}! See below:\n`);

		if (this.errorSet.size) {
			const toPrint = [...this.errorSet].sort(SortUtil.ascSortLower);
			toPrint.forEach(tp => this._addMessage(`${tp}\n`));
		}

		if (this.headerMap.__BAD) {
			this.headerMap.__BAD.forEach(dupId => this._addMessage(`Duplicate ID: "${dupId}"\n`));
		}
	}
}
AreaCheck.prototype.errorSet = new Set();
AreaCheck.prototype.fileMatcher = /\/(adventure-|book-).*\.json/;

class LootDataCheck extends GenericDataCheck {
	pRun () {
		const handleItem = (file, it) => {
			const toCheck = typeof it === "string" ? {name: it, source: Parser.SRC_DMG} : it;
			const url = `${Renderer.tag.getPage("item")}#${UrlUtil.encodeForHash([toCheck.name, toCheck.source])}`.toLowerCase().trim();
			if (!TagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${JSON.stringify(it)} in file "${file}" (evaluates to "${url}")\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
		};

		DataFileFinder.forEachEntity("magicItems", (it, file) => {
			if (it.table) {
				it.table.forEach(row => {
					if (row.choose) {
						if (row.choose.fromGeneric) {
							row.choose.fromGeneric.forEach(item => handleItem(file, item));
						}

						if (row.choose.fromGroup) {
							row.choose.fromGroup.forEach(item => handleItem(file, item));
						}

						if (row.choose.fromItems) {
							row.choose.fromItems.forEach(item => handleItem(file, item));
						}
					}
				});
			}
		});
	}
}

class ClassDataCheck extends GenericDataCheck {
	_doCheckClass (file, data, cls) {
		// region Check `classFeatures` -> `classFeature` links
		const featureLookup = {};
		(data.classFeature || []).forEach(cf => {
			const hash = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](cf);
			featureLookup[hash] = true;
		});

		cls.classFeatures.forEach(ref => {
			const uid = ref.classFeature || ref;
			const unpacked = DataUtil.class.unpackUidClassFeature(uid, {isLower: true});
			const hash = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](unpacked);
			if (!featureLookup[hash]) this._addMessage(`Missing class feature: ${uid} in file ${file} not found in the files "classFeature" array\n`);
		});

		const handlersNestedRefsClass = {
			array: (arr) => {
				arr.forEach(it => {
					if (it.type !== "refClassFeature") return;

					const uid = it.classFeature || it;
					const unpacked = DataUtil.class.unpackUidClassFeature(uid, {isLower: true});
					const hash = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](unpacked);

					if (!featureLookup[hash]) this._addMessage(`Missing class feature: ${uid} in file ${file} not found in the files "classFeature" array\n`);
				});
				return arr;
			},
		};
		(data.classFeature || []).forEach(cf => {
			WALKER.walk(cf.entries, handlersNestedRefsClass);
		});
		// endregion

		// region Referenced optional features; feats
		const handlersNestedRefsOptionalFeatures = {
			array: (arr) => {
				arr.forEach(it => {
					if (it.type !== "refOptionalfeature") return;

					const url = getEncoded(it.optionalfeature, "optfeature");
					if (!TagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing optional feature: ${it.optionalfeature} in file ${file} (evaluates to "${url}")\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
				});
				return arr;
			},
		};
		const handlersNestedRefsFeats = {
			array: (arr) => {
				arr.forEach(it => {
					if (it.type !== "refFeat") return;

					const url = getEncoded(it.feat, "feat");
					if (!TagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing feat: ${it.feat} in file ${file} (evaluates to "${url}")\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
				});
				return arr;
			},
		};
		(data.classFeature || []).forEach(cf => {
			WALKER.walk(cf.entries, handlersNestedRefsOptionalFeatures);
			WALKER.walk(cf.entries, handlersNestedRefsFeats);
		});
		(data.subclassFeature || []).forEach(scf => {
			WALKER.walk(scf.entries, handlersNestedRefsOptionalFeatures);
			WALKER.walk(scf.entries, handlersNestedRefsFeats);
		});
		// endregion

		this._testAdditionalSpells(file, cls);
		this._testReprintedAs(file, cls, "class");
	}

	_doCheckSubclass (file, data, subclassFeatureLookup, sc) {
		if (sc._copy && !sc.subclassFeatures) return;

		sc.subclassFeatures.forEach(ref => {
			const uid = ref.subclassFeature || ref;
			const unpacked = DataUtil.class.unpackUidSubclassFeature(uid, {isLower: true});
			const hash = UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](unpacked);

			if (!subclassFeatureLookup[hash]) this._addMessage(`Missing subclass feature: ${uid} in file ${file} not found in the files "subclassFeature" array\n`);
		});

		this._testAdditionalSpells(file, sc);

		this._testReprintedAs(file, sc, "subclass");
	}

	pRun () {
		const seen = new Set();
		[
			...DataFileFinder.getWithProp("class"),
			...DataFileFinder.getWithProp("subclass"),
		]
			.filter(({file}) => !seen.has(file) && seen.add(file))
			.forEach(({file, json}) => {
				this._run_handleFileClasses({filename: file, data: json});
				this._run_handleFileSubclasses({filename: file, data: json});
			});
	}

	_run_handleFileClasses ({filename, data}) {
		(data.class || []).forEach(cls => this._doCheckClass(filename, data, cls));
	}

	_run_handleFileSubclasses ({filename, data}) {
		if (!data.subclass) return;

		const subclassFeatureLookup = {};
		(data.subclassFeature || []).forEach(scf => {
			const hash = UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](scf);
			subclassFeatureLookup[hash] = true;
		});

		data.subclass.forEach(sc => this._doCheckSubclass(filename, data, subclassFeatureLookup, sc));

		// Check `subclassFeatures` -> `subclassFeature` links
		const handlersNestedRefsSubclass = {
			array: (arr) => {
				arr.forEach(it => {
					if (it.type !== "refSubclassFeature") return;

					const uid = it.subclassFeature || it;
					const unpacked = DataUtil.class.unpackUidSubclassFeature(uid, {isLower: true});
					const hash = UrlUtil.URL_TO_HASH_BUILDER["subclassFeature"](unpacked);

					if (!subclassFeatureLookup[hash]) this._addMessage(`Missing subclass feature in "refSubclassFeature": ${it.subclassFeature} in file ${filename} not found in the files "subclassFeature" array\n`);
				});
				return arr;
			},
		};
		(data.subclassFeature || []).forEach(scf => {
			WALKER.walk(scf.entries, handlersNestedRefsSubclass);
		});
	}
}

class FeatDataCheck extends GenericDataCheck {
	_handleFeat (file, feat) {
		this._testAdditionalSpells(file, feat);
		this._testReprintedAs(file, feat, "feat");
	}

	pRun () {
		DataFileFinder.forEachEntity("feat", (f, file) => this._handleFeat(file, f));
	}
}

class BackgroundDataCheck extends GenericDataCheck {
	_handleBackground (file, bg) {
		this._testAdditionalSpells(file, bg);
		this._testAdditionalFeats(file, bg);
		this._testReprintedAs(file, bg, "background");
	}

	pRun () {
		DataFileFinder.forEachEntity("background", (f, file) => this._handleBackground(file, f));
	}
}

class BestiaryDataCheck extends GenericDataCheck {
	_handleCreature (file, mon) {
		this._testReprintedAs(file, mon, "creature");

		if (mon.legendaryGroup) {
			const url = getEncoded(`${mon.legendaryGroup.name}|${mon.legendaryGroup.source}`, "legendaryGroup", {prop: "legendaryGroup"});
			if (!TagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${mon.legendaryGroup.name}|${mon.legendaryGroup.source} in file ${file} "legendaryGroup" (evaluates to "${url}")\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
		}

		if (mon.summonedBySpell) {
			const url = getEncoded(mon.summonedBySpell, "spell");
			if (!TagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${mon.summonedBySpell} in file ${file} "summonedBySpell" (evaluates to "${url}")\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
		}

		if (mon.attachedItems) {
			mon.attachedItems.forEach(s => {
				const url = getEncoded(s, "item");
				if (!TagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${s} in file ${file} (evaluates to "${url}") in "attachedItems"\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
			});
		}

		if (mon.gear) {
			mon.gear.forEach(ref => {
				const uid = ref.item || ref;
				const url = getEncoded(uid, "item");
				if (!TagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${uid} in file ${file} (evaluates to "${url}") in "gear"\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
			});
		}
	}

	pRun () {
		DataFileFinder.forEachEntity("monster", (mon, file) => this._handleCreature(file, mon));
	}
}

class DeckDataCheck extends GenericDataCheck {
	_handleDeck (file, deck) {
		(deck.cards || [])
			.forEach(cardMeta => {
				const uid = typeof cardMeta === "string" ? cardMeta : cardMeta.uid;
				const unpacked = DataUtil.deck.unpackUidCard(uid, {isLower: true});
				const hash = UrlUtil.URL_TO_HASH_BUILDER["card"](unpacked);
				const url = `card#${hash}`.toLowerCase().trim();
				if (!TagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${uid} in file ${file} (evaluates to "${url}") in "cards"\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
			});
	}

	pRun () {
		DataFileFinder.forEachEntity("deck", (f, file) => this._handleDeck(file, f));
	}
}

class CultsBoonsDataCheck extends GenericDataCheck {
	_handleEntity (file, cb, prop) {
		this._testReprintedAs(file, cb, prop);
	}

	pRun () {
		DataFileFinder.forEachEntity("cult", (ent, file) => this._handleEntity(file, ent, "cult"));
		DataFileFinder.forEachEntity("boon", (ent, file) => this._handleEntity(file, ent, "boon"));
	}
}

class OptionalfeatureDataCheck extends GenericDataCheck {
	_doPrerequisite (file, ent) {
		if (!ent.prerequisite?.length) return;

		ent.prerequisite
			.forEach(prereq => {
				(prereq.feat || []).forEach(uid => this._doUid({file, uid, tag: "feat", propPath: "prerequisite.feat"}));
				(prereq.optionalfeature || []).forEach(uid => this._doUid({file, uid, tag: "optfeature", propPath: "prerequisite.optionalfeature"}));
			});
	}

	_doUid ({file, uid, tag, propPath}) {
		const url = getEncoded(uid, tag);
		if (!TagTestUrlLookup.hasUrl(url)) this._addMessage(`Missing link: ${uid} in file ${file} (evaluates to "${url}") in "${propPath}"\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
	}

	pRun () {
		DataFileFinder.forEachEntity("optionalfeature", (ent, file) => {
			this._doPrerequisite(file, ent);
			this._testReprintedAs(file, ent, "optfeature");
		});
	}
}

class SpellDataCheck extends GenericDataCheck {
	pRun () {
		DataFileFinder.forEachEntity("spell", (ent, file) => this._testReprintedAs(file, ent, "spell"));
	}
}

class ConditionDiseaseDataCheck extends GenericDataCheck {
	pRun () {
		DataFileFinder.forEachEntity("condition", (ent, file) => this._testReprintedAs(file, ent, "condition"));
		DataFileFinder.forEachEntity("disease", (ent, file) => this._testReprintedAs(file, ent, "disease"));
		DataFileFinder.forEachEntity("status", (ent, file) => this._testReprintedAs(file, ent, "status"));
	}
}

class RewardsDataCheck extends GenericDataCheck {
	pRun () {
		DataFileFinder.forEachEntity("reward", (ent, file) => this._testReprintedAs(file, ent, "reward"));
	}
}

class VariantRuleDataCheck extends GenericDataCheck {
	pRun () {
		DataFileFinder.forEachEntity("variantrule", (ent, file) => this._testReprintedAs(file, ent, "variantrule"));
	}
}

class SkillsRuleDataCheck extends GenericDataCheck {
	pRun () {
		DataFileFinder.forEachEntity("skill", (ent, file) => this._testReprintedAs(file, ent, "skill"));
	}
}

class SensesDataCheck extends GenericDataCheck {
	pRun () {
		DataFileFinder.forEachEntity("sense", (ent, file) => this._testReprintedAs(file, ent, "sense"));
	}
}

class FoundrySpellsDataCheck extends GenericDataCheck {
	_RE_CUSTOM_ID = /^@(?<tag>[a-z][a-zA-Z]+)\[(?<text>[^\]]+)]$/;

	async _pHandleEntity (file, ent) {
		const summonProfiles = MiscUtil.get(ent, "system", "summons", "profiles");
		if (!summonProfiles?.length) return;

		await summonProfiles
			.pSerialAwaitMap(async profile => {
				const {tag, text} = this._RE_CUSTOM_ID.exec(profile.uuid).groups;
				const {name, page, source, hash} = Renderer.utils.getTagMeta(`@${tag}`, text);
				const ent = await DataLoader.pCacheAndGet(page, source, hash);
				if (ent) return;

				const url = getEncoded(text, tag);
				this._addMessage(`Missing link: ${name} in file ${file} "system.summons.profiles" (evaluates to "${url}")\n${TagTestUtil.getLogPtSimilarUrls({url})}`);
			});
	}

	async pRun () {
		await DataFileFinder.getWithProp("spell")
			.pSerialAwaitMap(({file, json}) => json.spell
				.pSerialAwaitMap(ent => this._pHandleEntity(file, ent)));
	}
}

class DuplicateEntityCheck extends DataTesterBase {
	registerParsedFileCheckers (parsedJsonChecker) {
		parsedJsonChecker.registerFileHandler(this);
	}

	handleFile (file, contents, {isSkipVersionCheck = false, isSkipBaseCheck = false} = {}) {
		this.errors = [];

		Object.entries(contents)
			.filter(([_, arr]) => arr instanceof Array)
			.forEach(([prop, arr]) => {
				const positions = {};
				arr.forEach((ent, i) => {
					if (ent == null) return;
					if (typeof ent !== "object" || ent instanceof Array) return;

					ent.__prop = prop;

					isSkipBaseCheck || this._doAddPosition({prop, ent, ixArray: i, positions});

					if (!ent._versions) return;

					isSkipVersionCheck || DataUtil.proxy.getVersions(prop, ent, {isExternalApplicationIdentityOnly: true})
						.forEach((entVer, j) => {
							this._doAddPosition({prop, ent: entVer, ixArray: i, ixVersion: j, positions});
						});
				});

				if (Object.keys(positions).length) {
					const withDuplicates = Object.entries(positions)
						.filter(([, v]) => v.length > 1);
					if (withDuplicates.length) {
						this._addMessage(`Duplicate entity keys in ${file} array .${prop}! See below:\n`);
						withDuplicates.forEach(([k, v]) => {
							this._addMessage(`\t${k} (at indexes ${v.join(", ")})\n`);
						});
					}
				}
			});
	}

	_doAddPosition ({prop, ent, ixArray, ixVersion, positions}) {
		const keyIx = [ixArray, ixVersion].filter(it => it != null).join("-v");

		const name = ent.name;
		const source = SourceUtil.getEntitySource(ent);

		switch (prop) {
			case "deity": {
				if (name != null && source != null) {
					const key = `${source} :: ${ent.pantheon} :: ${name}`;
					(positions[key] = positions[key] || []).push(keyIx);
				}
				break;
			}
			case "card": {
				if (name != null && source != null) {
					const key = `${source} :: ${ent.set} :: ${name}`;
					(positions[key] = positions[key] || []).push(keyIx);
				}
				break;
			}
			case "subclass": {
				if (name != null && source != null) {
					const key = `${source} :: ${ent.classSource} :: ${ent.className} :: ${name}`;
					(positions[key] = positions[key] || []).push(keyIx);
				}
				break;
			}
			case "classFeature": {
				if (name != null && source != null) {
					const key = `${source} :: ${ent.level} :: ${ent.classSource} :: ${ent.className} :: ${name}`;
					(positions[key] = positions[key] || []).push(keyIx);
				}
				break;
			}
			case "subclassFeature": {
				if (name != null && source != null) {
					const key = `${source} :: ${ent.level} :: ${ent.classSource} :: ${ent.className} :: ${ent.subclassSource} :: ${ent.subclassShortName} :: ${name}`;
					(positions[key] = positions[key] || []).push(keyIx);
				}
				break;
			}
			default: {
				if (name != null && source != null) {
					const key = `${source} :: ${name}`;
					(positions[key] = positions[key] || []).push(keyIx);
				}
				break;
			}
		}
	}
}

class RefTagCheck extends DataTesterBase {
	registerParsedFileCheckers (parsedJsonChecker) {
		parsedJsonChecker.registerFileHandler(this);
	}

	handleFile (file, contents) {
		Object.entries(contents)
			.filter(([_, arr]) => arr instanceof Array)
			.forEach(([prop, arr]) => {
				arr.forEach(ent => {
					if (!ent.hasRefs) return;
					WALKER.walk(
						ent,
						{
							object: (obj) => {
								if (!obj.type || !this._RE_TAG.test(obj.type)) return;
								const prop = obj.type.slice(3).lowercaseFirst();
								this._TO_CHECK.push(`{#${prop} ${obj[prop]}}`);
							},
							string: (str) => {
								if (!str.startsWith("{#") || !str.endsWith("}")) return;
								this._TO_CHECK.push(str);
							},
						},
					);
				});
			});
	}

	async pPostRun () {
		if (!this._TO_CHECK.length) return;

		for (const toCheck of this._TO_CHECK) {
			const toCheckMeta = Renderer.hover.getRefMetaFromTag(toCheck);

			const prop = toCheckMeta.type.slice(3).lowercaseFirst();

			const refUnpacked = DataUtil.generic.unpackUid(toCheckMeta[prop], prop);
			const refHash = UrlUtil.URL_TO_HASH_BUILDER[prop](refUnpacked);

			const cpy = await DataLoader.pCacheAndGetHash(prop, refHash, {isCopy: true});
			if (!cpy) {
				this._addMessage(`Missing ref tag: ${toCheck}\n`);
			}
		}
	}
}
RefTagCheck.prototype._RE_TAG = /^ref[A-Z]/;
RefTagCheck.prototype._TO_CHECK = [];

class TestCopyCheck extends DataTesterBase {
	registerParsedFileCheckers (parsedJsonChecker) {
		parsedJsonChecker.registerFileHandler(this);
	}

	handleFile (file, contents) {
		if (!contents._meta) return;

		const fileErrors = [];

		Object.entries(contents)
			.forEach(([prop, arr]) => {
				if (!(arr instanceof Array)) return;

				const propNoFluff = prop.replace(/Fluff$/, "");
				const hashBuilder = UrlUtil.URL_TO_HASH_BUILDER[prop] || UrlUtil.URL_TO_HASH_BUILDER[propNoFluff];
				if (!hashBuilder) return;

				arr.forEach(ent => {
					if (!ent._copy) return;

					const hash = hashBuilder(ent);
					const hashCopy = hashBuilder(ent._copy);

					if (hash !== hashCopy) return;

					fileErrors.push({prop, hash, ent});
				});
			});

		if (!fileErrors.length) return;

		this._addMessage(`Self-referencing _copy hashes in ${file}! See below:\n`);
		fileErrors.forEach(({prop, hash, ent}) => {
			this._addMessage(`\t${prop} "${ent.name}" with hash "${hash}"\n`);
		});
	}
}

class HasFluffCheck extends GenericDataCheck {
	_LEN_PAD_HASH = 70;

	async pRun () {
		const withLoaders = Object.entries(DataUtil)
			.filter(([, impl]) => Object.getPrototypeOf(impl).name !== "_DataUtilPropConfig" && impl.loadJSON);

		const metas = {};

		for (const [prop, impl] of withLoaders) {
			const isFluff = prop.endsWith("Fluff");
			const propBase = isFluff ? prop.replace(/Fluff$/, "") : prop;

			let allData;
			try {
				allData = await impl.loadJSON({isAddBaseRaces: true});
			} catch (e) {
				if (e.code === "ENOENT" || /No loading strategy/.test(e.message)) continue;
				throw e;
			}

			const tgt = (metas[propBase] = metas[propBase] || {});
			tgt.prop = propBase;
			tgt.page = impl.PAGE;

			if (isFluff) {
				tgt.propFluff = prop;
				tgt.dataFluff = allData;
				tgt.dataFluffUnmerged = await impl.loadUnmergedJSON();
			} else {
				tgt.data = allData;
			}
		}

		const [metasWithFluff] = Object.values(metas)
			.segregate(it => it.propFluff);

		for (const {prop, propFluff, dataFluff, dataFluffUnmerged, data, page} of metasWithFluff) {
			const fluffLookup = (dataFluff[propFluff] || [])
				.mergeMap(flf => ({
					[UrlUtil.URL_TO_HASH_BUILDER[page](flf)]: {
						hasFluff: !!flf.entries,
						hasFluffImages: !!flf.images,
					},
				}));
			const fluffLookupUsed = {};

			// Tag parent fluff, so we can ignore e.g. "unused" fluff which is only used by `_copy`s
			(dataFluffUnmerged[propFluff] || []).forEach(flfUm => {
				if (!flfUm._copy) return;
				const hashParent = UrlUtil.URL_TO_HASH_BUILDER[page](flfUm._copy);
				// Track fluff vs. images, as e.g. the child overwriting the images means we don't use the parent images
				fluffLookup[hashParent].isCopiedFluff = !flfUm.entries;
				fluffLookup[hashParent].isCopiedFluffImages = !flfUm.images;
			});

			data[prop].forEach(ent => {
				if (!ent.hasFluff && !ent.hasFluffImages) return;

				const hash = UrlUtil.URL_TO_HASH_BUILDER[page](ent);
				// Replacement hashes, to be used instead of the main hash
				const hashesAlt = this._getHashesAlt({page, ent});
				const hashUsed = [hash, ...hashesAlt].find(h => fluffLookup[h] || fluffLookupUsed[h]) || hash;

				// This fluff has already been completely marked as "used"
				if (fluffLookupUsed[hashUsed]) return;

				const fromLookup = fluffLookup[hashUsed];
				if (!fromLookup) {
					this._addMessage(`${prop} hash ${`"${hash}"`.padEnd(this._LEN_PAD_HASH, " ")} not found in corresponding "${propFluff}" fluff!\n`);
					return;
				}

				const ptsMessage = [];

				if (!!ent.hasFluff !== fromLookup.hasFluff) {
					ptsMessage.push(`hasFluff mismatch (entity ${ent.hasFluff} | fluff ${fromLookup.hasFluff})`);
				} else if (ent.hasFluff) {
					delete fluffLookup[hashUsed]?.hasFluff;
				}

				if (!!ent.hasFluffImages !== fromLookup.hasFluffImages) {
					ptsMessage.push(`hasFluffImages mismatch (entity ${ent.hasFluffImages} | fluff ${fromLookup.hasFluffImages})`);
				} else if (ent.hasFluffImages) {
					delete fluffLookup[hashUsed]?.hasFluffImages;
				}

				if (!fluffLookup[hashUsed].hasFluff && !fluffLookup[hashUsed].hasFluffImages) {
					delete fluffLookup[hashUsed];
					fluffLookupUsed[hashUsed] = true;
				}

				if (!ptsMessage.length) return;

				this._addMessage(`${prop} hash ${`"${hashUsed}"`.padEnd(this._LEN_PAD_HASH, " ")} fluff did not match fluff file: ${ptsMessage.join("; ")}\n`);
			});

			const unusedFluff = Object.entries(fluffLookup)
				.filter(([, meta]) => !meta.isCopiedFluff && !meta.isCopiedFluffImages);

			if (unusedFluff.length) {
				const errors = unusedFluff
					.map(([hash, {hasFluff, hasFluffImages}]) => `${`"${hash}"`.padEnd(this._LEN_PAD_HASH, " ")} ${[hasFluff ? "hasFluff" : null, hasFluffImages ? "hasFluffImages" : null].filter(Boolean).join(" | ")}`);
				this._addMessage(`Extra ${propFluff} fluff found!\n${errors.map(it => `\t${it}`).join("\n")}\n`);
			}
		}
	}

	_getHashesAlt ({page, ent}) {
		if (ent.__prop === "item" && ent._variantName) return [UrlUtil.URL_TO_HASH_BUILDER[page]({name: ent._variantName, source: ent.source})];
		return [];
	}
}

class AdventureBookTagCheck extends DataTesterBase {
	_ADV_BOOK_LOOKUP = {};

	registerParsedPrimitiveHandlers (parsedJsonChecker) {
		[
			{prop: "adventure", tag: "adventure"},
			{prop: "book", tag: "book"},
		].forEach(({prop, tag}) => {
			this._ADV_BOOK_LOOKUP[tag] = DataFileFinder.getWithProp(prop)
				.mergeMap(({json}) => json[prop].mergeMap(({id}) => ({[id.toLowerCase()]: true})));
		});

		parsedJsonChecker.addPrimitiveHandler("string", this._checkString.bind(this));
	}

	_checkString (str, {filePath}) {
		const tagSplit = Renderer.splitByTags(str);

		const len = tagSplit.length;
		for (let i = 0; i < len; ++i) {
			const s = tagSplit[i];

			if (!s) continue;
			if (s.startsWith("{@")) {
				const [tag, text] = Renderer.splitFirstSpace(s.slice(1, -1));
				if (!["@adventure", "@book"].includes(tag)) continue;

				const [, id] = text.toLowerCase().split("|");
				if (!id) throw new Error(`${tag} tag had ${s} no source!`); // Should never occur

				if (this._ADV_BOOK_LOOKUP[tag.slice(1)][id]) continue;

				this._addMessage(`Missing link: ${s} in file ${filePath} had unknown "${tag}" ID "${id}"\n`);
			}
		}
	}
}

async function main () {
	ut.patchLoadJson();

	await TagTestUtil.pInit();

	const dataTesters = [
		new LinkCheck(),
		new ClassLinkCheck(),
		new BraceCheck(),
		new FilterCheck(),
		new ScaleDiceCheck(),
		new StripTagTest(),
		new TableDiceTest(),
		new AdventureBookTagCheck(),
		new AreaCheck(),
		new EscapeCharacterCheck(),
		new DuplicateEntityCheck(),
		new RefTagCheck(),
		new TestCopyCheck(),
		new HasFluffCheck(),
		new ItemDataCheck(),
		new ActionDataCheck(),
		new DeityDataCheck(),
		new LootDataCheck(),
		new ClassDataCheck(),
		new FeatDataCheck(),
		new BackgroundDataCheck(),
		new BestiaryDataCheck(),
		new DeckDataCheck(),
		new CultsBoonsDataCheck(),
		new OptionalfeatureDataCheck(),
		new SpellDataCheck(),
		new ConditionDiseaseDataCheck(),
		new RewardsDataCheck(),
		new VariantRuleDataCheck(),
		new SkillsRuleDataCheck(),
		new SensesDataCheck(),
		new FoundrySpellsDataCheck(),
	];
	DataTester.register({dataTesters});

	const runOpts = {
		fnIsIgnoredFile: isIgnoredDataFile,
	};

	// Walk every data tree so the generic primitive/file checks (tags, braces, links, dice, ...) cover all files.
	//   Pass no per-entity testers here: those discover their relevant files across all trees themselves and are
	//   run once below, after every tree has been walked (so cross-file checks see the full picture).
	for (const dir of DATA_DIRS) {
		if (!fs.existsSync(dir)) continue;
		await DataTester.pRun(dir, [], runOpts);
	}

	for (const dataTester of dataTesters) await dataTester.pRun();
	for (const dataTester of dataTesters) await dataTester.pPostRun();

	ut.unpatchLoadJson();

	const outMessage = DataTester.getLogReport(dataTesters);

	console.timeEnd(TIME_TAG);

	return !outMessage;
}

export default main()
	.then(isSuccess => {
		if (isSuccess) return;
		console.error("Tag test failed! See errors above.");
		process.exit(1);
	})
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
