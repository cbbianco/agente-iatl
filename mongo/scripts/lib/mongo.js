import { MongoClient } from "mongodb";

const DEFAULT_URI = process.env.IATL_MONGO_URI ?? "mongodb://127.0.0.1:27017";
const DEFAULT_DB = process.env.IATL_MONGO_DB ?? "iatl_knowledge";

let client;

export async function getDb() {
  if (!client) {
    client = new MongoClient(DEFAULT_URI);
    await client.connect();
  }
  return client.db(DEFAULT_DB);
}

export async function closeDb() {
  if (client) {
    await client.close();
    client = undefined;
  }
}

export { DEFAULT_URI, DEFAULT_DB };
