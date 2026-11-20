"use strict";

// PARSING =============================================================================================================
globalThis.Parser = {};

Parser._parse_aToB = function (abMap, a, fallback) {
	if (a === undefined || a === null) throw new TypeError("undefined or null object passed to parser");
	if (typeof a === "string") a = a.trim();
	if (abMap[a] !== undefined) return abMap[a];
	return fallback !== undefined ? fallback : a;
};

Parser._parse_bToA = function (abMap, b, fallback) {
	if (b === undefined || b === null) throw new TypeError("undefined or null object passed to parser");
	if (typeof b === "string") b = b.trim();
	for (const v in abMap) {
		if (!abMap.hasOwnProperty(v)) continue;
		if (abMap[v] === b) return v;
	}
	return fallback !== undefined ? fallback : b;
};

Parser.attrChooseToFull = function (attList) {
	if (attList.length === 1) return `${Parser.attAbvToFull(attList[0])}${attList[0] === "spellcasting" ? " ability" : ""} modifier`;
	else {
		const attsTemp = [];
		for (let i = 0; i < attList.length; ++i) {
			attsTemp.push(Parser.attAbvToFull(attList[i]));
		}
		return `${attsTemp.join(" or ")} modifier (your choice)`;
	}
};

Parser.numberToText = function (number, {isOrdinalForm = false} = {}) {
	if (number == null) throw new TypeError(`undefined or null object passed to parser`);
	if (Math.abs(number) >= 100) return isOrdinalForm ? Parser.getOrdinalForm(number) : `${number}`;

	return `${number < 0 ? "negative " : ""}${Parser.numberToText._getPositiveNumberAsText({number: Math.abs(number), isOrdinalForm})}`;
};

Parser.numberToText._getPositiveNumberAsText = ({number, isOrdinalForm}) => {
	const [preDotRaw, postDotRaw] = `${number}`.split(".");

	if (!postDotRaw) return Parser.numberToText._getPositiveIntegerAsText({number, isOrdinalForm});

	if (isOrdinalForm) return `${preDotRaw}.${Parser.getOrdinalForm(postDotRaw)}`;

	const {str: strPostDot, isPretty: isPrettyPostDot} = Parser.numberToText._getPostDot({postDotRaw});

	if (!isPrettyPostDot) return `${number}`;

	return preDotRaw === "0"
		? strPostDot
		: `${Parser.numberToText._getPositiveIntegerAsText({number: Math.trunc(number), isOrdinalForm})} and ${strPostDot}`;
};

Parser.numberToText._getPostDot = ({postDotRaw}) => {
	// See also: `Parser.numberToVulgar`
	switch (postDotRaw) {
		case "125": return {str: `one-eighth`, isPretty: true};
		case "2": return {str: `one-fifth`, isPretty: true};
		case "25": return {str: `one-quarter`, isPretty: true};
		case "375": return {str: `three-eighths`, isPretty: true};
		case "4": return {str: `two-fifths`, isPretty: true};
		case "5": return {str: `one-half`, isPretty: true};
		case "6": return {str: `three-fifths`, isPretty: true};
		case "625": return {str: `five-eighths`, isPretty: true};
		case "75": return {str: `three-quarters`, isPretty: true};
		case "8": return {str: `four-fifths`, isPretty: true};
		case "875": return {str: `seven-eighths`, isPretty: true};

		default: {
			// Handle recursive
			const asNum = Number(`0.${postDotRaw}`);

			if (asNum.toFixed(2) === (1 / 3).toFixed(2)) return {str: `one-third`, isPretty: true};
			if (asNum.toFixed(2) === (2 / 3).toFixed(2)) return {str: `two-thirds`, isPretty: true};

			if (asNum.toFixed(2) === (1 / 6).toFixed(2)) return {str: `one-sixth`, isPretty: true};
			if (asNum.toFixed(2) === (5 / 6).toFixed(2)) return {str: `five-sixths`, isPretty: true};

			return {str: `${postDotRaw}`, isPretty: false};
		}
	}
};

Parser.numberToText._getPositiveIntegerAsText = ({number, isOrdinalForm}) => {
	switch (number) {
		case 0: return Parser.numberToText._getOptionallyOrdinal({number, str: "zero", isOrdinalForm});
		case 1: return Parser.numberToText._getOptionallyOrdinal({number, str: "one", isOrdinalForm});
		case 2: return Parser.numberToText._getOptionallyOrdinal({number, str: "two", isOrdinalForm});
		case 3: return Parser.numberToText._getOptionallyOrdinal({number, str: "three", isOrdinalForm});
		case 4: return Parser.numberToText._getOptionallyOrdinal({number, str: "four", isOrdinalForm});
		case 5: return Parser.numberToText._getOptionallyOrdinal({number, str: "five", isOrdinalForm});
		case 6: return Parser.numberToText._getOptionallyOrdinal({number, str: "six", isOrdinalForm});
		case 7: return Parser.numberToText._getOptionallyOrdinal({number, str: "seven", isOrdinalForm});
		case 8: return Parser.numberToText._getOptionallyOrdinal({number, str: "eight", isOrdinalForm});
		case 9: return Parser.numberToText._getOptionallyOrdinal({number, str: "nine", isOrdinalForm});
		case 10: return Parser.numberToText._getOptionallyOrdinal({number, str: "ten", isOrdinalForm});
		case 11: return Parser.numberToText._getOptionallyOrdinal({number, str: "eleven", isOrdinalForm});
		case 12: return Parser.numberToText._getOptionallyOrdinal({number, str: "twelve", isOrdinalForm});
		case 13: return Parser.numberToText._getOptionallyOrdinal({number, str: "thirteen", isOrdinalForm});
		case 14: return Parser.numberToText._getOptionallyOrdinal({number, str: "fourteen", isOrdinalForm});
		case 15: return Parser.numberToText._getOptionallyOrdinal({number, str: "fifteen", isOrdinalForm});
		case 16: return Parser.numberToText._getOptionallyOrdinal({number, str: "sixteen", isOrdinalForm});
		case 17: return Parser.numberToText._getOptionallyOrdinal({number, str: "seventeen", isOrdinalForm});
		case 18: return Parser.numberToText._getOptionallyOrdinal({number, str: "eighteen", isOrdinalForm});
		case 19: return Parser.numberToText._getOptionallyOrdinal({number, str: "nineteen", isOrdinalForm});
		case 20: return Parser.numberToText._getOptionallyOrdinal({number, str: "twenty", isOrdinalForm});
		case 30: return Parser.numberToText._getOptionallyOrdinal({number, str: "thirty", isOrdinalForm});
		case 40: return Parser.numberToText._getOptionallyOrdinal({number, str: "forty", isOrdinalForm});
		case 50: return Parser.numberToText._getOptionallyOrdinal({number, str: "fifty", isOrdinalForm});
		case 60: return Parser.numberToText._getOptionallyOrdinal({number, str: "sixty", isOrdinalForm});
		case 70: return Parser.numberToText._getOptionallyOrdinal({number, str: "seventy", isOrdinalForm});
		case 80: return Parser.numberToText._getOptionallyOrdinal({number, str: "eighty", isOrdinalForm});
		case 90: return Parser.numberToText._getOptionallyOrdinal({number, str: "ninety", isOrdinalForm});
		default: {
			const str = String(number);
			return `${Parser.numberToText._getPositiveIntegerAsText({number: Number(`${str[0]}0`)})}-${Parser.numberToText._getPositiveIntegerAsText({number: Number(str[1]), isOrdinalForm})}`;
		}
	}
};

Parser.numberToText._getOptionallyOrdinal = ({number, str, isOrdinalForm}) => {
	if (!isOrdinalForm) return str;
	switch (number) {
		case 1: return "first";
		case 2: return "second";
		case 3: return "third";
	}
	if (str.endsWith("y")) return `${str.slice(0, -1)}ieth`;
	if (str.endsWith("ve")) return `${str.slice(0, -2)}fth`;
	return `${str}th`;
};

Parser.textToNumber = function (str) {
	str = str.trim().toLowerCase();
	if (!isNaN(str)) return Number(str);
	switch (str) {
		case "zero": return 0;
		case "one": case "a": case "an": case "first": return 1;
		case "two": case "double": case "second": return 2;
		case "three": case "triple": case "third": return 3;
		case "four": case "quadruple": case "fourth": return 4;
		case "five": case "fifth": return 5;
		case "six": case "sixth": return 6;
		case "seven": case "seventh": return 7;
		case "eight": case "eighth": return 8;
		case "nine": case "ninth": return 9;
		case "ten": case "tenth": return 10;
		case "eleven": return 11;
		case "twelve": return 12;
		case "thirteen": return 13;
		case "fourteen": return 14;
		case "fifteen": return 15;
		case "sixteen": return 16;
		case "seventeen": return 17;
		case "eighteen": return 18;
		case "nineteen": return 19;
		case "twenty": return 20;
		case "thirty": return 30;
		case "forty": return 40;
		case "fifty": return 50;
		case "sixty": return 60;
		case "seventy": return 70;
		case "eighty": return 80;
		case "ninety": return 90;
	}
	return NaN;
};

Parser.numberToVulgar = function (number, {isFallbackOnFractional = true} = {}) {
	const isNeg = number < 0;
	const spl = `${number}`.replace(/^-/, "").split(".");
	if (spl.length === 1) return number;

	let preDot = spl[0] === "0" ? "" : spl[0];
	if (isNeg) preDot = `-${preDot}`;

	// See also: `Parser.numberToText._getPositiveNumberAsText`
	switch (spl[1]) {
		case "125": return `${preDot}⅛`;
		case "2": return `${preDot}⅕`;
		case "25": return `${preDot}¼`;
		case "375": return `${preDot}⅜`;
		case "4": return `${preDot}⅖`;
		case "5": return `${preDot}½`;
		case "6": return `${preDot}⅗`;
		case "625": return `${preDot}⅝`;
		case "75": return `${preDot}¾`;
		case "8": return `${preDot}⅘`;
		case "875": return `${preDot}⅞`;

		default: {
			// Handle recursive
			const asNum = Number(`0.${spl[1]}`);

			if (asNum.toFixed(2) === (1 / 3).toFixed(2)) return `${preDot}⅓`;
			if (asNum.toFixed(2) === (2 / 3).toFixed(2)) return `${preDot}⅔`;

			if (asNum.toFixed(2) === (1 / 6).toFixed(2)) return `${preDot}⅙`;
			if (asNum.toFixed(2) === (5 / 6).toFixed(2)) return `${preDot}⅚`;
		}
	}

	return isFallbackOnFractional ? Parser.numberToFractional(number) : null;
};

Parser.vulgarToNumber = function (str) {
	const [, leading = "0", vulgar = ""] = /^(\d+)?([⅛¼⅜½⅝¾⅞⅓⅔⅙⅚])?$/.exec(str) || [];
	let out = Number(leading);
	switch (vulgar) {
		case "⅛": out += 0.125; break;
		case "¼": out += 0.25; break;
		case "⅜": out += 0.375; break;
		case "½": out += 0.5; break;
		case "⅝": out += 0.625; break;
		case "¾": out += 0.75; break;
		case "⅞": out += 0.875; break;
		case "⅓": out += 1 / 3; break;
		case "⅔": out += 2 / 3; break;
		case "⅙": out += 1 / 6; break;
		case "⅚": out += 5 / 6; break;
		case "": break;
		default: throw new Error(`Unhandled vulgar part "${vulgar}"`);
	}
	return out;
};

Parser.numberToSuperscript = function (number) {
	return `${number}`.split("").map(c => isNaN(c) ? c : Parser._NUMBERS_SUPERSCRIPT[Number(c)]).join("");
};
Parser._NUMBERS_SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";

Parser.numberToSubscript = function (number) {
	return `${number}`.split("").map(c => isNaN(c) ? c : Parser._NUMBERS_SUBSCRIPT[Number(c)]).join("");
};
Parser._NUMBERS_SUBSCRIPT = "₀₁₂₃₄₅₆₇₈₉";

Parser._greatestCommonDivisor = function (a, b) {
	if (b < Number.EPSILON) return a;
	return Parser._greatestCommonDivisor(b, Math.floor(a % b));
};
Parser.numberToFractional = function (number) {
	const isMinus = number < 0;
	number = Math.abs(Number(number.toFixed(6)));

	if (!number) return `${number}`;

	const len = number.toString().length - 2;
	let denominator = 10 ** len;
	let numerator = number * denominator;
	const divisor = Parser._greatestCommonDivisor(numerator, denominator);
	numerator = Math.floor(numerator / divisor);
	denominator = Math.floor(denominator / divisor);

	return `${isMinus ? "-" : ""}${denominator === 1 ? String(numerator) : `${Math.floor(numerator)}/${Math.floor(denominator)}`}`;
};

Parser.isNumberNearEqual = function (a, b) {
	return Math.abs(a - b) < Number.EPSILON;
};

Parser.ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

Parser.defAbvToFull = function (abv) {
	return Parser._parse_aToB(Parser.DEF_ABV_TO_FULL, abv);
};

Parser.attAbvToFull = function (abv) {
	return Parser._parse_aToB(Parser.ATB_ABV_TO_FULL, abv);
};

Parser.attFullToAbv = function (full) {
	return Parser._parse_bToA(Parser.ATB_ABV_TO_FULL, full);
};

Parser.sizeAbvToFull = function (abv) {
	return Parser._parse_aToB(Parser.SIZE_ABV_TO_FULL, abv);
};

Parser.sizeAbvToShort = function (abv) {
	return Parser._parse_aToB(Parser.SIZE_ABV_TO_SHORT, abv);
};

Parser.getAbilityModNumber = function (abilityScore) {
	return Math.floor((abilityScore - 10) / 2);
};

Parser.getAbilityModifier = function (abilityScore) {
	let modifier = Parser.getAbilityModNumber(abilityScore);
	if (modifier >= 0) modifier = `+${modifier}`;
	return `${modifier}`;
};

Parser.getSpeedString = (ent, {isMetric = false, isSkipZeroWalk = false, isLongForm = false, styleHint = null} = {}) => {
	if (ent.speed == null) return "\u2014";

	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	const unit = isMetric
		? Parser.metric.getMetricUnit({originalUnit: "ft.", isShortForm: !isLongForm})
		: isLongForm ? "feet" : "ft.";
	if (typeof ent.speed === "object") {
		const stack = [];
		let joiner = ", ";

		Parser.SPEED_MODES
			.filter(mode => !ent.speed.hidden?.includes(mode))
			.forEach(mode => Parser._getSpeedString_addSpeedMode({ent, prop: mode, stack, isMetric, isSkipZeroWalk, unit, styleHint}));

		if (ent.speed.choose && !ent.speed.hidden?.includes("choose")) {
			joiner = "; ";
			stack.push(`${ent.speed.choose.from.sort().map(prop => Parser._getSpeedString_getSpeedName({prop, styleHint})).joinConjunct(", ", " or ")} ${ent.speed.choose.amount} ${unit}${ent.speed.choose.note ? ` ${ent.speed.choose.note}` : ""}`);
		}

		return stack.join(joiner) + (ent.speed.note ? ` ${ent.speed.note}` : "");
	}

	return (isMetric ? Parser.metric.getMetricNumber({originalValue: ent.speed, originalUnit: Parser.UNT_FEET}) : ent.speed)
		+ (ent.speed === "Varies" ? "" : ` ${unit} `);
};
Parser._getSpeedString_addSpeedMode = ({ent, prop, stack, isMetric, isSkipZeroWalk, unit, styleHint}) => {
	if (ent.speed[prop] || (!isSkipZeroWalk && prop === "walk")) Parser._getSpeedString_addSpeed({prop, speed: ent.speed[prop] || 0, isMetric, unit, stack, styleHint});
	if (ent.speed.alternate && ent.speed.alternate[prop]) ent.speed.alternate[prop].forEach(speed => Parser._getSpeedString_addSpeed({prop, speed, isMetric, unit, stack, styleHint}));
};
Parser._getSpeedString_addSpeed = ({prop, speed, isMetric, unit, stack, styleHint}) => {
	const ptName = Parser._getSpeedString_getSpeedName({prop, styleHint});
	const ptValue = Parser._getSpeedString_getVal({prop, speed, isMetric});
	const ptUnit = speed === true ? "" : ` ${unit}`;
	const ptCondition = Parser._getSpeedString_getCondition({speed});
	stack.push([ptName, ptValue, ptUnit, ptCondition].join(""));
};
Parser._getSpeedString_getVal = ({prop, speed, isMetric}) => {
	if (speed === true && prop !== "walk") return "equal to your walking speed";

	const num = speed === true
		? 0
		: speed.number != null ? speed.number : speed;

	return isMetric ? Parser.metric.getMetricNumber({originalValue: num, originalUnit: Parser.UNT_FEET}) : num;
};
Parser._getSpeedString_getCondition = ({speed}) => speed.condition ? ` ${Renderer.get().render(speed.condition)}` : "";
Parser._getSpeedString_getSpeedName = ({prop, styleHint}) => prop === "walk" ? "" : `${prop[styleHint === "classic" ? "toString" : "toTitleCase"]()} `;

Parser.SPEED_MODES = ["walk", "burrow", "climb", "fly", "swim"];

Parser.SPEED_TO_PROGRESSIVE = {
	"walk": "walking",
	"burrow": "burrowing",
	"climb": "climbing",
	"fly": "flying",
	"swim": "swimming",
};

Parser.speedToProgressive = function (prop) {
	return Parser._parse_aToB(Parser.SPEED_TO_PROGRESSIVE, prop);
};

Parser.raceCreatureTypesToFull = function (creatureTypes) {
	const hasSubOptions = creatureTypes.some(it => it.choose);
	return creatureTypes
		.map(it => {
			if (!it.choose) return Parser.monTypeToFullObj(it).asText;
			return [...it.choose]
				.sort(SortUtil.ascSortLower)
				.map(sub => Parser.monTypeToFullObj(sub).asText)
				.joinConjunct(", ", " or ");
		})
		.joinConjunct(hasSubOptions ? "; " : ", ", " and ");
};

Parser.crToXp = function (cr, {isDouble = false} = {}) {
	if (cr != null && cr.xp) return (isDouble ? cr.xp * 2 : cr.xp).toLocaleStringVe();

	const toConvert = cr ? (cr.cr || cr) : null;
	if (toConvert === "Unknown" || toConvert == null || !Parser.XP_CHART_ALT[toConvert]) return "Unknown";
	// CR 0 creatures can be 0 or 10 XP, but 10 XP is used in almost every case.
	//   Exceptions, such as MM's Frog and Sea Horse, have their XP set to 0 on the creature
	if (toConvert === "0") return "10";
	const xp = Parser.XP_CHART_ALT[toConvert];
	return (isDouble ? 2 * xp : xp).toLocaleStringVe();
};

Parser.crToXpNumber = function (cr) {
	if (cr != null && cr.xp) return cr.xp;
	const toConvert = cr ? (cr.cr || cr) : cr;
	if (toConvert === "Unknown" || toConvert == null) return null;
	return Parser.XP_CHART_ALT[toConvert] ?? null;
};

Parser.LEVEL_XP_REQUIRED = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

