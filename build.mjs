// Markdown -> static HTML. Single newlines become <br>, as in Obsidian
// with "Strict line breaks" turned off.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import footnote from "markdown-it-footnote";

const SRC = process.env.NOTES_DIR || "notes"; // "." publishes the whole repo root
const OUT = "dist";
const SKIP_DIRS = new Set(["node_modules", OUT, ".git", ".github", ".obsidian", ".trash"]);
const ASSET_RE = /\.(png|jpe?g|gif|svg|webp|avif|pdf|mp3|mp4|m4a|webm|ogg|wav)$/i;

const md = new MarkdownIt({ html: true, breaks: true, linkify: true, typographer: true }).use(footnote);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const posix = (p) => p.split(path.sep).join("/");
const parentOf = (s) => (s.includes("/") ? s.slice(0, s.lastIndexOf("/")) : "");
const fmtDate = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith(".") || SKIP_DIRS.has(e.name)) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

if (!fs.existsSync(SRC)) {
  console.error(`Notes folder "${SRC}" not found. Create it, or set NOTES_DIR.`);
  process.exit(1);
}
const files = walk(SRC);
const mdFiles = files.filter((f) => /\.md$/i.test(f));
console.log(`Source: ${SRC}  (${mdFiles.length} markdown files found)`);

const slugOf = (f) => {
  let s = posix(path.relative(SRC, f)).replace(/\.md$/i, "");
  if (path.basename(s).toLowerCase() === "index") s = parentOf(s); // folder/index.md -> folder
  return s;
};
const known = new Map(mdFiles.map((f) => [path.basename(f).replace(/\.md$/i, "").toLowerCase(), slugOf(f)]));

// Obsidian syntax: ![[image.png]], [[Note]], [[Note|label]], %%comments%%
function obsidian(src, depth) {
  const up = "../".repeat(depth);
  return src
    .replace(/%%[\s\S]*?%%/g, "")
    .replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, f, alt) => `![${alt ?? ""}](${up}${encodeURI(f.trim())})`)
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, n, label) => {
      const slug = known.get(n.trim().toLowerCase());
      return slug !== undefined ? `[${label ?? n}](${up}${slug ? encodeURI(slug) + "/" : ""})` : (label ?? n);
    });
}

const page = (title, body, depth) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="${"../".repeat(depth)}style.css">
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;
const write = (slug, html) => {
  const dest = path.join(OUT, slug, "index.html");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.copyFileSync("style.css", path.join(OUT, "style.css"));
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

for (const f of files.filter((f) => ASSET_RE.test(f))) {
  const dest = path.join(OUT, path.relative(SRC, f));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(f, dest);
}

const notes = [];
let skipped = 0;
for (const f of mdFiles) {
  const { data, content } = matter(fs.readFileSync(f, "utf8"));
  if (data.publish === false || data.draft) { skipped++; continue; }
  const slug = slugOf(f);
  const depth = slug ? slug.split("/").length : 0;
  const title = data.title ?? path.basename(f).replace(/\.md$/i, "");
  const body = md.render(obsidian(content, depth));
  const isIndex = path.basename(f).toLowerCase() === "index.md";
  write(slug, page(title, `<h1>${esc(title)}</h1>\n${body}`, depth));
  notes.push({ title, slug, isIndex, date: data.date ? fmtDate(data.date) : "" });
}

// Every folder containing a note gets a listing page, unless it has its own index.md
const dirs = new Set([""]);
for (const n of notes) for (let d = n.isIndex ? n.slug : parentOf(n.slug); ; d = parentOf(d)) { dirs.add(d); if (!d) break; }
const owned = new Map(notes.filter((n) => n.isIndex).map((n) => [n.slug, n]));

for (const dir of dirs) {
  if (owned.has(dir)) continue;
  const depth = dir ? dir.split("/").length : 0;
  const folders = [...dirs].filter((d) => d && parentOf(d) === dir).sort();
  const items = notes.filter((n) => !n.isIndex && parentOf(n.slug) === dir)
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title));
  const rel = (s) => encodeURI(s.slice(dir ? dir.length + 1 : 0)) + "/";
  const li = [
    ...folders.map((d) => `<li class="folder"><a href="${rel(d)}">${esc(owned.get(d)?.title ?? d.split("/").pop())}/</a></li>`),
    ...items.map((n) => `<li><a href="${rel(n.slug)}">${esc(n.title)}</a>${n.date ? ` <time>${n.date}</time>` : ""}</li>`),
  ].join("\n");
  const heading = dir ? `<h1>${esc(dir.split("/").pop())}</h1>\n` : "";
  write(dir, page(dir ? dir.split("/").pop() : "Notes", `${heading}<ul class="index">\n${li}\n</ul>`, depth));
}

console.log(`Published ${notes.length}, skipped ${skipped} (publish: false / draft)`);
if (!notes.length) console.warn(`No notes published. Check that your .md files are inside "${SRC}" and not marked draft.`);
