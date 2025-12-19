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
const lbPrev = document.getElementById("lbPrev");
const lbNext = document.getElementById("lbNext");

let currentList = [];
let currentIndex = 0;
let wheelLockUntil = 0;

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Prefer number right before extension, else last number anywhere. No number => bottom.
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

// Build a grouping key: remove extension, remove trailing number, remove the M/B tag token, normalize.
function getGroupKey(filename, tagLetter) {
  let stem = filename.replace(/\.[^.]+$/, "");

  // Remove trailing separators + digits (e.g. _01, -02, 03)
  stem = stem.replace(/([_\-\s]*)(\d+)$/, "");

  // Remove the tag as a token
  const t = tagLetter.toUpperCase();
  const reTag = new RegExp(`(^|[\\s_\\-])${t}(?=([\\s_\\-]|$))`, "i");
  stem = stem.replace(reTag, "$1");

  // Normalize
  stem = stem
    .replace(/[\s\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return stem.toLowerCase();
}

// ---------- Lightbox ----------
function updateLightbox() {
  if (!lightbox || !lightboxImg) return;
  if (!currentList.length) return;

  const item = currentList[currentIndex];
  lightboxImg.src = item.download_url;
  lightboxImg.alt = item.name || "";

  const showNav = currentList.length > 1;
  if (lbPrev) lbPrev.hidden = !showNav;
  if (lbNext) lbNext.hidden = !showNav;
}

function openLightbox(list, startIndex) {
  currentList = list;
  currentIndex = Math.max(0, Math.min(startIndex, list.length - 1));

  if (!lightbox) return;
  lightbox.hidden = false;
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  updateLightbox();
}

function closeLightbox() {
  if (!lightbox || !lightboxImg) return;
  lightbox.hidden = true;
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImg.src = "";
  document.body.style.overflow = "";
  currentList = [];
  currentIndex = 0;
}

function nextImage() {
  if (currentList.length <= 1) return;
  currentIndex = (currentIndex + 1) % currentList.length;
  updateLightbox();
}

function prevImage() {
  if (currentList.length <= 1) return;
  currentIndex = (currentIndex - 1 + currentList.length) % currentList.length;
  updateLightbox();
}

// Close on click backdrop. Also allow click on the big image to close (your earlier request).
lightbox?.addEventListener("click", (e) => {
  const target = e.target;
  if (target?.dataset?.close === "1") closeLightbox();
  else if (target === lightboxImg) closeLightbox();
});

lbPrev?.addEventListener("click", (e) => { e.stopPropagation(); prevImage(); });
lbNext?.addEventListener("click", (e) => { e.stopPropagation(); nextImage(); });

// Scroll wheel to navigate (throttled)
lightbox?.addEventListener("wheel", (e) => {
  if (lightbox.hidden) return;
  const now = Date.now();
  if (now < wheelLockUntil) return;
  wheelLockUntil = now + 220;

  if (Math.abs(e.deltaY) < 5) return;
  if (e.deltaY > 0) nextImage();
  else prevImage();
}, { passive: true });

// Keyboard nav
document.addEventListener("keydown", (e) => {
  if (!lightbox || lightbox.hidden) return;

  if (e.key === "Escape") closeLightbox();
  else if (e.key === "ArrowRight") nextImage();
  else if (e.key === "ArrowLeft") prevImage();
});

// ---------- Rendering ----------
function renderGroupsInto(el, groups) {
  if (!el) return;
  if (!groups.length) {
    el.innerHTML = "";
    return;
  }

  el.innerHTML = groups.map((g, idx) => {
    const top = g.items[0];                  // number-priority on top (lowest number)
    const back = g.items[1];                 // peek of the next one (if exists)

    const topName = escapeHtml(top.name);
    const topUrl = top.download_url;

    const backImgHtml = back
      ? `<img class="gimg gimg--back" src="${back.download_url}" alt="" loading="lazy">`
      : "";

    // Store the group's images in data attribute by index (we map in JS after)
    return `
      <div class="gcard" role="button" tabindex="0" data-group-index="${idx}" aria-label="Open ${topName}">
        <div class="gimgWrap">
          ${backImgHtml}
          <img class="gimg gimg--front" src="${topUrl}" alt="${topName}" loading="lazy">
        </div>
      </div>
    `;
  }).join("");
}

function bindGroupClicks(el, groups) {
  if (!el) return;

  el.querySelectorAll(".gcard").forEach(card => {
    const gi = parseInt(card.getAttribute("data-group-index"), 10);
    const group = groups[gi];
    if (!group) return;

    card.addEventListener("click", () => openLightbox(group.items, 0));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(group.items, 0);
      }
    });
  });
}

function groupImagesByName(images, tagLetter) {
  const map = new Map();

  for (const img of images) {
    const key = getGroupKey(img.name, tagLetter);
    if (!key) continue;

    if (!map.has(key)) map.set(key, []);
    map.get(key).push(img);
  }

  // Sort items within each group by number, then name
  const groups = [];
  for (const [key, list] of map.entries()) {
    list.sort((a, b) => {
      const na = getFileNumber(a.name);
      const nb = getFileNumber(b.name);
      if (na !== nb) return na - nb;
      return a.name.localeCompare(b.name);
    });
    groups.push({ key, items: list });
  }

  // Sort groups by their "top" image number priority
  groups.sort((ga, gb) => {
    const aTop = ga.items[0] ? getFileNumber(ga.items[0].name) : Number.MAX_SAFE_INTEGER;
    const bTop = gb.items[0] ? getFileNumber(gb.items[0].name) : Number.MAX_SAFE_INTEGER;
    if (aTop !== bTop) return aTop - bTop;
    return ga.key.localeCompare(gb.key);
  });

  return groups;
}

async function loadAndRender() {
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${ASSETS_PATH}`;

  try {
    const res = await fetch(apiUrl, { headers: { "Accept": "application/vnd.github+json" } });
    if (!res.ok) {
      if (modelsGrid) modelsGrid.innerHTML = "";
      if (buildsGrid) buildsGrid.innerHTML = "";
      return;
    }

    const items = await res.json();

    const images = items
      .filter(x => x.type === "file")
      .filter(x => exts.some(ext => x.name.toLowerCase().endsWith(ext)))
      .filter(x => !EXCLUDE_NAMES.has(x.name.toLowerCase()));

    const models = images.filter(img => hasTag(img.name, "M"));
    const builds = images.filter(img => hasTag(img.name, "B"));

    const modelGroups = groupImagesByName(models, "M");
    const buildGroups = groupImagesByName(builds, "B");

    renderGroupsInto(modelsGrid, modelGroups);
    bindGroupClicks(modelsGrid, modelGroups);

    renderGroupsInto(buildsGrid, buildGroups);
    bindGroupClicks(buildsGrid, buildGroups);
  } catch {
    if (modelsGrid) modelsGrid.innerHTML = "";
    if (buildsGrid) buildsGrid.innerHTML = "";
  }
}

loadAndRender();
