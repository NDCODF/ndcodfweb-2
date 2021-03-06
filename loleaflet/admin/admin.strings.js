/* -*- js-indent-level: 8 -*- */
/* Stringtable for Admin Console User Interface */
/* global _ _UNO */
var l10nstrings = {
	productName: 'NDC ODF Web',
	/**
	 * 找出整頁中，含有 _="字串" 的 DOM，把該 DOM 的 innerHTML 改成 _("字串") 的值
	 */
	fullPageTranslation: function() {
		this.translationElement(document);
	},

	/**
	 * 翻譯指定 DOM 內所有 element 有指定的 attribute
	 */
	 translationElement: function(DOM) {
		// 需要找出的 attributes
		var trAttrs = ['_', '_UNO', 'title', 'placeholder'];
		DOM.querySelectorAll('[' + trAttrs.join('],[') + ']').forEach(function(el) {
			for (var idx in trAttrs) {
				var attrName = trAttrs[idx]
				if (el.hasAttribute(attrName)) {
					// 讀取該 attribute 字串
					var origStr = el.getAttribute(attrName);
					// 翻譯結果
					var l10nStr = '';
					switch (attrName) {
					case '_':
					case 'title':
					case 'placeholder':
						l10nStr = _(origStr);
						break;
					case '_UNO':
						l10nStr = _UNO(origStr);
						break;
					default:
						break;
					}
					// 替代原來的字串
					if (attrName === 'title' || attrName === 'placeholder') {
						el.setAttribute('title', l10nStr);
					// 把翻譯結果插到該 element 的結尾
					} else if (attrName === '_' || attrName === '_UNO') {
						el.insertBefore(document.createTextNode(l10nStr), null);
					}
					if (origStr === l10nStr) {
						console.debug('warning! "' + origStr + '" may not be translation.');
					}
				}
			}
		}.bind(this));
	},

	// 內部翻譯的字串陣列
	strings: [
		_('Admin console'), // 管理主控臺
		_('Overview'), // 概覽
		_('Analytics'), // 分析
		_('Log'), // 日誌
		_('System configuration'), // 系統配置設定
		_('Software upgrade'), // 軟體升級
		_('Font manager'), // 字型管理
		_('Table conversion'), // 表格轉試算表
		_('Template Repo'), // 範本中心
		_('ODF report template'), // ODF 報表管理
	],
};

if (module) {
	module.exports = l10nstrings;
}
