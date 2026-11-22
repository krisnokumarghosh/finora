import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGO_DB_URI;
const dbName = process.env.MONGODB_DATABASE_NAME;

if (!mongoUri) {
  throw new Error("MONGO_DB_URI is not defined in environment variables");
}

if (!dbName) {
  throw new Error("MONGODB_DATABASE_NAME is not defined in environment variables");
}

// Dev e hot reload hole bar bar notun client na khule, global e rakhi.
// MongoClient nijei prothom query te connect kore, alada connect() lagbe na.
const globalForMongo = globalThis as unknown as { _mongoClient?: MongoClient };

export const client = (globalForMongo._mongoClient ??= new MongoClient(mongoUri));
export const db = client.db(dbName);