import PouchDB from 'pouchdb';
import HoodiePouch from 'pouchdb-hoodie-api';
PouchDB.plugin(HoodiePouch);
let db = PouchDB('https://prototypo.appback.com/_api/user%2Fyebrzd8',{
	auth: {
		username: 'admin',
		password: '0pyt0t0rp',
	}
});
let api = db.hoodieApi();

// const hoodie = new Hoodie('https://prototypo.appback.com');

function values(prefix) {
	return {
		get(params) {
			return api.find(`${prefix}values/${params.typeface}`);
		},
		save(params) {
			return api.updateOrAdd(`${prefix}values/${params.typeface}`,{
					values: params.values
				});
		},
		clear() {
			return api.removeAll(`${prefix}values`);
		}
	}
}

export default {
	AppValues: values('app'),
	FontValues: values('font'),
}