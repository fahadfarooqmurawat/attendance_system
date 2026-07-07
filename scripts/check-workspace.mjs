import { readFile } from "node:fs/promises";
import { stdout } from "node:process";
import { URL } from "node:url";

const workspace = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

if (workspace.packageManager !== "pnpm@11.10.0") {
  throw new Error("Unexpected package manager version in package.json");
}

stdout.write("workspace scaffold looks consistent\n");
