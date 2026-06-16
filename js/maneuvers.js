class ManeuversSublistManager extends SublistManager {
	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "bold ve-col-3-7 pl-0 pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Degree",
				css: "ve-col-2 px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Pts.",
				css: "ve-col-1 px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Time",
				css: "ve-col-1-8 px-1 ve-text-center",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Tradition",
				css: "ve-col-3-5 pl-1 pr-0",
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

		const $ele = $(`<div class="lst__row lst__row--sublist ve-flex-col">
			<a href="#${UrlUtil.autoEncodeHash(ent)}" title="${ent.name}" class="lst__row-border lst__row-inner">
				${this.constructor._getRowCellsHtml({values: cellsText})}
			</a>
		</div>`)
			.contextmenu(evt => this._handleSublistItemContextMenu(evt, listItem))
			.click(evt => this._listSub.doSelect(listItem, evt));

		const listItem = new ListItem(
			hash,
			$ele,
			ent.name,
			{
				hash,
				degree: ent.degree,
				points: ent.points ?? 0,
				time,
				tradition,
				normalisedTime: ent._normalisedTime,
				normalisedRange: ent._normalisedRange,
			},
			{
				entity: ent,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class ManeuverPageBookView extends ListPageBookView {
	static _BOOK_VIEW_MODE_K = "bookViewMode";

	constructor (opts) {
		super({
			pageTitle: "Maneuvers Book View",
			namePlural: "maneuvers",
			propMarkdown: "maneuver",
			...opts,
		});

		this._bookViewLastOrder = null;
		this._$wrpContent = null;
	}

	async _$pGetWrpControls ({$wrpContent}) {
		const out = await super._$pGetWrpControls({$wrpContent});

		const {$wrpPrint} = out;

		this._bookViewLastOrder = StorageUtil.syncGetForPage(ManeuverPageBookView._BOOK_VIEW_MODE_K);
		if (this._bookViewLastOrder != null) this._bookViewLastOrder = `${this._bookViewLastOrder}`;

		const $selSortMode = $(`<select class="form-control input-sm">
			<option value="0">Degree</option>
			<option value="1">Alphabetical</option>
		</select>`)
			.change(() => {
				if (!this._bookViewToShow.length && Hist.lastLoadedId != null) return;

				const val = $selSortMode.val();
				if (val === "0") this._renderByDegree();
				else this._renderByAlpha();

				StorageUtil.syncSetForPage(ManeuverPageBookView._BOOK_VIEW_MODE_K, val);
			});
		if (this._bookViewLastOrder != null) $selSortMode.val(this._bookViewLastOrder);
		$$`<div class="ve-flex-vh-center ml-3"><div class="mr-2 no-wrap">Sort order:</div>${$selSortMode}</div>`.appendTo($wrpPrint);

		return out;
	}

	_renderManeuver ({stack, ent}) {
		stack.push(`<div class="bkmv__wrp-item ve-inline-block print__ve-block print__my-2"><table class="w-100 stats stats--book stats--bkmv"><tbody>`);
		stack.push(Renderer.maneuver.getCompactRenderedString(ent));
		stack.push(`</tbody></table></div>`);
	}

	_renderByDegree () {
		let isAnyEntityRendered = false;
		const stack = [];
		for (let i = 0; i <= 5; ++i) {
			const atDegree = this._bookViewToShow.filter(ent => ent.degree === i);
			if (atDegree.length) {
				stack.push(`<div class="bkmv__no-breaks">`);
				stack.push(`<div class="bkmv__spacer-name ve-flex-v-center no-shrink no-print pl-2">${Parser.maneuverDegreeToFull(i)}</div>`);
				atDegree.forEach(ent => this._renderManeuver({stack, ent}));
				isAnyEntityRendered = true;
				stack.push(`</div>`);
			}
		}
		this._$wrpContent.empty().append(stack.join(""));
		this._bookViewLastOrder = "0";
		return {isAnyEntityRendered};
	}

	_renderByAlpha () {
		const stack = [];
		this._bookViewToShow.forEach(ent => this._renderManeuver({stack, ent}));
		this._$wrpContent.empty().append(stack.join(""));
		this._bookViewLastOrder = "1";
		return {isAnyEntityRendered: !!this._bookViewToShow.length};
	}

	_renderNoneSelected () {
		const stack = [];
		stack.push(`<div class="w-100 h-100 no-breaks">`);
		this._renderManeuver({stack, ent: this._fnGetEntLastLoaded()});
		stack.push(`</div>`);
		this._$wrpContent.empty().append(stack.join(""));
		return {isAnyEntityRendered: false};
	}

	_renderManeuvers () {
		if (!this._bookViewToShow.length && Hist.lastLoadedId != null) return this._renderNoneSelected();
		else if (this._bookViewLastOrder === "1") return this._renderByAlpha();
		else return this._renderByDegree();
	}

	async _pGetRenderContentMeta ({$wrpContent, $wrpControls}) {
		this._$wrpContent = $wrpContent;
		$wrpContent.addClass("p-2");

		this._bookViewToShow = this._sublistManager.getSublistedEntities()
			.sort((a, b) => SortUtil.ascSortLower(a.name, b.name));

		const {isAnyEntityRendered} = this._renderManeuvers();

		return {
			cntSelectedEnts: this._bookViewToShow.length,
			isAnyEntityRendered,
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

		const eleLi = e_({
			tag: "div",
			clazz: `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`,
			click: (evt) => this._list.doSelect(listItem, evt),
			contextmenu: (evt) => this._openContextMenu(evt, this._list, listItem),
			children: [
				e_({
					tag: "a",
					href: `#${hash}`,
					clazz: "lst__row-border lst__row-inner",
					children: [
						e_({tag: "span", clazz: `bold ve-col-2-7 pl-0 pr-1`, text: ent.name}),
						e_({tag: "span", clazz: `ve-col-1-3 px-1 ve-text-center`, text: degree}),
						e_({tag: "span", clazz: `ve-col-0-8 px-1 ve-text-center`, text: `${ent.points ?? 0}`}),
						e_({tag: "span", clazz: `ve-col-1-5 px-1 ve-text-center`, text: time}),
						e_({tag: "span", clazz: `ve-col-2-2 px-1`, text: tradition}),
						e_({tag: "span", clazz: `ve-col-1-5 px-1 ve-text-right`, text: range}),
						e_({
							tag: "span",
							clazz: `ve-col-1-7 ve-text-center ${Parser.sourceJsonToSourceClassname(ent.source)} pl-1 pr-0`,
							style: Parser.sourceJsonToStylePart(ent.source),
							title: `${Parser.sourceJsonToFull(ent.source)}${Renderer.utils.getSourceSubText(ent)}`,
							text: source,
						}),
					],
				}),
			],
		});

		const listItem = new ListItem(
			anI,
			eleLi,
			ent.name,
			{
				hash,
				source,
				degree: ent.degree,
				points: ent.points ?? 0,
				time,
				tradition,
				normalisedTime: ent._normalisedTime,
				normalisedRange: ent._normalisedRange,
			},
			{
				isExcluded,
			},
		);

		return listItem;
	}

	_tabTitleStats = "Maneuver";

	_renderStats_doBuildStatsTab ({ent}) {
		this._$pgContent.empty().append(`
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
