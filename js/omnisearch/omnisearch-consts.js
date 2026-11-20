export class OmnisearchConsts {
	static BTN_META_BREW = {
		propOmnisearch: "isShowBrew",
		fnAddHookOmnisearch: "addHookBrew",
		fnDoToggleOmnisearch: "doToggleBrew",
		title: "Include Homebrew",
		text: "Homebrew",
	};
	static BTN_META_BLOCKLISTED = {
		propOmnisearch: "isShowBlocklisted",
		fnAddHookOmnisearch: "addHookBlocklisted",
		fnDoToggleOmnisearch: "doToggleBlocklisted",
		title: "Include blocklisted content results",
		text: "Blocklisted",
	};
	static BTN_META_SRD_ONLY = {
		propOmnisearch: "isSrdOnly",
		fnAddHookOmnisearch: "addHookSrdOnly",
		fnDoToggleOmnisearch: "doToggleSrdOnly",
		title: "Exclude non- Systems Reference Document results",
		text: "SRD",
	};
	static BTN_METAS = [
		this.BTN_META_BREW,
		this.BTN_META_BLOCKLISTED,
		this.BTN_META_SRD_ONLY,
	];
}
