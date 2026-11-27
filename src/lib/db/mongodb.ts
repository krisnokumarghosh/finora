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
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

const globalForMongo = globalThis as unknown as {
  _mongoClient?: MongoClient;
  _mongoListenersAttached?: boolean;
};

export const client = (globalForMongo._mongoClient ??= new MongoClient(
  mongoUri,
  mongoOptions
));

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