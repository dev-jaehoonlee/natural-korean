import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

assert.ok(process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === "--remote"),
  "Usage: node scripts/smoke-install.mjs [--remote]");
const remote = process.argv[2] === "--remote";
const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const packageRoot = path.join(root, "plugins/natural-korean");
const manifest = JSON.parse(readFileSync(path.join(packageRoot, ".codex-plugin/plugin.json"), "utf8"));
const pluginId = "natural-korean@natural-korean-marketplace";
// Native realpath also expands Windows 8.3 names such as RUNNER~1. Codex
// returns the expanded path, which must compare equal to our temporary root.
const work = realpathSync.native(mkdtempSync(path.join(os.tmpdir(), "natural-korean-install-")));
const env = {
  ...process.env,
  CODEX_HOME: path.join(work, "codex"),
  CLAUDE_CONFIG_DIR: path.join(work, "claude"),
  NATURAL_KOREAN_SOURCE: root,
};
mkdirSync(env.CODEX_HOME);
mkdirSync(env.CLAUDE_CONFIG_DIR);
mkdirSync(path.join(work, "project"));

if (remote) {
  // Prove public Git access without using the developer's credential helpers,
  // URL rewrites, authorization headers, or GitHub tokens.
  for (const key of Object.keys(env)) {
    if (/^(?:GIT_CONFIG|GH_|GITHUB_|GIT_ASKPASS$|SSH_ASKPASS$)/i.test(key)) delete env[key];
  }
  const gitConfig = path.join(work, "gitconfig");
  writeFileSync(gitConfig, "");
  Object.assign(env, {
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: gitConfig,
    GIT_CONFIG_COUNT: "2",
    GIT_CONFIG_KEY_0: "credential.helper",
    GIT_CONFIG_VALUE_0: "",
    GIT_CONFIG_KEY_1: "http.extraHeader",
    GIT_CONFIG_VALUE_1: "",
    GIT_TERMINAL_PROMPT: "0",
    GCM_INTERACTIVE: "Never",
  });
}

const codex = "npx --yes --package @openai/codex@0.153.4 codex";
const claude = "npx --yes --package @anthropic-ai/claude-code@2.1.63 claude";
// Commands and remote source are fixed strings, never arbitrary user input.
// Expand the local path inside quotes so spaces work in both cmd.exe and sh.
const source = remote ? "dev-jaehoonlee/natural-korean"
  : process.platform === "win32" ? '"%NATURAL_KOREAN_SOURCE%"' : '"$NATURAL_KOREAN_SOURCE"';
function run(command) {
  return execSync(command, {
    cwd: path.join(work, "project"), env, encoding: "utf8", timeout: 180_000,
    stdio: ["ignore", "pipe", "pipe"],
  });
}
function verifyFiles(installedPath) {
  const installedRoot = realpathSync.native(installedPath);
  const relative = path.relative(work, installedRoot);
  assert.ok(relative && !path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`),
    "Installed files must stay inside the temporary environment");
  let checked = 0;
  function visit(directory = "") {
    for (const entry of readdirSync(path.join(packageRoot, directory), { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else {
        assert.ok(entry.isFile(), `Unsupported package entry: ${file}`);
        assert.deepEqual(readFileSync(path.join(installedRoot, file)), readFileSync(path.join(packageRoot, file)),
          `Installed file differs: ${file}`);
        checked++;
      }
    }
  }
  visit();
  return checked;
}

try {
  console.log(`Checking ${remote ? "public GitHub" : "local"} marketplace in temporary user settings.`);
  run(`${codex} plugin marketplace add ${source} --json`);
  const codexInstall = JSON.parse(run(`${codex} plugin add ${pluginId} --json`));
  const codexList = JSON.parse(run(`${codex} plugin list --json`));
  const codexEntry = codexList.installed.find((entry) => entry.pluginId === pluginId);
  assert.ok(codexEntry?.installed && codexEntry.enabled, "Codex plugin must be installed and enabled");
  assert.equal(codexEntry.version, manifest.version);
  if (remote) assert.notEqual(codexEntry.marketplaceSource.sourceType, "local", "Must install from GitHub");
  console.log(`Codex ${manifest.version}: enabled; ${verifyFiles(codexInstall.installedPath)} package files match.`);

  run(`${claude} plugin marketplace add ${source}`);
  run(`${claude} plugin install ${pluginId}`);
  const claudeList = JSON.parse(run(`${claude} plugin list --json`));
  const claudeEntry = claudeList.find((entry) => entry.id === pluginId);
  assert.ok(claudeEntry?.enabled, "Claude Code plugin must be enabled");
  assert.equal(claudeEntry.scope, "user");
  assert.equal(claudeEntry.version, manifest.version);
  console.log(`Claude Code ${manifest.version}: enabled; ${verifyFiles(claudeEntry.installPath)} package files match.`);

  // Only remove the specific temporary directory created above after success.
  assert.equal(path.dirname(realpathSync.native(work)), realpathSync.native(os.tmpdir()));
  assert.ok(path.basename(work).startsWith("natural-korean-install-"));
  rmSync(work, { recursive: true, force: true });
  console.log("Install checks passed. No model calls were made.");
} catch (error) {
  console.error(error.message);
  if (error.stderr) console.error(String(error.stderr));
  console.error(`Validation artifacts retained at: ${work}`);
  process.exitCode = 1;
}
