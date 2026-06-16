"use strict";

class PageFilterManeuvers extends PageFilterBase {
	static F_RNG_POINT = "Point";
	static F_RNG_SELF_AREA = "Self (Area)";
	static F_RNG_SELF = "Self";
	static F_RNG_TOUCH = "Touch";
	static F_RNG_SPECIAL = "Special";

	static _PREREQ = "Has Prerequisite";

	static INCHES_PER_FOOT = 12;
	static FEET_PER_YARD = 3;
	static FEET_PER_MILE = 5280;

	// region static
	static sortManeuvers (a, b, o) {
		switch (o.sortBy) {
			case "name": return SortUtil.compareListNames(a, b);
			case "tradition":
			case "source":
			case "degree":
			case "points": return SortUtil.ascSort(a.values[o.sortBy], b.values[o.sortBy]) || SortUtil.compareListNames(a, b);
			case "time": return SortUtil.ascSort(a.values.normalisedTime, b.values.normalisedTime) || SortUtil.compareListNames(a, b);
			case "range": return SortUtil.ascSort(a.values.normalisedRange, b.values.normalisedRange) || SortUtil.compareListNames(a, b);
		}
	}

	static getFilterDefence (def) { return def.uppercaseFirst(); }

	static getFilterDuration (ent) {
		const fDur = ent.duration[0] || {type: "special"};
		switch (fDur.type) {
			case "instant": return "Instant";
			case "timed": {
				if (!fDur.duration) return "Special";
				switch (fDur.duration.type) {
					case "turn":
					case "round": return "1 Round";

					case "minute": {
						const amt = fDur.duration.amount || 0;
						if (amt <= 1) return "1 Minute";
						if (amt <= 10) return "10 Minutes";
						if (amt <= 60) return "1 Hour";
						if (amt <= 8 * 60) return "8 Hours";
						return "24+ Hours";
					}

					case "hour": {
						const amt = fDur.duration.amount || 0;
						if (amt <= 1) return "1 Hour";
						if (amt <= 8) return "8 Hours";
						return "24+ Hours";
					}

					case "day":
					case "week":
					case "month":
					case "year": return "24+ Hours";
					default: return "Special";
				}
			}
			case "permanent": return "Permanent";
			case "sustained": return "Sustained";
			case "special":
			default: return "Special";
		}
	}

	static getNormalisedTime (time) {
		const firstTime = time[0];
		let multiplier = 1;
		let offset = 0;
		switch (firstTime.unit) {
			case Parser.SP_TM_B_ACTION: offset = 1; break;
			case Parser.SP_TM_REACTION: offset = 2; break;
			case Parser.SP_TM_ROUND: multiplier = 6; break;
			case Parser.SP_TM_MINS: multiplier = 60; break;
			case Parser.SP_TM_HRS: multiplier = 3600; break;
			case Parser.SP_TM_SPECIAL: multiplier = 1_000_000; break;
		}
		if (time.length > 1) offset += 0.5;
		return (multiplier * firstTime.number) + offset;
	}

	static getNormalisedRange (range) {
		const state = {multiplier: 1, distance: 0, offset: 0};

		switch (range.type) {
			case Parser.RNG_SPECIAL: return 1000000000;
			case Parser.RNG_POINT: this._getNormalisedRange_getAdjustedForDistance({range, state}); break;
			case Parser.RNG_LINE: state.offset = 1; this._getNormalisedRange_getAdjustedForDistance({range, state}); break;
			case Parser.RNG_CONE: state.offset = 2; this._getNormalisedRange_getAdjustedForDistance({range, state}); break;
			case Parser.RNG_EMANATION: state.offset = 3; this._getNormalisedRange_getAdjustedForDistance({range, state}); break;
			case Parser.RNG_RADIUS: state.offset = 4; this._getNormalisedRange_getAdjustedForDistance({range, state}); break;
			case Parser.RNG_HEMISPHERE: state.offset = 5; this._getNormalisedRange_getAdjustedForDistance({range, state}); break;
			case Parser.RNG_SPHERE: state.offset = 6; this._getNormalisedRange_getAdjustedForDistance({range, state}); break;
			case Parser.RNG_CYLINDER: state.offset = 7; this._getNormalisedRange_getAdjustedForDistance({range, state}); break;
			case Parser.RNG_CUBE: state.offset = 8; this._getNormalisedRange_getAdjustedForDistance({range, state}); break;
		}

		return (state.multiplier * state.distance) + state.offset;
	}

