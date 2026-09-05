import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = mkdtempSync(path.join(os.tmpdir(), "natural-korean-check-"));
const files = [...new Set(execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
  cwd: root, encoding: "utf8",
}).split("\0").filter(Boolean))];
for (const file of files) {
  const target = path.join(fixture, file);
  mkdirSync(path.dirname(target), { recursive: true });
  copyFileSync(path.join(root, file), target);
}
execFileSync("git", ["init", "--quiet"], { cwd: fixture });
execFileSync("git", ["add", "."], { cwd: fixture, stdio: "pipe" });

after(() => {
  // Only remove the isolated directory created by mkdtemp above.
  assert.equal(path.dirname(realpathSync(fixture)), realpathSync(os.tmpdir()));
  assert.ok(path.basename(fixture).startsWith("natural-korean-check-"));
  rmSync(fixture, { recursive: true, force: true });
});

function check() {
  return spawnSync(process.execPath, [path.join(root, "scripts/check-package.mjs"), fixture], { encoding: "utf8" });
}
function rejectChange(name, file, edit, expected) {
  test(name, () => {
    const target = path.join(fixture, file);
    const original = readFileSync(target, "utf8");
    const changed = edit(original);
    assert.notEqual(changed, original, "Test must change the fixture");
    try {
      writeFileSync(target, changed);
      const result = check();
      assert.equal(result.status, 1);
      assert.match(result.stderr, expected);
    } finally {
      writeFileSync(target, original);
    }
  });
}
const plugin = "plugins/natural-korean";
const changeJson = (key, value) => (text) => JSON.stringify({ ...JSON.parse(text), [key]: value }, null, 2) + "\n";

test("valid repository passes", () => {
  const result = check();
  assert.equal(result.status, 0, result.stderr);
});
rejectChange("different plugin versions fail", `${plugin}/.codex-plugin/plugin.json`, changeJson("version", "99.0.0"), /Plugin metadata differs: version/);
rejectChange("different publisher metadata fails", `${plugin}/.codex-plugin/plugin.json`, changeJson("author", { name: "Different publisher" }), /Plugin metadata differs: author/);
rejectChange("different display publisher fails", `${plugin}/.codex-plugin/plugin.json`, (text) => {
  const manifest = JSON.parse(text);
  manifest.interface.developerName = "Different publisher";
  return JSON.stringify(manifest, null, 2) + "\n";
}, /Codex developer name differs/);
rejectChange("missing component directory fails", `${plugin}/.codex-plugin/plugin.json`, changeJson("skills", "./missing/"), /target does not exist/);
rejectChange("different marketplace names fail", ".claude-plugin/marketplace.json", changeJson("name", "wrong-marketplace"), /Marketplace names differ/);
rejectChange("diverging output styles fail", `${plugin}/output-styles/natural-korean-writing.md`, (text) => text + "\nUnintended difference.\n", /Output style bodies differ/);
rejectChange("writing style cannot silently enable coding instructions", `${plugin}/output-styles/natural-korean-writing.md`, (text) => text.replace("keep-coding-instructions: false", "keep-coding-instructions: true"), /Writing style must explicitly omit/);
rejectChange("broken local links fail", "README.md", (text) => text + "\n[missing](missing.md)\n", /broken local link/);
rejectChange("missing Markdown headings fail", "README.md", (text) => text + "\n[missing](CONTRIBUTING.md#does-not-exist)\n", /heading does not exist/);
rejectChange("skill references cannot leave the distributed package", `${plugin}/skills/natural-korean/SKILL.md`, (text) => text + "\n[repository readme](../../../../README.md)\n", /link leaves its package/);
rejectChange("license divergence fails", `${plugin}/LICENSE`, (text) => text + "\nChanged terms.\n", /Bundled LICENSE differs/);
rejectChange("CRLF is rejected by the repository format policy", "README.md", (text) => text.replaceAll("\n", "\r\n"), /use LF and a final newline/);
rejectChange("UTF-8 BOM is rejected", "README.md", (text) => "\uFEFF" + text, /UTF-8 BOM is not allowed/);
