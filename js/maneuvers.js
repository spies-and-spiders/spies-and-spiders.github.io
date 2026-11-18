class ManeuversSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "ve-bold ve-col-3-7 ve-pl-0 ve-pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Degree",
				css: "ve-col-2 ve-px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Pts.",
				css: "ve-col-1 ve-px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Time",
				css: "ve-col-1-8 ve-px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Tradition",
				css: "ve-col-3-5 ve-pl-1 ve-pr-0",
				colStyle: "",
			}),
		];
	}

	pGetSublistItem (ent, hash) {
		const degree = Parser.maneuverDegreeToFull(ent.degree);
		const time = PageFilterManeuvers.getTblTimeStr(ent.time[0]);
		const tradition = (ent.traditions || []).join(", ") || "—";

		const cellsText = [
			ent.name,
			degree,
			ent.points ?? 0,
			time,
			tradition,
		];

		const ele = veT`<div class="ve-lst__row ve-lst__row--sublist ve-flex-col">
			<a href="#${UrlUtil.autoEncodeHash(ent)}" title="${ent.name}" class="ve-lst__row-border ve-lst__row-inner">
				${this.constructor._getRowCellsHtml({values: cellsText})}
			</a>
		</div>`
			.vee.onn("contextmenu", evt => this._handleSublistItemContextMenu(evt, listItem))
			.vee.onn("click", evt => this._listSub.doSelect(listItem, evt));

		const listItem = new ListItem({
			id: hash,
			ele,
			name: ent.name,
			values: {
				...ListItem.getCommonValues(ent),
				degree: ent.degree,
				points: ent.points ?? 0,
				time,
				tradition,
				normalisedTime: ent._normalisedTime,
				normalisedRange: ent._normalisedRange,
			},
			data: {
				hash,
				page: ent.page,
				entity: ent,
				mdRow: [...cellsText],
			},
		});
		return listItem;
	}
}

class ManeuverPageBookView extends ListPageBookView {
	static _BOOK_VIEW_MODE_K = "bookViewMode";

	constructor (opts) {
		super({
			pageTitle: "Maneuvers Book View",
			nameSingular: "maneuver",
			namePlural: "maneuvers",
			propMarkdown: "maneuver",
			...opts,
		});

		const lastOrder = StorageUtil.syncGetForPage(ManeuverPageBookView._BOOK_VIEW_MODE_K);
		this._bookViewLastOrder = `${lastOrder ?? 0}`;
	}

	_getSorted (a, b) {
		return (this._bookViewLastOrder === "0" ? SortUtil.ascSort(a.degree, b.degree) : 0)
			|| SortUtil.ascSortLower(a.name, b.name);
	}

	async _pGetWrpControls ({wrpContent}) {
		const out = await super._pGetWrpControls({wrpContent});

		const {wrpPrint} = out;

		const onChangeSortMode = async () => {
			const val = selSortMode.vee.val();
			this._bookViewLastOrder = val;
			await this._pGetRenderContentMeta({wrpContent});

			StorageUtil.syncSetForPage(ManeuverPageBookView._BOOK_VIEW_MODE_K, val);
		};

		const selSortMode = veT`<select class="ve-form-control ve-input-xs">
			<option value="0">Degree</option>
			<option value="1">Alphabetical</option>
		</select>`
			.vee.onn("change", () => onChangeSortMode());

		selSortMode.vee.val(`${this._bookViewLastOrder ?? 0}`);
		veT`<label class="ve-flex-vh-center ve-ml-3"><span class="ve-mr-2 ve-no-wrap">Sort Order:</span>${selSortMode}</label>`.vee.appendTo(wrpPrint);

		return out;
	}

	_pGetRenderContentMeta_getRenderedEntries ({entityMetas, cntEntsPinned}) {
		if (!cntEntsPinned && entityMetas.length) {
			return [
				`<div class="ve-w-100 ve-h-100 ve-no-breaks">`,
				this._getRenderedEnt(entityMetas[0].entity),
				`</div>`,
			]
				.join("");
		}

		if (this._bookViewLastOrder === "1") {
			return entityMetas
				.map(({entity}) => this._getRenderedEnt(entity))
				.join("");
		}

		if (this._bookViewLastOrder === "0") {
			return Array.from({length: 6})
				.map((_, i) => {
					const atDegree = entityMetas.filter(({entity}) => entity.degree === i);
					if (!atDegree.length) return null;

					return [
						`<div class="bkmv__no-breaks"><div class="bkmv__spacer-name ve-flex-v-center ve-no-shrink ve-print__hidden ve-pl-2">${Parser.maneuverDegreeToFull(i)}</div>`,
						...atDegree.map(({entity}) => this._getRenderedEnt(entity)),
						`</div>`,
					];
				})
				.filter(Boolean)
				.flat()
				.join("");
		}

		throw new Error(`Unhandled maneuver sort mode "${this._bookViewLastOrder}"`);
	}

	async _pGetRenderContentMeta ({wrpContent}) {
		wrpContent.vee.addClass("ve-p-2");

		const {entityMetas, cntEntsPinned} = this._getRenderableContentMeta();
		const ptEntries = this._pGetRenderContentMeta_getRenderedEntries({entityMetas, cntEntsPinned});

		wrpContent.vee.empty();
		if (ptEntries.length) wrpContent.vee.appends(ptEntries);

		return {
			cntSelectedEnts: cntEntsPinned,
			isAnyEntityRendered: !!ptEntries.length,
		};
	}
}

