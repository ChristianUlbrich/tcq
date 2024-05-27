// import Database from 'better-sqlite3';
import { Database } from 'bun:sqlite';
import { resolve } from 'node:path';
import type { IDBManager } from '@tc39/typings';

export type table = 'users' | 'meetings' | 'agendaItems' | 'topics' | 'chairs';

class DBMngr implements IDBManager {
	#db;

	constructor(dbPath: string) {
		this.#db = new Database(dbPath);
		this.#db.exec('PRAGMA journal_mode = WAL;');
		this.#db.exec(`
			CREATE TABLE IF NOT EXISTS users (
				id TEXT PRIMARY KEY NOT NULL,
				name TEXT NOT NULL,
				email TEXT NOT NULL,
				ghId INTEGER,
				organization TEXT,
				isChair BOOLEAN NOT NULL DEFAULT FALSE,
				lastLogin DATE DEFAULT CURRENT_TIMESTAMP,
				token TEXT NOT NULL
			);
			CREATE TABLE IF NOT EXISTS meetings (
				id TEXT PRIMARY KEY NOT NULL,
				title TEXT NOT NULL,
				startDate DATE NOT NULL,
				endDate DATE NOT NULL,
				location TEXT NOT NULL,
				status TEXT NOT NULL DEFAULT 'planned'
			);
			CREATE TABLE IF NOT EXISTS agendaItems (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				meetingId TEXT NOT NULL,
				name TEXT NOT NULL,
				userName TEXT NOT NULL,
				description TEXT,
				timebox INTEGER,
				weight INTEGER NOT NULL DEFAULT 0,
				FOREIGN KEY(meetingId) REFERENCES meetings(id)
			);
			CREATE TABLE IF NOT EXISTS chairs (
				meetingId TEXT NOT NULL,
				userGhId INTEGER NOT NULL,
				FOREIGN KEY(meetingId) REFERENCES meetings(id),
				PRIMARY KEY (meetingId, userGhId)
			);
			CREATE INDEX IF NOT EXISTS idx_users_ghId ON users (ghId);
			CREATE INDEX IF NOT EXISTS idx_agendaItems_meetingId ON agendaItems (meetingId);
		`);
	}

	upsert(table: table, data: Record<string, unknown>) {
		const keys = Object.keys(data);
		const values = Object.values(data);
		const placeholders = Array(keys.length).fill('?').join(',');

		const stmt = this.#db.prepare(`
			INSERT INTO ${table} (${keys.join(',')})
			VALUES (${placeholders})
			ON CONFLICT(id) DO UPDATE SET ${keys.map(key => `${key}=excluded.${key}`).join(',')}
		`);
		//@ts-ignore - 'unknown[]' is not assignable to type 'SQLQueryBindings[] | [null] | [string] | [number] | [bigint] | [false] | [true] | [Uint8Array] | [Uint8ClampedArray] | [Uint16Array] | ... 8 more ... | [...]
		stmt.run(...values);
	}

	read(table: table, conditions = '', params: unknown[] = []) {
		const stmt = this.#db.query(`SELECT * FROM ${table} ${conditions}`);
		//@ts-ignore - 'unknown[]' is not assignable to type 'SQLQueryBindings[] | [null] | [string] | [number] | [bigint] | [false] | [true] | [Uint8Array] | [Uint8ClampedArray] | [Uint16Array] | ... 8 more ... | [...]
		return stmt.all(...params);
	}

	delete(table: table, conditions = '', params: unknown[] = []) {
		const stmt = this.#db.prepare(`DELETE FROM ${table} ${conditions}`);
		//@ts-ignore - 'unknown[]' is not assignable to type 'SQLQueryBindings[] | [null] | [string] | [number] | [bigint] | [false] | [true] | [Uint8Array] | [Uint8ClampedArray] | [Uint16Array] | ... 8 more ... | [...]
		stmt.run(...params);
	}
}

const DB = new DBMngr(resolve(import.meta.dir, '../', 'db.sqlite'));

export { DB };
