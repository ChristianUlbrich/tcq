import * as db from './db';
import {
  DocumentClient,
  DatabaseMeta,
  QueryError,
  SqlQuerySpec,
  CollectionMeta,
  RetrievedDocument,
  NewDocument
} from 'documentdb';
import { CDB_SECRET } from './secrets';

const host = db.HOST;
const masterKey = CDB_SECRET;
if (!host) throw new Error('Missing DB_URI');
const client = new DocumentClient(host, { masterKey: masterKey });

export function createDocument(
  collection: CollectionMeta,
  newDocument: NewDocument
): Promise<RetrievedDocument> {
  return new Promise((resolve, reject) => {
    client.createDocument(collection._self, newDocument, (err, resource) => {
      if (err) {
        reject(err);
      } else {
        resolve(resource);
      }
    });
  });
}

export function replaceDocument<T extends RetrievedDocument>(
  collection: CollectionMeta,
  originalDocument: RetrievedDocument,
  updates: Partial<T>
): Promise<RetrievedDocument> {
  const updatedDocument = { ...originalDocument, ...(updates as any) } as T;
  return new Promise((resolve, reject) => {
    client.replaceDocument(collection._self, updatedDocument, (err, resource) => {
      if (err) {
        reject(err);
      } else {
        resolve(resource);
      }
    });
  });
}

export function getDatabaseById(id: string): Promise<DatabaseMeta> {
  return new Promise((resolve, reject) => {
    client
      .queryDatabases(makeIdQuery(id))
      .toArray(queryResolverRejecter('database', resolve, reject));
  });
}

export function getCollectionById(id: string, database: DatabaseMeta): Promise<CollectionMeta> {
  return new Promise((resolve, reject) => {
    client
      .queryCollections(database._self, makeIdQuery(id))
      .toArray(queryResolverRejecter('collection', resolve, reject));
  });
}

export function getDocumentById(
  id: string,
  collection: CollectionMeta
): Promise<RetrievedDocument> {
  return new Promise((resolve, reject) => {
    client
      .queryDocuments(collection._self, makeIdQuery(id))
      .toArray(queryResolverRejecter('document', resolve, reject));
  });
}

function makeIdQuery(id: string): SqlQuerySpec {
  return {
    query: 'SELECT * FROM root r WHERE r.id=@id',
    parameters: [
      {
        name: '@id',
        value: id
      }
    ]
  };
}

function queryResolverRejecter<T>(
  resourceType: string,
  resolve: (element: T) => void,
  reject: (err: any) => void
) {
  return (err: QueryError, resource: T[]) => {
    if (err) {
      reject(err);
    } else if (resource.length !== 1) {
      reject(
        new Error(
          `Expected a single ${resourceType} of a given ID, got ${resource.length}:\n` +
          JSON.stringify(resource)
        )
      );
    } else {
      resolve(resource[0]);
    }
  };
}