Parser.CRS = ["0", "1/8", "1/4", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"];

Parser.isValidCr = function (cr) {
	return Parser.CRS.includes(cr);
};

Parser.crToNumber = function (cr, opts = {}) {
	const {isDefaultNull = false} = opts;

	if (cr === "Unknown" || cr === "\u2014" || cr == null) return isDefaultNull ? null : VeCt.CR_UNKNOWN;
	if (cr.cr) return Parser.crToNumber(cr.cr, opts);

	const parts = cr.trim().split("/").filter(Boolean);
	if (!parts.length || parts.length >= 3) return isDefaultNull ? null : VeCt.CR_CUSTOM;
	if (isNaN(parts[0])) return isDefaultNull ? null : VeCt.CR_CUSTOM;

	if (parts.length === 2) {
		if (isNaN(Number(parts[1]))) return isDefaultNull ? null : VeCt.CR_CUSTOM;
		return Number(parts[0]) / Number(parts[1]);
	}

	return Number(parts[0]);
};

Parser.numberToCr = function (number, safe) {
	// avoid dying if already-converted number is passed in
	if (safe && typeof number === "string" && Parser.CRS.includes(number)) return number;

	if (number == null) return "Unknown";

	return Parser.numberToFractional(number);
};

Parser.crToPb = function (cr) {
	const crNumber = Parser.crToNumber(cr);
	if (crNumber === VeCt.CR_UNKNOWN) return 0;
	if (crNumber === VeCt.CR_CUSTOM || crNumber < 0) return null;
	if (crNumber < 5) return 2;
	return Math.ceil(crNumber / 4) + 1;
};

Parser.levelToPb = function (level) {
	if (!level) return 2;
	return Math.ceil(level / 4) + 1;
};

Parser.SKILL_TO_ATB_ABV = {
	"athletics": "str",
	"brawn": "str",
	"finesse": "dex",
	"stealth": "dex",
	"history": "int",
	"magiscience": "int",
	"medicine": "int",
	"nature": "int",
	"insight": "wis",
	"investigation": "wis",
	"perception": "wis",
	"survival": "wis",
	"deception": "cha",
	"intimidation": "cha",
	"persuasion": "cha",
};

Parser.skillToAbilityAbv = function (skill) {
	return Parser._parse_aToB(Parser.SKILL_TO_ATB_ABV, skill);
};

Parser.SKILL_TO_SHORT = {
	"athletics": "ath",
	"brawn": "brwn",
	"finesse": "fnes",
	"stealth": "slth",
	"history": "hist",
	"magiscience": "mgsc",
	"medicine": "med",
	"nature": "natr",
	"insight": "ins",
	"investigation": "invn",
	"perception": "perp",
	"survival": "surv",
	"deception": "decp",
	"intimidation": "intm",
	"persuasion": "pers",
};

Parser.skillToShort = function (skill) {
	return Parser._parse_aToB(Parser.SKILL_TO_SHORT, skill);
};

Parser.LANGUAGES_STANDARD = [
	"Common",
	"Common Sign Language",
	"Dwarvish",
	"Elvish",
	"Giant",
	"Gnomish",
	"Goblin",
	"Halfling",
	"Orc",
];

Parser.LANGUAGES_EXOTIC = [
	"Abyssal",
	"Aquan",
	"Auran",
	"Celestial",
	"Draconic",
	"Deep Speech",
	"Ignan",
	"Infernal",
	"Primordial",
	"Sylvan",
	"Terran",
	"Undercommon",
];

Parser.LANGUAGES_SECRET = [
	"Druidic",
	"Thieves' cant",
];

Parser.LANGUAGES_ALL = [
	...Parser.LANGUAGES_STANDARD,
	...Parser.LANGUAGES_EXOTIC,
	...Parser.LANGUAGES_SECRET,
].sort();

Parser.defenceToFull = function (defence, {renderer = null, isHideFrom = false, key = "arm"} = {}) {
	if (typeof defence === "string") return defence; // handle classic format

	renderer ||= Renderer.get();

	let stack = "";
	let inBraces = false;
	for (let i = 0; i < defence.length; ++i) {
		const cur = defence[i];
		const nxt = defence[i + 1];

		if (cur.special != null) {
			if (inBraces) inBraces = false;

			stack += cur.special;
		} else if (cur[key] != null) {
			const isNxtBraces = nxt && nxt.braces;

			if (!inBraces && cur.braces) {
				stack += "(";
				inBraces = true;
			}

			stack += cur[key];

			if (!isHideFrom && cur.from) {
				// always brace nested braces
				if (cur.braces) {
					stack += " (";
				} else {
					stack += inBraces ? "; " : " (";
				}

				inBraces = true;

				stack += cur.from.map(it => renderer.render(it)).join(", ");

				if (cur.braces) {
					stack += ")";
				} else if (!isNxtBraces) {
					stack += ")";
					inBraces = false;
				}
			}

			if (cur.condition) stack += ` ${renderer.render(cur.condition)}`;

			if (inBraces && !isNxtBraces) {
				stack += ")";
				inBraces = false;
			}
		} else {
			stack += cur;
		}

		if (nxt) {
			if (nxt.braces) {
				stack += inBraces ? "; " : " (";
				inBraces = true;
			} else stack += ", ";
		}
	}
	if (inBraces) stack += ")";

	return stack.trim();
};

Parser.MONSTER_COUNT_TO_XP_MULTIPLIER = [1, 1.5, 2, 2, 2, 2, 2.5, 2.5, 2.5, 2.5, 3, 3, 3, 3, 4];
Parser.numMonstersToXpMult = function (num, playerCount = 3) {
	const baseVal = (() => {
		if (num >= Parser.MONSTER_COUNT_TO_XP_MULTIPLIER.length) return 4;
		return Parser.MONSTER_COUNT_TO_XP_MULTIPLIER[num - 1];
	})();

	if (playerCount < 3) return baseVal >= 3 ? baseVal + 1 : baseVal + 0.5;
	else if (playerCount > 5) {
		return baseVal === 4 ? 3 : baseVal - 0.5;
	} else return baseVal;
};

Parser.armourFullToAbv = function (armour) {
	return Parser._parse_bToA(Parser.ARMOUR_ABV_TO_FULL, armour);
};

Parser.weaponFullToAbv = function (weapon) {
	return Parser._parse_bToA(Parser.WEAPON_ABV_TO_FULL, weapon);
};

Parser._getSourceStringFromSource = function (source) {
	if (source && source.source) return source.source;
	return source;
};
Parser._buildSourceCache = function (dict) {
	const out = {};
	Object.entries(dict).forEach(([k, v]) => out[k.toLowerCase()] = v);
	return out;
};
Parser._sourceJsonCache = null;
Parser.hasSourceJson = function (source) {
	Parser._sourceJsonCache = Parser._sourceJsonCache || Parser._buildSourceCache(Object.keys(Parser.SOURCE_JSON_TO_FULL).mergeMap(k => ({[k]: k})));
	return !!Parser._sourceJsonCache[source.toLowerCase()];
};
Parser._sourceFullCache = null;
Parser.hasSourceFull = function (source) {
	Parser._sourceFullCache = Parser._sourceFullCache || Parser._buildSourceCache(Parser.SOURCE_JSON_TO_FULL);
	return !!Parser._sourceFullCache[source.toLowerCase()];
};
Parser._sourceAbvCache = null;
Parser.hasSourceAbv = function (source) {
	Parser._sourceAbvCache = Parser._sourceAbvCache || Parser._buildSourceCache(Parser.SOURCE_JSON_TO_ABV);
	return !!Parser._sourceAbvCache[source.toLowerCase()];
};
Parser._sourceDateCache = null;
Parser.hasSourceDate = function (source) {
	Parser._sourceDateCache = Parser._sourceDateCache || Parser._buildSourceCache(Parser.SOURCE_JSON_TO_DATE);
	return !!Parser._sourceDateCache[source.toLowerCase()];
};
Parser.sourceJsonToJson = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceJson(source)) return Parser._sourceJsonCache[source.toLowerCase()];
	if (typeof PrereleaseUtil !== "undefined" && PrereleaseUtil.hasSourceJson(source)) return PrereleaseUtil.sourceJsonToSource(source).json;
	if (typeof BrewUtil2 !== "undefined" && BrewUtil2.hasSourceJson(source)) return BrewUtil2.sourceJsonToSource(source).json;
	return source;
};
Parser.sourceJsonToFull = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceFull(source)) return Parser._sourceFullCache[source.toLowerCase()].replace(/'/g, "\u2019");
	if (typeof PrereleaseUtil !== "undefined" && PrereleaseUtil.hasSourceJson(source)) return PrereleaseUtil.sourceJsonToFull(source).replace(/'/g, "\u2019");
	if (typeof BrewUtil2 !== "undefined" && BrewUtil2.hasSourceJson(source)) return BrewUtil2.sourceJsonToFull(source).replace(/'/g, "\u2019");
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_FULL, source).replace(/'/g, "\u2019");
};
Parser.sourceJsonToFullCompactPrefix = function (source) {
	return Parser.sourceJsonToFull(source);
};
Parser.sourceJsonToAbv = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceAbv(source)) return Parser._sourceAbvCache[source.toLowerCase()];
	if (typeof PrereleaseUtil !== "undefined" && PrereleaseUtil.hasSourceJson(source)) return PrereleaseUtil.sourceJsonToAbv(source);
	if (typeof BrewUtil2 !== "undefined" && BrewUtil2.hasSourceJson(source)) return BrewUtil2.sourceJsonToAbv(source);
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_ABV, source);
};
Parser.sourceJsonToDate = function (source) {
	source = Parser._getSourceStringFromSource(source);
	if (Parser.hasSourceDate(source)) return Parser._sourceDateCache[source.toLowerCase()];
	if (typeof PrereleaseUtil !== "undefined" && PrereleaseUtil.hasSourceJson(source)) return PrereleaseUtil.sourceJsonToDate(source);
	if (typeof BrewUtil2 !== "undefined" && BrewUtil2.hasSourceJson(source)) return BrewUtil2.sourceJsonToDate(source);
	return Parser._parse_aToB(Parser.SOURCE_JSON_TO_DATE, source, null);
};

Parser.sourceJsonToSourceClassname = function (source, {sourceJson = null} = {}) {
	sourceJson ||= Parser.sourceJsonToJson(source);
	return `ve-source__${sourceJson.replace(/[^A-Za-z0-9-_]/g, "_")}`;
};

Parser.sourceJsonToMarkerHtml = function (source, {isList = false, isStatsName = false, isAddBrackets = false, additionalStyles = ""} = {}) {
	source = Parser._getSourceStringFromSource(source);
	return "";
};

Parser.stringToSlug = function (str) {
	return str.trim().toLowerCase().toAscii().replace(/[^\w ]+/g, "").replace(/ +/g, "-");
};

Parser.stringToCasedSlug = function (str) {
	return str.toAscii().replace(/[^\w ]+/g, "").replace(/ +/g, "-");
};

Parser.ITEM_SPELLCASTING_FOCUS_CLASSES = ["Artificer", "Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard"];

Parser.itemValueToFull = function (item, opts = {isShortForm: false, isSmallUnits: false}) {
	return Parser._moneyToFull(item, "value", "valueMult", opts);
};

/**
 * @param item
 * @param {object} [opts]
 * @param {?boolean} [opts.isShortForm]
 * @param {?boolean} [opts.isSmallUnits]
 * @param {?number} [opts.multiplier]
 * @param {?string} [opts.styleHint]
 */
Parser.itemValueToFullMultiCurrency = function (
	item,
	opts = {
		isShortForm: false,
		isSmallUnits: false,
		multiplier: null,
		styleHint: null,
	},
) {
	return Parser._moneyToFullMultiCurrency(item, "value", "valueMult", opts);
};

Parser.itemVehicleCostsToFull = function (item, isShortForm) {
	return {
		travelCostFull: Parser._moneyToFull(item, "travelCost", "travelCostMult", {isShortForm}),
		shippingCostFull: Parser._moneyToFull(item, "shippingCost", "shippingCostMult", {isShortForm}),
	};
};

Parser.spellComponentCostToFull = function (item, isShortForm) {
	return Parser._moneyToFull(item, "cost", "costMult", {isShortForm});
};

Parser.vehicleCostToFull = function (item, isShortForm) {
	return Parser._moneyToFull(item, "cost", "costMult", {isShortForm});
};

Parser._moneyToFull = function (it, prop, propMult, opts = {isShortForm: false, isSmallUnits: false}) {
	if (it[prop] == null && it[propMult] == null) return "";
	if (it[prop] != null) {
		const {coin, mult} = Parser.getCurrencyAndMultiplier(it[prop], it.currencyConversion);
		return `${(it[prop] * mult).toLocaleStringVe()}${opts.isSmallUnits ? `<span class="small ve-ml-1">${coin}</span>` : ` ${coin}`}`;
	} else if (it[propMult] != null) return opts.isShortForm ? `×${it[propMult]}` : `base value ×${it[propMult]}`;
	return "";
};

Parser._moneyToFullMultiCurrency = function (it, prop, propMult, {isShortForm, multiplier, styleHint} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	if (it[prop]) {
		const conversionTable = Parser.getCurrencyConversionTable(it.currencyConversion);

		const simplified = it.currencyConversion
			? CurrencyUtil.doSimplifyCoins(
				{
					// Assume the e.g. item's value is in the lowest available denomination
					[conversionTable[0]?.coin || "cp"]: it[prop] * (multiplier ?? conversionTable[0]?.mult ?? 1),
				},
				{
					currencyConversionId: it.currencyConversion,
				},
			)
			: CurrencyUtil.doSimplifyCoins({
				cp: it[prop] * (multiplier ?? 1),
			});

		return [...conversionTable]
			.reverse()
			.filter(meta => simplified[meta.coin])
			.map(meta => `${simplified[meta.coin].toLocaleStringVe()} ${styleHint === "classic" ? meta.coin : meta.coin.toUpperCase()}`)
			.join(", ");
	}

	if (it[prop] === 0) {
		return `0 ${styleHint === "classic" ? "gp" : "GP"}`;
	}

	if (it[propMult]) return isShortForm ? `×${it[propMult]}` : `base value ×${it[propMult]}`;

	return "";
};

Parser.DEFAULT_CURRENCY_CONVERSION_TABLE = [
	{
		coin: "cp",
		mult: 1,
	},
	{
		coin: "sp",
		mult: 0.1,
	},
	{
		coin: "gp",
		mult: 0.01,
		isFallback: true,
	},
];
Parser.FULL_CURRENCY_CONVERSION_TABLE = [
	{
		coin: "cp",
		mult: 1,
	},
	{
		coin: "sp",
		mult: 0.1,
	},
	{
		coin: "ep",
		mult: 0.02,
	},
	{
		coin: "gp",
		mult: 0.01,
		isFallback: true,
	},
	{
		coin: "pp",
		mult: 0.001,
	},
];
Parser.getCurrencyConversionTable = function (currencyConversionId) {
	const fromPrerelease = currencyConversionId ? PrereleaseUtil.getMetaLookup("currencyConversions")?.[currencyConversionId] : null;
	const fromBrew = currencyConversionId ? BrewUtil2.getMetaLookup("currencyConversions")?.[currencyConversionId] : null;
	const conversionTable = fromPrerelease?.length
		? fromPrerelease
		: fromBrew?.length
			? fromBrew
			: Parser.DEFAULT_CURRENCY_CONVERSION_TABLE;
	if (conversionTable !== Parser.DEFAULT_CURRENCY_CONVERSION_TABLE) conversionTable.sort((a, b) => SortUtil.ascSort(b.mult, a.mult));
	return conversionTable;
};
Parser.getCurrencyAndMultiplier = function (value, currencyConversionId) {
	const conversionTable = Parser.getCurrencyConversionTable(currencyConversionId);

	if (!value) return conversionTable.find(it => it.isFallback) || conversionTable[0];
	if (conversionTable.length === 1) return conversionTable[0];
	if (!Number.isInteger(value) && value < conversionTable[0].mult) return conversionTable[0];

	for (let i = conversionTable.length - 1; i >= 0; --i) {
		if (Number.isInteger(value * conversionTable[i].mult)) return conversionTable[i];
	}

	return conversionTable.last();
};

Parser.COIN_ABVS = ["cp", "sp", "ep", "gp", "pp"];
Parser.COIN_ABV_TO_FULL = {
	"cp": "copper pieces",
	"sp": "silver pieces",
	"ep": "electrum pieces",
	"gp": "gold pieces",
	"pp": "platinum pieces",
};
Parser.COIN_CONVERSIONS = [1, 10, 50, 100, 1000];

Parser.coinAbvToFull = function (coin) {
	return Parser._parse_aToB(Parser.COIN_ABV_TO_FULL, coin);
};

/**
 * @param currency Object of the form `{pp: <n>, gp: <m>, ... }`.
 * @param isDisplayEmpty If "empty" values (i.e., those which are 0) should be displayed.
 * @param styleHint
 */
Parser.getDisplayCurrency = function (currency, {isDisplayEmpty = false, styleHint = null} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");
	return [...Parser.COIN_ABVS]
		.reverse()
		.filter(abv => isDisplayEmpty ? currency[abv] != null : currency[abv])
		.map(abv => `${currency[abv].toLocaleStringVe()} ${styleHint === "classic" ? abv : abv.toUpperCase()}`)
		.join(", ");
};

Parser.itemWeightToFull = function (item, isShortForm) {
	if (item.weight) {
		// Handle pure integers
		if (Math.round(item.weight) === item.weight) return `${item.weight} lb.${(item.weightNote ? ` ${item.weightNote}` : "")}`;

		const integerPart = Math.floor(item.weight);

		// Attempt to render the amount as (a number +) a vulgar
		const vulgarGlyph = Parser.numberToVulgar(item.weight - integerPart, {isFallbackOnFractional: false});
		if (vulgarGlyph) return `${integerPart || ""}${vulgarGlyph} lb.${(item.weightNote ? ` ${item.weightNote}` : "")}`;

		// Fall back on decimal pounds or ounces
		return `${(item.weight < 1 ? item.weight * 16 : item.weight).toLocaleStringVe()} ${item.weight < 1 ? "oz" : "lb"}.${(item.weightNote ? ` ${item.weightNote}` : "")}`;
	}
	if (item.weightMult) return isShortForm ? `×${item.weightMult}` : `base weight ×${item.weightMult}`;
	return "";
};

Parser.ITEM_RECHARGE_TO_FULL = {
	round: "Every Round",
	restShort: "Short Rest",
	restLong: "Long Rest",
	dawn: "Dawn",
	dusk: "Dusk",
	midnight: "Midnight",
	week: "Week",
	month: "Month",
	year: "Year",
	decade: "Decade",
	century: "Century",
	special: "Special",
};
Parser.itemRechargeToFull = function (recharge) {
	return Parser._parse_aToB(Parser.ITEM_RECHARGE_TO_FULL, recharge);
};

Parser.ITEM_MISC_TAG_TO_FULL = {
	"CF/W": "Creates Food/Water",
	"CNS": "Consumable",
	"DRK": "Drink",
	"FOD": "Food",
	"TT": "Trinket Table",
};
Parser.itemMiscTagToFull = function (type) {
	return Parser._parse_aToB(Parser.ITEM_MISC_TAG_TO_FULL, type);
};

Parser.ITM_PROP_ABV__TWO_HANDED = "2H";
Parser.ITM_PROP_ABV__AMMUNITION = "A";
Parser.ITM_PROP_ABV__AMMUNITION_FUTURISTIC = "AF";
Parser.ITM_PROP_ABV__BURST_FIRE = "BF";
Parser.ITM_PROP_ABV__EXTENDED_REACH = "ER";
Parser.ITM_PROP_ABV__FINESSE = "F";
Parser.ITM_PROP_ABV__HEAVY = "H";
Parser.ITM_PROP_ABV__LIGHT = "L";
Parser.ITM_PROP_ABV__LOADING = "LD";
Parser.ITM_PROP_ABV__OTHER = "OTH";
Parser.ITM_PROP_ABV__REACH = "R";
Parser.ITM_PROP_ABV__RELOAD = "RLD";
Parser.ITM_PROP_ABV__SPECIAL = "S";
Parser.ITM_PROP_ABV__THROWN = "T";
Parser.ITM_PROP_ABV__VERSATILE = "V";
Parser.ITM_PROP_ABV__VESTIGE_OF_DIVERGENCE = "Vst";

