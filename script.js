const GITHUB_OWNER = "SnoxxEY";
const GITHUB_REPO  = "portfolio";
const ASSETS_PATH  = "assets";

const exts = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const EXCLUDE_NAMES = new Set(["avatar.png"].map(x => x.toLowerCase()));

const modelsGrid = document.getElementById("modelsGrid");
const buildsGrid = document.getElementById("buildsGrid");

// Lightbox elements
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Prefer number right before extension, else last number anywhere.
// No number => bottom.
function getFileNumber(name) {
  const beforeExt = name.match(/(\d+)(?=\.[^.]+$)/);
  if (beforeExt) return parseInt(beforeExt[1], 10);

  const all = [...name.matchAll(/(\d+)/g)];
  if (all.length) return parseInt(all[all.length - 1][1], 10);

  return Number.MAX_SAFE_INTEGER;
}

// Detect tag letter as a token: _M_, -M-, " M ", _M01_ etc.
function hasTag(name, tagLetter) {
  const n = name.toUpperCase();
  const t = tagLetter.toUpperCase();
  const re = new RegExp(`(^|[\\s_\\-])${t}(?=([\\s_\\-]|\\d|\\.|$))`, "i");
  return re.test(n);
}

// Lightbox open/close
function openLightbox(src, altText) {
  if (!lightbox || !lightboxImg) return;
  lightboxImg.src = src;
  lightboxImg.alt = altText || "";
  lightbox.hidden = false;
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  if (!lightbox || !lightboxImg) return;
  lightbox.hidden = true;
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImg.src = "";
  document.body.style.overflow = "";
}

// Close on click (backdrop or image)
lightbox?.addEventListener("click", (e) => {
  const target = e.target;
  if (target === lightboxImg || target?.dataset?.close === "1") {
    closeLightbox();
  }
});

// Close on ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && lightbox && !lightbox.hidden) closeLightbox();
});

function renderInto(el, items) {
  if (!el) return;
  if (!items.length) {
    el.innerHTML = "";
    return;
  }

  // Use buttons/divs instead of <a> so it doesn't open a new tab
  el.innerHTML = items.map(img => {
    const safeName = escapeHtml(img.name);
    const safeUrl = img.download_url;
    return `
      <div class="gcard" role="button" tabindex="0"
           data-src="${safeUrl}" data-alt="${safeName}"
           aria-label="Open ${safeName}">
        <img class="gimg" src="${safeUrl}" alt="${safeName}" loading="lazy">
      </div>
    `;
  }).join("");

  // Click / Enter / Space to open lightbox
  el.querySelectorAll(".gcard").forEach(card => {
    const src = card.getAttribute("data-src");
    const alt = card.getAttribute("data-alt") || "";

    card.addEventListener("click", () => openLightbox(src, alt));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(src, alt);
      }
    });
  });
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
      if (hasTag(img.name, "M")) models.push(img);
      else if (hasTag(img.name, "B")) builds.push(img);
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
