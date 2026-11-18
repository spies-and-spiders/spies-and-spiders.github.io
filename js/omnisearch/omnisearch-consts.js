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

export const PARTNERED_CONTENT_MODE_ALL = "all";
export const PARTNERED_CONTENT_MODE_LOCAL = "local";
export const PARTNERED_CONTENT_MODE_NONE = "none";

export const PARTNERED_CONTENT_MODES = [
	PARTNERED_CONTENT_MODE_ALL,
	PARTNERED_CONTENT_MODE_LOCAL,
	PARTNERED_CONTENT_MODE_NONE,
];

export const PARTNERED_CONTENT_MODE_TOOLTIP = {
	[PARTNERED_CONTENT_MODE_NONE]: "Do Not Include Partnered Content",
	[PARTNERED_CONTENT_MODE_LOCAL]: "Include Locally-Loaded Partnered Content",
	[PARTNERED_CONTENT_MODE_ALL]: "Include All Partnered Content",
};

export const PARTNERED_CONTENT_MODE_TEXT = {
	[PARTNERED_CONTENT_MODE_ALL]: "Partnered (All)",
	[PARTNERED_CONTENT_MODE_LOCAL]: "Partnered (Local)",
	[PARTNERED_CONTENT_MODE_NONE]: "Partnered",
};