	static _getNormalisedRange_getAdjustedForDistance ({range, state}) {
		const dist = range.distance;
		switch (dist.type) {
			case Parser.UNT_FEET: state.multiplier = PageFilterManeuvers.INCHES_PER_FOOT; state.distance = dist.amount; break;
			case Parser.UNT_YARDS: state.multiplier = PageFilterManeuvers.INCHES_PER_FOOT * PageFilterManeuvers.FEET_PER_YARD; state.distance = dist.amount; break;
			case Parser.UNT_MILES: state.multiplier = PageFilterManeuvers.INCHES_PER_FOOT * PageFilterManeuvers.FEET_PER_MILE; state.distance = dist.amount; break;
			case Parser.RNG_SELF: state.distance = 0; break;
			case Parser.RNG_TOUCH: state.distance = 1; break;
			case Parser.RNG_SIGHT: state.multiplier = PageFilterManeuvers.INCHES_PER_FOOT * PageFilterManeuvers.FEET_PER_MILE; state.distance = 12; break;
			case Parser.RNG_UNLIMITED_SAME_PLANE: state.distance = 900000000; break;
			case Parser.RNG_UNLIMITED: state.distance = 900000001; break;
		}
	}

	static getRangeType (range) {
		switch (range.type) {
			case Parser.RNG_SPECIAL: return PageFilterManeuvers.F_RNG_SPECIAL;
			case Parser.RNG_POINT:
				switch (range.distance.type) {
					case Parser.RNG_SELF: return PageFilterManeuvers.F_RNG_SELF;
					case Parser.RNG_TOUCH: return PageFilterManeuvers.F_RNG_TOUCH;
					default: return PageFilterManeuvers.F_RNG_POINT;
				}
			case Parser.RNG_LINE:
			case Parser.RNG_CONE:
			case Parser.RNG_EMANATION:
			case Parser.RNG_RADIUS:
			case Parser.RNG_HEMISPHERE:
			case Parser.RNG_SPHERE:
			case Parser.RNG_CYLINDER:
			case Parser.RNG_CUBE:
				return PageFilterManeuvers.F_RNG_SELF_AREA;
		}
	}

	static getTblTimeStr (time) {
		return (time.number === 1 && Parser.SP_TIME_SINGLETONS.includes(time.unit))
			? `${time.unit.uppercaseFirst()}`
			: `${time.number ? `${time.number} ` : ""}${Parser.spTimeUnitToShort(time.unit).uppercaseFirst()}`;
	}

	static getTblDegreeStr (ent) { return Parser.maneuverDegreeToFull(ent.degree); }
	// endregion