Parser.ITM_PROP__TWO_HANDED = "2H";
Parser.ITM_PROP__AMMUNITION = "A";
Parser.ITM_PROP__AMMUNITION_FUTURISTIC = "AF|DMG";
Parser.ITM_PROP__BURST_FIRE = "BF|DMG";
Parser.ITM_PROP__FINESSE = "F";
Parser.ITM_PROP__HEAVY = "H";
Parser.ITM_PROP__LIGHT = "L";
Parser.ITM_PROP__LOADING = "LD";
Parser.ITM_PROP__OTHER = "OTH";
Parser.ITM_PROP__REACH = "R";
Parser.ITM_PROP__RELOAD = "RLD|DMG";
Parser.ITM_PROP__SPECIAL = "S";
Parser.ITM_PROP__THROWN = "T";
Parser.ITM_PROP__VERSATILE = "V";

Parser.ITM_PROP__ODND_TWO_HANDED = "2H|XPHB";
Parser.ITM_PROP__ODND_AMMUNITION = "A|XPHB";
Parser.ITM_PROP__ODND_FINESSE = "F|XPHB";
Parser.ITM_PROP__ODND_HEAVY = "H|XPHB";
Parser.ITM_PROP__ODND_LIGHT = "L|XPHB";
Parser.ITM_PROP__ODND_LOADING = "LD|XPHB";
Parser.ITM_PROP__ODND_REACH = "R|XPHB";
Parser.ITM_PROP__ODND_THROWN = "T|XPHB";
Parser.ITM_PROP__ODND_VERSATILE = "V|XPHB";

Parser.ITM_TYP_ABV__TREASURE = "$";
Parser.ITM_TYP_ABV__TREASURE_ART_OBJECT = "$A";
Parser.ITM_TYP_ABV__TREASURE_COINAGE = "$C";
Parser.ITM_TYP_ABV__TREASURE_GEMSTONE = "$G";
Parser.ITM_TYP_ABV__AMMUNITION = "A";
Parser.ITM_TYP_ABV__AMMUNITION_FUTURISTIC = "AF";
Parser.ITM_TYP_ABV__VEHICLE_AIR = "AIR";
Parser.ITM_TYP_ABV__ARTISAN_TOOL = "AT";
Parser.ITM_TYP_ABV__EXPLOSIVE = "EXP";
Parser.ITM_TYP_ABV__FOOD_AND_DRINK = "FD";
Parser.ITM_TYP_ABV__ADVENTURING_GEAR = "G";
Parser.ITM_TYP_ABV__GAMING_SET = "GS";
Parser.ITM_TYP_ABV__GENERIC_VARIANT = "GV";
Parser.ITM_TYP_ABV__HEAVY_ARMOUR = "HA";
Parser.ITM_TYP_ABV__ILLEGAL_DRUG = "IDG";
Parser.ITM_TYP_ABV__INSTRUMENT = "INS";
Parser.ITM_TYP_ABV__LIGHT_ARMOUR = "LA";
Parser.ITM_TYP_ABV__MELEE_WEAPON = "M";
Parser.ITM_TYP_ABV__MEDIUM_ARMOUR = "MA";
Parser.ITM_TYP_ABV__MOUNT = "MNT";
Parser.ITM_TYP_ABV__OTHER = "OTH";
Parser.ITM_TYP_ABV__POTION = "P";
Parser.ITM_TYP_ABV__RANGED_WEAPON = "R";
Parser.ITM_TYP_ABV__ROD = "RD";
Parser.ITM_TYP_ABV__RING = "RG";
Parser.ITM_TYP_ABV__SHIELD = "S";
Parser.ITM_TYP_ABV__SCROLL = "SC";
Parser.ITM_TYP_ABV__SPELLCASTING_FOCUS = "SCF";
Parser.ITM_TYP_ABV__VEHICLE_WATER = "SHP";
Parser.ITM_TYP_ABV__VEHICLE_SPACE = "SPC";
Parser.ITM_TYP_ABV__TOOL = "T";
Parser.ITM_TYP_ABV__TACK_AND_HARNESS = "TAH";
Parser.ITM_TYP_ABV__TRADE_BAR = "TB";
Parser.ITM_TYP_ABV__TRADE_GOOD = "TG";
Parser.ITM_TYP_ABV__VEHICLE_LAND = "VEH";
Parser.ITM_TYP_ABV__WAND = "WD";

Parser.ITM_TYP__TREASURE = "$|DMG";
Parser.ITM_TYP__TREASURE_ART_OBJECT = "$A|DMG";
Parser.ITM_TYP__TREASURE_COINAGE = "$C";
Parser.ITM_TYP__TREASURE_GEMSTONE = "$G|DMG";
Parser.ITM_TYP__AMMUNITION = "A";
Parser.ITM_TYP__AMMUNITION_FUTURISTIC = "AF|DMG";
Parser.ITM_TYP__VEHICLE_AIR = "AIR|DMG";
Parser.ITM_TYP__ARTISAN_TOOL = "AT";
Parser.ITM_TYP__EXPLOSIVE = "EXP|DMG";
Parser.ITM_TYP__FOOD_AND_DRINK = "FD";
Parser.ITM_TYP__ADVENTURING_GEAR = "G";
Parser.ITM_TYP__GAMING_SET = "GS";
Parser.ITM_TYP__GENERIC_VARIANT = "GV|DMG";
Parser.ITM_TYP__HEAVY_ARMOUR = "HA";
Parser.ITM_TYP__ILLEGAL_DRUG = "IDG|TDCSR";
Parser.ITM_TYP__INSTRUMENT = "INS";
Parser.ITM_TYP__LIGHT_ARMOUR = "LA";
Parser.ITM_TYP__MELEE_WEAPON = "M";
Parser.ITM_TYP__MEDIUM_ARMOUR = "MA";
Parser.ITM_TYP__MOUNT = "MNT";
Parser.ITM_TYP__OTHER = "OTH";
Parser.ITM_TYP__POTION = "P";
Parser.ITM_TYP__RANGED_WEAPON = "R";
Parser.ITM_TYP__ROD = "RD|DMG";
Parser.ITM_TYP__RING = "RG|DMG";
Parser.ITM_TYP__SHIELD = "S";
Parser.ITM_TYP__SCROLL = "SC|DMG";
Parser.ITM_TYP__SPELLCASTING_FOCUS = "SCF";
Parser.ITM_TYP__VEHICLE_WATER = "SHP";
Parser.ITM_TYP__VEHICLE_SPACE = "SPC|AAG";
Parser.ITM_TYP__TOOL = "T";
Parser.ITM_TYP__TACK_AND_HARNESS = "TAH";
Parser.ITM_TYP__TRADE_GOOD = "TG";
Parser.ITM_TYP__VEHICLE_LAND = "VEH";
Parser.ITM_TYP__WAND = "WD|DMG";

Parser.ITM_TYP__ODND_TREASURE_ART_OBJECT = "$A|XDMG";
Parser.ITM_TYP__ODND_TREASURE_COINAGE = "$C|XPHB";
Parser.ITM_TYP__ODND_TREASURE_GEMSTONE = "$G|XDMG";
Parser.ITM_TYP__ODND_AMMUNITION = "A|XPHB";
Parser.ITM_TYP__ODND_AMMUNITION_FUTURISTIC = "AF|XDMG";
Parser.ITM_TYP__ODND_VEHICLE_AIR = "AIR|XPHB";
Parser.ITM_TYP__ODND_ARTISAN_TOOL = "AT|XPHB";
Parser.ITM_TYP__ODND_EXPLOSIVE = "EXP|XDMG";
Parser.ITM_TYP__ODND_FOOD_AND_DRINK = "FD|XPHB";
Parser.ITM_TYP__ODND_ADVENTURING_GEAR = "G|XPHB";
Parser.ITM_TYP__ODND_GAMING_SET = "GS|XPHB";
Parser.ITM_TYP__ODND_GENERIC_VARIANT = "GV|XDMG";
Parser.ITM_TYP__ODND_HEAVY_ARMOUR = "HA|XPHB";
Parser.ITM_TYP__ODND_INSTRUMENT = "INS|XPHB";
Parser.ITM_TYP__ODND_LIGHT_ARMOUR = "LA|XPHB";
Parser.ITM_TYP__ODND_MELEE_WEAPON = "M|XPHB";
Parser.ITM_TYP__ODND_MEDIUM_ARMOUR = "MA|XPHB";
Parser.ITM_TYP__ODND_MOUNT = "MNT|XPHB";
Parser.ITM_TYP__ODND_POTION = "P|XPHB";
Parser.ITM_TYP__ODND_RANGED_WEAPON = "R|XPHB";
Parser.ITM_TYP__ODND_ROD = "RD|XDMG";
Parser.ITM_TYP__ODND_RING = "RG|XDMG";
Parser.ITM_TYP__ODND_SHIELD = "S|XPHB";
Parser.ITM_TYP__ODND_SCROLL = "SC|XPHB";
Parser.ITM_TYP__ODND_SPELLCASTING_FOCUS = "SCF|XPHB";
Parser.ITM_TYP__ODND_VEHICLE_WATER = "SHP|XPHB";
Parser.ITM_TYP__ODND_TOOL = "T|XPHB";
Parser.ITM_TYP__ODND_TACK_AND_HARNESS = "TAH|XPHB";
Parser.ITM_TYP__ODND_TRADE_BAR = "TB|XDMG";
Parser.ITM_TYP__ODND_TRADE_GOOD = "TG|XDMG";
Parser.ITM_TYP__ODND_VEHICLE_LAND = "VEH|XPHB";
Parser.ITM_TYP__ODND_WAND = "WD|XDMG";

Parser.ITM_RARITY_TO_SHORT = {
	"common": "Com.",
	"uncommon": "Unc.",
	"rare": "Rare",
	"very rare": "V.Rare",
	"legendary": "Leg.",
	"artifact": "Art.",
	"varies": "Var.",
};
Parser.itemRarityToShort = function (rarity) {
	if (!rarity) return rarity;
	if (Parser.ITM_RARITY_TO_SHORT[rarity]) return Parser.ITM_RARITY_TO_SHORT[rarity];
	if (rarity.length <= 4) return rarity.toTitleCase();
	return `${rarity.toTitleCase().slice(0, 3)}.`;
};

Parser._decimalSeparator = (0.1).toLocaleString().substring(1, 2);
Parser._numberCleanRegexp = Parser._decimalSeparator === "." ? new RegExp(/[\s,]*/g, "g") : new RegExp(/[\s.]*/g, "g");
Parser._costSplitRegexp = Parser._decimalSeparator === "." ? new RegExp(/(\d+(\.\d+)?)([csegp]p)/) : new RegExp(/(\d+(,\d+)?)([csegp]p)/);

/** input e.g. "25 gp", "1,000pp" */
Parser.coinValueToNumber = function (value) {
	if (!value) return 0;
	// handle oddities
	if (value === "Varies") return 0;

	value = value
		.replace(/\s*/, "")
		.replace(Parser._numberCleanRegexp, "")
		.toLowerCase();
	const m = Parser._costSplitRegexp.exec(value);
	if (!m) throw new Error(`Badly formatted value "${value}"`);
	const ixCoin = Parser.COIN_ABVS.indexOf(m[3]);
	if (!~ixCoin) throw new Error(`Unknown coin type "${m[3]}"`);
	return Number(m[1]) * Parser.COIN_CONVERSIONS[ixCoin];
};

Parser.weightValueToNumber = function (value) {
	if (!value) return 0;

	if (Number(value)) return Number(value);
	else throw new Error(`Badly formatted value ${value}`);
};

Parser.dmgTypeToFull = function (dmgType, {styleHint = null} = {}) {
	if (!dmgType) return dmgType;

	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	const out = Parser._parse_aToB(Parser.DMGTYPE_JSON_TO_FULL, dmgType);
	if (styleHint !== "classic") return out.toTitleCase();
	return out;
};

Parser.skillProficienciesToFull = function (skillProficiencies, {styleHint = null} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	const ptSourceDefault = Parser.SRC_SNS;

	const getRenderedSkill = uid => {
		const unpacked = DataUtil.proxy.unpackUid("skill", uid, "skill");
		const ptSource = uid.includes("|")
			? unpacked.source
			: unpacked.source.toLowerCase() === Parser.SRC_SNS.toLowerCase()
				? ptSourceDefault
				: unpacked.source;
		return Renderer.get().render(`{@skill ${unpacked.name.toTitleCase()}|${ptSource}}`);
	};

	return skillProficiencies
		.map(skProf => {
			if (skProf.any) {
				skProf = MiscUtil.copyFast(skProf);
				skProf.choose = {"from": Object.keys(Parser.SKILL_TO_ATB_ABV), "count": skProf.any};
				delete skProf.any;
			}

			const keys = Object.keys(skProf).sort(SortUtil.ascSortLower);

			const ixChoose = keys.indexOf("choose");
			if (~ixChoose) keys.splice(ixChoose, 1);

			const baseStack = [];
			keys.filter(k => skProf[k]).forEach(k => baseStack.push(getRenderedSkill(k)));

			let ptChoose = "";
			if (~ixChoose) {
				const chObj = skProf.choose;
				const count = chObj.count ?? 1;
				if (chObj.from.length === 18) {
					ptChoose = styleHint === "classic"
						? `choose any ${count === 1 ? "skill" : chObj.count}`
						: Renderer.get().render(`{@i Choose any ${chObj.count} ${count === 1 ? "skill" : "skills"}} (see {@book chapter 1|XPHB|1|Skill List})`);
				} else {
					ptChoose = styleHint === "classic"
						? `choose ${count} from ${chObj.from.map(it => getRenderedSkill(it)).joinConjunct(", ", " and ")}`
						: Renderer.get().render(`{@i Choose ${count}:} ${chObj.from.map(it => getRenderedSkill(it)).joinConjunct(", ", " or ")}`);
				}
			}

			const base = baseStack.joinConjunct(", ", " and ");

			if (baseStack.length && ptChoose.length) return `${base}; and ${ptChoose}`;
			else if (baseStack.length) return base;
			else if (ptChoose.length) return ptChoose;
		})
		.join(` <i>or</i> `);
};

// sp-prefix functions are for parsing spell data, and shared with the roll20 script
Parser.spSchoolAndSubschoolsAbvsToFull = function (school, subschools) {
	if (!subschools || !subschools.length) return Parser.spSchoolAbvToFull(school);
	else return `${Parser.spSchoolAbvToFull(school)} (${subschools.map(sub => Parser.spSchoolAbvToFull(sub)).join(", ")})`;
};

Parser.spSchoolAbvToFull = function (schoolOrSubschool) {
	const out = Parser._parse_aToB(Parser.SP_SCHOOL_ABV_TO_FULL, schoolOrSubschool);
	if (Parser.SP_SCHOOL_ABV_TO_FULL[schoolOrSubschool]) return out;
	if (PrereleaseUtil.getMetaLookup("spellSchools")?.[schoolOrSubschool]) return PrereleaseUtil.getMetaLookup("spellSchools")?.[schoolOrSubschool].full;
	if (BrewUtil2.getMetaLookup("spellSchools")?.[schoolOrSubschool]) return BrewUtil2.getMetaLookup("spellSchools")?.[schoolOrSubschool].full;
	return out;
};

Parser.spSchoolAndSubschoolsAbvsShort = function (school, subschools) {
	if (!subschools || !subschools.length) return Parser.spSchoolAbvToShort(school);
	else return `${Parser.spSchoolAbvToShort(school)} (${subschools.map(sub => Parser.spSchoolAbvToShort(sub)).join(", ")})`;
};

Parser.spSchoolAbvToShort = function (school) {
	const out = Parser._parse_aToB(Parser.SP_SCHOOL_ABV_TO_SHORT, school);
	if (Parser.SP_SCHOOL_ABV_TO_SHORT[school]) return out;
	if (PrereleaseUtil.getMetaLookup("spellSchools")?.[school]) return PrereleaseUtil.getMetaLookup("spellSchools")?.[school].short;
	if (BrewUtil2.getMetaLookup("spellSchools")?.[school]) return BrewUtil2.getMetaLookup("spellSchools")?.[school].short;
	if (out.length <= 4) return out;
	return `${out.slice(0, 3)}.`;
};

Parser.spSchoolAbvToStyle = function (school) { // For prerelease/homebrew
	return Parser._colorableMetaAbvToStyle({key: school, prop: "spellSchools"});
};

Parser.spSchoolAbvToStylePart = function (school) { // For prerelease/homebrew
	return Parser._colorableMetaAbvToStylePart({key: school, prop: "spellSchools"});
};

Parser._colorableMetaAbvToStyle = function ({key, prop}) {
	const stylePart = Parser._colorableMetaAbvToStylePart({key, prop});
	if (!stylePart) return stylePart;
	return `style="${stylePart}"`;
};

Parser._colorableMetaAbvToStylePart = function ({key, prop}) {
	return Parser._colorableMetaAbvToStylePart_prereleaseBrew({key, prop, brewUtil: PrereleaseUtil})
		|| Parser._colorableMetaAbvToStylePart_prereleaseBrew({key, prop, brewUtil: BrewUtil2})
		|| "";
};

Parser._colorableMetaAbvToStylePart_prereleaseBrew = function ({key, prop, brewUtil}) {
	const rawColor = brewUtil.getMetaLookup(prop)?.[key]?.color;
	if (!rawColor || !rawColor.trim()) return "";
	const validColor = BrewUtilShared.getValidColor(rawColor);
	if (validColor.length) return MiscUtil.getColorStylePart(validColor);
};

Parser.getOrdinalForm = function (i) {
	i = Number(i);
	if (isNaN(i)) return "";
	const j = i % 10; const k = i % 100;
	if (j === 1 && k !== 11) return `${i}st`;
	if (j === 2 && k !== 12) return `${i}nd`;
	if (j === 3 && k !== 13) return `${i}rd`;
	return `${i}th`;
};

Parser.spLevelToFull = function (level) {
	if (level === 0) return "Cantrip";
	else return Parser.getOrdinalForm(level);
};

Parser.maneuverDegreeToFull = function (degree) {
	if (degree === 0) return "Basic";
	return `${Parser.getOrdinalForm(degree)}`;
};

Parser.getArticle = function (str) {
	str = `${str}`;
	str = str.replace(/\d+/g, (...m) => Parser.numberToText(m[0]));
	return /^[aeiou]/i.test(str) ? "an" : "a";
};

Parser.spLevelToFullLevelText = function (level, {isDash = false, isPluralCantrips = true} = {}) {
	return `${Parser.spLevelToFull(level)}${(level === 0 ? (isPluralCantrips ? "s" : "") : `${isDash ? "-" : " "}level`)}`;
};

Parser.spLevelToSpellPoints = function (lvl) {
	lvl = Number(lvl);
	if (isNaN(lvl) || lvl === 0) return 0;
	return Math.ceil(1.34 * lvl);
};

Parser.spMetaToArr = function (meta) {
	if (!meta) return [];
	return Object.entries(meta)
		.filter(([_, v]) => v)
		.sort(SortUtil.ascSort)
		.map(([k]) => k);
};

Parser.spMetaToFull = function (meta) {
	if (!meta) return "";
	const metaTags = Parser.spMetaToArr(meta);
	if (metaTags.length) return ` (${metaTags.join(", ")})`;
	return "";
};

Parser._spLevelSchoolMetaToFull_level = ({level, styleHint}) => {
	if (styleHint === "classic") return level === 0 ? Parser.spLevelToFull(level).toLowerCase() : `${Parser.spLevelToFull(level)}-level`;
	return level === 0 ? Parser.spLevelToFull(level) : `Level ${level}`;
};

