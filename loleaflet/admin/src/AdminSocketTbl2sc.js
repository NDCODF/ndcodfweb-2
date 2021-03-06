/* -*- js-indent-level: 8 -*- */
/*
	View logs in the admin console.
*/
/* global vex $ AdminSocketBase Admin */
var AdminSocketTbl2sc = AdminSocketBase.extend({
	constructor: function(host) {
		this.base(host);
	},

	_intervalId: 0,
    _rec_id: 0,
	_pause:  false,	// 是否暫停

	getLog: function() {
		if (!this._pause)
		{
			this.socket.send('module tbl2sc get_log ' + this._rec_id);
		}
	},

	onSocketOpen: function() {
		// Base class' onSocketOpen handles authentication
		this.base.call(this);
        this.socket.send('module tbl2sc get_log ' + this._rec_id);
        this.socket.send('module tbl2sc getModuleVersion');
		var socketLogView = this;

        //初始化畫面的按鈕事件
        $('#Pause').click(function ()
            {
                socketLogView._pause = !socketLogView._pause;
                $('#Pause').text(socketLogView._pause ? '持續更新' : '暫停');
                $('#Pause').removeClass(socketLogView._pause ? 'btn-warning' : 'btn-success');
                $('#Pause').addClass(socketLogView._pause ? 'btn-success' : 'btn-warning');
            });
        this._intervalId = setInterval(function() {
            return socketLogView.getLog();
        }, 5000);
	},

	onSocketMessage: function(e) {
		var textMsg;
		if (typeof e.data === 'string')
		{
			textMsg = e.data;
		}
		else
		{
			textMsg = '';
		}

        if(textMsg.startsWith("get_log "))
        {
            log_data = textMsg.split("get_log")[1];
            result = JSON.parse(log_data.trim());
            for(id in result)
            {
                data = result[id];
                loggingTable.row.add([
                    data['status'] == 1 ? "成功" : "失敗",
                    // plus Z to make the timezone correct, origin time zone is UTC+0
                    new Date((Date.parse(data['timestamp']+'Z'))).toLocaleString(),
                    data['source_ip'],
                    data['title'],
                ]).node().id = ("rec_id_" + data['rec_id']);
                if (Number(data['rec_id']) > this._rec_id)
                    this._rec_id = Number(data['rec_id']);
            }
            // false will retain the page on current page
            loggingTable.draw(false);
        }
        if(textMsg.startsWith("getModuleVersion "))
        {
            version = textMsg.split("getModuleVersion")[1];
            $("#moduleVersion").html(`模組版本: ${version}`);
        }
    },

	onSocketClose: function() {
		clearInterval(this._intervalId);
        this.base.call(this);
	}
});

Admin.Tbl2sc = function(host)
{
	return new AdminSocketTbl2sc(host);
};