class ManeuversPage extends ListPageMultiSource {
	constructor () {
		super({
			pageFilter: new PageFilterManeuvers({
				sourceFilterOpts: {
					pFnOnChange: (...args) => this._pLoadSource(...args),
				},
			}),

			listOptions: {
				fnSort: PageFilterManeuvers.sortManeuvers,
			},

			dataProps: ["maneuver"],

			bookViewOptions: {
				ClsBookView: ManeuverPageBookView,
			},

			tableViewOptions: {
				title: "Maneuvers",
				colTransforms: {
					name: UtilsTableview.COL_TRANSFORM_NAME,
					source: UtilsTableview.COL_TRANSFORM_SOURCE,
					page: UtilsTableview.COL_TRANSFORM_PAGE,
					degree: {name: "Degree", transform: (it) => Parser.maneuverDegreeToFull(it)},
					_traditions: {name: "Tradition", transform: (ent) => (ent.traditions || []).join(", ")},
					points: {name: "Points", transform: (it) => `${it ?? 0}`},
					time: {name: "Action Type", transform: (it) => PageFilterManeuvers.getTblTimeStr(it[0])},
					range: {name: "Range", transform: (it) => Parser.spRangeToFull(it)},
					duration: {name: "Duration", transform: (it) => Parser.spDurationToFull(it)},
					_prerequisites: {name: "Prerequisites", transform: (ent) => (ent.prerequisites || []).join(", ")},
					entries: {name: "Text", transform: (it) => Renderer.get().render({type: "entries", entries: it}, 1), flex: 3},
				},
			},

			propLoader: "maneuver",

			listSyntax: new ListSyntaxManeuvers({fnGetDataList: () => this._dataList}),
		});
	}

	get _bindOtherButtonsOptions () {
		return {
			other: [
				this._bindOtherButtonsOptions_openAsSinglePage({slugPage: "maneuvers", fnGetHash: () => Hist.getHashParts()[0]}),
			].filter(Boolean),
		};
	}

	getListItem (ent, anI) {
		const hash = UrlUtil.autoEncodeHash(ent);
		if (this._seenHashes.has(hash)) return null;
		this._seenHashes.add(hash);

		const isExcluded = ExcludeUtil.isExcluded(hash, "maneuver", ent.source);

		this._pageFilter.mutateAndAddToFilters(ent, isExcluded);

		const source = Parser.sourceJsonToAbv(ent.source);
		const degree = Parser.maneuverDegreeToFull(ent.degree);
		const time = PageFilterManeuvers.getTblTimeStr(ent.time[0]);
		const tradition = (ent.traditions || []).join(", ") || "—";
		const range = Parser.spRangeToFull(ent.range);

		const eleLi = veE({
			tag: "div",
			clazz: `ve-lst__row ve-flex-col ${isExcluded ? "ve-lst__row--blocklisted" : ""}`,
			click: (evt) => this._list.doSelect(listItem, evt),
			contextmenu: (evt) => this._openContextMenu(evt, this._list, listItem),
			html: `<a href="#${hash.qq()}" class="ve-lst__row-border ve-lst__row-inner">
				<span class="ve-bold ve-col-2-7 ve-pl-0 ve-pr-1">${ent.name.qq()}</span>
				<span class="ve-col-1-3 ve-px-1 ve-text-center">${degree.qq()}</span>
				<span class="ve-col-0-8 ve-px-1 ve-text-center">${`${ent.points ?? 0}`.qq()}</span>
				<span class="ve-col-1-5 ve-px-1 ve-text-center">${time.qq()}</span>
				<span class="ve-col-2-2 ve-px-1">${tradition.qq()}</span>
				<span class="ve-col-1-5 ve-px-1 ve-text-right">${range.qq()}</span>
				<span class="ve-col-1-7 ve-text-center ${Parser.sourceJsonToSourceClassname(ent.source).qq()} ve-pl-1 ve-pr-0" title="${`${Parser.sourceJsonToFull(ent.source)}${Renderer.utils.getSourceSubText(ent)}`.qq()}">${source.qq()}</span>
			</a>`,
		});

		const listItem = new ListItem({
			id: anI,
			ele: eleLi,
			name: ent.name,
			values: {
				source,
				...ListItem.getCommonValues(ent),
				degree: ent.degree,
				points: ent.points ?? 0,
				time,
				tradition,
				normalisedTime: ent._normalisedTime,
				normalisedRange: ent._normalisedRange,
			},
			data: {
				hash,
				page: ent.page,
				isExcluded,
			},
		});

		return listItem;
	}

	_tabTitleStats = "Maneuver";

	_renderStats_doBuildStatsTab ({ent}) {
		this._pgContent.vee.empty().vee.appends(`
			${Renderer.utils.getBorderTr()}
			${Renderer.maneuver.getCompactRenderedString(ent)}
			${Renderer.utils.getBorderTr()}
		`);
	}
}

const maneuversPage = new ManeuversPage();
maneuversPage.sublistManager = new ManeuversSublistManager();
window.addEventListener("load", () => maneuversPage.pOnLoad());

globalThis.dbg_page = maneuversPage;
