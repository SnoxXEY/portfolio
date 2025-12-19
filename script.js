const GITHUB_OWNER = "SnoxxEY";
const GITHUB_REPO  = "portfolio";
const ASSETS_PATH  = "assets";

const exts = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const EXCLUDE_NAMES = new Set(["avatar.png"].map(x => x.toLowerCase()));

const modelsGrid = document.getElementById("modelsGrid");
const buildsGrid = document.getElementById("buildsGrid");

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Prefer the number right before extension, else last number anywhere.
// No number => goes to bottom.
function getFileNumber(name) {
  const beforeExt = name.match(/(\d+)(?=\.[^.]+$)/);
  if (beforeExt) return parseInt(beforeExt[1], 10);

  const all = [...name.matchAll(/(\d+)/g)];
  if (all.length) return parseInt(all[all.length - 1][1], 10);

  return Number.MAX_SAFE_INTEGER;
}

// Detect tag letter as a separate token (e.g. _M_, -M-, " M ", _M1_, _M01_ also works)
function hasTag(name, tagLetter) {
  const n = name.toUpperCase();
  const t = tagLetter.toUpperCase();
  // boundaries: start or _ - space, then tag, then boundary or digit or dot/end
  const re = new RegExp(`(^|[\\s_\\-])${t}(?=([\\s_\\-]|\\d|\\.|$))`, "i");
  return re.test(n);
}

function renderInto(el, items) {
  if (!el) return;
  if (!items.length) {
    el.innerHTML = "";
    return;
  }

  el.innerHTML = items.map(img => {
    const safeName = escapeHtml(img.name);
    return `
      <a class="gcard" href="${img.download_url}" target="_blank" rel="noreferrer" aria-label="Open ${safeName}">
        <img class="gimg" src="${img.download_url}" alt="${safeName}" loading="lazy">
      </a>
    `;
  }).join("");
}

async function loadAndSplitGallery() {
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${ASSETS_PATH}`;

  try {
    const res = await fetch(apiUrl, { headers: { "Accept": "application/vnd.github+json" } });
    if (!res.ok) {
      renderInto(modelsGrid, []);
      renderInto(buildsGrid, []);
      return;
    }

    const items = await res.json();

    const images = items
      .filter(x => x.type === "file")
      .filter(x => exts.some(ext => x.name.toLowerCase().endsWith(ext)))
      .filter(x => !EXCLUDE_NAMES.has(x.name.toLowerCase()));

    const models = [];
    const builds = [];

    for (const img of images) {
      const name = img.name;

      if (hasTag(name, "M")) models.push(img);
      else if (hasTag(name, "B")) builds.push(img);
      // If neither tag exists, we ignore it (keeps the gallery clean)
    }

    const sorter = (a, b) => {
      const na = getFileNumber(a.name);
      const nb = getFileNumber(b.name);
      if (na !== nb) return na - nb;
      return a.name.localeCompare(b.name);
    };

    models.sort(sorter);
    builds.sort(sorter);

    renderInto(modelsGrid, models);
    renderInto(buildsGrid, builds);
  } catch {
    renderInto(modelsGrid, []);
    renderInto(buildsGrid, []);
  }
}

loadAndSplitGallery();