Parser._spLevelSchoolMetaToFull_levelSchool = ({level, school, styleHint, ptLevel}) => {
	if (level === 0) return `${Parser.spSchoolAbvToFull(school)} ${ptLevel}`;

	if (styleHint === "classic") return `${ptLevel} ${Parser.spSchoolAbvToFull(school).toLowerCase()}`;
	return `${ptLevel} ${Parser.spSchoolAbvToFull(school)}`;
};

Parser.spLevelSchoolMetaToFull = function (level, school, meta, subschools, {styleHint = null} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	const ptLevel = Parser._spLevelSchoolMetaToFull_level({level, styleHint});
	const ptLevelSchool = Parser._spLevelSchoolMetaToFull_levelSchool({level, school, styleHint, ptLevel});

	const metaArr = Parser.spMetaToArr(meta, {styleHint})
		.filter(k => styleHint === "classic" || k !== "ritual");

	if (metaArr.length || subschools?.length) {
		const ptMetaAndSubschools = [
			(subschools || [])
				.map(sub => Parser.spSchoolAbvToFull(sub))
				.join(", "),
			metaArr
				.join(", "),
		]
			.filter(Boolean)
			.join("; ");

		if (styleHint === "classic") return `${ptLevelSchool} (${ptMetaAndSubschools.toLowerCase()})`;
		return `${ptLevelSchool} (${ptMetaAndSubschools})`;
	}

	return ptLevelSchool;
};

Parser.SP_TM_ACTION = "action";
Parser.SP_TM_B_ACTION = "bonus";
Parser.SP_TM_REACTION = "reaction";
Parser.SP_TM_ROUND = "round";
Parser.SP_TM_MINS = "minute";
Parser.SP_TM_HRS = "hour";
Parser.SP_TM_SPECIAL = "special";
Parser.SP_TIME_SINGLETONS = [Parser.SP_TM_ACTION, Parser.SP_TM_B_ACTION, Parser.SP_TM_REACTION, Parser.SP_TM_ROUND];
Parser.SP_TIME_TO_FULL = {
	[Parser.SP_TM_ACTION]: "Action",
	[Parser.SP_TM_B_ACTION]: "Bonus Action",
	[Parser.SP_TM_REACTION]: "Reaction",
	[Parser.SP_TM_ROUND]: "Rounds",
	[Parser.SP_TM_MINS]: "Minutes",
	[Parser.SP_TM_HRS]: "Hours",
	[Parser.SP_TM_SPECIAL]: "Special",
};
Parser.spTimeUnitToFull = function (timeUnit) {
	return Parser._parse_aToB(Parser.SP_TIME_TO_FULL, timeUnit);
};

Parser.SP_TIME_TO_SHORT = {
	[Parser.SP_TM_ROUND]: "Rnd.",
	[Parser.SP_TM_MINS]: "Min.",
	[Parser.SP_TM_HRS]: "Hr.",
};
Parser.spTimeUnitToShort = function (timeUnit) {
	return Parser._parse_aToB(Parser.SP_TIME_TO_SHORT, timeUnit);
};

Parser.SP_TIME_TO_ABV = {
	[Parser.SP_TM_ACTION]: "A",
	[Parser.SP_TM_B_ACTION]: "BA",
	[Parser.SP_TM_REACTION]: "R",
	[Parser.SP_TM_ROUND]: "rnd",
	[Parser.SP_TM_MINS]: "min",
	[Parser.SP_TM_HRS]: "hr",
	[Parser.SP_TM_SPECIAL]: "SPC",
};
Parser.spTimeUnitToAbv = function (timeUnit) {
	return Parser._parse_aToB(Parser.SP_TIME_TO_ABV, timeUnit);
};

Parser.spTimeToShort = function (time, isHtml) {
	if (!time) return "";
	return (time.number === 1 && Parser.SP_TIME_SINGLETONS.includes(time.unit))
		? `${Parser.spTimeUnitToAbv(time.unit).uppercaseFirst()}${time.condition ? "*" : ""}`
		: `${time.number} ${isHtml ? `<span class="ve-small">` : ""}${Parser.spTimeUnitToAbv(time.unit)}${isHtml ? `</span>` : ""}${time.condition ? "*" : ""}`;
};

Parser.spTimeListToFull = function (times, meta, {isStripTags = false, styleHint = null} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	return [
		...times,
		...styleHint === "classic" || !meta?.ritual
			? []
			: [{"number": 1, "unit": "ritual"}],
	]
		.map(time => {
			return [
				Parser.getTimeToFull(time, {styleHint}),
				time.condition ? `, ${isStripTags ? Renderer.stripTags(time.condition) : Renderer.get().render(time.condition)}` : "",
				time.note ? ` (${isStripTags ? Renderer.stripTags(time.note) : Renderer.get().render(time.note)})` : "",
			]
				.filter(Boolean)
				.join("");
		})
		.joinConjunct(", ", " or ");
};

Parser._TIME_UNITS_SHORTHAND = new Set([
	Parser.SP_TM_ACTION,
	Parser.SP_TM_B_ACTION,
	Parser.SP_TM_REACTION,
	"ritual", // faux unit added during rendering
]);

Parser._getTimeToFull_number = ({time, styleHint}) => {
	if (!time.number) return "";
	if (styleHint === "classic") return `${time.number} `;

	if (time.number === 1 && Parser._TIME_UNITS_SHORTHAND.has(time.unit)) return "";
	return `${time.number} `;
};

Parser.getTimeToFull = function (time, {styleHint = null} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	const ptNumber = Parser._getTimeToFull_number({time, styleHint});
	const ptUnit = (time.unit === Parser.SP_TM_B_ACTION ? "bonus action" : time.unit)[(styleHint === "classic" || ptNumber) ? "toString" : "uppercaseFirst"]();
	return `${ptNumber}${ptUnit}${time.number > 1 ? "s" : ""}`;
};

Parser.getMinutesToFull = function (mins, {isShort = false} = {}) {
	const days = Math.floor(mins / (24 * 60));
	mins = mins % (24 * 60);

	const hours = Math.floor(mins / 60);
	mins = mins % 60;

	return [
		days ? `${days} ${isShort ? `d` : `day${days > 1 ? "s" : ""}`}` : null,
		hours ? `${hours} ${isShort ? `h` : `hour${hours > 1 ? "s" : ""}`}` : null,
		mins ? `${mins} ${isShort ? `m` : `minute${mins > 1 ? "s" : ""}`}` : null,
	].filter(Boolean)
		.join(" ");
};

Parser.RNG_SPECIAL = "special";
Parser.RNG_POINT = "point";
Parser.RNG_LINE = "line";
Parser.RNG_CUBE = "cube";
Parser.RNG_CONE = "cone";
Parser.RNG_EMANATION = "emanation";
Parser.RNG_RADIUS = "radius";
Parser.RNG_SPHERE = "sphere";
Parser.RNG_HEMISPHERE = "hemisphere";
Parser.RNG_CYLINDER = "cylinder"; // homebrew only
Parser.RNG_SELF = "self";
Parser.RNG_SIGHT = "sight";
Parser.RNG_UNLIMITED = "unlimited";
Parser.RNG_UNLIMITED_SAME_PLANE = "plane";
Parser.RNG_TOUCH = "touch";
Parser.SP_RANGE_TYPE_TO_FULL = {
	[Parser.RNG_SPECIAL]: "Special",
	[Parser.RNG_POINT]: "Point",
	[Parser.RNG_LINE]: "Line",
	[Parser.RNG_CUBE]: "Cube",
	[Parser.RNG_CONE]: "Cone",
	[Parser.RNG_EMANATION]: "Emanation",
	[Parser.RNG_RADIUS]: "Radius",
	[Parser.RNG_SPHERE]: "Sphere",
	[Parser.RNG_HEMISPHERE]: "Hemisphere",
	[Parser.RNG_CYLINDER]: "Cylinder",
	[Parser.RNG_SELF]: "Self",
	[Parser.RNG_SIGHT]: "Sight",
	[Parser.RNG_UNLIMITED]: "Unlimited",
	[Parser.RNG_UNLIMITED_SAME_PLANE]: "Unlimited on the same plane",
	[Parser.RNG_TOUCH]: "Touch",
};

Parser.spRangeTypeToFull = function (range) {
	return Parser._parse_aToB(Parser.SP_RANGE_TYPE_TO_FULL, range);
};

Parser.UNT_LBS = "lbs";
Parser.UNT_TONS_IMPERIAL = "tns";
Parser.UNT_TONS_METRIC = "Mg";

Parser.UNT_INCHES = "inches";
Parser.UNT_FEET = "feet";
Parser.UNT_YARDS = "yards";
Parser.UNT_MILES = "miles";

Parser.UNT_CUBIC_FEET = "cubic feet";

Parser.getNormalizedUnit = function (unit) {
	if (unit == null) return unit;

	unit = unit.toLowerCase().trim();

	switch (unit) {
		case "inch": case "in.": case "in": case Parser.UNT_INCHES: return Parser.UNT_INCHES;
		case "foot": case "ft.": case "ft": case Parser.UNT_FEET: return Parser.UNT_FEET;
		case "yard": case "yd.": case "yd": case Parser.UNT_YARDS: return Parser.UNT_YARDS;
		case "mile": case "mi.": case "mi": case Parser.UNT_MILES: return Parser.UNT_MILES;

		case "pound": case "pounds": case "lbs.": case "lb.": case "lb": case Parser.UNT_LBS: return Parser.UNT_LBS;
		default: return unit;
	}
};

Parser.SP_DIST_TYPE_TO_FULL = {
	[Parser.UNT_INCHES]: "Inches",
	[Parser.UNT_FEET]: "Feet",
	[Parser.UNT_YARDS]: "Yards",
	[Parser.UNT_MILES]: "Miles",
	[Parser.RNG_SELF]: Parser.SP_RANGE_TYPE_TO_FULL[Parser.RNG_SELF],
	[Parser.RNG_TOUCH]: Parser.SP_RANGE_TYPE_TO_FULL[Parser.RNG_TOUCH],
	[Parser.RNG_SIGHT]: Parser.SP_RANGE_TYPE_TO_FULL[Parser.RNG_SIGHT],
	[Parser.RNG_UNLIMITED]: Parser.SP_RANGE_TYPE_TO_FULL[Parser.RNG_UNLIMITED],
	[Parser.RNG_UNLIMITED_SAME_PLANE]: Parser.SP_RANGE_TYPE_TO_FULL[Parser.RNG_UNLIMITED_SAME_PLANE],
};

Parser.spDistanceTypeToFull = function (range) {
	return Parser._parse_aToB(Parser.SP_DIST_TYPE_TO_FULL, range);
};

Parser.SP_RANGE_TO_ICON = {
	[Parser.RNG_SPECIAL]: "fa-star",
	[Parser.RNG_POINT]: "",
	[Parser.RNG_LINE]: "fa-grip-lines-vertical",
	[Parser.RNG_CUBE]: "fa-cube",
	[Parser.RNG_CONE]: "fa-traffic-cone",
	[Parser.RNG_EMANATION]: "fa-hockey-puck",
	[Parser.RNG_RADIUS]: "fa-hockey-puck",
	[Parser.RNG_SPHERE]: "fa-globe",
	[Parser.RNG_HEMISPHERE]: "fa-globe",
	[Parser.RNG_CYLINDER]: "fa-database",
	[Parser.RNG_SELF]: "fa-street-view",
	[Parser.RNG_SIGHT]: "fa-eye",
	[Parser.RNG_UNLIMITED_SAME_PLANE]: "fa-earth-americas",
	[Parser.RNG_UNLIMITED]: "fa-infinity",
	[Parser.RNG_TOUCH]: "fa-hand",
};

Parser.spRangeTypeToIcon = function (range) {
	return Parser._parse_aToB(Parser.SP_RANGE_TO_ICON, range);
};

Parser.spRangeToShortHtml = function (range) {
	switch (range.type) {
		case Parser.RNG_SPECIAL: return `<span class="fas fa-fw ${Parser.spRangeTypeToIcon(range.type)} ve-help-subtle" title="Special"></span>`;
		case Parser.RNG_POINT: return Parser.spRangeToShortHtml._renderPoint(range);
		case Parser.RNG_LINE:
		case Parser.RNG_CUBE:
		case Parser.RNG_CONE:
		case Parser.RNG_EMANATION:
		case Parser.RNG_RADIUS:
		case Parser.RNG_SPHERE:
		case Parser.RNG_HEMISPHERE:
		case Parser.RNG_CYLINDER:
			return Parser.spRangeToShortHtml._renderArea(range);
	}
};
Parser.spRangeToShortHtml._renderPoint = function (range) {
	const dist = range.distance;
	switch (dist.type) {
		case Parser.RNG_SELF:
		case Parser.RNG_SIGHT:
		case Parser.RNG_UNLIMITED:
		case Parser.RNG_UNLIMITED_SAME_PLANE:
		case Parser.RNG_SPECIAL:
		case Parser.RNG_TOUCH: return `<span class="fas fa-fw ${Parser.spRangeTypeToIcon(dist.type)} ve-help-subtle" title="${Parser.spRangeTypeToFull(dist.type)}"></span>`;
		case Parser.UNT_INCHES:
		case Parser.UNT_FEET:
		case Parser.UNT_YARDS:
		case Parser.UNT_MILES:
		default:
			return `${dist.amount} <span class="ve-small">${Parser.getSingletonUnit(dist.type, true)}</span>`;
	}
};
Parser.spRangeToShortHtml._renderArea = function (range) {
	const size = range.distance;
	return `<span class="fas fa-fw ${Parser.spRangeTypeToIcon(Parser.RNG_SELF)} ve-help-subtle" title="Self"></span> ${size.amount}<span class="ve-small">-${Parser.getSingletonUnit(size.type, true)}</span> ${Parser.spRangeToShortHtml._getAreaStyleString(range)}`;
};
Parser.spRangeToShortHtml._getAreaStyleString = function (range) {
	return `<span class="fas fa-fw ${Parser.spRangeTypeToIcon(range.type)} ve-help-subtle" title="${Parser.spRangeTypeToFull(range.type)}"></span>`;
};

Parser.spRangeToFull = function (range, {styleHint, isDisplaySelfArea = false} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	switch (range.type) {
		case Parser.RNG_SPECIAL: return Parser.spRangeTypeToFull(range.type);
		case Parser.RNG_POINT: return Parser.spRangeToFull._renderPoint(range);
		case Parser.RNG_LINE:
		case Parser.RNG_CUBE:
		case Parser.RNG_CONE:
		case Parser.RNG_EMANATION:
		case Parser.RNG_RADIUS:
		case Parser.RNG_SPHERE:
		case Parser.RNG_HEMISPHERE:
		case Parser.RNG_CYLINDER:
			return Parser.spRangeToFull._renderArea({range, styleHint, isDisplaySelfArea});
	}
};
Parser.spRangeToFull._renderPoint = function (range) {
	const dist = range.distance;
	switch (dist.type) {
		case Parser.RNG_SELF:
		case Parser.RNG_SIGHT:
		case Parser.RNG_UNLIMITED:
		case Parser.RNG_UNLIMITED_SAME_PLANE:
		case Parser.RNG_SPECIAL:
		case Parser.RNG_TOUCH: return Parser.spRangeTypeToFull(dist.type);
		case Parser.UNT_INCHES:
		case Parser.UNT_FEET:
		case Parser.UNT_YARDS:
		case Parser.UNT_MILES:
		default:
			return `${dist.amount} ${dist.amount === 1 ? Parser.getSingletonUnit(dist.type) : dist.type}`;
	}
};
Parser.spRangeToFull._renderArea = function ({range, styleHint, isDisplaySelfArea = false}) {
	if (styleHint !== "classic" && !isDisplaySelfArea) return "Self";
	const size = range.distance;
	return `Self (${size.amount}-${Parser.getSingletonUnit(size.type)}${Parser.spRangeToFull._getAreaStyleString(range)}${range.type === Parser.RNG_CYLINDER ? `${size.amountSecondary != null && size.typeSecondary != null ? `, ${size.amountSecondary}-${Parser.getSingletonUnit(size.typeSecondary)}-high` : ""} cylinder` : ""})`;
};
Parser.spRangeToFull._getAreaStyleString = function (range) {
	switch (range.type) {
		case Parser.RNG_SPHERE: return " radius";
		case Parser.RNG_HEMISPHERE: return `-radius ${range.type}`;
		case Parser.RNG_CYLINDER: return "-radius";
		default: return ` ${range.type}`;
	}
};

Parser.getSingletonUnit = function (unit, isShort) {
	if (!unit) return unit;
	switch (unit) {
		case Parser.UNT_INCHES:
			return isShort ? "in." : "inch";
		case Parser.UNT_FEET:
			return isShort ? "ft." : "foot";
		case Parser.UNT_YARDS:
			return isShort ? "yd." : "yard";
		case Parser.UNT_MILES:
			return isShort ? "mi." : "mile";
		default: {
			const fromPrerelease = Parser._getSingletonUnit_prereleaseBrew({unit, isShort, brewUtil: PrereleaseUtil});
			if (fromPrerelease) return fromPrerelease;

			const fromBrew = Parser._getSingletonUnit_prereleaseBrew({unit, isShort, brewUtil: BrewUtil2});
			if (fromBrew) return fromBrew;

			if (unit.charAt(unit.length - 1) === "s") return unit.slice(0, -1);
			return unit;
		}
	}
};

Parser._getSingletonUnit_prereleaseBrew = function ({unit, isShort, brewUtil}) {
	const fromBrew = brewUtil.getMetaLookup("spellDistanceUnits")?.[unit]?.["singular"];
	if (fromBrew) return fromBrew;
};

Parser.getInchesToFull = function (inches, {isShort = false} = {}) {
	const feet = Math.floor(inches / 12);
	inches = inches % 12;

	return [
		feet ? `${feet} ${isShort ? `ft.` : !feet ? Parser.getSingletonUnit(Parser.UNT_FEET) : Parser.UNT_FEET}` : null,
		inches ? `${Parser.numberToVulgar(inches)} ${isShort ? `in.` : !inches ? Parser.getSingletonUnit(Parser.UNT_INCHES) : Parser.UNT_INCHES}` : null,
	].filter(Boolean)
		.join(" ");
};

Parser.spComponentsToFull = function (comp, level, {isPlainText = false} = {}) {
	if (!comp) return "None";
	const out = [];
	if (comp.v) out.push("V");
	if (comp.s) out.push("S");
	if (comp.m != null) {
		const fnRender = isPlainText ? Renderer.stripTags.bind(Renderer) : Renderer.get().render.bind(Renderer.get());
		out.push(`M${comp.m !== true ? ` (${fnRender(comp.m.text != null ? comp.m.text : comp.m)})` : ""}`);
	}
	if (comp.r) out.push(`R (${level} gp)`);
	return out.join(", ") || "None";
};

Parser.SP_END_TYPE_TO_FULL = {
	"dispel": "dispelled",
	"trigger": "triggered",
	"discharge": "discharged",
};
Parser.spEndTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.SP_END_TYPE_TO_FULL, type);
};

Parser.spDurationToFull = function (durations, {isPlainText = false, styleHint} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	const entriesMeta = Renderer.generic.getRenderableDurationEntriesMeta(durations, {styleHint});

	if (isPlainText) return Renderer.stripTags(entriesMeta.entryDuration);
	return Renderer.get().render(entriesMeta.entryDuration);
};

Parser.DURATION_TYPES = [
	{type: "instant", full: "Instantaneous"},
	{type: "sustained", full: "Sustained"},
	{type: "timed", hasAmount: true},
	{type: "permanent", hasEnds: true},
	{type: "special"},
];

Parser.DURATION_AMOUNT_TYPES = [
	"turn",
	"round",
	"minute",
	"hour",
	"day",
	"week",
	"month",
	"year",
];

