import _config from './config.js'
import 'ydn.db'

export default new ydn.db.Storage( _config.db_name )

/*

Example:
	import DB      from 'DB/DB'

	DB.put('store-name1', {message: 'Hello world!'}, 'id1')

	!(async () => {
		const result = await DB.get('store-name1', 'id1')
		console.log(result)
	})()
*/
