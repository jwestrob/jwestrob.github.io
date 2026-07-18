#!/usr/bin/env node
/**
 * Stage the plain static site in the existing deployment convention.
 *
 * dist/client contains the exact public tree. dist/server/index.js is a small
 * Cloudflare Worker that delegates to the platform's static-asset binding.
 */

import { cp, mkdir, rm, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const CLIENT = join(DIST, "client");
const SERVER = join(DIST, "server");

const PUBLIC_FILES = [
  "index.html",
  "styles.css",
  "robots.txt",
  "sitemap.xml",
  "favicon.svg",
  "favicon-32.png",
  "apple-touch-icon.png",
  "research.html",
  "art.html",
  "heliophase.html",
  "hyperspin.html",
  "quaternion_julia.html",
  "quasicrystal.html",
  "_headers",
];

const PUBLIC_DIRECTORIES = [
  "about",
  "projects",
  "publications",
  "writing",
  "cv",
  "art",
  "links",
  "contact",
  "js",
  "data",
  "assets/art",
  "assets/css",
  "assets/js",
  "assets/poster",
];

await rm(DIST, { recursive: true, force: true });
await mkdir(CLIENT, { recursive: true });
await mkdir(SERVER, { recursive: true });

for (const file of PUBLIC_FILES) {
  await cp(join(ROOT, file), join(CLIENT, file));
}

for (const directory of PUBLIC_DIRECTORIES) {
  await mkdir(dirname(join(CLIENT, directory)), { recursive: true });
  await cp(join(ROOT, directory), join(CLIENT, directory), {
    recursive: true,
  });
}

await cp(join(ROOT, "worker", "index.js"), join(SERVER, "index.js"));

const required = [
  join(CLIENT, "index.html"),
  join(CLIENT, "about", "index.html"),
  join(CLIENT, "projects", "index.html"),
  join(CLIENT, "publications", "index.html"),
  join(CLIENT, "contact", "index.html"),
  join(CLIENT, "js", "site.js"),
  join(CLIENT, "data", "scholar.json"),
  join(CLIENT, "data", "structures", "protein-fragment.json"),
  join(SERVER, "index.js"),
];

for (const path of required) {
  const details = await stat(path);
  if (!details.isFile() || details.size === 0) {
    throw new Error(`Invalid build artifact: ${path}`);
  }
}

console.log("Sites build staged in dist/client + dist/server");