Parser.spClassesToFull = function (sp, {isTextOnly = false, subclassLookup = {}} = {}) {
	const fromSubclassList = Renderer.spell.getCombinedClasses(sp, "fromSubclass");
	const fromSubclasses = Parser.spSubclassesToFull(fromSubclassList, {isTextOnly, subclassLookup});
	const fromClassList = Renderer.spell.getCombinedClasses(sp, "fromClassList");
	return `${Parser.spMainClassesToFull(fromClassList, {isTextOnly})}${fromSubclasses ? `, ${fromSubclasses}` : ""}`;
};

Parser.spMainClassesToFull = function (fromClassList, {isTextOnly = false, isIncludeSource = false} = {}) {
	return fromClassList
		.map(clsStub => ({hash: UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](clsStub), clsStub}))
		.filter(it => !ExcludeUtil.isInitialised || !ExcludeUtil.isExcluded(it.hash, "class", it.clsStub.source))
		.sort((a, b) => SortUtil.ascSort(a.clsStub.name, b.clsStub.name))
		.map(it => {
			if (isTextOnly) {
				if (isIncludeSource) return `${it.clsStub.name} (${Parser.sourceJsonToAbv(it.clsStub.source)})`;
				return it.clsStub.name;
			}

			const definedInSource = it.clsStub.definedInSource || it.clsStub.source;
			const ptLink = Renderer.get().render(`{@class ${it.clsStub.name}|${it.clsStub.source}}`);
			const ptSource = isIncludeSource ? ` (${Parser.sourceJsonToAbv(it.clsStub.source)})` : "";
			const ptTitle = definedInSource === it.clsStub.source ? `Class source/spell list defined in: ${Parser.sourceJsonToFull(definedInSource)}.` : `Class source: ${Parser.sourceJsonToFull(it.clsStub.source)}. Spell list defined in: ${Parser.sourceJsonToFull(definedInSource)}.`;
			return `<span title="${ptTitle.qq()}">${ptLink}${ptSource}</span>`;
		})
		.join(", ") || "";
};

Parser.spSubclassesToFull = function (fromSubclassList, {isTextOnly = false, isIncludeSource = false, subclassLookup = {}} = {}) {
	return fromSubclassList
		.filter(mt => {
			if (!ExcludeUtil.isInitialised) return true;
			const excludeClass = ExcludeUtil.isExcluded(UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](mt.class), "class", mt.class.source);
			if (excludeClass) return false;

			return !ExcludeUtil.isExcluded(
				UrlUtil.URL_TO_HASH_BUILDER["subclass"]({
					shortName: mt.subclass.name,
					source: mt.subclass.source,
					className: mt.class.name,
					classSource: mt.class.source,
				}),
				"subclass",
				mt.subclass.source,
				{isNoCount: true},
			);
		})
		.sort((a, b) => {
			const byName = SortUtil.ascSort(a.class.name, b.class.name);
			return byName || SortUtil.ascSort(a.subclass.name, b.subclass.name);
		})
		.map(c => Parser._spSubclassItem({fromSubclass: c, isTextOnly, isIncludeSource}))
		.join(", ") || "";
};

Parser._spSubclassItem = function ({fromSubclass, isTextOnly = false, isIncludeSource = false}) {
	const c = fromSubclass.class;
	const sc = fromSubclass.subclass;
	const text = `${sc.shortName}${sc.subSubclass ? ` (${sc.subSubclass})` : ""}`;
	if (isTextOnly) {
		if (isIncludeSource) return `${text} (${Parser.sourceJsonToAbv(sc.source)})`;
		return text;
	}

	const ptClass = `<span title="Source: ${Parser.sourceJsonToFull(c.source)}${c.definedInSource ? ` From a class spell list defined in: ${Parser.sourceJsonToFull(c.definedInSource)}` : ""}">${Renderer.get().render(`{@class ${c.name}|${c.source}}`)}</span>`;
	const ptSource = isIncludeSource ? ` (${Parser.sourceJsonToAbv(sc.source)})` : "";

	return `<span class="ve-italic" title="Source: ${Parser.sourceJsonToFull(fromSubclass.subclass.source)}">${Renderer.get().render(`{@class ${c.name}|${c.source}|${text}|${sc.shortName}|${sc.source}}`)}</span>${isIncludeSource ? ptSource : ""} ${ptClass}`;
};

Parser.SPELL_ATTACK_TYPE_TO_FULL = {};
Parser.SPELL_ATTACK_TYPE_TO_FULL["M"] = "Melee";
Parser.SPELL_ATTACK_TYPE_TO_FULL["R"] = "Ranged";
Parser.SPELL_ATTACK_TYPE_TO_FULL["O"] = "Other/Unknown";

Parser.spAttackTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.SPELL_ATTACK_TYPE_TO_FULL, type);
};

Parser.SPELL_AREA_TYPE_TO_FULL = {
	"ST": "Single Target",
	"MT": "Multiple Targets",
	"C": "Cube",
	"N": "Cone",
	"Y": "Cylinder",
	"S": "Sphere",
	"R": "Circle",
	"Q": "Square",
	"L": "Line",
	"H": "Hemisphere",
	"W": "Wall",
	"E": "Emanation",
};
Parser.spAreaTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.SPELL_AREA_TYPE_TO_FULL, type);
};

Parser.SP_MISC_TAG_TO_FULL = {
	"HL": "Healing",
	"THP": "Grants Temporary Hit Points",
	"SGT": "Requires Sight",
	"PRM": "Permanent Effects",
	"SCL": "Scaling Effects",
	"SCT": "Scaling Targets",
	"SMN": "Summons Creature",
	"TP": "Teleportation",
	"FMV": "Forced Movement",
	"RO": "Rollable Effects",
	"LGTS": "Creates Sunlight",
	"LGT": "Creates Light",
	"UA": "Uses Action",
	"UBA": "Uses Bonus Action",
	"PS": "Plane Shifting",
	"OBS": "Obscures Vision",
	"DFT": "Difficult Terrain",
	"AAD": "Additional Attack Damage",
	"OBJ": "Affects Objects",
	"ADV": "Grants Advantage",
	"PIR": "Permanent If Repeated",
	"BO": "Burns Objects",
	"WLT": "Targets Willing Creatures",
	"ALT": "Targets Allies",
};
Parser.spMiscTagToFull = function (type) {
	return Parser._parse_aToB(Parser.SP_MISC_TAG_TO_FULL, type);
};

Parser.SP_CASTER_PROGRESSION_TO_FULL = {
	full: "Full",
	"1/2": "Half",
	"1/3": "One-Third",
	"pact": "Pact Magic",
};
Parser.spCasterProgressionToFull = function (type) {
	return Parser._parse_aToB(Parser.SP_CASTER_PROGRESSION_TO_FULL, type);
};

// mon-prefix functions are for parsing monster data, and shared with the roll20 script
Parser.monTypeToFullObj = function (type) {
	const out = {
		types: [],
		tags: [],
		asText: "",
		asTextShort: "",

		typeSidekick: null,
		tagsSidekick: [],
		asTextSidekick: null,
	};
	if (type == null) return out;

	// handles e.g. "fey"
	if (typeof type === "string") {
		out.types = [type];
		out.asText = type.toTitleCase();
		out.asTextShort = out.asText;
		return out;
	}

	if (type.type?.choose) {
		out.types = type.type.choose;
	} else {
		out.types = [type.type];
	}

	if (type.swarmSize) {
		out.tags.push("swarm");
		out.asText = `swarm of ${Parser.sizeAbvToFull(type.swarmSize)} ${out.types.map(typ => Parser.monTypeToPlural(typ).toTitleCase()).joinConjunct(", ", " or ")}`;
		out.asTextShort = out.asText;
		out.swarmSize = type.swarmSize;
	} else {
		out.asText = out.types.map(typ => typ.toTitleCase()).joinConjunct(", ", " or ");
		out.asTextShort = out.asText;
	}

	const tagMetas = Parser.monTypeToFullObj._getTagMetas(type.tags);
	if (tagMetas.length) {
		out.tags.push(...tagMetas.flatMap(({filterTags}) => filterTags));
		const ptTags = ` (${tagMetas.map(({displayTag}) => displayTag).join(", ")})`;
		out.asText += ptTags;
		out.asTextShort += ptTags;
	}

	if (type.note) out.asText += ` ${type.note}`;

	// region Sidekick
	if (type.sidekickType) {
		out.typeSidekick = type.sidekickType;
		if (!type.sidekickHidden) out.asTextSidekick = `${type.sidekickType}`;

		const tagMetas = Parser.monTypeToFullObj._getTagMetas(type.sidekickTags);
		if (tagMetas.length) {
			out.tagsSidekick.push(...tagMetas.flatMap(({filterTags}) => filterTags));
			if (!type.sidekickHidden) out.asTextSidekick += ` (${tagMetas.map(({displayTag}) => displayTag).join(", ")})`;
		}
	}
	// endregion

	return out;
};

Parser.monTypeToFullObj._getTagMetas = (tags) => {
	return tags
		? tags.map(tag => {
			if (typeof tag === "string") { // handles e.g. "Fiend (Devil)"
				return {
					filterTags: [tag.toLowerCase()],
					displayTag: tag.toTitleCase(),
				};
			}

			// handles e.g. drow -> "Humanoid (Elf)"
			if (tag.prefixHidden) {
				return {
					filterTags: [
						tag.tag.toLowerCase(),
						`${tag.prefix} ${tag.tag}`.toLowerCase(),
					],
					displayTag: tag.tag.toTitleCase(),
				};
			}

			// handles e.g. "Humanoid (Chondathan Human)"
			return {
				filterTags: [
					tag.tag.toLowerCase(),
					`${tag.prefix} ${tag.tag}`.toLowerCase(),
				],
				displayTag: `${tag.prefix} ${tag.tag}`.toTitleCase(),
			};
		})
		: [];
};

Parser.monTypeToPlural = function (type) {
	return Parser._parse_aToB(Parser.MON_TYPE_TO_PLURAL, type);
};

Parser.monTypeFromPlural = function (type) {
	return Parser._parse_bToA(Parser.MON_TYPE_TO_PLURAL, type);
};

/* -------------------------------------------- */

Parser._getFullImmRes_isSimpleTerm = val => {
	if (typeof val === "string" || val.special) return true;
	const prop = Parser._getFullImmRes_getNextProp(val);
	return prop == null;
};

Parser._getFullImmRes_getNextProp = obj => ["immune", "resist", "vulnerable", "conditionImmune"].find(prop => prop in obj) || null;

Parser._getFullImmRes_getRenderedString = (str, {isPlainText = false, isEntry = false, isTitleCase = false, fnGetModString} = {}) => {
	if (isTitleCase) str = str.toTitleCase();
	if (isPlainText) return Renderer.stripTags(`${str}`);
	if (fnGetModString) str = fnGetModString(str);
	if (isEntry) return str;
	return Renderer.get().render(`${str}`);
};

Parser._getFullImmRes_getRenderedObject = (obj, {isPlainText = false, isEntry = false, isTitleCase = false, mode} = {}) => {
	const stack = [];

	if (obj.preNote) stack.push(Parser._getFullImmRes_getRenderedString(obj.preNote, {isPlainText}));

	const prop = Parser._getFullImmRes_getNextProp(obj);
	if (prop) stack.push(Parser._getFullImmRes_getRenderedArray(obj[prop], {isPlainText, isEntry, isTitleCase, isGroup: true, mode}));

	if (obj.note) stack.push(Parser._getFullImmRes_getRenderedString(obj.note, {isPlainText}));

	return stack.join(" ");
};

Parser._getFullImmRes_getRenderedArray = (values, {isPlainText = false, isEntry = false, isTitleCase = false, isGroup = false, mode} = {}) => {
	if (isPlainText && isEntry) throw new Error(`Options "isPlainText" and "isEntry" are mutually exclusive!`);

	if (mode === "damageType" && values.length === Parser.DMG_TYPES.length && CollectionUtil.deepEquals(Parser.DMG_TYPES, values)) {
		return "all damage"[isTitleCase ? "toTitleCase" : "toString"]();
	}

	return values
		.map((val, i, arr) => {
			const isSimpleCur = Parser._getFullImmRes_isSimpleTerm(val);

			const rendCur = isSimpleCur
				? val.special
					? Parser._getFullImmRes_getRenderedString(val.special, {isPlainText, isTitleCase: false})
					: Parser._getFullImmRes_getRenderedString(val, {isPlainText, isEntry, isTitleCase, fnGetModString: mode === "condition" ? str => `{@condition ${str}}` : null})
				: Parser._getFullImmRes_getRenderedObject(val, {isPlainText, isEntry, isTitleCase, mode});

			if (i === arr.length - 1) return rendCur;

			const isSimpleNxt = Parser._getFullImmRes_isSimpleTerm(arr[i + 1]);

			if (!isSimpleCur || !isSimpleNxt) return `${rendCur}; `;
			if (!isGroup || i !== arr.length - 2 || arr.length < 2) return `${rendCur}, `;
			if (arr.length === 2) return `${rendCur} and `;
			return `${rendCur}, and `;
		})
		.join("");
};

Parser.getFullImmRes = function (values, {isPlainText = false, isTitleCase = false} = {}) {
	if (!values?.length) return "";
	return Parser._getFullImmRes_getRenderedArray(values, {isPlainText, isTitleCase, mode: "damageType"});
};

Parser.getFullCondImm = function (values, {isPlainText = false, isEntry = false, isTitleCase = false} = {}) {
	if (isPlainText && isEntry) throw new Error(`Options "isPlainText" and "isEntry" are mutually exclusive!`);

	if (!values?.length) return "";
	return Parser._getFullImmRes_getRenderedArray(values, {isPlainText, isTitleCase, isEntry, mode: "condition"});
};

/* -------------------------------------------- */

Parser.MON_SENSE_TAG_TO_FULL = {
	"B": "blindsight",
	"D": "darkvision",
	"SD": "superior darkvision",
	"T": "tremorsense",
	"U": "truesight",
};
Parser.monSenseTagToFull = function (tag) {
	return Parser._parse_aToB(Parser.MON_SENSE_TAG_TO_FULL, tag);
};

Parser.MON_SPELLCASTING_TAG_TO_FULL = {
	"P": "Psionics",
	"I": "Innate",
	"F": "Form Only",
	"S": "Shared",
	"O": "Other",
	"CA": "Class, Artificer",
	"CB": "Class, Bard",
	"CC": "Class, Cleric",
	"CD": "Class, Druid",
	"CP": "Class, Paladin",
	"CR": "Class, Ranger",
	"CS": "Class, Sorcerer",
	"CL": "Class, Warlock",
	"CW": "Class, Wizard",
};
Parser.monSpellcastingTagToFull = function (tag) {
	return Parser._parse_aToB(Parser.MON_SPELLCASTING_TAG_TO_FULL, tag);
};

Parser.MON_MISC_TAG_TO_FULL = {
	"AOE": "Has Areas of Effect",
	"CUR": "Inflicts Curse",
	"DIS": "Inflicts Disease",
	"HPR": "Has HP Reduction",
	"MW": "Has Weapon Attacks, Melee",
	"RW": "Has Weapon Attacks, Ranged",
	"MA": "Has Attacks, Melee",
	"RA": "Has Attacks, Ranged",
	"MLW": "Has Melee Weapons",
	"RNG": "Has Ranged Weapons",
	"RCH": "Has Reach Attacks",
	"THW": "Has Thrown Weapons",
};
Parser.monMiscTagToFull = function (tag) {
	return Parser._parse_aToB(Parser.MON_MISC_TAG_TO_FULL, tag);
};

Parser.MON_LANGUAGE_TAG_TO_FULL = {
	"AB": "Abyssal",
	"AQ": "Aquan",
	"AU": "Auran",
	"C": "Common",
	"CE": "Celestial",
	"CS": "Can't Speak Known Languages",
	"CSL": "Common Sign Language",
	"D": "Dwarvish",
	"DR": "Draconic",
	"DS": "Deep Speech",
	"DU": "Druidic",
	"E": "Elvish",
	"G": "Gnomish",
	"GI": "Giant",
	"GO": "Goblin",
	"GTH": "Gith",
	"H": "Halfling",
	"I": "Infernal",
	"IG": "Ignan",
	"LF": "Languages Known in Life",
	"O": "Orc",
	"OTH": "Other",
	"P": "Primordial",
	"S": "Sylvan",
	"T": "Terran",
	"TC": "Thieves' cant",
	"TP": "Telepathy",
	"U": "Undercommon",
	"X": "Any (Choose)",
	"XX": "All",
};
Parser.monLanguageTagToFull = function (tag) {
	return Parser._parse_aToB(Parser.MON_LANGUAGE_TAG_TO_FULL, tag);
};

Parser.ENVIRONMENTS = ["arctic", "coastal", "desert", "forest", "grassland", "hill", "mountain", "swamp", "underdark", "underwater", "urban"];

Parser.ENVIRONMENT__PLANAR_FEYWILD = "planar, feywild";
Parser.ENVIRONMENT__PLANAR_SHADOWFELL = "planar, shadowfell";

Parser.ENVIRONMENT__PLANAR_WATER = "planar, water";
Parser.ENVIRONMENT__PLANAR_EARTH = "planar, earth";
Parser.ENVIRONMENT__PLANAR_FIRE = "planar, fire";
Parser.ENVIRONMENT__PLANAR_AIR = "planar, air";

Parser.ENVIRONMENT__PLANAR_OOZE = "planar, ooze";
Parser.ENVIRONMENT__PLANAR_MAGMA = "planar, magma";
Parser.ENVIRONMENT__PLANAR_ASH = "planar, ash";
Parser.ENVIRONMENT__PLANAR_ICE = "planar, ice";

Parser.ENVIRONMENT__PLANAR_ELEMENTAL_CHAOS = "planar, elemental chaos";

Parser.ENVIRONMENT__PLANAR_ETHEREAL = "planar, ethereal";
Parser.ENVIRONMENT__PLANAR_ASTRAL = "planar, astral";

Parser.ENVIRONMENT__PLANAR_ARBOREA = "planar, arborea";
Parser.ENVIRONMENT__PLANAR_ARCADIA = "planar, arcadia";
Parser.ENVIRONMENT__PLANAR_BEASTLANDS = "planar, beastlands";
Parser.ENVIRONMENT__PLANAR_BYTOPIA = "planar, bytopia";
Parser.ENVIRONMENT__PLANAR_ELYSIUM = "planar, elysium";
Parser.ENVIRONMENT__PLANAR_MOUNT_CELESTIA = "planar, mount celestia";
Parser.ENVIRONMENT__PLANAR_YSGARD = "planar, ysgard";

Parser.ENVIRONMENT__PLANAR_ABYSS = "planar, abyss";
Parser.ENVIRONMENT__PLANAR_ACHERON = "planar, acheron";
Parser.ENVIRONMENT__PLANAR_CARCERI = "planar, carceri";
Parser.ENVIRONMENT__PLANAR_GEHENNA = "planar, gehenna";
Parser.ENVIRONMENT__PLANAR_HADES = "planar, hades";
Parser.ENVIRONMENT__PLANAR_NINE_HELLS = "planar, nine hells";
Parser.ENVIRONMENT__PLANAR_PANDEMONIUM = "planar, pandemonium";

Parser.ENVIRONMENT__PLANAR_LIMBO = "planar, limbo";
Parser.ENVIRONMENT__PLANAR_MECHANUS = "planar, mechanus";
Parser.ENVIRONMENT__PLANAR_OUTLANDS = "planar, outlands";

Parser.ENVIRONMENT__PLANAR_EMERALD_DREAM = "planar, emerald dream";
Parser.ENVIRONMENT__PLANAR_TWISTING_NETHER = "planar, twisting nether";

