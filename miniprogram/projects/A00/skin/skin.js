module.exports = {
	PID: 'A00', //理发店

	NAV_COLOR: '#ffffff',
	NAV_BG: '#544643',

	MEET_NAME: '预约', 
 
	MENU_ITEM: ['首页', '预约日程', '我的'], // 第1,4,5菜单

	NEWS_CATE: '1=小店动态,2=美发常识,3=男士发型,4=女士发型',
	MEET_TYPE: '1=发型师预约|leftbig2,2=项目预约',

	DEFAULT_FORMS: [{
			type: 'line',
			title: '姓名',
			desc: '请填写您的姓名',
			must: true,
			len: 50,
			onlySet: {
				mode: 'all',
				cnt: -1
			},
			selectOptions: ['', ''],
			mobileTruth: true,
			checkBoxLimit: 2,
		},
		{
			type: 'line',
			title: '手机',
			desc: '请填写您的手机号码',
			must: true,
			len: 50,
			onlySet: {
				mode: 'all',
				cnt: -1
			},
			selectOptions: ['', ''],
			mobileTruth: true,
			checkBoxLimit: 2,
		}
	]
}