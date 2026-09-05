import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const root = path.resolve(process.argv[2] ?? fileURLToPath(new URL("../", import.meta.url)));
const errors = [];
const requireThat = (condition, message) => {
  if (!condition) errors.push(message);
};
const read = (relative) => readFileSync(path.join(root, relative), "utf8");
const json = (relative) => JSON.parse(read(relative));
const inside = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === "" || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
};

function checkPath(base, relative, label, directory = false) {
  requireThat(typeof relative === "string" && relative.startsWith("./"), `${label}: use a ./-prefixed path`);
  if (typeof relative !== "string") return;
  const target = path.resolve(base, relative);
  if (!inside(base, target)) {
    errors.push(`${label}: path leaves its package`);
    return;
  }
  try {
    requireThat(inside(realpathSync(base), realpathSync(target)), `${label}: resolved path leaves its package`);
    requireThat(directory ? statSync(target).isDirectory() : statSync(target).isFile(), `${label}: wrong file type`);
  } catch {
    errors.push(`${label}: target does not exist`);
  }
}

function frontmatter(relative) {
  const source = read(relative);
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${relative}: missing YAML frontmatter`);
  // These files use single-line names/descriptions. Full manifest validation is
  // also run with the platform validators; this checks shared repository rules.
  const field = (key) => match[1].match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]?.trim();
  requireThat(Boolean(field("name")) && Boolean(field("description")), `${relative}: name and description are required`);
  return { field, body: match[2] };
}

function headings(source) {
  const counts = new Map();
  return new Set([...source.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => {
    const slug = match[1].replace(/\s+#+\s*$/, "").toLowerCase()
      .replace(/[^\p{L}\p{N}\p{M}_\-\s]/gu, "").replace(/\s/g, "-");
    const count = counts.get(slug) ?? 0;
    counts.set(slug, count + 1);
    return count ? `${slug}-${count}` : slug;
  }));
}

try {
  const plugin = "plugins/natural-korean";
  const pluginRoot = path.join(root, plugin);
  const claude = json(`${plugin}/.claude-plugin/plugin.json`);
  const codex = json(`${plugin}/.codex-plugin/plugin.json`);
  for (const field of ["name", "version", "author", "homepage", "repository", "license", "keywords"]) {
    requireThat(isDeepStrictEqual(claude[field], codex[field]), `Plugin metadata differs: ${field}`);
  }
  requireThat(codex.name === path.basename(pluginRoot), "Plugin name must match its folder");
  requireThat(/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(codex.version), "Use a release version without local cache metadata");
  const latestRelease = read("CHANGELOG.md").match(/^## (\S+) — \d{4}-\d{2}-\d{2}$/m)?.[1];
  requireThat(latestRelease === codex.version, "Latest changelog version must match both plugins");
  requireThat(read("LICENSE") === read(`${plugin}/LICENSE`), "Bundled LICENSE differs from repository LICENSE");
  requireThat(codex.interface.developerName === codex.author.name, "Codex developer name differs from plugin author");
  checkPath(pluginRoot, codex.skills, "Codex skills", true);
  checkPath(pluginRoot, claude.outputStyles, "Claude Code outputStyles", true);
  requireThat(path.resolve(pluginRoot, codex.skills) === path.join(pluginRoot, "skills"), "Codex skills must use the documented skills directory");
  requireThat(path.resolve(pluginRoot, claude.outputStyles) === path.join(pluginRoot, "output-styles"), "Claude Code styles must use the documented output-styles directory");

  const claudeMarket = json(".claude-plugin/marketplace.json");
  const codexMarket = json(".agents/plugins/marketplace.json");
  requireThat(claudeMarket.name === codexMarket.name, "Marketplace names differ");
  requireThat(claudeMarket.owner.name === codex.author.name, "Marketplace owner differs from plugin author");
  for (const [platform, market] of [["Claude Code", claudeMarket], ["Codex", codexMarket]]) {
    requireThat(market.plugins.length === 1, `${platform}: expected one shared plugin`);
    const entry = market.plugins[0];
    requireThat(entry.name === codex.name, `${platform}: marketplace plugin name differs`);
    requireThat(!Object.hasOwn(entry, "version"), `${platform}: do not duplicate the plugin version`);
    const source = platform === "Codex" ? entry.source.path : entry.source;
    checkPath(root, source, `${platform} marketplace source`, true);
    requireThat(path.resolve(root, source) === pluginRoot, `${platform}: source must point to the shared plugin`);
  }
  const codexEntry = codexMarket.plugins[0];
  requireThat(codexEntry.source.source === "local", "Codex marketplace must bundle the local plugin");
  requireThat(codexEntry.policy.installation === "AVAILABLE", "Codex installation policy must be AVAILABLE");
  requireThat(codexEntry.policy.authentication === "ON_INSTALL", "Codex authentication policy must be ON_INSTALL");
  requireThat(codexEntry.category === codex.interface.category, "Codex categories differ");

  const skill = frontmatter(`${plugin}/skills/natural-korean/SKILL.md`);
  requireThat(skill.field("name") === codex.name, "Skill name differs from the public invocation name");
  const coding = frontmatter(`${plugin}/output-styles/natural-korean.md`);
  const writing = frontmatter(`${plugin}/output-styles/natural-korean-writing.md`);
  requireThat(coding.field("name") === "natural-korean", "Coding style name differs");
  requireThat(writing.field("name") === "natural-korean-writing", "Writing style name differs");
  requireThat(coding.field("keep-coding-instructions") === "true", "Coding style must keep coding instructions");
  requireThat(writing.field("keep-coding-instructions") === "false", "Writing style must explicitly omit coding instructions");
  requireThat(coding.body === writing.body, "Output style bodies differ");
  requireThat(/^@AGENTS\.md$/m.test(read("CLAUDE.md")), "CLAUDE.md must import shared AGENTS.md");

  const files = [...new Set(execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
    cwd: root, encoding: "utf8",
  }).split("\0").filter(Boolean))];
  let links = 0;
  for (const file of files) {
    const bytes = readFileSync(path.join(root, file));
    const source = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
    requireThat(!source.startsWith("\uFEFF"), `${file}: UTF-8 BOM is not allowed`);
    requireThat(!source.includes("\r") && source.endsWith("\n"), `${file}: use LF and a final newline`);
    if (!file.endsWith(".md")) continue;
    const prose = source.replace(/^ *```[^\n]*\n[\s\S]*?^ *```[^\n]*$/gm, "");
    for (const match of prose.matchAll(/\[[^\]\n]+\]\(([^)\n]+)\)/g)) {
      const target = match[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
      const [relative, fragment] = target.split("#");
      const resolved = relative ? path.resolve(root, path.dirname(file), decodeURIComponent(relative)) : path.join(root, file);
      const boundary = inside(pluginRoot, path.join(root, file)) ? pluginRoot : root;
      requireThat(inside(boundary, resolved), `${file}: link leaves its package: ${target}`);
      try {
        requireThat(inside(realpathSync(boundary), realpathSync(resolved)), `${file}: resolved link leaves its package: ${target}`);
        requireThat(statSync(resolved).isFile(), `${file}: link target is not a file: ${target}`);
        if (fragment && resolved.endsWith(".md")) {
          requireThat(headings(readFileSync(resolved, "utf8")).has(decodeURIComponent(fragment)), `${file}: heading does not exist: ${target}`);
        }
      } catch {
        errors.push(`${file}: broken local link: ${target}`);
      }
      links++;
    }
  }
  if (!errors.length) console.log(`Package checks passed: ${files.length} files, ${links} local links, version ${codex.version}.`);
} catch (error) {
  errors.push(error.message);
}
if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
}