Parser.ENVIRONMENT__GROUP_PLANAR = "planar";
Parser.ENVIRONMENT__GROUP_PLANAR_TRANSITIVE = "planar, transitive";
Parser.ENVIRONMENT__GROUP_PLANAR_ELEMENTAL = "planar, elemental";
Parser.ENVIRONMENT__GROUP_PLANAR_INNER = "planar, inner";
Parser.ENVIRONMENT__GROUP_PLANAR_UPPER = "planar, upper";
Parser.ENVIRONMENT__GROUP_PLANAR_LOWER = "planar, lower";

Parser.ENVIRONMENT_GROUPS = {
	[Parser.ENVIRONMENT__GROUP_PLANAR_TRANSITIVE]: [
		Parser.ENVIRONMENT__PLANAR_ETHEREAL,
		Parser.ENVIRONMENT__PLANAR_ASTRAL,
	],
	[Parser.ENVIRONMENT__GROUP_PLANAR_ELEMENTAL]: [
		Parser.ENVIRONMENT__PLANAR_WATER,
		Parser.ENVIRONMENT__PLANAR_EARTH,
		Parser.ENVIRONMENT__PLANAR_FIRE,
		Parser.ENVIRONMENT__PLANAR_AIR,
	],
	[Parser.ENVIRONMENT__GROUP_PLANAR_INNER]: [
		Parser.ENVIRONMENT__PLANAR_WATER,
		Parser.ENVIRONMENT__PLANAR_EARTH,
		Parser.ENVIRONMENT__PLANAR_FIRE,
		Parser.ENVIRONMENT__PLANAR_AIR,

		Parser.ENVIRONMENT__PLANAR_OOZE,
		Parser.ENVIRONMENT__PLANAR_MAGMA,
		Parser.ENVIRONMENT__PLANAR_ASH,
		Parser.ENVIRONMENT__PLANAR_ICE,

		Parser.ENVIRONMENT__PLANAR_ELEMENTAL_CHAOS,
	],
	[Parser.ENVIRONMENT__GROUP_PLANAR_UPPER]: [
		Parser.ENVIRONMENT__PLANAR_ARBOREA,
		Parser.ENVIRONMENT__PLANAR_ARCADIA,
		Parser.ENVIRONMENT__PLANAR_BEASTLANDS,
		Parser.ENVIRONMENT__PLANAR_BYTOPIA,
		Parser.ENVIRONMENT__PLANAR_ELYSIUM,
		Parser.ENVIRONMENT__PLANAR_MOUNT_CELESTIA,
		Parser.ENVIRONMENT__PLANAR_YSGARD,
	],
	[Parser.ENVIRONMENT__GROUP_PLANAR_LOWER]: [
		Parser.ENVIRONMENT__PLANAR_ABYSS,
		Parser.ENVIRONMENT__PLANAR_ACHERON,
		Parser.ENVIRONMENT__PLANAR_CARCERI,
		Parser.ENVIRONMENT__PLANAR_GEHENNA,
		Parser.ENVIRONMENT__PLANAR_HADES,
		Parser.ENVIRONMENT__PLANAR_NINE_HELLS,
		Parser.ENVIRONMENT__PLANAR_PANDEMONIUM,
	],
};
Parser.ENVIRONMENT_GROUPS[Parser.ENVIRONMENT__GROUP_PLANAR] = [
	...Parser.ENVIRONMENT_GROUPS[Parser.ENVIRONMENT__GROUP_PLANAR_TRANSITIVE],
	...Parser.ENVIRONMENT_GROUPS[Parser.ENVIRONMENT__GROUP_PLANAR_INNER],
	...Parser.ENVIRONMENT_GROUPS[Parser.ENVIRONMENT__GROUP_PLANAR_UPPER],
	...Parser.ENVIRONMENT_GROUPS[Parser.ENVIRONMENT__GROUP_PLANAR_LOWER],
	Parser.ENVIRONMENT__PLANAR_LIMBO,
	Parser.ENVIRONMENT__PLANAR_MECHANUS,
	Parser.ENVIRONMENT__PLANAR_OUTLANDS,
];

Parser.getExpandedEnvironments = function (env) {
	if (!Parser.ENVIRONMENT_GROUPS[env]) return env;
	return [...Parser.ENVIRONMENT_GROUPS[env]];
};

Parser.ENVIRONMENT_DISPLAY_NAMES = {
	[Parser.ENVIRONMENT__PLANAR_FEYWILD]: "Planar (Feywild)",
	[Parser.ENVIRONMENT__PLANAR_SHADOWFELL]: "Planar (Shadowfell)",

	[Parser.ENVIRONMENT__PLANAR_WATER]: "Planar (Elemental Plane of Water)",
	[Parser.ENVIRONMENT__PLANAR_EARTH]: "Planar (Elemental Plane of Earth)",
	[Parser.ENVIRONMENT__PLANAR_FIRE]: "Planar (Elemental Plane of Fire)",
	[Parser.ENVIRONMENT__PLANAR_AIR]: "Planar (Elemental Plane of Air)",

	[Parser.ENVIRONMENT__PLANAR_OOZE]: "Planar (Para-elemental Plane of Ooze)",
	[Parser.ENVIRONMENT__PLANAR_MAGMA]: "Planar (Para-elemental Plane of Magma)",
	[Parser.ENVIRONMENT__PLANAR_ASH]: "Planar (Para-elemental Plane of Ash)",
	[Parser.ENVIRONMENT__PLANAR_ICE]: "Planar (Para-elemental Plane of Ice)",

	[Parser.ENVIRONMENT__PLANAR_ELEMENTAL_CHAOS]: "Planar (Elemental Chaos)",

	[Parser.ENVIRONMENT__PLANAR_ETHEREAL]: "Planar (Ethereal Plane)",
	[Parser.ENVIRONMENT__PLANAR_ASTRAL]: "Planar (Astral Plane)",

	[Parser.ENVIRONMENT__PLANAR_ARBOREA]: "Planar (Arborea)",
	[Parser.ENVIRONMENT__PLANAR_ARCADIA]: "Planar (Arcadia)",
	[Parser.ENVIRONMENT__PLANAR_BEASTLANDS]: "Planar (Beastlands)",
	[Parser.ENVIRONMENT__PLANAR_BYTOPIA]: "Planar (Bytopia)",
	[Parser.ENVIRONMENT__PLANAR_ELYSIUM]: "Planar (Elysium)",
	[Parser.ENVIRONMENT__PLANAR_MOUNT_CELESTIA]: "Planar (Mount Celestia)",
	[Parser.ENVIRONMENT__PLANAR_YSGARD]: "Planar (Ysgard)",

	[Parser.ENVIRONMENT__PLANAR_ABYSS]: "Planar (Abyss)",
	[Parser.ENVIRONMENT__PLANAR_ACHERON]: "Planar (Acheron)",
	[Parser.ENVIRONMENT__PLANAR_CARCERI]: "Planar (Carceri)",
	[Parser.ENVIRONMENT__PLANAR_GEHENNA]: "Planar (Gehenna)",
	[Parser.ENVIRONMENT__PLANAR_HADES]: "Planar (Hades)",
	[Parser.ENVIRONMENT__PLANAR_NINE_HELLS]: "Planar (Nine Hells)",
	[Parser.ENVIRONMENT__PLANAR_PANDEMONIUM]: "Planar (Pandemonium)",

	[Parser.ENVIRONMENT__PLANAR_LIMBO]: "Planar (Limbo)",
	[Parser.ENVIRONMENT__PLANAR_MECHANUS]: "Planar (Mechanus)",

	[Parser.ENVIRONMENT__PLANAR_OUTLANDS]: "Planar (Outlands)",

	[Parser.ENVIRONMENT__PLANAR_EMERALD_DREAM]: "Planar (Emerald Dream)",
	[Parser.ENVIRONMENT__PLANAR_TWISTING_NETHER]: "Planar (Twisting Nether)",

	[Parser.ENVIRONMENT__GROUP_PLANAR_TRANSITIVE]: "Planar (Transitive Planes)",
	[Parser.ENVIRONMENT__GROUP_PLANAR_ELEMENTAL]: "Planar (Elemental Planes)",
	[Parser.ENVIRONMENT__GROUP_PLANAR_INNER]: "Planar (Inner Planes)",
	[Parser.ENVIRONMENT__GROUP_PLANAR_UPPER]: "Planar (Upper Planes)",
	[Parser.ENVIRONMENT__GROUP_PLANAR_LOWER]: "Planar (Lower Planes)",
};

Parser.getEnvironmentDisplayName = function (env) {
	return Parser.ENVIRONMENT_DISPLAY_NAMES[env] || env.toTitleCase();
};

Parser.TREASURE_TYPES = ["arcana", "armaments", "implements", "relics"];

Parser.getTreasureTypeEntry = function (typ) {
	if (Parser.TREASURE_TYPES.includes(typ)) return `{@table Random Magic Items - ${typ.toTitleCase()}|${Parser.SRC_SNS}|${typ.toTitleCase()}}`;
	return typ.toTitleCase();
};

// psi-prefix functions are for parsing psionic data, and shared with the roll20 script
Parser.PSI_ABV_TYPE_TALENT = "T";
Parser.PSI_ABV_TYPE_DISCIPLINE = "D";
Parser.PSI_ORDER_NONE = "None";
Parser.psiTypeToFull = type => Parser.psiTypeToMeta(type).full;

Parser.psiTypeToMeta = type => {
	let out = {};
	if (type === Parser.PSI_ABV_TYPE_TALENT) out = {hasOrder: false, full: "Talent"};
	else if (type === Parser.PSI_ABV_TYPE_DISCIPLINE) out = {hasOrder: true, full: "Discipline"};
	else if (PrereleaseUtil.getMetaLookup("psionicTypes")?.[type]) out = MiscUtil.copyFast(PrereleaseUtil.getMetaLookup("psionicTypes")[type]);
	else if (BrewUtil2.getMetaLookup("psionicTypes")?.[type]) out = MiscUtil.copyFast(BrewUtil2.getMetaLookup("psionicTypes")[type]);
	out.full = out.full || "Unknown";
	out.short = out.short || out.full;
	return out;
};

Parser.psiTypeAbvToStyle = function (type) { // For prerelease/homebrew
	return Parser._colorableMetaAbvToStyle({key: type, prop: "psionicTypes"});
};

Parser.psiTypeAbvToStylePart = function (type) { // For prerelease/homebrew
	return Parser._colorableMetaAbvToStylePart({key: type, prop: "psionicTypes"});
};

Parser.psiOrderToFull = (order) => {
	return order === undefined ? Parser.PSI_ORDER_NONE : order;
};

Parser.prereqPactToFull = function (pact) {
	if (pact === "Chain") return "Pact of the Chain";
	if (pact === "Tome") return "Pact of the Tome";
	if (pact === "Blade") return "Pact of the Blade";
	if (pact === "Talisman") return "Pact of the Talisman";
	return pact;
};

Parser.prereqPatronToShort = function (patron) {
	if (patron === "Any") return patron;
	const mThe = /^The (.*?)$/.exec(patron);
	if (mThe) return mThe[1];
	return patron;
};

Parser.FEAT_CATEGORY_TO_FULL = {
	"D": "Dragonmark",
	"DG": "Dark Gift",
	"G": "General",
	"O": "Origin",
	"FS": "Fighting Style",
	"FS:P": "Fighting Style Replacement (Paladin)",
	"FS:R": "Fighting Style Replacement (Ranger)",
	"EB": "Epic Boon",
};

Parser.featCategoryToFull = (category) => {
	if (Parser.FEAT_CATEGORY_TO_FULL[category]) return Parser.FEAT_CATEGORY_TO_FULL[category];
	if (PrereleaseUtil.getMetaLookup("featCategories")?.[category]) return PrereleaseUtil.getMetaLookup("featCategories")[category];
	if (BrewUtil2.getMetaLookup("featCategories")?.[category]) return BrewUtil2.getMetaLookup("featCategories")[category];
	return category;
};

Parser.featCategoryFromFull = (full) => {
	return Parser._parse_bToA(Parser.FEAT_CATEGORY_TO_FULL, full.trim().toTitleCase()) || full;
};

// Optional-feature-type acronym expansions are loaded at runtime from each book's
//   `_meta.optionalFeatureTypes` (see `DataUtil.optionalfeature.pInitFeatureTypes`).
Parser.OPT_FEATURE_TYPE_TO_FULL = {};

Parser.optFeatureTypeToFull = function (type) {
	if (Parser.OPT_FEATURE_TYPE_TO_FULL[type]) return Parser.OPT_FEATURE_TYPE_TO_FULL[type];
	if (PrereleaseUtil.getMetaLookup("optionalFeatureTypes")?.[type]) return PrereleaseUtil.getMetaLookup("optionalFeatureTypes")[type];
	if (BrewUtil2.getMetaLookup("optionalFeatureTypes")?.[type]) return BrewUtil2.getMetaLookup("optionalFeatureTypes")[type];
	return type;
};

Parser.CHAR_OPTIONAL_FEATURE_TYPE_TO_FULL = {
	"SG": "Supernatural Gift",
	"OF": "Optional Feature",
	"DG": "Dark Gift",
	"RF:B": "Replacement Feature: Background",
	"CS": "Character Secret", // Specific to IDRotF (rules on page 14)
	"PTH": "Path",
};

Parser.charCreationOptionTypeToFull = function (type) {
	if (Parser.CHAR_OPTIONAL_FEATURE_TYPE_TO_FULL[type]) return Parser.CHAR_OPTIONAL_FEATURE_TYPE_TO_FULL[type];
	if (PrereleaseUtil.getMetaLookup("charOption")?.[type]) return PrereleaseUtil.getMetaLookup("charOption")[type];
	if (BrewUtil2.getMetaLookup("charOption")?.[type]) return BrewUtil2.getMetaLookup("charOption")[type];
	return type;
};

Parser.weightToFull = function (lbs, isSmallUnit) {
	const tons = Math.floor(lbs / 2000);
	lbs = lbs - (2000 * tons);
	return [
		tons ? `${tons}${isSmallUnit ? `<span class="ve-small ve-ml-1">` : " "}ton${tons === 1 ? "" : "s"}${isSmallUnit ? `</span>` : ""}` : null,
		lbs ? `${lbs}${isSmallUnit ? `<span class="ve-small ve-ml-1">` : " "}lb.${isSmallUnit ? `</span>` : ""}` : null,
	].filter(Boolean).join(", ");
};

Parser.RARITIES = ["common", "uncommon", "rare", "very rare", "legendary", "artifact"];
Parser.ITEM_RARITIES = ["none", ...Parser.RARITIES, "varies", "unknown", "unknown (magic)", "other"];

Parser.CAT_ID_CREATURE = 1;
Parser.CAT_ID_SPELL = 2;
Parser.CAT_ID_BACKGROUND = 3;
Parser.CAT_ID_ITEM = 4;
Parser.CAT_ID_CLASS = 5;
Parser.CAT_ID_CONDITION = 6;
Parser.CAT_ID_FEAT = 7;
Parser.CAT_ID_ELDRITCH_INVOCATION = 8;
Parser.CAT_ID_PSIONIC = 9;
Parser.CAT_ID_OTHER_REWARD = 11;
Parser.CAT_ID_VARIANT_OPTIONAL_RULE = 12;
Parser.CAT_ID_ADVENTURE = 13;
Parser.CAT_ID_DEITY = 14;
Parser.CAT_ID_OBJECT = 15;
Parser.CAT_ID_TRAP = 16;
Parser.CAT_ID_HAZARD = 17;
Parser.CAT_ID_QUICKREF = 18;
Parser.CAT_ID_CULT = 19;
Parser.CAT_ID_BOON = 20;
Parser.CAT_ID_DISEASE = 21;
Parser.CAT_ID_METAMAGIC = 22;
Parser.CAT_ID_MANEUVER_BATTLE_MASTER = 23;
Parser.CAT_ID_TABLE = 24;
Parser.CAT_ID_TABLE_GROUP = 25;
Parser.CAT_ID_MANEUVER_CAVALIER = 26;
Parser.CAT_ID_ARCANE_SHOT = 27;
Parser.CAT_ID_OPTIONAL_FEATURE_OTHER = 28;
Parser.CAT_ID_FIGHTING_STYLE = 29;
Parser.CAT_ID_CLASS_FEATURE = 30;
Parser.CAT_ID_VEHICLE = 31;
Parser.CAT_ID_PACT_BOON = 32;
Parser.CAT_ID_ELEMENTAL_DISCIPLINE = 33;
Parser.CAT_ID_ARTIFICER_INFUSION = 34;
Parser.CAT_ID_VEHICLE_UPGRADE_SHIP = 35;
Parser.CAT_ID_VEHICLE_UPGRADE_INFERNAL_WAR_MACHINE = 36;
Parser.CAT_ID_ONOMANCY_RESONANT = 37;
Parser.CAT_ID_RUNE_KNIGHT_RUNE = 37;
Parser.CAT_ID_ALCHEMICAL_FORMULA = 38;
Parser.CAT_ID_MANEUVER = 39;
Parser.CAT_ID_SUBCLASS = 40;
Parser.CAT_ID_SUBCLASS_FEATURE = 41;
Parser.CAT_ID_ACTION = 42;
Parser.CAT_ID_LANGUAGE = 43;
Parser.CAT_ID_BOOK = 44;
Parser.CAT_ID_PAGE = 45;
Parser.CAT_ID_LEGENDARY_GROUP = 46;
Parser.CAT_ID_CHAR_CREATION_OPTIONS = 47;
Parser.CAT_ID_RECIPE = 48;
Parser.CAT_ID_STATUS = 49;
Parser.CAT_ID_SKILLS = 50;
Parser.CAT_ID_SENSES = 51;
Parser.CAT_ID_DECK = 52;
Parser.CAT_ID_CARD = 53;
Parser.CAT_ID_ITEM_MASTERY = 54;
Parser.CAT_ID_MANEUVER_SNS = 55;
Parser.CAT_ID_VEHICLE_UPGRADE_OTHER = 56;

Parser.CAT_ID_GROUPS = {
	"optionalfeature": [
		Parser.CAT_ID_ELDRITCH_INVOCATION,
		Parser.CAT_ID_METAMAGIC,
		Parser.CAT_ID_MANEUVER_BATTLE_MASTER,
		Parser.CAT_ID_MANEUVER_CAVALIER,
		Parser.CAT_ID_ARCANE_SHOT,
		Parser.CAT_ID_OPTIONAL_FEATURE_OTHER,
		Parser.CAT_ID_FIGHTING_STYLE,
		Parser.CAT_ID_PACT_BOON,
		Parser.CAT_ID_ELEMENTAL_DISCIPLINE,
		Parser.CAT_ID_ARTIFICER_INFUSION,
		Parser.CAT_ID_ONOMANCY_RESONANT,
		Parser.CAT_ID_RUNE_KNIGHT_RUNE,
		Parser.CAT_ID_ALCHEMICAL_FORMULA,
		Parser.CAT_ID_MANEUVER,
	],
	"vehicleUpgrade": [
		Parser.CAT_ID_VEHICLE_UPGRADE_SHIP,
		Parser.CAT_ID_VEHICLE_UPGRADE_INFERNAL_WAR_MACHINE,
		Parser.CAT_ID_VEHICLE_UPGRADE_OTHER,
	],
};

