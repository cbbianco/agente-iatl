import { existsSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { loadConfig } from "./config.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function getChromaConfig() {
  let project = "pfi-backend-core";
  let host = "127.0.0.1";
  let port = 8010;
  let collection = "iatl_semantic_knowledge";

  try {
    const config = loadConfig();
    if (config.project) project = config.project;
    if (config.chroma) {
      if (config.chroma.host) host = config.chroma.host;
      if (config.chroma.port) port = Number(config.chroma.port);
      if (config.chroma.collection) collection = config.chroma.collection;
    } else {
      // Generar dinámicamente si no está en config.json
      const projectSlug = project.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      let hash = 0;
      for (let i = 0; i < project.length; i++) {
        hash = project.charCodeAt(i) + ((hash << 5) - hash);
      }
      port = 8010 + (Math.abs(hash) % 80);
      collection = `iatl_semantic_${projectSlug}`;
    }
  } catch (e) {
    // Ignorar si falla lectura
  }

  const projectSlug = project.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const persistPath = process.env.IATL_CHROMA_PATH ?? join(ROOT, `chroma-data-${projectSlug}`);

  return {
    host: process.env.IATL_CHROMA_HOST ?? host,
    port: Number(process.env.IATL_CHROMA_PORT ?? port),
    collection: process.env.IATL_CHROMA_COLLECTION ?? collection,
    persistPath,
  };
}

const chromaCfg = getChromaConfig();
const COLLECTION_NAME = chromaCfg.collection;
const DEFAULT_PORT = chromaCfg.port;
const DEFAULT_HOST = chromaCfg.host;

let clientPromise;
let collectionPromise;
let serverPromise;

function persistPath() {
  return chromaCfg.persistPath;
}

async function heartbeat(host, port) {
  try {
    const res = await fetch(`http://${host}:${port}/api/v2/heartbeat`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForHeartbeat(host, port, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    if (await heartbeat(host, port)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function ensureServer() {
  if (!serverPromise) {
    serverPromise = (async () => {
      const host = DEFAULT_HOST;
      const port = DEFAULT_PORT;

      if (await heartbeat(host, port)) {
        return { host, port };
      }

      if (!existsSync(persistPath())) {
        mkdirSync(persistPath(), { recursive: true });
      }

      // IMPORTANTE: usar 'npx -y' para evitar prompts interactivos, bloqueando versión de compatibilidad
      const child = spawn(
        "npx",
        ["-y", "chromadb@3.0.14", "run", "--path", persistPath(), "--host", host, "--port", String(port)],
        { detached: true, stdio: "ignore", cwd: ROOT },
      );
      child.unref();

      const ok = await waitForHeartbeat(host, port);
      if (!ok) {
        throw new Error(
          `Chroma server no respondió en ${host}:${port}. Ejecuta: npx chroma run --path ${persistPath()} --port ${port}`,
        );
      }

      return { host, port };
    })();
  }
  return serverPromise;
}

async function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const { ChromaClient } = await import("chromadb");
      const { host, port } = await ensureServer();
      return new ChromaClient({ host, port, ssl: false });
    })();
  }
  return clientPromise;
}

async function getCollection() {
  if (!collectionPromise) {
    collectionPromise = (async () => {
      const client = await getClient();
      let embeddingFunction;
      try {
        const { DefaultEmbeddingFunction } = await import("@chroma-core/default-embed");
        embeddingFunction = new DefaultEmbeddingFunction();
      } catch {
        embeddingFunction = undefined;
      }

      return client.getOrCreateCollection({
        name: COLLECTION_NAME,
        embeddingFunction,
        metadata: { hub: "iatl", version: 2 },
      });
    })();
  }
  return collectionPromise;
}

/**
 * @param {object} input
 * @param {string} input.text
 * @param {string} [input.id]
 * @param {Record<string, string | number | boolean>} [input.metadata]
 */
export async function upsertDocument({ text, id, metadata = {} }) {
  if (!text?.trim()) {
    return { skipped: true, reason: "empty text" };
  }

  const collection = await getCollection();
  const docId = id ?? randomUUID();
  const cleanMeta = Object.fromEntries(
    Object.entries(metadata)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : v]),
  );

  await collection.upsert({
    ids: [docId],
    documents: [text.trim()],
    metadatas: [{ ...cleanMeta, updatedAt: new Date().toISOString() }],
  });

  return { id: docId, collection: COLLECTION_NAME };
}

/**
 * @param {string} query
 * @param {object} [opts]
 * @param {number} [opts.limit]
 * @param {Record<string, unknown>} [opts.where]
 */
export async function semanticSearch(query, opts = {}) {
  const collection = await getCollection();
  const limit = Number(opts.limit ?? 8);
  const result = await collection.query({
    queryTexts: [query],
    nResults: limit,
    where: opts.where,
  });

  const rows = [];
  const ids = result.ids?.[0] ?? [];
  const docs = result.documents?.[0] ?? [];
  const metas = result.metadatas?.[0] ?? [];
  const distances = result.distances?.[0] ?? [];

  for (let i = 0; i < ids.length; i++) {
    rows.push({
      id: ids[i],
      text: docs[i],
      metadata: metas[i] ?? {},
      distance: distances[i],
    });
  }

  return rows;
}

export async function chromaHealth() {
  try {
    const { host, port } = await ensureServer();
    const client = await getClient();
    const heartbeatNs = await client.heartbeat();
    const collection = await getCollection();
    const count = await collection.count();
    return {
      ok: true,
      heartbeat: heartbeatNs,
      host,
      port,
      collection: COLLECTION_NAME,
      path: persistPath(),
      count,
    };
  } catch (err) {
    return { ok: false, error: err.message, path: persistPath(), port: DEFAULT_PORT };
  }
}

export function resetChromaCache() {
  clientPromise = undefined;
  collectionPromise = undefined;
  serverPromise = undefined;
}
