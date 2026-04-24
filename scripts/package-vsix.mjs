import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const distDirectory = path.join(repositoryRoot, "dist");

async function removePreviousVsixFiles() {
  await mkdir(distDirectory, { recursive: true });
  const entries = await readdir(distDirectory, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".vsix"))
      .map((entry) => rm(path.join(distDirectory, entry.name))),
  );
}

function packageVsix() {
  const outputPath = path.join(
    distDirectory,
    `workspace-reviews-${process.env.npm_package_version}.vsix`,
  );

  return new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["vsce", "package", "--out", outputPath],
      {
        cwd: repositoryRoot,
        stdio: "inherit",
      },
    );

    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(`vsce package exited with code ${code ?? "unknown"}`));
    });

    child.on("error", reject);
  });
}

await removePreviousVsixFiles();
await packageVsix();