Parser.CAT_ID_TO_FULL = {};
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CREATURE] = "Bestiary";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SPELL] = "Spell";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_MANEUVER_SNS] = "Maneuver";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_BACKGROUND] = "Background";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ITEM] = "Item";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CLASS] = "Class";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CONDITION] = "Condition";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_FEAT] = "Feat";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ELDRITCH_INVOCATION] = "Eldritch Invocation";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_PSIONIC] = "Psionic";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_OTHER_REWARD] = "Other Reward";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_VARIANT_OPTIONAL_RULE] = "Rule";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ADVENTURE] = "Adventure";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_DEITY] = "Deity";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_OBJECT] = "Object";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_TRAP] = "Trap";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_HAZARD] = "Hazard";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_QUICKREF] = "Quick Reference";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CULT] = "Cult";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_BOON] = "Boon";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_DISEASE] = "Disease";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_METAMAGIC] = "Metamagic";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_MANEUVER_BATTLE_MASTER] = "Maneuver; Battle Master";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_TABLE] = "Table";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_TABLE_GROUP] = "Table";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_MANEUVER_CAVALIER] = "Maneuver; Cavalier";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ARCANE_SHOT] = "Arcane Shot";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_OPTIONAL_FEATURE_OTHER] = "Optional Feature";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_FIGHTING_STYLE] = "Fighting Style";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CLASS_FEATURE] = "Class Feature";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_VEHICLE] = "Vehicle";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_PACT_BOON] = "Pact Boon";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ELEMENTAL_DISCIPLINE] = "Elemental Discipline";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ARTIFICER_INFUSION] = "Infusion";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_VEHICLE_UPGRADE_SHIP] = "Ship Upgrade";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_VEHICLE_UPGRADE_INFERNAL_WAR_MACHINE] = "Infernal War Machine Upgrade";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_VEHICLE_UPGRADE_OTHER] = "Vehicle Upgrade";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ONOMANCY_RESONANT] = "Onomancy Resonant";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_RUNE_KNIGHT_RUNE] = "Rune Knight Rune";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ALCHEMICAL_FORMULA] = "Alchemical Formula";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_MANEUVER] = "Maneuver";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SUBCLASS] = "Subclass";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SUBCLASS_FEATURE] = "Subclass Feature";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ACTION] = "Action";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_LANGUAGE] = "Language";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_BOOK] = "Book";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_PAGE] = "Page";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_LEGENDARY_GROUP] = "Legendary Group";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CHAR_CREATION_OPTIONS] = "Character Creation Option";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_RECIPE] = "Recipe";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_STATUS] = "Status";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_DECK] = "Deck";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_CARD] = "Card";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SKILLS] = "Skill";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_SENSES] = "Sense";
Parser.CAT_ID_TO_FULL[Parser.CAT_ID_ITEM_MASTERY] = "Item Mastery";

Parser.pageCategoryToFull = function (catId) {
	return Parser._parse_aToB(Parser.CAT_ID_TO_FULL, catId);
};

Parser.CAT_ID_TO_PROP = {};
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CREATURE] = "monster";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SPELL] = "spell";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_MANEUVER_SNS] = "maneuver";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_BACKGROUND] = "background";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ITEM] = "item";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CLASS] = "class";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CONDITION] = "condition";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_FEAT] = "feat";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_PSIONIC] = "psionic";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_OTHER_REWARD] = "reward";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_VARIANT_OPTIONAL_RULE] = "variantrule";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ADVENTURE] = "adventure";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_DEITY] = "deity";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_OBJECT] = "object";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_TRAP] = "trap";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_HAZARD] = "hazard";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CULT] = "cult";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_BOON] = "boon";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_DISEASE] = "condition";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_TABLE] = "table";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_TABLE_GROUP] = "tableGroup";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_VEHICLE] = "vehicle";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ELDRITCH_INVOCATION] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_MANEUVER_CAVALIER] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ARCANE_SHOT] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_OPTIONAL_FEATURE_OTHER] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_FIGHTING_STYLE] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_METAMAGIC] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_MANEUVER_BATTLE_MASTER] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_PACT_BOON] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ELEMENTAL_DISCIPLINE] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ARTIFICER_INFUSION] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_VEHICLE_UPGRADE_SHIP] = "vehicleUpgrade";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_VEHICLE_UPGRADE_INFERNAL_WAR_MACHINE] = "vehicleUpgrade";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_VEHICLE_UPGRADE_OTHER] = "vehicleUpgrade";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ONOMANCY_RESONANT] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_RUNE_KNIGHT_RUNE] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ALCHEMICAL_FORMULA] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_MANEUVER] = "optionalfeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_QUICKREF] = null;
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CLASS_FEATURE] = "classFeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SUBCLASS] = "subclass";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SUBCLASS_FEATURE] = "subclassFeature";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ACTION] = "action";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_LANGUAGE] = "language";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_BOOK] = "book";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_PAGE] = null;
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_LEGENDARY_GROUP] = "legendaryGroup";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CHAR_CREATION_OPTIONS] = "charoption";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_RECIPE] = "recipe";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_STATUS] = "status";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_DECK] = "deck";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_CARD] = "card";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SKILLS] = "skill";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_SENSES] = "sense";
Parser.CAT_ID_TO_PROP[Parser.CAT_ID_ITEM_MASTERY] = "itemMastery";

Parser.pageCategoryToProp = function (catId) {
	return Parser._parse_aToB(Parser.CAT_ID_TO_PROP, catId);
};

Parser.ABIL_ABVS = ["str", "dex", "int", "wis", "cha"];

Parser.spClassesToCurrentAndLegacy = function (fromClassList) {
	const current = [];
	const legacy = [];
	fromClassList.forEach(cls => {
		if ((cls.name === "Artificer" && cls.source === "UAArtificer") || (cls.name === "Artificer (Revisited)" && cls.source === "UAArtificerRevisited")) legacy.push(cls);
		else current.push(cls);
	});
	return [current, legacy];
};

/**
 * Build a pair of strings; one with all current subclasses, one with all legacy subclasses
 *
 * @param sp a spell
 * @param subclassLookup Data loaded from `generated/gendata-subclass-lookup.json`. Of the form: `{PHB: {Barbarian: {PHB: {Berserker: "Path of the Berserker"}}}}`
 * @param isIncludeSource
 * @returns {*[]} A two-element array. First item is a string of all the current subclasses, second item a string of
 * all the legacy/superseded subclasses
 */
Parser.spSubclassesToCurrentAndLegacyFull = function (sp, subclassLookup, {isIncludeSource = false} = {}) {
	return Parser._spSubclassesToCurrentAndLegacyFull({sp, subclassLookup, prop: "fromSubclass", isIncludeSource});
};

Parser.spVariantSubclassesToCurrentAndLegacyFull = function (sp, subclassLookup, {isIncludeSource = false} = {}) {
	return Parser._spSubclassesToCurrentAndLegacyFull({sp, subclassLookup, prop: "fromSubclassVariant", isIncludeSource});
};

Parser._spSubclassesToCurrentAndLegacyFull = ({sp, subclassLookup, prop, isIncludeSource = false}) => {
	const fromSubclass = Renderer.spell.getCombinedClasses(sp, prop);
	if (!fromSubclass.length) return ["", ""];

	const current = [];
	const legacy = [];
	const curNames = new Set();
	const toCheck = [];
	fromSubclass
		.filter(c => {
			const excludeClass = ExcludeUtil.isExcluded(
				UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES]({name: c.class.name, source: c.class.source}),
				"class",
				c.class.source,
				{isNoCount: true},
			);
			if (excludeClass) return false;

			const excludeSubclass = ExcludeUtil.isExcluded(
				UrlUtil.URL_TO_HASH_BUILDER["subclass"]({
					shortName: c.subclass.shortName,
					source: c.subclass.source,
					className: c.class.name,
					classSource: c.class.source,
				}),
				"subclass",
				c.subclass.source,
				{isNoCount: true},
			);
			if (excludeSubclass) return false;

			return !Renderer.spell.isExcludedSubclassVariantSource({classDefinedInSource: c.class.definedInSource});
		})
		.sort((a, b) => {
			const byName = SortUtil.ascSort(a.subclass.name, b.subclass.name);
			return byName || SortUtil.ascSort(a.class.name, b.class.name);
		})
		.forEach(c => {
			const nm = c.subclass.name;
			const src = c.subclass.source;

			const toAdd = Parser._spSubclassItem({fromSubclass: c, isTextOnly: false, isIncludeSource});

			const fromLookup = MiscUtil.get(
				subclassLookup,
				c.class.source,
				c.class.name,
				c.subclass.source,
				c.subclass.name,
			);

			if (fromLookup && fromLookup.isReprinted) {
				legacy.push(toAdd);
			} else if (SourceUtil.isNonstandardSource(src)) {
				const cleanName = Parser._spSubclassesToCurrentAndLegacyFull.mapClassShortNameToMostRecent(
					nm.split("(")[0].trim().split(/v\d+/)[0].trim(),
				);
				toCheck.push({"name": cleanName, "ele": toAdd});
			} else {
				current.push(toAdd);
				curNames.add(nm);
			}
		});

	toCheck.forEach(n => {
		if (curNames.has(n.name)) {
			legacy.push(n.ele);
		} else {
			current.push(n.ele);
		}
	});

	return [current.join(", "), legacy.join(", ")];
};

/**
 * Get the most recent iteration of a subclass name.
 */
Parser._spSubclassesToCurrentAndLegacyFull.mapClassShortNameToMostRecent = (shortName) => {
	switch (shortName) {
		case "Favored Soul": return "Divine Soul";
		case "Undying Light": return "Celestial";
		case "Deep Stalker": return "Gloom Stalker";
	}
	return shortName;
};

Parser.spVariantClassesToCurrentAndLegacy = function (fromVariantClassList) {
	const current = [];
	const legacy = [];
	fromVariantClassList.forEach(cls => {
		if (SourceUtil.isPrereleaseSource(cls.definedInSource)) legacy.push(cls);
		else current.push(cls);
	});
	return [current, legacy];
};

Parser.attackTypeToFull = function (attackType) {
	return Parser._parse_aToB(Parser.ATK_TYPE_TO_FULL, attackType);
};

Parser.trapHazTypeToFull = function (type) {
	return Parser._parse_aToB(Parser.TRAP_HAZARD_TYPE_TO_FULL, type);
};

Parser.TRAP_HAZARD_TYPE_TO_FULL = {
	"MECH": "Mechanical Trap",
	"MAG": "Magical Trap",
	"SMPL": "Simple Trap",
	"CMPX": "Complex Trap",
	"HAZ": "Hazard",
	"WTH": "Weather",
	"ENV": "Environmental Hazard",
	"WLD": "Wilderness Hazard",
	"GEN": "Generic",
	"EST": "Eldritch Storm",
	"TRP": "Trap",
	"HAUNT": "Haunted Trap",
};

Parser._TIER_TO_LEVEL_RANGE = {
	"1": [1, 4],
	"2": [5, 10],
	"3": [11, 16],
	"4": [17, 20],
};
Parser.tierToFullLevel = function (tier, {styleHint} = {}) {
	const range = Parser._parse_aToB(Parser._TIER_TO_LEVEL_RANGE, tier);
	if (!range) return `Tier ${tier}`;

	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");

	if (styleHint === "classic") return `${range.map(n => Parser.getOrdinalForm(n)).join("\u2013")} Level`;
	return `Levels ${range.join("\u2013")}`;
};

Parser.trapInitToFull = function (init) {
	return Parser._parse_aToB(Parser.TRAP_INIT_TO_FULL, init);
};

Parser.TRAP_INIT_TO_FULL = {};
Parser.TRAP_INIT_TO_FULL[1] = "initiative count 10";
Parser.TRAP_INIT_TO_FULL[2] = "initiative count 20";
Parser.TRAP_INIT_TO_FULL[3] = "initiative count 20 and initiative count 10";

Parser.ATK_TYPE_TO_FULL = {};
Parser.ATK_TYPE_TO_FULL["MW"] = "Melee Weapon Attack";
Parser.ATK_TYPE_TO_FULL["RW"] = "Ranged Weapon Attack";

Parser.bookOrdinalToAbv = (ordinal, {isPreNoSuff = false, isPlainText = false} = {}) => {
	if (ordinal === undefined) return "";
	switch (ordinal.type) {
		case "part": return `${isPreNoSuff ? " " : ""}${Parser._bookOrdinalToAbv_getPt({ordinal, isPlainText})} ${ordinal.identifier}${isPreNoSuff ? "" : " \u2014 "}`;
		case "chapter": return `${isPreNoSuff ? " " : ""}${Parser._bookOrdinalToAbv_getPt({ordinal, isPlainText})} ${ordinal.identifier}${isPreNoSuff ? "" : ": "}`;
		case "episode": return `${isPreNoSuff ? " " : ""}${Parser._bookOrdinalToAbv_getPt({ordinal, isPlainText})} ${ordinal.identifier}${isPreNoSuff ? "" : ": "}`;
		case "appendix": return `${isPreNoSuff ? " " : ""}${Parser._bookOrdinalToAbv_getPt({ordinal, isPlainText})}${ordinal.identifier != null ? ` ${ordinal.identifier}` : ""}${isPreNoSuff ? "" : ": "}`;
		case "level": return `${isPreNoSuff ? " " : ""}${Parser._bookOrdinalToAbv_getPt({ordinal, isPlainText})} ${ordinal.identifier}${isPreNoSuff ? "" : ": "}`;
		case "section": return `${isPreNoSuff ? " " : ""}${Parser._bookOrdinalToAbv_getPt({ordinal, isPlainText})} ${ordinal.identifier}${isPreNoSuff ? "" : ": "}`;
		default: throw new Error(`Unhandled ordinal type "${ordinal.type}"`);
	}
};

Parser._bookOrdinalToAbv_getPt = ({ordinal, isPlainText = false}) => {
	switch (ordinal.type) {
		case "part": return `Part`;
		case "chapter": return isPlainText ? `Ch.` : `<span title="Chapter">Ch.</span>`;
		case "episode": return isPlainText ? `Ep.` : `<span title="Episode">Ep.</span>`;
		case "appendix": return isPlainText ? `App.` : `<span title="Appendix">App.</span>`;
		case "section": return isPlainText ? `Sec.` : `<span title="Section">Sec.</span>`;
		case "level": return `Level`;
		default: throw new Error(`Unhandled ordinal type "${ordinal.type}"`);
	}
};

Parser.IMAGE_TYPE_TO_FULL = {
	"map": "Map",
	"mapPlayer": "Map (Player)",
};
Parser.imageTypeToFull = function (imageType) {
	return Parser._parse_aToB(Parser.IMAGE_TYPE_TO_FULL, imageType, "Other");
};

