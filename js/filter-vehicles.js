"use strict";

class PageFilterVehicles extends PageFilterBase {
	constructor () {
		super();

		this._vehicleTypeFilter = new Filter({
			header: "Vehicle Type",
			items: [],
			displayFn: Parser.vehicleTypeToFull,
			isSortByDisplayItems: true,
		});
		this._upgradeTypeFilter = new Filter({
			header: "Upgrade Type",
			items: [],
			displayFn: Parser.vehicleTypeToFull,
			isSortByDisplayItems: true,
		});
		this._terrainFilter = new Filter({header: "Terrain", items: ["land", "sea", "air"], displayFn: StrUtil.uppercaseFirst});
		this._speedFilter = new RangeFilter({header: "Speed"});
		this._armourFilter = new RangeFilter({header: "Armour"});
		this._willFilter = new RangeFilter({header: "Will"});
		this._reflexFilter = new RangeFilter({header: "Reflex"});
		this._fortitudeFilter = new RangeFilter({header: "Fortitude"});
		this._defencesFilter = new MultiFilter({
			header: "Defences",
			filters: [this._armourFilter, this._willFilter, this._reflexFilter, this._fortitudeFilter],
		});
		this._hpFilter = new RangeFilter({header: "Hit Points"});
		this._creatureCapacityFilter = new RangeFilter({header: "Creature Capacity"});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Has Images", "Has Info", "Has Token"],
			isMiscFilter: true,
			deselFn: PageFilterBase.defaultMiscellaneousDeselFn.bind(PageFilterBase),
		});
	}

	static mutateForFilters (ent) {
		ent._fSpeed = 0;
		if (typeof ent.speed === "number" && ent.speed > 0) {
			ent._fSpeed = ent.speed;
		} else if (ent.speed) {
			const maxSpeed = Math.max(...Object.values(ent.speed));
			if (maxSpeed > 0) ent._fSpeed = maxSpeed;
		} else if (ent.pace && typeof ent.pace === "number") {
			ent._fSpeed = ent.pace * 10; // Based on "Special Travel Pace," DMG p242
		}

		ent._fHp = 0;
		if (ent.hp && ent.hp.hp != null) {
			ent._fHp = ent.hp.hp;
		} else if (ent.hull && ent.hull.hp != null) {
			ent._fHp = ent.hull.hp;
		} else if (ent.hp && ent.hp.average != null) {
			ent._fHp = ent.hp.average;
		}

		const _fDef = (src, key) => { const vals = ((src && src[key]) || []).map(it => it.special ? null : (it[key] != null ? it[key] : it)).filter(it => it !== null); return vals.length ? vals : null; };
		const defSrc = Renderer.vehicle.hasDefences(ent) ? ent : ent.hull;
		ent._fArm = _fDef(defSrc, "arm");
		ent._fWil = _fDef(defSrc, "wil");
		ent._fRef = _fDef(defSrc, "ref");
		ent._fFort = _fDef(defSrc, "fort");

		ent._fCreatureCapacity = (ent.capCrew || 0) + (ent.capPassenger || 0) + (ent.capCreature || 0);

		this._mutateForFilters_commonMisc(ent);
		if (Renderer.vehicle.hasToken(ent)) ent._fMisc.push("Has Token");
	}

	addToFilters (it, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(it.source);
		this._vehicleTypeFilter.addItem(it.vehicleType);
		this._upgradeTypeFilter.addItem(it.upgradeType);
		this._speedFilter.addItem(it._fSpeed);
		this._terrainFilter.addItem(it.terrain);
		(it._fArm || []).forEach(v => this._armourFilter.addItem(v));
		(it._fWil || []).forEach(v => this._willFilter.addItem(v));
		(it._fRef || []).forEach(v => this._reflexFilter.addItem(v));
		(it._fFort || []).forEach(v => this._fortitudeFilter.addItem(v));
		this._hpFilter.addItem(it._fHp);
		this._creatureCapacityFilter.addItem(it._fCreatureCapacity);
		this._miscFilter.addItem(it._fMisc);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._vehicleTypeFilter,
			this._upgradeTypeFilter,
			this._terrainFilter,
			this._speedFilter,
			this._defencesFilter,
			this._hpFilter,
			this._creatureCapacityFilter,
			this._miscFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it.source,
			it.vehicleType,
			it.upgradeType,
			it.terrain,
			it._fSpeed,
			[it._fArm, it._fWil, it._fRef, it._fFort],
			it._fHp,
			it._fCreatureCapacity,
			it._fMisc,
		);
	}
}

globalThis.PageFilterVehicles = PageFilterVehicles;

class ListSyntaxVehicles extends ListUiUtil.ListSyntax {
	static _INDEXABLE_PROPS_ENTRIES = [
		"control",
		"movement",
		"weapon",
		"other",
		"entries",

		"actionStation",

		"action",
		"trait",
		"reaction",
	];
}

globalThis.ListSyntaxVehicles = ListSyntaxVehicles;
