import {ConverterUi} from "./converter/converter-ui.js";
import {CreatureConverterUi} from "./converter/converter-ui-creature.js";
import {ItemConverterUi} from "./converter/converter-ui-item.js";
import {FeatConverterUi} from "./converter/converter-ui-feat.js";
import {BackgroundConverterUi} from "./converter/converter-ui-background.js";
import {SpellConverterUi} from "./converter/converter-ui-spell.js";
import {TableConverterUi} from "./converter/converter-ui-table.js";
import {EntryConverterUi} from "./converter/converter-ui-entries.js";
import {AttachedItemTag, MiscTag, SpellcastingTraitConvert} from "./converter/converterutils-creature.js";
import {ConverterItem} from "./converter/converter-item.js";
import {TagCondition, TaggerUtils} from "./converter/converterutils-tags.js";
import {TagJsons} from "./converter/converterutils-entries.js";
import {InstrumentBaseItemTag} from "./converter/converterutils-item.js";

const doPageInit = async () => {
	await Promise.all([
		PrereleaseUtil.pInit(),
		BrewUtil2.pInit(),
	]);
	ExcludeUtil.pInitialise().then(null); // don't await, as this is only used for search
	const [spells, items, legendaryGroups, classes, brew, converterData] = await Promise.all([
		DataUtil.spell.pLoadAll(),
		Renderer.item.pBuildList(),
		DataUtil.legendaryGroup.pLoadAll(),
		DataUtil.class.loadJSON(),
		BrewUtil2.pGetBrewProcessed(), // init homebrew
		DataUtil.loadJSON(`${Renderer.get().baseUrl}data/converter.json`),
	]);
	const itemsNoGroups = items.filter(it => !it._isItemGroup);
	SpellcastingTraitConvert.init(spells);
	ConverterItem.init(itemsNoGroups, classes);
	TaggerUtils.init({legendaryGroups, spells});
	await TagJsons.pInit({spells});
	MiscTag.init({items});
	AttachedItemTag.init({items});
	await TagCondition.pInit({conditionsBrew: brew.condition});
	InstrumentBaseItemTag.init({items: itemsNoGroups});

	const ui = new ConverterUi();

	const creatureConverter = new CreatureConverterUi({ui, converterData});
	const itemConverter = new ItemConverterUi({ui, converterData});
	const featConverter = new FeatConverterUi({ui, converterData});
	const backgroundConverter = new BackgroundConverterUi({ui, converterData});
	const spellConverter = new SpellConverterUi({ui, converterData});
	const tableConverter = new TableConverterUi({ui, converterData});
	const entryConverter = new EntryConverterUi({ui, converterData});

	ui.converters = {
		[creatureConverter.converterId]: creatureConverter,
		[spellConverter.converterId]: spellConverter,
		[itemConverter.converterId]: itemConverter,
		[backgroundConverter.converterId]: backgroundConverter,
		[featConverter.converterId]: featConverter,
		[tableConverter.converterId]: tableConverter,
		[entryConverter.converterId]: entryConverter,
	};

	return ui.pInit();
};

window.addEventListener("load", () => doPageInit());
