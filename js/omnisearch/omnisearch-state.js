export class OmnisearchState extends BaseComponent {
	static _STORAGE_NAME = "search";

	static _DEFAULT_STATE = {
		isShowBrew: true,
		isShowBlocklisted: false,
		isSrdOnly: false,
	};

	static _COMP = null;

	static _getComp () {
		if (this._COMP) return this._COMP;

		this._COMP = new this();

		const saved = StorageUtil.syncGet(this._STORAGE_NAME) || {};
		Object.entries(this._DEFAULT_STATE)
			.forEach(([k, v]) => saved[k] ??= v);

		this._COMP._proxyAssignSimple("state", saved);

		this._COMP._addHookAll("state", () => {
			StorageUtil.syncSet(this._STORAGE_NAME, this._COMP.toObject());
		});

		return this._COMP;
	}

	static addHookBrew (hk) { return this._getComp()._addHookBase("isShowBrew", hk); }
	static addHookBlocklisted (hk) { return this._getComp()._addHookBase("isShowBlocklisted", hk); }
	static addHookSrdOnly (hk) { return this._getComp()._addHookBase("isSrdOnly", hk); }

	static doToggleBrew () { this._getComp()._state.isShowBrew = !this._getComp()._state.isShowBrew; }
	static doToggleBlocklisted () { this._getComp()._state.isShowBlocklisted = !this._getComp()._state.isShowBlocklisted; }
	static doToggleSrdOnly () { this._getComp()._state.isSrdOnly = !this._getComp()._state.isSrdOnly; }

	static get isShowBrew () { return this._getComp()._state.isShowBrew; }
	static get isShowBlocklisted () { return this._getComp()._state.isShowBlocklisted; }
	static get isSrdOnly () { return this._getComp()._state.isSrdOnly; }

	static set isShowBrew (val) { this._getComp()._state.isShowBrew = !!val; }
	static set isShowBlocklisted (val) { this._getComp()._state.isShowBlocklisted = !!val; }
	static set isSrdOnly (val) { this._getComp()._state.isSrdOnly = !!val; }
}
