import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "@better-auth/mongo-adapter";

const mongoUri = process.env.MONGO_DB_URI;
const dbName = process.env.MONGODB_DATABASE_NAME;

if (!mongoUri) {
  throw new Error("MONGO_DB_URI is not defined in environment variables");
}

if (!dbName) {
  throw new Error(
    "MONGODB_DATABASE_NAME is not defined in environment variables",
  );
}

const client = new MongoClient(mongoUri);
const db = client.db(dbName);

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
  },
});
