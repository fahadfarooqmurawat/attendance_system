import { readFile } from "node:fs/promises";

const workspace = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

if (workspace.packageManager !== "pnpm@11.5.0") {
  throw new Error("Unexpected package manager version in package.json");
}

console.log("workspace scaffold looks consistent");
