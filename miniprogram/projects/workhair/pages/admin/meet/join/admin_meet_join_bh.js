const pageHelper = require('../../../../../../helper/page_helper.js');
const cacheHelper = require('../../../../../../helper/cache_helper.js');
const helper = require('../../../../../../helper/helper.js');
const timeHelper = require('../../../../../../helper/time_helper.js');
const cloudHelper = require('../../../../../../helper/cloud_helper.js');

const CACHE_CANCEL_REASON = 'JOIN_CANCEL_REASON';


module.exports = Behavior({
	/**
	 * 页面的初始数据
	 */
	data: {

		oprt: 'admin',

		isLoad: false,
		isAllFold: true,

		parentDayIdx: 0,
		parentTimeIdx: 0,

		menuIdx: 0,

		meetId: '',
		mark: '',

		title: '',
		titleEn: '',

		cancelModalShow: false,
		formReason: '',
		curIdx: -1
	},

	methods: {

		_init: function (options) {
			// 附加参数 
			if (options && options.meetId && options.mark) {
				//设置搜索菜单 
				this._getSearchMenu();

				this.setData({
					meetId: options.meetId,
					mark: options.mark,
					parentDayIdx: options.dayidx,
					parentTimeIdx: options.timeidx,
					time: options.time,

					_params: {
						meetId: options.meetId,
						mark: options.mark,
					}
				}, () => {
					this.setData({
						isLoad: true
					});
				}
				);
			}

			if (options && options.title) {
				let title = decodeURIComponent(options.title);
				this.setData({
					title,
					titleEn: options.title
				});
				wx.setNavigationBarTitle({
					title: '分时段预约名单 - ' + title
				});
			}
		},


		/**
		 * 生命周期函数--监听页面初次渲染完成
		 */
		onReady: function () {

		},

		/**
		 * 生命周期函数--监听页面显示
		 */
		onShow: function () {

		},

		/**
		 * 生命周期函数--监听页面隐藏
		 */
		onHide: function () {

		},

		/**
		 * 生命周期函数--监听页面卸载
		 */
		onUnload: function () {

		},

		url: async function (e) {
			pageHelper.url(e, this);
		},

		bindUnFoldTap: function (e) {
			let idx = pageHelper.dataset(e, 'idx');
			let dataList = this.data.dataList;
			dataList.list[idx].fold = false;
			this.setData({
				dataList
			});
		},

		bindFoldTap: function (e) {
			let idx = pageHelper.dataset(e, 'idx');
			let dataList = this.data.dataList;
			dataList.list[idx].fold = true;
			this.setData({
				dataList
			});
		},

		bindFoldAllTap: function (e) {
			let dataList = this.data.dataList;
			for (let k = 0; k < dataList.list.length; k++) {
				dataList.list[k].fold = true;
			}
			this.setData({
				isAllFold: true,
				dataList
			});
		},

		bindUnFoldAllTap: function (e) {
			let dataList = this.data.dataList;
			for (let k = 0; k < dataList.list.length; k++) {
				dataList.list[k].fold = false;
			}
			this.setData({
				isAllFold: false,
				dataList
			});
		},

		bindCopyTap: function (e) {
			let idx = pageHelper.dataset(e, 'idx');
			let forms = this.data.dataList.list[idx].JOIN_FORMS;

			let ret = '';

			ret += `项目：${this.data.dataList.list[idx].JOIN_MEET_TITLE}\r`;

			ret += `时段：${this.data.dataList.list[idx].JOIN_MEET_DAY} ${this.data.dataList.list[idx].JOIN_MEET_TIME_START}～${this.data.dataList.list[idx].JOIN_MEET_TIME_END}\r`;
			for (let k = 0; k < forms.length; k++) {
				ret += forms[k].title + '：' + forms[k].val + '\r';
			}
			wx.setClipboardData({
				data: ret,
				success(res) {
					wx.getClipboardData({
						success(res) {
							pageHelper.showSuccToast('已复制到剪贴板');
						}
					})
				}
			});

		},

		bindCancelTap: function (e) {
			this.setData({
				formReason: cacheHelper.get(CACHE_CANCEL_REASON) || '',
				curIdx: pageHelper.dataset(e, 'idx'),
				cancelModalShow: true
			});
		},


		bindCancelCmpt: async function () {

			cacheHelper.set(CACHE_CANCEL_REASON, this.data.formReason, 86400 * 365);

			let idx = this.data.curIdx;
			let dataList = this.data.dataList;
			let joinId = dataList.list[idx]._id;
			let reason = this.data.formReason;

			let callback = async () => {

				let params = {
					joinId,
					reason
				}
				let opts = {
					title: '处理中'
				}
				try {
					await cloudHelper.callCloudSumbit(this.data.oprt + '/join_cancel', params, opts).then(res => {
						pageHelper.showSuccToast('操作成功', 1000);

						let cb = () => {
							// 更新列表页面数据
							this.setData({
								cancelModalShow: false,
								formReason: '',
								curIdx: -1,
								['dataList.list[' + idx + '].JOIN_REASON']: reason,
								['dataList.list[' + idx + '].JOIN_STATUS']: 99,
								['dataList.list[' + idx + '].JOIN_CANCEL_TIME']: timeHelper.time('Y-M-D h:m:s'),

								curIdx: -1,
								cancelModalShow: false
							});

							let parent = pageHelper.getPrevPage(2);
							if (parent) {
								let daysSet = parent.data.daysSet;
								daysSet[this.data.parentDayIdx].times[this.data.parentTimeIdx].stat = res.data;
								parent.setData({
									daysSet
								});
							}
						}

						pageHelper.showModal('取消成功 (若有在线缴费，所缴纳费用将在1-5分钟内原路退还)', '温馨提示', cb);

					});
				} catch (err) {
					console.error(err);
				}
			}

			pageHelper.showConfirm('确认取消该预约记录？ 取消后不可恢复', callback);


		},


		bindCheckinTap: async function (e) {
			let flag = Number(pageHelper.dataset(e, 'flag'));

			let callback = async () => {
				let idx = Number(pageHelper.dataset(e, 'idx'));
				let dataList = this.data.dataList;
				let joinId = dataList.list[idx]._id;
				let params = {
					joinId,
					flag,
				}
				let opts = {
					title: '处理中'
				}
				try {
					await cloudHelper.callCloudSumbit(this.data.oprt + '/join_checkin', params, opts).then(res => {
						let cb = () => {
							let sortIndex = this.selectComponent('#cmpt-comm-list').getSortIndex();
							if (sortIndex >= 10 && !this.data.search) { // 全部或者检索的结果
								dataList.list.splice(idx, 1);
								dataList.total--;
							} else {
								dataList.list[idx].JOIN_IS_CHECKIN = flag;
								dataList.list[idx].JOIN_CHECKIN_TIME = timeHelper.time('Y-M-D h:m:s');
							}
							this.setData({
								dataList
							});
						}

						pageHelper.showSuccToast('操作成功', 1000, cb);


					});
				} catch (err) {
					console.error(err);
				}
			}
			if (flag == 1)
				pageHelper.showConfirm('确认「核销」？', callback);
			else if (flag == 0)
				pageHelper.showConfirm('确认「取消核销」？', callback);

		},

		bindCommListCmpt: function (e) {

			if (helper.isDefined(e.detail.search))
				this.setData({
					search: '',
					sortType: '',
				});
			else {
				let dataList = e.detail.dataList;
				if (dataList) {
					for (let k = 0; k < dataList.list.length; k++) {
						dataList.list[k].fold = this.data.isAllFold;
					}
				}

				this.setData({
					dataList,
				});
				if (e.detail.sortType)
					this.setData({
						sortType: e.detail.sortType,
					});
			}

		},

		// 修改与展示状态菜单
		_getSearchMenu: function () {

			let sortItems = [];
			let sortMenus = [{
				label: '全部',
				type: '',
				value: ''
			}, {
				label: `成功`,
				type: 'status',
				value: 1
			},
			{
				label: `已取消`,
				type: 'status',
				value: 1099
			},
			{
				label: `已核销`,
				type: 'checkin',
				value: 1
			},
			{
				label: `未核销`,
				type: 'checkin',
				value: 0
			}

			]
			this.setData({
				sortItems,
				sortMenus
			})


		},

		bindClearReasonTap: function (e) {
			this.setData({
				formReason: ''
			})
		}

	}
})