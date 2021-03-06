/* -*- js-indent-level: 8 -*- */
/*
 * L.Control.Tabs is used to switch sheets in Calc
 */

/* global $ vex _ _UNO */
L.Control.Tabs = L.Control.extend({
	onAdd: function(map) {
		map.on('updatepermission', this._onUpdatePermission, this);
		this._initialized = false;
	},

	_onUpdatePermission: function(e) {
		if (this._map.getDocType() !== 'spreadsheet') {
			return;
		}

		if (!this._initialized) {
			this._initialize();
		}

		if (window.mode.isMobile() == true) {
			if (e.perm === 'edit') {
				$('.spreadsheet-tabs-container')
					.removeClass('mobile-view')
					.addClass('mobile-edit');
			} else {
				$('.spreadsheet-tabs-container')
					.addClass('mobile-view')
					.addClass('mobile-edit');
			}
		}
	},

	_initialize: function () {
		this._initialized = true;
		this._tabsInitialized = false;
		this._spreadsheetTabs = {};
		this._tabForContextMenu = 0;
		var map = this._map;
		var docContainer = map.options.documentContainer;
		this._tabsCont = L.DomUtil.create('div', 'spreadsheet-tabs-container', docContainer.parentElement);
		L.DomEvent.on(this._tabsCont, 'touchstart',
			function (e) {
				if (e && e.touches.length > 1) {
					L.DomEvent.preventDefault(e);
				}
			},
			this);

		map.on('updateparts', this._updateDisabled, this);
		map.on('resize', this._selectedTabScrollIntoView, this);

		L.installContextMenu({
			selector: '.spreadsheet-tab',
			className: 'loleaflet-font',
			autoHide: true,
			callback: (function(key) {
				if (key === 'InsertColumnsAfter') {
					map.insertPage(this._tabForContextMenu);
				}
				if (key === 'InsertColumnsBefore') {
					map.insertPage(this._tabForContextMenu + 1);
				}
			}).bind(this),
			items: {
				'InsertColumnsAfter': {
					name: _('Insert sheet before this'),
					icon: (function(opt, $itemElement, itemKey, item) {
						return this._map.contextMenuIcon($itemElement, itemKey, item);
					}).bind(this)
				},
				'InsertColumnsBefore': {
					name: _('Insert sheet after this'),
					icon: (function(opt, $itemElement, itemKey, item) {
						return this._map.contextMenuIcon($itemElement, itemKey, item);
					}).bind(this)
				},
				'DuplicatePage': {
					name: _UNO('.uno:Move', 'spreadsheet', true),
					callback: (function() {
						map.fire('executeDialog', {dialog: 'MoveTable'});
					}).bind(this),
					icon: (function(opt, $itemElement, itemKey, item) {
						return this._map.contextMenuIcon($itemElement, itemKey, item);
					}).bind(this)
				},
				'DeleteTable': {
					name: _UNO('.uno:Remove', 'spreadsheet', true),
					callback: (function(/*key, options*/) {
						map.fire('executeDialog', {dialog: 'RemoveTable'});
					}).bind(this),
					disabled: (function() {
						// ???????????????????????????
						return (map.getNumberOfVisibleParts() === 1);
					}).bind(this),
					icon: (function(opt, $itemElement, itemKey, item) {
						return this._map.contextMenuIcon($itemElement, itemKey, item);
					}).bind(this)
				 },
				'DBTableRename': {
					name: _UNO('.uno:RenameTable', 'spreadsheet', true),
					callback: (function(/*key, options*/) {
						map.fire('executeDialog', {dialog: 'RenameTable'});
					}).bind(this),
					icon: (function(opt, $itemElement, itemKey, item) {
						return this._map.contextMenuIcon($itemElement, itemKey, item);
					}).bind(this)
				} ,
				'sep01': '----',
				'Show': {
					name: _UNO('.uno:Show', 'spreadsheet', true),
					callback: (function() {
						map.fire('executeDialog', {dialog: 'ShowTable'});
					}).bind(this),
					disabled: (function() {
						// ????????????????????????????????????
						return !this._map.hasAnyHiddenPart();
					}).bind(this),
					icon: (function(opt, $itemElement, itemKey, item) {
						return this._map.contextMenuIcon($itemElement, itemKey, item);
					}).bind(this)
				},
				'Hide': {
					name: _UNO('.uno:Hide', 'spreadsheet', true),
					callback: (function() {
						map.hidePage();
					}).bind(this),
					disabled: (function() {
						// ?????????????????????
						return map.getNumberOfVisibleParts() === 1;
					}).bind(this),
					icon: (function(opt, $itemElement, itemKey, item) {
						return this._map.contextMenuIcon($itemElement, itemKey, item);
					}).bind(this)
				}
			},
			zIndex: 1000
		});
	},

	_showPage: function () {
		var map = this._map;
		if (!map.hasAnyHiddenPart()) {
			return;
		}
		var hiddenNames = map.getHiddenPartNames().split(',');
		var sels = '<div style="height:200px; overflow-y:auto; overflow-y:none; padding: 5px; border:1px #bbbbbb solid">';
		for (var i=0 ; i < hiddenNames.length ; i++) {
			sels += '<input type="checkbox" name="' + hiddenNames[i] + '" ' +
					'value="' + hiddenNames[i] + '">' + hiddenNames[i] + '<br>';
		}
		vex.dialog.open({
			message: _('Hidden Sheets'),
			input: sels,
			buttons: [
				$.extend({}, vex.dialog.buttons.YES, { text: _('OK') }),
				$.extend({}, vex.dialog.buttons.NO, { text: _('Cancel') })
			],
			callback: function(data) {
				for (var sheet in data) {
					map.showPage(sheet);
				}
			}
		});
	},

	_movePart: function () {
		var map = this._map;
		var partNames = map._docLayer._partNames;
		var currPart = map.getCurrentPartNumber();
		var options = '';
		for (var i = 0 ; i < partNames.length ; i++) {
			if (!map.isHiddenPart(i)) {
				options += '<option value="' + (i+1) + '">' + partNames[i] + '</option>';
			}
		}
		options += '<option value="32767">' + _('- move to end position -') + '</option>';
		vex.dialog.open({
			message: _UNO('.uno:Move', 'spreadsheet', true),
			input: [
				'<div><input type="radio" id="movepart" name="copypart" value="false" checked><label for="movepart"> ' + _('Move') + '</label>&emsp;&emsp;&emsp;&emsp;' +
				'<input type="radio" id="copypart" name="copypart" value="true"><label for="copypart"> ' + _('Copy') + '</label></div>',
				'<div><b>' + _('Insert before') + '</b></div>',
				'<select name="moveTo" size="10" style="font-size:16px; width: 100%;">' + options + '</select>'
			],
			callback: function (data) {
				if (data !== undefined) {
					// ???????????????
					var copy = (data.copypart === 'true');
					var pos = data.moveTo;
					if (pos === undefined) {
						pos = currPart + 2;
						if (pos > partNames.length)
							pos = 32767; // ??????
					}
					var params = {
						'DocName': {
							'type': 'string',
							'value': map.getDocName()
						},
						'Index': {
							'type': 'long',
							'value': pos
						},
						'Copy': {
							'type': 'boolean',
							'value': copy
						}
					}
					map.sendUnoCommand('.uno:Move', params);
				}
			}
		});
	},

	_updateDisabled: function (e) {
		var parts = e.parts;
		var selectedPart = e.selectedPart;
		var docType = e.docType;
		if (docType === 'text') {
			return;
		}
		if (docType === 'spreadsheet') {
			if (!this._tabsInitialized) {
				// make room for the preview
				var docContainer = this._map.options.documentContainer;
				L.DomUtil.addClass(docContainer, 'spreadsheet-document');
				setTimeout(L.bind(function () {
					this._map.invalidateSize();
					$('.scroll-container').mCustomScrollbar('update');
					$('.scroll-container').mCustomScrollbar('scrollTo', [0, 0]);
				}, this), 100);
				this._tabsInitialized = true;
			}

			// ????????????????????????
			var horizScrollPos = 0;
			var scrollDiv = L.DomUtil.get('spreadsheet-tab-scroll');
			if (scrollDiv) {
				horizScrollPos = scrollDiv.scrollLeft;
			}

			if ('partNames' in e) {
				while (this._tabsCont.firstChild) {
					this._tabsCont.removeChild(this._tabsCont.firstChild);
				}
				var ssTabScroll = L.DomUtil.create('div', 'spreadsheet-tab-scroll', this._tabsCont);
				ssTabScroll.id = 'spreadsheet-tab-scroll';

				for (var i = 0; i < parts; i++) {
					if (e.hiddenParts.indexOf(i) !== -1)
						continue;
					var id = 'spreadsheet-tab' + i;
					var tab = L.DomUtil.create('button', 'spreadsheet-tab', ssTabScroll);
					L.DomEvent.enableLongTap(tab, 15, 1000);

					L.DomEvent.on(tab, 'contextmenu', function(j) {
						return function() {
							this._tabForContextMenu = j;
							$('#spreadsheet-tab' + j).contextMenu();
						}
					}(i).bind(this));

					tab.textContent = e.partNames[i];
					tab.id = id;

					L.DomEvent
						.on(tab, 'click', L.DomEvent.stopPropagation)
						.on(tab, 'click', L.DomEvent.stop)
						.on(tab, 'mousedown', this._setPart, this)
						.on(tab, 'mousedown', this._map.focus, this._map);
					this._spreadsheetTabs[id] = tab;
				}
			}
			for (var key in this._spreadsheetTabs) {
				var part =  parseInt(key.match(/\d+/g)[0]);
				L.DomUtil.removeClass(this._spreadsheetTabs[key], 'spreadsheet-tab-selected');
				if (part === selectedPart) {
					L.DomUtil.addClass(this._spreadsheetTabs[key], 'spreadsheet-tab-selected');
				}
			}

			// ????????????????????????
			scrollDiv = L.DomUtil.get('spreadsheet-tab-scroll');
			if (scrollDiv) {
				if (this._map.insertPage && this._map.insertPage.scrollToEnd) {
					this._map.insertPage.scrollToEnd = false;
					scrollDiv.scrollLeft = scrollDiv.scrollWidth;
				} else {
					scrollDiv.scrollLeft = horizScrollPos;
				}
			}

			// ????????????????????? SelectedTab ?????????????????????
			var SelectedPosition = $('#spreadsheet-tab' + selectedPart).position()
			if (SelectedPosition) {
				var visualWidth = $('.spreadsheet-tab-scroll').width(); // ???????????? 0~width
				var selectedLeft = SelectedPosition.left;
				if (selectedLeft > visualWidth) scrollDiv.scrollLeft = visualWidth; // ?????????????????????
				if (selectedLeft < 0) scrollDiv.scrollLeft = 0; // ?????????????????????
			}

		}
		this._selectedTabScrollIntoView();
	},

	_setPart: function (e) {
		var part =  e.target.id.match(/\d+/g)[0];
		if (part !== null) {
			this._map.setPart(parseInt(part), /*external:*/ false, /*calledFromSetPartHandler:*/ true);
		}
	},

	// ????????????????????????????????????
	_selectedTabScrollIntoView: function() {
		var container = this._tabsCont;
		var scrollTab = this._tabsCont.firstChild; // div#spreadsheet-tab-scroll

		// ????????????????????? DOM
		var tab = scrollTab.children[this._map.getCurrentPartNumber()];
		if (!tab) return false;
		// ?????????????????????????????????
		var containerRect = container.getBoundingClientRect();
		// ??????????????????
		var tabRect = tab.getBoundingClientRect();
		var scrollOffsetX = 0; // ??????????????????
		// ??????????????? ???????????????
		if (tabRect.left < containerRect.left) {
			scrollOffsetX = tab.offsetLeft
		// ??????????????? ???????????????
		} else if (tabRect.right > containerRect.right) {
			scrollOffsetX = tab.offsetLeft - containerRect.width + tabRect.width;
		}

		// ?????????????????? 0???????????????????????????
		if (scrollOffsetX !== 0) {
			$(scrollTab).animate({scrollLeft: scrollOffsetX}, 100);
		}
	}
});

L.control.tabs = function (options) {
	return new L.Control.Tabs(options);
};
