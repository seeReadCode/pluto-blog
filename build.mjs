// Markdown -> static HTML. Single newlines become <br>, as in Obsidian
// with "Strict line breaks" turned off.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import footnote from "markdown-it-footnote";
import hljs from "highlight.js/lib/common";

const SRC = process.env.NOTES_DIR || "notes"; // "." publishes the whole repo root
const OUT = "dist";
const SKIP_DIRS = new Set(["node_modules", OUT, ".git", ".github", ".obsidian", ".trash"]);
const ASSET_RE = /\.(png|jpe?g|gif|svg|webp|avif|pdf|mp3|mp4|m4a|webm|ogg|wav)$/i;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const posix = (p) => p.split(path.sep).join("/");
const parentOf = (s) => (s.includes("/") ? s.slice(0, s.lastIndexOf("/")) : "");
const fmtDate = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));
const segs = (s) => s.split("/").map(encodeURIComponent).join("/");
const up = (depth) => "../".repeat(depth);
const hslug = (h) => {
  let s = String(h);
  try { s = decodeURIComponent(s); } catch {}
  return s.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-");
};
const urlFor = (slug, frag, depth) =>
  (up(depth) + (slug ? segs(slug) + "/" : "") || "./") + (frag ? "#" + hslug(frag) : "");

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

// ---- pass 1: read every note, decide what is published ----------------------
const slugOf = (rel) => {
  const s = rel.replace(/\.md$/i, "").replace(/ /g, "-");
  return path.posix.basename(s).toLowerCase() === "index" ? parentOf(s) : s; // folder/index.md -> folder
};
const notes = [];
let skipped = 0;
for (const f of mdFiles) {
  const { data, content } = matter(fs.readFileSync(f, "utf8"));
  if (data.publish === false || data.draft) { skipped++; continue; }
  const rel = posix(path.relative(SRC, f));
  notes.push({
    rel, content,
    slug: slugOf(rel),
    isIndex: path.posix.basename(rel).toLowerCase() === "index.md",
    title: data.title ?? path.posix.basename(rel).replace(/\.md$/i, ""),
    date: data.published_at ? fmtDate(data.published_at): "",
  });
}

// ---- lookup tables for link resolution --------------------------------------
const noteByPath = new Map(notes.map((n) => [n.rel.toLowerCase(), n]));
const noteKeys = notes
  .map((n) => ({ key: n.rel.replace(/\.md$/i, "").toLowerCase(), note: n }))
  .sort((a, b) => a.key.length - b.key.length); // shortest path wins, like Obsidian
const assetRels = files.filter((f) => ASSET_RE.test(f)).map((f) => posix(path.relative(SRC, f)));
const assetByPath = new Map(assetRels.map((r) => [r.toLowerCase(), r]));
const assetKeys = [...assetByPath.entries()].sort((a, b) => a[0].length - b[0].length);

const findNote = (name) => {
  const k = name.replace(/\.md$/i, "").toLowerCase().replace(/^\/+|\/+$/g, "");
  return noteKeys.find((e) => e.key === k || e.key.endsWith("/" + k) || e.key === k + "/index" || e.key.endsWith("/" + k + "/index"))?.note;
};
const findAsset = (name) => {
  const k = name.toLowerCase().replace(/^\/+/, "");
  return assetKeys.find(([p]) => p === k || p.endsWith("/" + k))?.[1];
};

// Folders with published notes containing a note
const dirs = new Set([""]);
for (const n of notes) for (let d = n.isIndex ? n.slug : parentOf(n.slug); ; d = parentOf(d)) { dirs.add(d); if (!d) break; }
const owned = new Map(notes.filter((n) => n.isIndex).map((n) => [n.slug, n]));

const broken = [];

// Standard markdown links/images: resolve relative to the source file, then
// point at where that target ends up in dist/ (pages live in <slug>/index.html).
function fixRelative(href, env) {
  if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) return href; // external / anchor-only
  const m = href.match(/^([^#?]*)([?#].*)?$/);
  let p = m[1];
  const tail = m[2] || "";
  if (!p) return href;
  try { p = decodeURIComponent(p); } catch {}
  const abs = p.startsWith("/") ? p.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(env.rel), p));
  if (abs.startsWith("..")) return href;

  const n = [abs, abs + ".md", abs.replace(/\/$/, "") + "/index.md"]
    .map((c) => noteByPath.get(c.toLowerCase())).find(Boolean);
  if (n) return urlFor(n.slug, tail.startsWith("#") ? tail.slice(1) : "", env.depth);
  const dir = abs.replace(/\/+$/, "");
  if (dirs.has(dir) && !/\.[a-z0-9]+$/i.test(dir)) return urlFor(dir, tail.startsWith("#") ? tail.slice(1) : "", env.depth);
  if (/\.md$/i.test(abs)) { broken.push(`${env.rel}: ${href}`); return href; }

  const a = assetByPath.get(abs.toLowerCase());
  if (a) return up(env.depth) + segs(a) + tail;
  return href;
}

// ---- markdown-it ------------------------------------------------------------
const md = new MarkdownIt({
  html: true, breaks: true, linkify: true, typographer: true,
  highlight(code, lang) {
    lang = (lang || "").trim().split(/\s/)[0].toLowerCase();
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre><code class="hljs language-${esc(lang)}">${hljs.highlight(code, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
      } catch {}
    }
    return ""; // unlabeled or unknown language: plain, escaped
  },
}).use(footnote);

