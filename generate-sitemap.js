const fs = require("fs");
const path = require("path");

const DOMAIN = "https://rbxc.netlify.app";
const ROOT_FOLDER = ".";
const OUTPUT = path.join(ROOT_FOLDER, "sitemap.xml");

const IGNORE_DIRS = new Set([
  ".git",
  ".vscode",
  ".netlify",
  "assets",
  "images",
  "node_modules",
  ".well-known"
]);
const IGNORE_HTML_FILES = new Set([
  "404.html",
  "googlecdf0082ce667f320.html"
]);

function getHtmlFiles(dir, base = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let urls = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name) || entry.name.startsWith(".")) {
        continue;
      }
      const subFull = path.join(dir, entry.name);
      const subBase = path.join(base, entry.name);
      urls = urls.concat(getHtmlFiles(subFull, subBase));
      continue;
    }

    if (!entry.name.endsWith(".html")) continue;

    const relPath = path.join(base, entry.name);
    const fileName = path.basename(relPath);

    if (IGNORE_HTML_FILES.has(fileName)) continue;
    if (fileName.startsWith("google") && fileName.endsWith(".html")) continue; // верификация Google

    let urlPath = relPath.replace(/\\/g, "/");

    if (urlPath === "index.html") {
      urlPath = "/";
    } else if (urlPath.endsWith("/index.html")) {
      urlPath = "/" + urlPath.replace("/index.html", "/");
    } else {
      if (!urlPath.startsWith("/")) urlPath = "/" + urlPath;
    }

    urls.push(urlPath);
  }

  return urls;
}

const urls = getHtmlFiles(ROOT_FOLDER);
const today = new Date().toISOString();

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

urls.forEach((url) => {
  const priority = url === "/" ? "1.0" : "0.8";
  xml += `  <url>
    <loc>${DOMAIN}${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
});

xml += `</urlset>\n`;

fs.writeFileSync(OUTPUT, xml, "utf8");
console.log("✅ Sitemap generated at:", OUTPUT);

// node generate-sitemap.js