	constructor (opts) {
		super(opts);

		this._degreeFilter = new Filter({
			header: "Degree",
			items: [0, 1, 2, 3, 4, 5],
			displayFn: (degree) => Parser.maneuverDegreeToFull(degree),
		});
		this._traditionFilter = new Filter({
			header: "Tradition",
			items: [],
			displayFn: StrUtil.toTitleCase,
		});
		this._pointsFilter = new RangeFilter({
			header: "Points",
			min: 0,
			max: 5,
		});
		this._prerequisiteFilter = new Filter({
			header: "Prerequisite",
			items: [PageFilterManeuvers._PREREQ],
		});
		this._damageFilter = new Filter({
			header: "Damage Type",
			items: MiscUtil.copy(Parser.DMG_TYPES),
			displayFn: StrUtil.uppercaseFirst,
		});
		this._conditionFilter = new Filter({
			header: "Conditions Inflicted",
			items: [...Parser.CONDITIONS],
			displayFn: uid => uid.split("|")[0].toTitleCase(),
		});
		this._defenceFilter = new Filter({
			header: "Defences Targeted",
			items: ["armour", "reflex", "fortitude", "will"],
			displayFn: PageFilterManeuvers.getFilterDefence,
			itemSortFn: null,
		});
		this._timeFilter = new Filter({
			header: "Action Type",
			items: [
				Parser.SP_TM_ACTION,
				Parser.SP_TM_B_ACTION,
				Parser.SP_TM_REACTION,
				Parser.SP_TM_ROUND,
				Parser.SP_TM_MINS,
				Parser.SP_TM_HRS,
				Parser.SP_TM_SPECIAL,
			],
			displayFn: Parser.spTimeUnitToFull,
			itemSortFn: null,
		});
		this._durationFilter = new RangeFilter({
			header: "Duration",
			isLabelled: true,
			labelSortFn: null,
			labels: ["Instant", "1 Round", "1 Minute", "10 Minutes", "1 Hour", "8 Hours", "24+ Hours", "Permanent", "Sustained", "Special"],
		});
		this._rangeFilter = new Filter({
			header: "Range",
			items: [
				PageFilterManeuvers.F_RNG_SELF,
				PageFilterManeuvers.F_RNG_TOUCH,
				PageFilterManeuvers.F_RNG_POINT,
				PageFilterManeuvers.F_RNG_SELF_AREA,
				PageFilterManeuvers.F_RNG_SPECIAL,
			],
			itemSortFn: null,
		});
	}

	static mutateForFilters (ent) {
		// used for sorting
		ent._normalisedTime = PageFilterManeuvers.getNormalisedTime(ent.time);
		ent._normalisedRange = PageFilterManeuvers.getNormalisedRange(ent.range);

		// used for filtering
		ent._fSources = SourceFilter.getCompleteFilterSources(ent);
		ent._fTraditions = ent.traditions || [];
		ent._fTimeType = ent.time.map(t => t.unit);
		ent._fDurationType = PageFilterManeuvers.getFilterDuration(ent);
		ent._fRangeType = PageFilterManeuvers.getRangeType(ent.range);
		ent._fPrereq = ent.prerequisites?.length ? [PageFilterManeuvers._PREREQ] : [];
	}

	static unmutateForFilters (ent) {
		delete ent._normalisedTime;
		delete ent._normalisedRange;

		Object.keys(ent)
			.filter(it => it.startsWith("_f"))
			.forEach(it => delete ent[it]);
	}

	addToFilters (ent, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(ent._fSources);
		this._degreeFilter.addItem(ent.degree);
		this._traditionFilter.addItem(ent._fTraditions);
		this._pointsFilter.addItem(ent.points);
		this._conditionFilter.addItem(ent.conditionInflict);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._degreeFilter,
			this._traditionFilter,
			this._pointsFilter,
			this._prerequisiteFilter,
			this._damageFilter,
			this._conditionFilter,
			this._defenceFilter,
			this._timeFilter,
			this._durationFilter,
			this._rangeFilter,
		];
	}

	toDisplay (values, ent) {
		return this._filterBox.toDisplay(
			values,
			ent._fSources,
			ent.degree,
			ent._fTraditions,
			ent.points,
			ent._fPrereq,
			ent.damageInflict,
			ent.conditionInflict,
			ent.defence,
			ent._fTimeType,
			ent._fDurationType,
			ent._fRangeType,
		);
	}
}

globalThis.PageFilterManeuvers = PageFilterManeuvers;

class ListSyntaxManeuvers extends ListUiUtil.ListSyntax {
	static _INDEXABLE_PROPS_ENTRIES = [
		"entries",
	];
}

globalThis.ListSyntaxManeuvers = ListSyntaxManeuvers;
