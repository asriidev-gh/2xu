import { MongoClient } from 'mongodb';

const uri = process.env.DATABASE_URL;
const options = {};

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    return Promise.reject(new Error('Please add DATABASE_URL to .env.local'));
  }
  if (process.env.NODE_ENV === 'development') {
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };
    if (!globalWithMongo._mongoClientPromise) {
      globalWithMongo._mongoClientPromise = new MongoClient(uri, options).connect();
    }
    return globalWithMongo._mongoClientPromise;
  }
  return new MongoClient(uri, options).connect();
}

const clientPromise = getClientPromise();

export default clientPromise;

