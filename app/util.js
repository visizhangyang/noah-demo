
define('util', ['http'], function (http) {
	var Utils = {
		/*
		 * opt.reqData: [], //[{ method: '',params: {}}，{}...]：一次请求可同时调用多个业务接口
		 * opt.loadingFlag: true, //true:转菊花，false无加载菊花
		 * successFb: undefined, //请求成功回调
		 * errorFb: undefined, //请求错误回调
		*/
		ajax: function (opt) {

			var dfd = new http.promise();

			var _opt = {};
			//字符串类型则当做url直接请求
			if (typeof opt === 'string') {
				_opt.reqData = { method: opt };
			}
			//json类型直接赋值
			else if (Object.prototype.toString.call(opt) === '[object Object]') {
				_opt = opt;
			}
			else {
				dfd.done(true, '请求数据有误');
				return false;
			}

			//默认数据，组装jsonrpc
			var requestData = [{
				"jsonrpc": "2.0",
				"id": Math.random().toString(36),
				"method": 'etc.get_token',
				"params": {}
			}];

			//默认加loading
			_opt.loadingFlag = _opt.loadingFlag || true;

			//postdata不是数组时转成数组
			if (Object.prototype.toString.call(_opt.reqData) !== '[object Array]') {
				_opt.reqData = Object.prototype.toString.call(_opt.reqData) === '[object Object]' ? [_opt.reqData] : [];
			}

			if (_opt.reqData.length) {
				//拼装数据
				for (var i = 0, max = _opt.reqData.length; i < max; i++) {
					requestData.push({
						jsonrpc: '2.0',
						id: Math.random().toString(36),
						method: _opt.reqData[i].method,
						params: _opt.reqData[i].params
					});
				}
			}
			else {
				dfd.done(true, '请求数据有误');
			}

			var request = JSON.stringify(requestData);
			var t = Math.floor(+new Date() / 1000);
			var _ic_token_ = '';//Utils.cookie.get('_ifa_token_') || '';
			var sign = md5(['king-ifa', request, _ic_token_, t].join('@'));
			
			var domain = document.domain;
			if (window.location.port) {
			    domain += ':' + window.location.port;
			}
			http.post(
				"//" + domain + "/api/",
				request,
				{
					"Content-Type": "application/json",
					"X-KGW-T": t,
					"X-KGW-SIGN": sign,
					"X-KGW-AGENT": "pc/1.0",
					"X-KGW-DOMAIN": "." + document.domain,
					"X-KGW-TOKEN": _ic_token_
				}
			).then(function (error, res) {
				//请求异常
				if (error) {
					if (typeof res === 'string') {
						dfd.done(true, res);
					}
					else {
						dfd.done(true, '网络请求失败，请稍后再试');
					}
				}
				//成功
				else {
					//ajax返回responseText数据，需要转成json或数组
					res = (new Function('return ' + res))();

					//返回没遵循jsonrpc标准，返回为非数组,跟后台确认过只有机构版11304会返回非jsonrpc格式
					if (Object.prototype.toString.call(res) !== '[object Array]') {
						//json
						if (Object.prototype.toString.call(res) === '[object Object]') {
							dfd.done(true, (function () {
								try {
									return res.error.message;
								} catch (err) {
									return '网络请求失败，请稍后再试'
								}
							})());
						}
						else {
							dfd.done(true, '网络请求失败，请稍后再试');
						}
						//Utils.cookie.del('_ifa_token_');
					}
					//标准jsonsrpc格式数据为一个数组
					else {
						if (res[0].error) {
							dfd.done(true, res[0].error.message);
							//Utils.cookie.del('_ifa_token_');
						}
						//第一项token数据无误则返回给前端处理
						else {
							//Utils.cookie.add('_ifa_token_', res[0].result);
							//删除第一项默认数据
							res.shift();
							if (res.length === 1) {
								res = res[0];
							}
							dfd.done(false, res);
						}
					}
				}
			});

			return dfd;
		},

		//请求验证码
		getCaptchaUrl: function (width, height) {
			var w = width ? width : '',
				h = height ? height : '',
				t = Math.floor(+new Date() / 1000),
				sid = Utils.cookie.get('_ifa_token_') || '',
				sign = md5(['king-ifa', '', sid, t].join('@'));

			return "//" + document.domain + "/api/" + 'resource/captcha?w=' + w + '&h=' + h + '&kgw_t=' + t + '&kgw_sign=' + sign + '&kgw_agent=pc';
		},

		//获取请求参数值
		getQueryString: function (name) {
			var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
			var r = window.location.search.substr(1).match(reg);
			if (r != null) return r[2];
			return null;
		},

		on: function (et, obj, son, cb, prevent) {
			var $obj = document.querySelectorAll(obj);
			var _cb, _prevent = prevent;
			if (typeof son === 'function') {
				_prevent = cb;
				cb = son;
			}
			//事件代理
			if (typeof son === 'string') {
				_cb = cb;
				cb = function (e) {
					var $son = this.querySelectorAll(son);
					var target;
					e = e || window.event;
					if (e.target === $obj[0]) return false;
					for (var i = 0; i < $son.length; i++) {
						//点击当前元素或是子孙元素
						if ($son[i] === e.target || Utils.isSon(e.target, $son[i], $obj[0])) {
							target = $son[i];
							break;
						}
					}
					if (target) {
						_cb.call(target, e);
					}
				};
			}
			
			//touchend事件单独处理，prevent设置为true则忽略
			for (var i = 0; i < $obj.length; i++) {
				(function (item) {
					if (et === 'touchend' && !_prevent) {
						item.addEventListener('touchstart', function startFunc(e) {
							var touch = e.changedTouches.length ? e.changedTouches[0] : e.touches[0];
							var startX = touch.clientX;
							var startY = touch.clientY;
							//事件绑定写在touchstart中以防被清理
							item.removeEventListener(et, cb);
							item.addEventListener(et, cb, false);

							item.addEventListener('touchmove', function moveFunc(ev) {
								var newTouch = ev.changedTouches.length ? ev.changedTouches[0] : ev.touches[0];
								var moveX = newTouch.clientX;
								var moveY = newTouch.clientY;
								//如果触摸发生偏移则忽略当前操作
								if (Math.abs(moveY - startY) > 20 || Math.abs(moveX - startX) > 20) {
									//$obj.removeEventListener('touchstart',startFunc);
									item.removeEventListener('touchmove', moveFunc);
									item.removeEventListener(et, cb);
									e.stopPropagation();
									e.preventDefault();
								}
							}, false);
						}, false);
					} else {
						item.addEventListener(et, cb, false);

					}
				})($obj[i]);
			}
		},

		isSon: function (elem, parent, top) {

			if (elem.parentNode === parent) {
				return true;
			}
			else {
				//如果top值为object则设定top为最高层级
				if (elem.parentNode === (typeof top === 'object' ? top : document)) {
					return false;
				}
				else {
					return Utils.isSon(elem.parentNode, parent, top);
				}
			}
		},

		cookie: {
			add: function (name, value, day) {
				//当day为h5的时候走localStroage
				if (day === 'h5' && Utils.device.hasLocalStorage) {
					localStorage[name] = value;
					return false;
				}
				var date = new Date();
				//默认不过期
				day = day || 10000;
				date.setDate(date.getDate() + day);
				document.cookie = name + '=' + value + ';expires=' + date;
			},
			get: function (name, expires) {
				//expires为true时走localStroage
				if (expires && Utils.device.hasLocalStorage) {
					return localStorage[name] || '';
				}
				//'username=abc; password=123456; aaa=123; bbb=4r4er'
				var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
				if (arr = document.cookie.match(reg)) {
					return unescape(arr[2]);
				}
				else {
					return '';
				}
			},
			del: function (name, expires) {
				//expires为true时只走localStroage
				if (expires && Utils.device.hasLocalStorage) {
					localStorage.removeItem(name);
					return false;
				}
				this.add(name, '1', -1);
			}
		},

		ui: {
			createWait: function () {
				var oModal = document.createElement('div');
				oModal.className = 'base-ui-wait';
				document.body.appendChild(oModal);
			},
			closeWait: function () {
				var oModal = document.querySelector('.base-ui-wait');
				oModal.parentNode.removeChild(oModal);
			},
			alert: function (msg, txtok, cbok) {
				if (!msg) return false;
				var oText = null, oBtnOk = null;
				var oModal = document.createElement('div');

				//txtok不为function类型时当确认按钮文字处理
				if (typeof txtok === 'function') {
					cbok = txtok;
				}

				oModal.className = 'base-ui-alert';
				oModal.innerHTML = '<div class="modal">'
					+ '<div class="modal-inner">'
					+ msg
					+ '</div>'
					+ '<div class="modal-btns">'
					+ '<a href="javascript:;" class="modal-btn confirm-ok">' + (typeof txtok === 'string' ? txtok : '确认') + '</a>'
					+ '</div>'
					+ '</div>'
				document.body.appendChild(oModal);

				//确认操作
				var confirmModal = function () {
					if (typeof cbok === 'function') {
						cbok();
						
					}
					oModal.parentNode.removeChild(oModal);
					
				};

				oModal.classList.add('modal-in');
				oText = oModal.querySelector('.modal-inner');
				oBtnOk = oModal.querySelector('.confirm-ok');

				oBtnOk.addEventListener('click', confirmModal, false);
			},
			/*
			** opt.msg 提示内容
			** opt.cbok 确认回调
			** opt.cbcancle 取消回调
			** opt.reversal 调转确认按钮和取消按钮位置
			** opt.txtok 确认按钮文本
			** opt.txtcancel 取消按钮文本
			** 
			** util.ui.confirm({
			**		msg: '测试一个',
			**		reversal: true,
			**		txtok: '按钮2',
			**		txtcancel: '按钮1'
			**	});
			*/
			confirm: function (msg, cbok, cbcancle) {
				if (!msg) return false;

				var opt = {};
				//第一个参数为object时忽略其他参数
				if (Object.prototype.toString.call(msg) === '[object Object]') {
					opt = msg;
				}
				else {
					opt.msg = msg;
					opt.cbok = cbok;
					opt.cbcancle = cbcancle;
				}

				var oModal = document.querySelector('.base-ui-confirm');
				var oText = null, oBtnOk = null, oBtnCancel = null, iRemove = true;
				if (!oModal) {
					oModal = document.createElement('div');
					oModal.className = 'base-ui-confirm';
					oModal.innerHTML = '<div class="modal">'
						+ '<div class="modal-inner">'
						+ opt.msg
						+ '</div>'
						+ '<div class="modal-btns">'
						//反转
						+ (opt.reversal ? '<a href="javascript:;" class="modal-btn confirm-ok">' + (opt.txtok || '确认') + '</a><a href="javascript:;" class="modal-btn confirm-cancel">' + (opt.txtcancel || '取消') + '</a>'
							: '<a href="javascript:;" class="modal-btn confirm-cancel">' + (opt.txtcancel || '取消') + '</a><a href="javascript:;" class="modal-btn confirm-ok">' + (opt.txtok || '确认') + '</a>')
						+ '</div>'
						+ '</div>'
					document.body.appendChild(oModal);
				}
				else {
					iRemove = false;
				}
				oModal.classList.add('modal-in');
				oText = oModal.querySelector('.modal-inner');
				oBtnOk = oModal.querySelector('.confirm-ok');
				oBtnCancel = oModal.querySelector('.confirm-cancel');

				//关闭modal
				var closeModal = function () {
					if (iRemove) {
						oModal.parentNode.removeChild(oModal);
					}
					else {
						oModal.classList.remove('modal-in');
						oBtnCancel.removeEventListener('click', cancelModal, false);
						oBtnOk.removeEventListener('click', okModal, false);
					}
				};
				//取消的回调函数
				var cancelModal = closeModal;
				if (typeof opt.cbcancle === 'function') {
					cancelModal = function () {
						opt.cbcancle();
						closeModal();
					};
				}
				//确认的回调函数
				var okModal = function () {
					closeModal();
					if (typeof opt.cbok === 'function') {
						opt.cbok();
					}
				};

				//绑定事件
				oBtnCancel.addEventListener('click', cancelModal, false);
				oBtnOk.addEventListener('click', okModal, false);
			},
			//自关闭
			toast: function (msg, time) {
				if (!msg) return false;
				var oModal = document.createElement('div');
				time = time || 3000;

				oModal.className = 'base-ui-toast';
				oModal.innerHTML = '<div class="modal">'
					+ '<div class="modal-inner">'
					+ msg
					+ '</div>'
					+ '</div>'
				document.body.appendChild(oModal);

				//确认操作
				oModal.classList.add('modal-in');
				//设置生存期
				setTimeout(function () {
					oModal.parentNode.removeChild(oModal);
				}, time);
			}
		},

		device: {
			hasLocalStorage: typeof localStorage != 'undefined' && !!localStorage && typeof localStorage.getItem === 'function',
			isWeixin: window.navigator.userAgent.search(/MicroMessenger/i) !== -1,
			isIOS: /(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)
		},
		app: function () {
			var cookie = this.cookie.get('device_agent');

			if (!cookie) {
				return;
			}
			// 方舟用户版
			var config = {
				'funduser': [
					'com.noah.ifa.app.standard',
					'com.ifa.app.inHouse.std',
					'com.ifa.app.std'
				],
				'fundfa': [
					'com.noah.ifa.app.pro',
					'com.ifa.app.inHouse.pro',
					'com.ifa.app.pro'
				],
				'noahwm': [
					'com.noahwm.android',
					'com.noahwm.test.std',
					'com.noahwm.app.std'
				],
				'noahcrm': [
					'com.noahwm.crm',
					'com.noahwm.test.pro',
					'com.noahwm.app.pro'
				]
			}

			for (var name in config) {
				var item = config[name];
				for (var i = 0; i < item.length; i++) {
					if (cookie.indexOf(item[i]) == -1) {
						continue;
					}
					return name;
				}
			}
			return 'funduser'

		},
		testIdCard: function (num) {
			if (!num)
				return false;
			num = num.toUpperCase();
			//身份证号码为15位或者18位，15位时全为数字，18位前17位为数字，最后一位是校验位，可能为数字或字符X。
			if (!((/(^\d{15}$)|(^\d{17}([0-9]|X)$)/).test(num))) {
				//alert('输入的身份证号长度不对，或者号码不符合规定！\n15位号码应全为数字，18位号码末位可以为数字或X。');
				return false;
			}
			//校验位按照ISO 7064:1983.MOD 11-2的规定生成，X可以认为是数字10。
			//下面分别分析出生日期和校验位
			var len, re;
			len = num.length;
			if (len == 15) {
				re = new RegExp(/^(\d{6})(\d{2})(\d{2})(\d{2})(\d{3})$/);
				var arrSplit = num.match(re);

				//检查生日日期是否正确
				var dtmBirth = new Date('19' + arrSplit[2] + '/' + arrSplit[3] + '/' + arrSplit[4]);
				var bGoodDay;
				bGoodDay = (dtmBirth.getYear() == Number(arrSplit[2])) && ((dtmBirth.getMonth() + 1) == Number(arrSplit[3])) && (dtmBirth.getDate() == Number(arrSplit[4]));
				if (!bGoodDay) {
					//alert('输入的身份证号里出生日期不对！');
					return false;
				}
				else {
					//将15位身份证转成18位
					//校验位按照ISO 7064:1983.MOD 11-2的规定生成，X可以认为是数字10。
					var arrInt = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
					var arrCh = new Array('1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2');
					var nTemp = 0, i;
					num = num.substr(0, 6) + '19' + num.substr(6, num.length - 6);
					for (i = 0; i < 17; i++) {
						nTemp += num.substr(i, 1) * arrInt[i];
					}
					num += arrCh[nTemp % 11];
					return true;
				}
			}
			if (len == 18) {
				re = new RegExp(/^(\d{6})(\d{4})(\d{2})(\d{2})(\d{3})([0-9]|X)$/);
				var arrSplit = num.match(re);

				//检查生日日期是否正确
				var dtmBirth = new Date(arrSplit[2] + "/" + arrSplit[3] + "/" + arrSplit[4]);
				var bGoodDay;
				bGoodDay = (dtmBirth.getFullYear() == Number(arrSplit[2])) && ((dtmBirth.getMonth() + 1) == Number(arrSplit[3])) && (dtmBirth.getDate() == Number(arrSplit[4]));
				if (!bGoodDay) {
					//alert(dtmBirth.getYear());
					//alert(arrSplit[2]);
					//alert('输入的身份证号里出生日期不对！');
					return false;
				}
				else {
					//检验18位身份证的校验码是否正确。
					//校验位按照ISO 7064:1983.MOD 11-2的规定生成，X可以认为是数字10。
					var valnum;
					var arrInt = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
					var arrCh = new Array('1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2');
					var nTemp = 0, i;
					for (i = 0; i < 17; i++) {
						nTemp += num.substr(i, 1) * arrInt[i];
					}
					valnum = arrCh[nTemp % 11];
					if (valnum != num.substr(17, 1)) {
						//alert('18位身份证的校验码不正确！应该为：' + valnum);
						return false;
					}
					return true;
				}
			}
			return false;
		}
	};

	return Utils;
});