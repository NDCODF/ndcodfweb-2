/* -*- js-indent-level: 8 -*- */
/* global errorMessages getParameterByName accessToken accessTokenTTL accessHeader vex host */
/* global serviceRoot idleTimeoutSecs outOfFocusTimeoutSecs setupToolbar*/
/*eslint indent: [error, "tab", { "outerIIFEBody": 0 }]*/
(function (global) {

var wopiParams;
var wopiSrc = getParameterByName('WOPISrc');

if (wopiSrc !== '' && accessToken !== '') {
	wopiParams = { 'access_token': accessToken, 'access_token_ttl': accessTokenTTL };
}
else if (wopiSrc !== '' && accessHeader !== '') {
	wopiParams = { 'access_header': accessHeader };
}

var filePath = getParameterByName('file_path');
var permission = getParameterByName('permission') || 'edit';
var timestamp = getParameterByName('timestamp');
// Shows close button if non-zero value provided
var closebutton = getParameterByName('closebutton');
// Shows revision history file menu option
var revHistoryEnabled = getParameterByName('revisionhistory');
// Should the document go inactive or not
var alwaysActive = getParameterByName('alwaysactive');
// Loleaflet Debug mode
var debugMode = getParameterByName('debug');
if (wopiSrc === '' && filePath === '' && !window.ThisIsAMobileApp) {
	vex.dialog.alert(errorMessages.wrongwopisrc);
}
if (host === '' && !window.ThisIsAMobileApp) {
	vex.dialog.alert(errorMessages.emptyhosturl);
}
var brandProductName = 'NDC ODF Web';
global.brandProductName = brandProductName;
global.brandProductFAQURL = 'https://www.ossii.com.tw/';
// loleaflet.js accesses these globals
// TODO: Get rid of these globals
global.closebutton = closebutton;
global.revHistoryEnabled = revHistoryEnabled;
var docURL, docParams;
var isWopi = false;
if (wopiSrc != '') {
	docURL = decodeURIComponent(wopiSrc);
	docParams = wopiParams;
	isWopi = true;
} else {
	docURL = filePath;
	docParams = {};
}

var notWopiButIframe = getParameterByName('NotWOPIButIframe') != '';

var map = L.map('map', {
	server: host,
	doc: docURL,
	serviceRoot: serviceRoot,
	docParams: docParams,
	permission: permission,
	timestamp: timestamp,
	documentContainer: 'document-container',
	debug: debugMode,
	// the wopi and wopiSrc properties are in sync: false/true : empty/non-empty
	wopi: isWopi,
	wopiSrc: wopiSrc,
	notWopiButIframe: notWopiButIframe,
	alwaysActive: alwaysActive,
	idleTimeoutSecs: idleTimeoutSecs,  // Dim when user is idle.
	outOfFocusTimeoutSecs: outOfFocusTimeoutSecs, // Dim after switching tabs.
	timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	timezoneOffset: new Date().getTimezoneOffset()
});

////// Controls /////
var menubar = L.control.menubar();
map.menubar = menubar;
map.addControl(menubar);
setupToolbar(map);
map.addControl(L.control.dialogs());
map.addControl(L.control.scroll());
map.addControl(L.control.alertDialog());
map.addControl(L.control.lokDialog());
map.addControl(L.control.partsPreview());
map.addControl(L.control.tabs());
map.addControl(L.control.columnHeader());
map.addControl(L.control.rowHeader());
map.addControl(L.control.contextMenu());
map.addControl(L.control.infobar());
map.loadDocument();
window.__map = map;
window.addEventListener('beforeunload', function () {
	if (map && map._socket) {
		map.forceCellCommit();
		map._socket.close();
	}
}, true);

if (!L.Browser.mobile) {
	L.DomEvent.on(document, 'contextmenu', L.DomEvent.preventDefault);
}

}(window));
