import {PageGeneratorRedirectBase} from "./generate-pages-page-generator.js";

class _PageGeneratorSnsTools extends PageGeneratorRedirectBase {
	_page = "sns-tools.html";

	_pageDescription = "A suite of browser-based tools for Spies & Spiders players and DMs.";

	_redirectHref = "index.html";
	_redirectMessage = "the homepage";
}

export const PAGE_GENERATORS_REDIRECT = [
	new _PageGeneratorSnsTools(),
];
