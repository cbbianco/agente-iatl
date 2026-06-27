import { MongoClient } from "mongodb";
import { loadConfig } from "./config.js";

const DEFAULT_URI = process.env.IATL_MONGO_URI ?? "mongodb://127.0.0.1:27017";

let client;

export async function getDb() {
  if (!client) {
    client = new MongoClient(DEFAULT_URI);
    await client.connect();
  }

  let dbName = process.env.IATL_MONGO_DB;
  if (!dbName) {
    try {
      const config = loadConfig();
      const project = config.project ?? "pfi-backend-core";
      const normalizedProject = project.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      dbName = `iatl_knowledge_${normalizedProject}`;
    } catch (err) {
      dbName = "iatl_knowledge";
    }
  }

  return client.db(dbName);
}

export async function closeDb() {
  if (client) {
    await client.close();
    client = undefined;
  }
}

export { DEFAULT_URI };
