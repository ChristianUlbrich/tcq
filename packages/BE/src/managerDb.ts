import { resolve } from 'node:path';
import type { AgendaItem, Collection, GetElementType, Jsonify, Meeting, Topic } from '@tc39/typings';
import { JSONFilePreset, JSONFileSyncPreset } from 'lowdb/node';
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

const DB = await JSONFilePreset(resolve(import.meta.dir, '../', 'db.json'), defaultData);

export const upsert = <T extends Collection>(collection: T, data: GetElementType<Data[T]>): void => {
	const dat = DB.data[collection].filter(element => element.id === data.id).at(0);
	if (dat) Object.assign(dat, data);
	//@ts-expect-error: Ts can't infer the type of the element
	else DB.data[collection].push(data);
	DB.write().catch(console.error);
};

export const read = <T extends Collection>(collection: T, conditions?: (keyof GetElementType<Data[T]>)[], params?: any[]) => {
	const dat = DB.data[collection] as Jsonify<GetElementType<Data[T]>>[];

	if (conditions && params) {
		return dat.filter(element => conditions.every((condition, index) => (element as any)[condition] === params[index]));
	}

	return dat;
};

export const erase = <T extends Collection>(collection: T, conditions: (keyof GetElementType<Data[T]>)[], params: any[]): void => {
	//@ts-expect-error: Ts can't infer the type of the element
	DB.data[collection] = DB.data[collection].filter(element => !conditions.every((condition, index) => (element as any)[condition] === params[index]));
	DB.write().catch(console.error);
};

// @example
// read('users', ['id', 'email'], ['1', 'tim.tester@zalari.de']).at(0)?.ghId;

