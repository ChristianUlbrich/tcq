import { resolve } from 'node:path';
import type { AgendaItem, Collection, GetElementType, IDBManager, Jsonify, Meeting, Topic } from '@tc39/typings';
import { JSONFileSyncPreset } from 'lowdb/node';
import type { UserInternal } from '.';


type Data = {
	users: UserInternal[];
	meetings: Meeting[];
	agendaItems: AgendaItem[];
	topics: Topic[];
};

const defaultData: Data = {
	users: [],
	meetings: [],
	agendaItems: [],
	topics: []
};

class DBMngr implements IDBManager {
	#db;

	constructor(filename: string) {
		this.#db = JSONFileSyncPreset<Data>(filename, defaultData);
	}

	upsert<T extends Collection>(collection: T, data: GetElementType<Data[T]>): void {
		const dat = this.#db.data[collection].filter(element => element.id === data.id).at(0);
		if (dat) Object.assign(dat, data);
		//@ts-expect-error
		else this.#db.data[collection].push(data);
		this.#db.write();
	}
	read<T extends Collection>(collection: T, conditions?: (keyof GetElementType<Data[T]>)[], params?: any[]) {
		const dat = this.#db.data[collection] as Jsonify<GetElementType<Data[T]>>[];

		if (conditions && params) {
			return dat.filter(element => conditions.every((condition, index) => (element as any)[condition] === params[index]));
		}

		return dat;
	}
	delete<T extends Collection>(collection: T, conditions: (keyof GetElementType<Data[T]>)[], params: any[]): void {
		//@ts-expect-error
		this.#db.data[collection] = this.#db.data[collection].filter(element => !conditions.every((condition, index) => (element as any)[condition] === params[index]));
		this.#db.write();
	}
}

const DB = new DBMngr(resolve(import.meta.dir, '../', 'db.json'));

// @example
// DB.read('users', ['id', 'email'], ['1', 'tim.tester@zalari.de']).at(0)?.ghId;

export { DB };
