
module.exports = {
	upd : '14.09-2',

	db_name:       'DaoCasino',
	rtc_room:      'daocasino-room1',
	rtc_store:     'rtc_msgs',

	network:       'ropsten',
	wallet_pass:   '1234',
	rpc_url:       'https://ropsten.infura.io/JCnK5ifEPH9qcQkX0Ahl',
	erc20_address: '0x95a48dca999c89e4e284930d9b9af973a7481287',
	erc20_abi:     require('./erc20.abi.js'),

	gasPrice:    400000000000,
	gasLimit:    4000000,

	api_url:         'https://platform.dao.casino/api/',
}
