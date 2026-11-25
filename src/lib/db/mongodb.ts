import { MongoClient, type MongoClientOptions } from "mongodb";

const mongoUri = process.env.MONGO_DB_URI;
const dbName = process.env.MONGODB_DATABASE_NAME;

if (!mongoUri) {
  throw new Error("MONGO_DB_URI is not defined in environment variables");
}

if (!dbName) {
  throw new Error("MONGODB_DATABASE_NAME is not defined in environment variables");
}

const mongoOptions: MongoClientOptions = {
  // Keep pool small in serverless so concurrent instances do not exhaust Atlas limits.
  maxPoolSize: 10,
  minPoolSize: 0,
  // Close idle connections before Vercel/Atlas drops them silently.
  maxIdleTimeMS: 30000,
  // Fail fast on unreachable primary instead of hanging for 30s.
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

// Dev e hot reload hole bar bar notun client na khule, global e rakhi.
const globalForMongo = globalThis as unknown as {
  _mongoClient?: MongoClient;
  _mongoListenersAttached?: boolean;
};

export const client = (globalForMongo._mongoClient ??= new MongoClient(
  mongoUri,
  mongoOptions
));

// In mongodb v7, if initial autoConnect fails, topology.close() leaves client.topology
// non-null in a closed state, causing every future query to throw MongoTopologyClosedError.
// Clearing it on topologyClosed lets the next operation reconnect cleanly.
if (!globalForMongo._mongoListenersAttached) {
  globalForMongo._mongoListenersAttached = true;
  client.on("topologyClosed", () => {
    const internalClient = client as unknown as {
      topology?: unknown;
      s?: { hasBeenClosed?: boolean };
    };
    if (!internalClient.s?.hasBeenClosed) {
      internalClient.topology = undefined;
    }
  });
}

export const ensureDbConnected = async (): Promise<MongoClient> => {
  return client.connect();
};

export const db = client.db(dbName);