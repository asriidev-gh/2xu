import type { MongoClient } from 'mongodb';

let indexesEnsured: Promise<void> | null = null;

/** Drops legacy unique index on users.email so the same email can register more than once. */
export function ensureUserIndexes(client: MongoClient): Promise<void> {
  if (!indexesEnsured) {
    indexesEnsured = (async () => {
      const collection = client.db('2xu').collection('users');
      const indexes = await collection.listIndexes().toArray();

      for (const index of indexes) {
        const keys = index.key as Record<string, number> | undefined;
        if (keys?.email === 1 && index.unique) {
          const name = index.name;
          if (name) {
            await collection.dropIndex(name);
          }
        }
      }

      await collection.createIndex({ email: 1 }, { unique: false, background: true });
    })().catch((err) => {
      indexesEnsured = null;
      throw err;
    });
  }

  return indexesEnsured;
}