Parser.nameToTokenName = function (name, {isUrlEncode = false} = {}) {
	const out = name
		.toAscii()
		.replace(/"/g, "");
	if (!isUrlEncode) return out;
	return encodeURIComponent(out);
};

Parser.bytesToHumanReadable = function (bytes, {fixedDigits = 2} = {}) {
	if (bytes == null) return "";
	if (!bytes) return "0 B";
	const e = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / Math.pow(1024, e)).toFixed(fixedDigits)} ${`\u200bKMGTP`.charAt(e)}B`;
};

Parser.SKL_ABV_ABJ = "A";
Parser.SKL_ABV_EVO = "V";
Parser.SKL_ABV_ENC = "E";
Parser.SKL_ABV_ILL = "I";
Parser.SKL_ABV_DIV = "D";
Parser.SKL_ABV_NEC = "N";
Parser.SKL_ABV_TRA = "T";
Parser.SKL_ABV_CON = "C";
Parser.SKL_ABV_PSI = "P";
Parser.SKL_ABVS = [
	Parser.SKL_ABV_ABJ,
	Parser.SKL_ABV_CON,
	Parser.SKL_ABV_DIV,
	Parser.SKL_ABV_ENC,
	Parser.SKL_ABV_EVO,
	Parser.SKL_ABV_ILL,
	Parser.SKL_ABV_NEC,
	Parser.SKL_ABV_PSI,
	Parser.SKL_ABV_TRA,
];

Parser.SKL_ABJ = "Abjuration";
Parser.SKL_EVO = "Evocation";
Parser.SKL_ENC = "Enchantment";
Parser.SKL_ILL = "Illusion";
Parser.SKL_DIV = "Divination";
Parser.SKL_NEC = "Necromancy";
Parser.SKL_TRA = "Transmutation";
Parser.SKL_CON = "Conjuration";
Parser.SKL_PSI = "Psionic";

Parser.SP_SCHOOL_ABV_TO_FULL = {};
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_ABJ] = Parser.SKL_ABJ;
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_EVO] = Parser.SKL_EVO;
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_ENC] = Parser.SKL_ENC;
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_ILL] = Parser.SKL_ILL;
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_DIV] = Parser.SKL_DIV;
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_NEC] = Parser.SKL_NEC;
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_TRA] = Parser.SKL_TRA;
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_CON] = Parser.SKL_CON;
Parser.SP_SCHOOL_ABV_TO_FULL[Parser.SKL_ABV_PSI] = Parser.SKL_PSI;

Parser.SP_SCHOOL_ABV_TO_SHORT = {};
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_ABJ] = "Abj.";
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_EVO] = "Evoc.";
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_ENC] = "Ench.";
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_ILL] = "Illu.";
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_DIV] = "Divin.";
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_NEC] = "Necro.";
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_TRA] = "Trans.";
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_CON] = "Conj.";
Parser.SP_SCHOOL_ABV_TO_SHORT[Parser.SKL_ABV_PSI] = "Psi.";

Parser.SP_SCHOOL_ABV_TO_CSS_CLASS = {};
Parser.SP_SCHOOL_ABV_TO_CSS_CLASS[Parser.SKL_ABV_ABJ] = "ve-sp__school--a";
Parser.SP_SCHOOL_ABV_TO_CSS_CLASS[Parser.SKL_ABV_CON] = "ve-sp__school--c";
Parser.SP_SCHOOL_ABV_TO_CSS_CLASS[Parser.SKL_ABV_DIV] = "ve-sp__school--d";
Parser.SP_SCHOOL_ABV_TO_CSS_CLASS[Parser.SKL_ABV_ENC] = "ve-sp__school--e";
Parser.SP_SCHOOL_ABV_TO_CSS_CLASS[Parser.SKL_ABV_EVO] = "ve-sp__school--v";
Parser.SP_SCHOOL_ABV_TO_CSS_CLASS[Parser.SKL_ABV_ILL] = "ve-sp__school--i";
Parser.SP_SCHOOL_ABV_TO_CSS_CLASS[Parser.SKL_ABV_NEC] = "ve-sp__school--n";
Parser.SP_SCHOOL_ABV_TO_CSS_CLASS[Parser.SKL_ABV_PSI] = "ve-sp__school--p";
Parser.SP_SCHOOL_ABV_TO_CSS_CLASS[Parser.SKL_ABV_TRA] = "ve-sp__school--t";

Parser.spSchoolAbvToStyleClass = function (school) {
	return Parser.SP_SCHOOL_ABV_TO_CSS_CLASS[school] || "";
};

Parser.PSI_ABV_TYPE_TO_CSS_CLASS = {};
Parser.PSI_ABV_TYPE_TO_CSS_CLASS[Parser.PSI_ABV_TYPE_TALENT] = "ve-psi__type--t";
Parser.PSI_ABV_TYPE_TO_CSS_CLASS[Parser.PSI_ABV_TYPE_DISCIPLINE] = "ve-psi__type--d";

Parser.psiTypeAbvToStyleClass = function (type) {
	return Parser.PSI_ABV_TYPE_TO_CSS_CLASS[type] || "";
};

Parser.ATB_ABV_TO_FULL = {
	"str": "Strength",
	"dex": "Dexterity",
	"int": "Intelligence",
	"wis": "Wisdom",
	"cha": "Charisma",
};

Parser.DEF_ABV_TO_FULL = {
	"frt": "Fortitude",
	"ref": "Reflex",
	"wil": "Will",
	"arm": "Armour",
};

Parser.TP_ABERRATION = "aberration";
Parser.TP_BEAST = "beast";
Parser.TP_CELESTIAL = "celestial";
Parser.TP_CONSTRUCT = "construct";
Parser.TP_DRAGON = "dragon";
Parser.TP_ELEMENTAL = "elemental";
Parser.TP_FEY = "fey";
Parser.TP_FIEND = "fiend";
Parser.TP_GIANT = "giant";
Parser.TP_HUMANOID = "humanoid";
Parser.TP_MONSTROSITY = "monstrosity";
Parser.TP_OOZE = "ooze";
Parser.TP_PLANT = "plant";
Parser.TP_UNDEAD = "undead";
Parser.TP_VEHICLE = "vehicle";
Parser.TP_SPECIAL = "special";
Parser.MON_TYPES = [Parser.TP_ABERRATION, Parser.TP_BEAST, Parser.TP_CELESTIAL, Parser.TP_CONSTRUCT, Parser.TP_DRAGON, Parser.TP_ELEMENTAL, Parser.TP_FEY, Parser.TP_FIEND, Parser.TP_GIANT, Parser.TP_HUMANOID, Parser.TP_MONSTROSITY, Parser.TP_OOZE, Parser.TP_PLANT, Parser.TP_UNDEAD, Parser.TP_VEHICLE, Parser.TP_SPECIAL];
Parser.MON_TYPES_STANDARD = Parser.MON_TYPES.filter(it => ![Parser.TP_VEHICLE, Parser.TP_SPECIAL].includes(it));
Parser.MON_TYPE_TO_PLURAL = {};
Parser.MON_TYPE_TO_PLURAL[Parser.TP_ABERRATION] = "aberrations";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_BEAST] = "beasts";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_CELESTIAL] = "celestials";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_CONSTRUCT] = "constructs";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_DRAGON] = "dragons";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_ELEMENTAL] = "elementals";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_FEY] = "fey";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_FIEND] = "fiends";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_GIANT] = "giants";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_HUMANOID] = "humanoids";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_MONSTROSITY] = "monstrosities";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_OOZE] = "oozes";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_PLANT] = "plants";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_UNDEAD] = "undead";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_VEHICLE] = "vehicles";
Parser.MON_TYPE_TO_PLURAL[Parser.TP_SPECIAL] = "special";

Parser.SZ_FINE = "F";
Parser.SZ_DIMINUTIVE = "D";
Parser.SZ_TINY = "T";
Parser.SZ_SMALL = "S";
Parser.SZ_MEDIUM = "M";
Parser.SZ_LARGE = "L";
Parser.SZ_HUGE = "H";
Parser.SZ_GARGANTUAN = "G";
Parser.SZ_COLOSSAL = "C";
Parser.SZ_VARIES = "V";

Parser.SIZE_ABVS = [Parser.SZ_TINY, Parser.SZ_SMALL, Parser.SZ_MEDIUM, Parser.SZ_LARGE, Parser.SZ_HUGE, Parser.SZ_GARGANTUAN, Parser.SZ_VARIES];

Parser.SIZE_ABV_TO_FULL = {
	[Parser.SZ_FINE]: "Fine",
	[Parser.SZ_DIMINUTIVE]: "Diminutive",
	[Parser.SZ_TINY]: "Tiny",
	[Parser.SZ_SMALL]: "Small",
	[Parser.SZ_MEDIUM]: "Medium",
	[Parser.SZ_LARGE]: "Large",
	[Parser.SZ_HUGE]: "Huge",
	[Parser.SZ_GARGANTUAN]: "Gargantuan",
	[Parser.SZ_COLOSSAL]: "Colossal",
	[Parser.SZ_VARIES]: "Varies",
};

Parser.SIZE_ABV_TO_SHORT = {
	[Parser.SZ_FINE]: "Fin.",
	[Parser.SZ_DIMINUTIVE]: "Dmtv.",
	[Parser.SZ_TINY]: "Tin.",
	[Parser.SZ_SMALL]: "Sml.",
	[Parser.SZ_MEDIUM]: "Med.",
	[Parser.SZ_LARGE]: "Lrg.",
	[Parser.SZ_HUGE]: "Hge.",
	[Parser.SZ_GARGANTUAN]: "Grgn.",
	[Parser.SZ_COLOSSAL]: "Clsl.",
	[Parser.SZ_VARIES]: "Vars.",
};

Parser.XP_CHART_ALT = {
	"0": 10,
	"1/8": 25,
	"1/4": 50,
	"1/2": 100,
	"1": 200,
	"2": 450,
	"3": 700,
	"4": 1100,
	"5": 1800,
	"6": 2300,
	"7": 2900,
	"8": 3900,
	"9": 5000,
	"10": 5900,
	"11": 7200,
	"12": 8400,
	"13": 10000,
	"14": 11500,
	"15": 13000,
	"16": 15000,
	"17": 18000,
	"18": 20000,
	"19": 22000,
	"20": 25000,
	"21": 33000,
	"22": 41000,
	"23": 50000,
	"24": 62000,
	"25": 75000,
	"26": 90000,
	"27": 105000,
	"28": 120000,
	"29": 135000,
	"30": 155000,
};

Parser.ARMOUR_ABV_TO_FULL = {
	"l.": "light",
	"m.": "medium",
	"h.": "heavy",
	"s.": "shield",
};

Parser.WEAPON_ABV_TO_FULL = {
	"s.": "simple",
	"m.": "martial",
};

Parser.CONDITION_TO_COLOR = {
	"Blinded": "#525252",
	"Brittle": "#c8a84b",
	"Charmed": "#f01789",
	"Confused": "#d4517a",
	"Dazed": "#5ba0a0",
	"Deafened": "#ababab",
	"Debilitated": "#8b1a1a",
	"Dominated": "#7b2d8b",
	"Doomed": "#2d0a0a",
	"Fatigue": "#8a6e3a",
	"Fixated": "#c9960c",
	"Frightened": "#c9ca18",
	"Grappled": "#8784a0",
	"Incapacitated": "#3165a0",
	"Poisoned": "#4dc200",
	"Prone": "#5e60a0",
	"Rattled": "#e0b830",
	"Restrained": "#d98000",
	"Slowed": "#4682b4",
	"Sluggish": "#3d8b8b",
	"Staggered": "#b84c00",
	"Strife": "#7d3c98",
	"Taunted": "#c0392b",
	"Unconscious": "#3a40ad",
	"Weakened": "#6b8a52",

	"Concentration": "#009f7a",
};

Parser.RULE_TYPE_TO_FULL = {
	"C": "Core",
	"O": "Optional",
	"P": "Prerelease",
	"V": "Variant",
	"VO": "Variant Optional",
	"VV": "Variant Variant",
	"U": "Unknown",
};

Parser.ruleTypeToFull = function (ruleType) {
	return Parser._parse_aToB(Parser.RULE_TYPE_TO_FULL, ruleType);
};

Parser.VEHICLE_TYPE_TO_FULL = {
	"SHIP": "Ship",
	"SPELLJAMMER": "Spelljammer Ship",
	"ELEMENTAL_AIRSHIP": "Elemental Airship",
	"INFWAR": "Infernal War Machine",
	"CREATURE": "Creature",
	"OBJECT": "Object",
};

Parser.vehicleTypeToFull = function (vehicleType) {
	return Parser._parse_aToB(Parser.VEHICLE_TYPE_TO_FULL, vehicleType);
};

Parser.VEHICLE_UPGRADE_TYPE_TO_FULL = {
	"SHP:H": "Ship Upgrade, Hull",
	"SHP:M": "Ship Upgrade, Movement",
	"SHP:W": "Ship Upgrade, Weapon",
	"SHP:F": "Ship Upgrade, Figurehead",
	"SHP:O": "Ship Upgrade, Miscellaneous",
	"IWM:W": "Infernal War Machine Variant, Weapon",
	"IWM:A": "Infernal War Machine Upgrade, Armour",
	"IWM:G": "Infernal War Machine Upgrade, Gadget",
};

Parser.vehicleUpgradeTypeToFull = function (type) {
	if (Parser.VEHICLE_UPGRADE_TYPE_TO_FULL[type]) return Parser.VEHICLE_UPGRADE_TYPE_TO_FULL[type];
	if (PrereleaseUtil.getMetaLookup("vehicleUpgradeTypes")?.[type]) return PrereleaseUtil.getMetaLookup("vehicleUpgradeTypes")[type];
	if (BrewUtil2.getMetaLookup("vehicleUpgradeTypes")?.[type]) return BrewUtil2.getMetaLookup("vehicleUpgradeTypes")[type];
	return type;
};

Parser.CROCHET_PATTERN_SKILL_LEVEL_TO_FULL = {
	"B": "Beginner",
	"I": "Intermediate",
	"A": "Advanced",
};

Parser.crochetPatternSkilLevelToFull = function (lvl) {
	return Parser._parse_aToB(Parser.CROCHET_PATTERN_SKILL_LEVEL_TO_FULL, lvl);
};

Parser.CROCHET_HOOK_MM_TO_US = {
	"2.25": "B/1",
	"2.75": "C",
	"3.25": "D",
	"3.50": "E/4",
	"3.75": "F",
	"4": "G/6",
	"4.25": "G/6",
	"4.50": "7",
	"5": "H/8",
	"5.25": "I",
	"5.50": "I/9",
	"6": "J/10",
	"6.50": "K",
	"9": "M/13",
	"10": "N/15",
	"12": "P/16",
	"15": "Q",
	"16": "Q",
	"19": "S",
};

Parser.crochetHookMmToUs = function (sz) {
	return Parser._parse_aToB(Parser.CROCHET_HOOK_MM_TO_US, sz);
};

// SOURCES =============================================================================================================

Parser.SRC_SNS = "sns";

Parser.SOURCE_JSON_TO_FULL = {};
Parser.SOURCE_JSON_TO_FULL[Parser.SRC_SNS] = "Spies & Spiders";

Parser.SOURCE_JSON_TO_ABV = {};
Parser.SOURCE_JSON_TO_ABV[Parser.SRC_SNS] = "SNS";

Parser.SOURCE_JSON_TO_DATE = {};
Parser.SOURCE_JSON_TO_DATE[Parser.SRC_SNS] = "2024-01-01";

// region Source categories
Parser.SOURCES_ADVENTURES = new Set([]);
Parser.SOURCES_CORE_SUPPLEMENTS = new Set(Object.keys(Parser.SOURCE_JSON_TO_FULL).filter(it => !Parser.SOURCES_ADVENTURES.has(it)));
Parser.SOURCES_VANILLA = new Set([Parser.SRC_SNS]);
Parser.SOURCES_COMEDY = new Set([]);
Parser.SOURCES_NON_FR = new Set([]);
// endregion

Parser.SOURCES_AVAILABLE_DOCS_BOOK = {};
[
	Parser.SRC_SNS,
].forEach(src => {
	Parser.SOURCES_AVAILABLE_DOCS_BOOK[src] = src;
	Parser.SOURCES_AVAILABLE_DOCS_BOOK[src.toLowerCase()] = src;
});
Parser.SOURCES_AVAILABLE_DOCS_ADVENTURE = {};

Parser.getTagSource = function (tag, source) {
	if (source && source.trim()) return source;

	tag = tag.trim();

	return Renderer.tag.getTagInfo(tag, {isRequired: true}).defaultSource;
};

Parser.PROP_TO_TAG = {
	"monster": "creature",
	"optionalfeature": "optfeature",
	"tableGroup": "table",
	"vehicleUpgrade": "vehupgrade",
	"baseitem": "item",
	"itemGroup": "item",
	"magicvariant": "item",
	"crochetPattern": "crochet",
};
Parser._RE_PROP_RAW_PREFIX = /^raw_/;
Parser.getPropTag = function (prop) {
	if (!prop) return prop;
	prop = prop.replace(Parser._RE_PROP_RAW_PREFIX, "");
	if (Parser.PROP_TO_TAG[prop]) return Parser.PROP_TO_TAG[prop];
	if (prop?.endsWith("Fluff")) return null;
	return prop;
};

// Note that ordering is important; we expect the "primary" prop to be first
Parser.TAG_TO_PROPS = {
	"creature": ["monster"],
	"optfeature": ["optionalfeature"],
	"table": ["table", "tableGroup"],
	"vehupgrade": ["vehicleUpgrade"],
	"item": ["item", "baseitem", "itemGroup", "magicvariant"],
	"legroup": ["legendaryGroup"],
};
Parser.getTagProps = function (tag) {
	if (Parser.TAG_TO_PROPS[tag]) return Parser.TAG_TO_PROPS[tag];
	return [tag];
};

Parser.PROP_TO_DISPLAY_NAME = {
	"monster": "Creature",
	"variantrule": "Rule",
	"optionalfeature": "Option/Feature",
	"magicvariant": "Magic Item Variant",
	"baseitem": "Item (Base)",
	"item": "Item",
	"adventure": "Adventure",
	"adventureData": "Adventure Text",
	"book": "Book",
	"bookData": "Book Text",
	"charoption": "Other Character Creation Option",
	"encounterShape": "Encounter Shape",
	"crochetPattern": "Crochet Pattern",
	"renderdemo": "Renderer Sample",

	"bonus": "Bonus Action",
	"legendary": "Legendary Action",
	"mythic": "Mythic Action",
	"lairActions": "Lair Action",
	"regionalEffects": "Regional Effect",

	// '24-specific
	"race": "Species",
	"subrace": "Subspecies",
};
Parser.getPropDisplayName = function (prop, {suffix = ""} = {}) {
	if (Parser.PROP_TO_DISPLAY_NAME[prop]) return `${Parser.PROP_TO_DISPLAY_NAME[prop]}${suffix}`;

	const mFluff = /Fluff$/.exec(prop);
	if (mFluff) return Parser.getPropDisplayName(prop.slice(0, -mFluff[0].length), {suffix: " Fluff"});

	const mFoundry = /^foundry(?<prop>[A-Z].*)$/.exec(prop);
	if (mFoundry) return Parser.getPropDisplayName(mFoundry.groups.prop.lowercaseFirst(), {suffix: " Foundry Data"});

	return `${prop.split(/([A-Z][a-z]+)/g).filter(Boolean).join(" ").uppercaseFirst()}${suffix}`;
};

Parser.DMGTYPE_JSON_TO_FULL = {
	"A": "acid",
	"B": "bludgeoning",
	"C": "cold",
	"F": "fire",
	"O": "force",
	"L": "lightning",
	"N": "necrotic",
	"P": "piercing",
	"I": "poison",
	"Y": "psychic",
	"R": "radiant",
	"S": "slashing",
	"T": "thunder",
};

Parser.DMG_TYPES = ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"];
Parser.CONDITIONS = ["blinded", "brittle", "charmed", "confused", "dazed", "deafened", "debilitated", "dominated", "doomed", "fatigue", "fixated", "frightened", "grappled", "incapacitated", "poisoned", "prone", "rattled", "restrained", "slowed", "sluggish", "staggered", "strife", "taunted", "unconscious", "weakened"];

Parser.SENSES = [
	{"name": "blindsight", "source": Parser.SRC_SNS},
	{"name": "darkvision", "source": Parser.SRC_SNS},
	{"name": "tremorsense", "source": Parser.SRC_SNS},
	{"name": "truesight", "source": Parser.SRC_SNS},
];
Parser._SENSES_MODERN = [
	{"name": "blindsight", "source": Parser.SRC_SNS},
	{"name": "darkvision", "source": Parser.SRC_SNS},
	{"name": "tremorsense", "source": Parser.SRC_SNS},
	{"name": "truesight", "source": Parser.SRC_SNS},
];
Parser.getSenses = function ({styleHint = null} = {}) {
	styleHint ||= VetoolsConfig.get("styleSwitcher", "style");
	return styleHint === "classic" ? Parser._SENSES_LEGACY : Parser._SENSES_MODERN;
};

Parser.NUMBERS_ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
Parser.NUMBERS_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
Parser.NUMBERS_TEENS = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];

// region Metric conversion
Parser.metric = class {
	// See MPMB's breakdown: https://old.reddit.com/r/dndnext/comments/6gkuec
	static MILES_TO_KILOMETRES = 1.6;
	static FEET_TO_METRES = 0.3; // 5 ft = 1.5 m
	static YARDS_TO_METRES = 0.9; // (as above)
	static POUNDS_TO_KILOGRAMS = 0.5; // 2 lb = 1 kg
	// Other additions
	static INCHES_TO_CENTIMETERS = 2.5; // 1 in = 2.5 cm
	static CUBIC_FEET_TO_LITRES = 28; // 1 ft³ = 28 L

	/**
	 * @param {number} originalValue
	 * @param {string} originalUnit
	 * @param {?boolean} toFixed
	 */
	static getMetricNumber ({originalValue, originalUnit, toFixed = null}) {
		if (originalValue == null || isNaN(originalValue)) return originalValue;

		originalValue = Number(originalValue);
		if (!originalValue) return originalValue;

		let out = null;
		switch (Parser.getNormalizedUnit(originalUnit)) {
			case Parser.UNT_INCHES: out = originalValue * Parser.metric.INCHES_TO_CENTIMETERS; break;
			case Parser.UNT_FEET: out = originalValue * Parser.metric.FEET_TO_METRES; break;
			case Parser.UNT_YARDS: out = originalValue * Parser.metric.YARDS_TO_METRES; break;
			case Parser.UNT_MILES: out = originalValue * Parser.metric.MILES_TO_KILOMETRES; break;
			case Parser.UNT_LBS: out = originalValue * Parser.metric.POUNDS_TO_KILOGRAMS; break;
			case Parser.UNT_CUBIC_FEET: out = originalValue * Parser.metric.CUBIC_FEET_TO_LITRES; break;
			default: return originalValue;
		}
		if (toFixed != null) return NumberUtil.toFixedNumber(out, toFixed);
		return out;
	}

	/**
	 * @param {number} originalValue
	 * @param {boolean} isShortForm
	 * @param {isPlural} isShortForm
	 */
	static getMetricUnit ({originalUnit, isShortForm = false, isPlural = true}) {
		switch (Parser.getNormalizedUnit(originalUnit)) {
			case Parser.UNT_INCHES: return isShortForm ? "cm" : `centimeter`[isPlural ? "toPlural" : "toString"]();
			case Parser.UNT_FEET: return isShortForm ? "m" : `meter`[isPlural ? "toPlural" : "toString"]();
			case Parser.UNT_YARDS: return isShortForm ? "m" : `meter`[isPlural ? "toPlural" : "toString"]();
			case Parser.UNT_MILES: return isShortForm ? "km" : `kilometer`[isPlural ? "toPlural" : "toString"]();
			case Parser.UNT_LBS: return isShortForm ? "kg" : `kilogram`[isPlural ? "toPlural" : "toString"]();
			case Parser.UNT_CUBIC_FEET: return isShortForm ? "L" : `liter`[isPlural ? "toPlural" : "toString"]();
			default: return originalUnit;
		}
	}

	static _MM_PER_INCHES = 25.4;

	// Display to the nearest 0.5 in.
	static getApproxDisplayInches (distMm) {
		return Math.round((distMm / this._MM_PER_INCHES) * 2) / 2;
	}
};
// endregion
// region Map grids

Parser.MAP_GRID_TYPE_TO_FULL = {};
Parser.MAP_GRID_TYPE_TO_FULL["none"] = "None";
Parser.MAP_GRID_TYPE_TO_FULL["square"] = "Square";
Parser.MAP_GRID_TYPE_TO_FULL["hexRowsOdd"] = "Hex Rows (Odd)";
Parser.MAP_GRID_TYPE_TO_FULL["hexRowsEven"] = "Hex Rows (Even)";
Parser.MAP_GRID_TYPE_TO_FULL["hexColsOdd"] = "Hex Columns (Odd)";
Parser.MAP_GRID_TYPE_TO_FULL["hexColsEven"] = "Hex Columns (Even)";

Parser.mapGridTypeToFull = function (gridType) {
	return Parser._parse_aToB(Parser.MAP_GRID_TYPE_TO_FULL, gridType);
};
// endregion
