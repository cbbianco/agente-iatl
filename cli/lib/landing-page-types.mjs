import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const TYPES_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "landing-page-types.json");

/** @type {{ landingPageTypes: Array<{ id: string, label: string, description: string, defaultTitle: string, defaultContext: string, layoutAsset: string }> }} */
const registry = JSON.parse(readFileSync(TYPES_PATH, "utf8"));

export const LANDING_PAGE_TYPES = registry.landingPageTypes;

/**
 * @param {string} [id]
 */
export function getLandingPageType(id) {
  return LANDING_PAGE_TYPES.find((t) => t.id === id) ?? LANDING_PAGE_TYPES[0];
}

export function loadLandingPageTypesRegistry() {
  return registry;
}
