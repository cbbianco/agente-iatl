import { MongoClient } from "mongodb";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { loadConfig, getConfigPath } from "./config.js";

const DEFAULT_URI = process.env.IATL_MONGO_URI ?? "mongodb://127.0.0.1:27017";

let client;
let jsonDbClient;

class JSONDbMock {
  constructor(dbName) {
    this.dbName = dbName;
    const configPath = getConfigPath();
    this.filePath = join(dirname(configPath), `local-db-${dbName}.json`);
    this.data = {};
    this._load();
  }

  _load() {
    if (existsSync(this.filePath)) {
      try {
        this.data = JSON.parse(readFileSync(this.filePath, "utf8"));
      } catch (e) {
        this.data = {};
      }
    }
    const collections = ["knowledge_sources", "learnings", "peer_discussions", "review_findings", "pattern_evals"];
    for (const coll of collections) {
      if (!Array.isArray(this.data[coll])) {
        this.data[coll] = [];
      }
    }
  }

  _save() {
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf8");
  }

  _matches(item, filter) {
    if (!filter) return true;
    for (const key in filter) {
      const val = filter[key];
      if (val && typeof val === "object" && !Array.isArray(val)) {
        if ("$in" in val) {
          if (!Array.isArray(val.$in) || !val.$in.includes(item[key])) {
            return false;
          }
        } else if ("$regex" in val) {
          const regex = new RegExp(val.$regex, val.$options || "");
          if (!regex.test(item[key])) {
            return false;
          }
        }
      } else {
        if (item[key] !== val) {
          return false;
        }
      }
    }
    return true;
  }

  collection(name) {
    if (!Array.isArray(this.data[name])) {
      this.data[name] = [];
    }
    const self = this;
    return {
      async createIndex() { return {}; },
      async deleteMany(filter = {}) {
        const prevLen = self.data[name].length;
        self.data[name] = self.data[name].filter(item => !self._matches(item, filter));
        self._save();
        return { deletedCount: prevLen - self.data[name].length };
      },
      async insertMany(docs) {
        const added = docs.map(d => ({ _id: d._id || Math.random().toString(36).slice(2), ...d }));
        self.data[name].push(...added);
        self._save();
        return { insertedCount: added.length, insertedIds: added.map(d => d._id) };
      },
      async insertOne(doc) {
        const added = { _id: doc._id || Math.random().toString(36).slice(2), ...doc };
        self.data[name].push(added);
        self._save();
        return { insertedId: added._id };
      },
      find(filter = {}) {
        let results = self.data[name].filter(item => self._matches(item, filter));
        const cursor = {
          toArray: async () => results,
          sort: (sortObj) => {
            const key = Object.keys(sortObj)[0];
            const dir = sortObj[key];
            results.sort((a, b) => {
              if (a[key] < b[key]) return dir === -1 ? 1 : -1;
              if (a[key] > b[key]) return dir === -1 ? -1 : 1;
              return 0;
            });
            return cursor;
          },
          limit: (num) => {
            results = results.slice(0, num);
            return cursor;
          }
        };
        return cursor;
      },
      async findOne(filter = {}) {
        return self.data[name].find(item => self._matches(item, filter)) || null;
      },
      async updateOne(filter, update, options = {}) {
        const idx = self.data[name].findIndex(item => self._matches(item, filter));
        if (idx !== -1) {
          const item = self.data[name][idx];
          if (update.$set) {
            self.data[name][idx] = { ...item, ...update.$set };
          }
          self._save();
          return { matchedCount: 1, modifiedCount: 1 };
        } else if (options.upsert) {
          const newDoc = {
            _id: Math.random().toString(36).slice(2),
            ...filter,
          };
          if (update.$set) {
            Object.assign(newDoc, update.$set);
          }
          if (update.$setOnInsert) {
            Object.assign(newDoc, update.$setOnInsert);
          }
          self.data[name].push(newDoc);
          self._save();
          return { matchedCount: 0, modifiedCount: 0, upsertedId: newDoc._id, upsertedCount: 1 };
        }
        return { matchedCount: 0, modifiedCount: 0 };
      }
    };
  }
}

export async function getDb() {
  let config = {};
  try {
    config = loadConfig();
  } catch (e) {}

  const project = config.project ?? "pfi-backend-core";
  const normalizedProject = project.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "") || "default_project";
  const dbName = `iatl_knowledge_${normalizedProject}`;

  if (config.useLocalJsonDb) {
    if (!jsonDbClient) {
      jsonDbClient = new JSONDbMock(normalizedProject);
    }
    return jsonDbClient;
  }

  if (!client) {
    client = new MongoClient(DEFAULT_URI);
    await client.connect();
  }

  return client.db(dbName);
}

export async function closeDb() {
  if (client) {
    await client.close();
    client = undefined;
  }
  jsonDbClient = undefined;
}

export { DEFAULT_URI };
