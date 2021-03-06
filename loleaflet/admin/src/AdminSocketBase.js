/* -*- js-indent-level: 8 -*- */
/*
	Abstract class
*/

/* global _ Util vex Base $ */

// polyfill startsWith for IE11
if (typeof String.prototype.startsWith !== 'function') {
	String.prototype.startsWith = function (str) {
		return this.slice(0, str.length) === str;
	};
}

var AdminSocketBase = Base.extend({
	socket: null,
	connectCount: 0,

	constructor: function (host) {
		// because i am abstract
		if (this.constructor === AdminSocketBase) {
			throw new Error('Cannot instantiate abstract class');
		}

		// We do not allow such child class to instantiate websocket that do not implement
		// onSocketMessage and onSocketOpen.
		if (typeof this.onSocketMessage === 'function' && typeof this.onSocketOpen === 'function') {
			this.socket = new WebSocket(host);
			this.socket.onopen = this.onSocketOpen.bind(this);
			this.socket.onclose = this.onSocketClose.bind(this);
			this.socket.onmessage = this.onSocketMessage.bind(this);
			this.socket.onerror = this.onSocketError.bind(this);
			this.socket.binaryType = 'arraybuffer';
		}

		this.pageWillBeRefreshed = false;
		var onBeforeFunction = function() {
			this.pageWillBeRefreshed = true;
		};
		window.onbeforeunload = onBeforeFunction.bind(this);
	},

	onSocketOpen: function () {
		// Authenticate
		var cookie = Util.getCookie('jwt');
		this.socket.send('auth ' + cookie);
	},

	onSocketMessage: function () {
		/* Implemented by child */
	},

	onSocketClose: function () {
		this.socket.onerror = function () { };
		this.socket.onclose = function () { };
		this.socket.onmessage = function () { };
		this.socket.close();

		if (this.pageWillBeRefreshed === false) {
			this.vexInstance = vex.open({
				content: _('Server has been shut down; Waiting to be back online.') +
						'<div>' +
						'<span class="spinner-border spinner-border-sm text-success" role="status" aria-hidden="true"></span>' +
						' <span id="wait-server-start"></span>' +
						'</div>',
				contentClassName: 'loleaflet-user-idle',
				showCloseButton: false,
				overlayClosesOnClick: false,
				escapeButtonCloses: false,
			});
			this.waitServerStart(); // ???????????? Server ????????????
		}
	},

	onSocketError: function () {
		vex.dialog.alert(_('Connection error'));
	},

	// Add by Firefly <firefly@ossii.com.tw>
	// ?????? OxOOL Server ????????????????????????????????? reload ????????????
	waitServerStart: function () {
		var that = this;
		this.connectCount ++;
		$('#wait-server-start').text(_('Try to reconnect...') + ' #' + this.connectCount);
		setTimeout(function () {
			// ?????? OxOOL ??????????????????
			// get "/" ?????????????????? OK ????????????
			$.ajax({
				type: 'GET',
				url: '/',
				timeout: 100, // 0.1 ???
				success: function(data/*, textStatus*/) {
					if (data === 'OK') {
						location.reload();
					}  else {
						// ????????????
						that.waitServerStart();
					}
				},
				error:function(/*xhr, ajaxOptions, thrownError*/) {
					// ????????????
					that.waitServerStart();
				}
			});
		}, 2900);
	}
});
