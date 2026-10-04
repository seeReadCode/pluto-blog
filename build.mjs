// Markdown -> static HTML. Single newlines become <br>, as in Obsidian
// with "Strict line breaks" turned off.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import footnote from "markdown-it-footnote";

const SRC = "posts";
const OUT = "dist";

const md = new MarkdownIt({ html: true, breaks: true, linkify: true, typographer: true })
  .use(footnote);

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Walk the notes directory
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const files = fs.existsSync(SRC) ? walk(SRC) : [];
const mdFiles = files.filter((f) => f.endsWith(".md"));
const slugOf = (f) => path.relative(SRC, f).replace(/\.md$/, "").split(path.sep).join("/");
const known = new Map(mdFiles.map((f) => [path.basename(f, ".md").toLowerCase(), slugOf(f)]));

// Obsidian syntax: ![[image.png]], [[Note]], [[Note|label]], %%comments%%
function obsidian(src, depth) {
  const up = "../".repeat(depth);
  return src
    .replace(/%%[\s\S]*?%%/g, "")
    .replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, f, alt) => `![${alt ?? ""}](${up}${encodeURI(f)})`)
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, n, label) => {
      const slug = known.get(n.trim().toLowerCase());
      return slug ? `[${label ?? n}](${up}${encodeURI(slug)}/)` : (label ?? n);
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

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.copyFileSync("style.css", path.join(OUT, "style.css"));

// Non-markdown assets (images, pdfs) are copied as-is
for (const f of files.filter((f) => !f.endsWith(".md"))) {
  const dest = path.join(OUT, path.relative(SRC, f));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(f, dest);
}

const index = [];
for (const f of mdFiles) {
  const { data, content } = matter(fs.readFileSync(f, "utf8"));
  if (data.publish === false || data.draft) continue;
  const slug = slugOf(f);
  const depth = slug.split("/").length;
  const title = data.title ?? path.basename(f, ".md");
  const body = md.render(obsidian(content, depth));
  const html = page(title, `<h1>${esc(title)}</h1>\n${body}`, depth);
  const dest = path.join(OUT, slug, "index.html");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
  index.push({ title, slug, date: data.date ? String(data.date).slice(0, 10) : "" });
}

index.sort((a, b) => (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title));
const list = index
  .map((n) => `<li><a href="${encodeURI(n.slug)}/">${esc(n.title)}</a>${n.date ? ` <time>${n.date}</time>` : ""}</li>`)
  .join("\n");
fs.writeFileSync(path.join(OUT, "index.html"), page("Notes", `<ul class="index">\n${list}\n</ul>`, 0));
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
console.log(`Built ${index.length} notes`);