// Obsidian [[wikilinks]], [[Note|label]], [[Note#Heading]], ![[image.png|300]]
md.inline.ruler.before("link", "wikilink", (state, silent) => {
  const src = state.src;
  let p = state.pos;
  let embed = false;
  if (src[p] === "!") { embed = true; p++; }
  if (src[p] !== "[" || src[p + 1] !== "[") return false;
  const end = src.indexOf("]]", p + 2);
  if (end < 0) return false;
  const inner = src.slice(p + 2, end);
  if (!inner.trim() || inner.includes("\n") || inner.includes("[")) return false;

  if (!silent) {
    const env = state.env;
    const bar = inner.indexOf("|");
    const target = (bar < 0 ? inner : inner.slice(0, bar)).trim();
    const alias = bar < 0 ? "" : inner.slice(bar + 1).trim();
    const [name, ...fr] = target.split("#");
    const frag = fr.join("#");

    if (embed && ASSET_RE.test(name)) {
      const a = findAsset(name.trim());
      if (!a) broken.push(`${env.rel}: ![[${target}]]`);
      const size = alias.match(/^(\d+)(?:x(\d+))?$/);
      const t = state.push("image", "img", 0);
      t.meta = { done: true };
      t.attrs = [["src", a ? up(env.depth) + segs(a) : name], ["alt", size ? "" : alias]];
      if (size) { t.attrs.push(["width", size[1]]); if (size[2]) t.attrs.push(["height", size[2]]); }
      const tx = new state.Token("text", "", 0);
      tx.content = size ? "" : alias;
      t.children = [tx];
      t.content = tx.content;
    } else {
      const label = alias || (name.trim() ? name.trim() + (frag ? " › " + frag : "") : frag);
      let href = null;
      if (!name.trim()) href = "#" + hslug(frag);
      else {
        const n = findNote(name.trim());
        if (n) href = urlFor(n.slug, frag, env.depth);
      }
      if (href) {
        const o = state.push("link_open", "a", 1);
        o.attrs = [["href", href]];
        o.meta = { done: true };
        state.push("text", "", 0).content = label;
        state.push("link_close", "a", -1);
      } else {
        broken.push(`${env.rel}: [[${target}]]`);
        state.push("html_inline", "", 0).content = `<span class="unresolved">${esc(label)}</span>`;
      }
    }
  }
  state.pos = end + 2;
  return true;
});

// Resolve ordinary [text](path.md) links and ![alt](images/x.png)
md.core.ruler.push("resolve_urls", (state) => {
  const visit = (toks) => {
    for (const t of toks) {
      if (t.meta?.done) continue;
      if (t.type === "link_open") {
        const i = t.attrIndex("href");
        if (i >= 0) t.attrs[i][1] = fixRelative(t.attrs[i][1], state.env);
      } else if (t.type === "image") {
        const i = t.attrIndex("src");
        if (i >= 0) t.attrs[i][1] = fixRelative(t.attrs[i][1], state.env);
      }
      if (t.children) visit(t.children);
    }
  };
  visit(state.tokens);
});

// Heading ids so that [[Note#Heading]] and (#heading) anchors work
md.core.ruler.push("heading_ids", (state) => {
  const seen = new Map();
  const toks = state.tokens;
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].type !== "heading_open") continue;
    const text = (toks[i + 1].children || [])
      .filter((c) => c.type === "text" || c.type === "code_inline").map((c) => c.content).join("");
    let id = hslug(text) || "section";
    const n = seen.get(id) || 0;
    seen.set(id, n + 1);
    if (n) id += "-" + n;
    toks[i].attrSet("id", id);
  }
});

// ---- output -----------------------------------------------------------------
const page = (title, body, depth) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="${up(depth)}style.css">
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

for (const r of assetRels) {
  const dest = path.join(OUT, r);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(SRC, r), dest);
}

// ---- pass 2: render ---------------------------------------------------------
for (const n of notes) {
  const depth = n.slug ? n.slug.split("/").length : 0;
  const body = md.render(n.content.replace(/%%[\s\S]*?%%/g, ""), { rel: n.rel, depth });
  write(n.slug, page(n.title, `<h1>${esc(n.title)}</h1>\n${body}`, depth));
}

// Each folder gets a listing page unless it has its own index.md
for (const dir of dirs) {
  if (owned.has(dir)) continue;
  const depth = dir ? dir.split("/").length : 0;
  const folders = [...dirs].filter((d) => d && parentOf(d) === dir).sort();
  const items = notes.filter((n) => !n.isIndex && parentOf(n.slug) === dir)
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title));
  const rel = (s) => segs(s.slice(dir ? dir.length + 1 : 0)) + "/";
  const li = [
    ...folders.map((d) => `<li class="folder"><a href="${rel(d)}">${esc(owned.get(d)?.title ?? d.split("/").pop())}/</a></li>`),
    ...items.map((n) => `<li><a href="${rel(n.slug)}">${esc(n.title)}</a>${n.date ? ` <time>${n.date}</time>` : ""}</li>`),
  ].join("\n");
  const heading = dir ? `<h1>${esc(dir.split("/").pop())}</h1>\n` : "";
  write(dir, page(dir ? dir.split("/").pop() : "Notes", `${heading}<ul class="index">\n${li}\n</ul>`, depth));
}

console.log(`Published ${notes.length}, skipped ${skipped} (publish: false / draft)`);
if (broken.length) {
  console.warn(`\n${broken.length} unresolved link(s):`);
  for (const b of broken.slice(0, 30)) console.warn("  " + b);
}
if (!notes.length) console.warn(`No notes published. Check that your .md files are inside "${SRC}" and not marked draft.`);
