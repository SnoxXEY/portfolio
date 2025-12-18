// --------------------
// Theme toggle (stores preference)
// --------------------
const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

function setTheme(theme) {
  if (theme) root.setAttribute("data-theme", theme);
  else root.removeAttribute("data-theme");
  localStorage.setItem("theme", theme || "");
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme) setTheme(savedTheme);

themeToggle?.addEventListener("click", () => {
  const current = root.getAttribute("data-theme");
  setTheme(current === "light" ? "" : "light");
});

// --------------------
// Mobile menu
// --------------------
const menuBtn = document.getElementById("menuBtn");
const mobileNav = document.getElementById("mobileNav");

menuBtn?.addEventListener("click", () => {
  const isOpen = menuBtn.getAttribute("aria-expanded") === "true";
  menuBtn.setAttribute("aria-expanded", String(!isOpen));
  mobileNav.hidden = isOpen;
});

mobileNav?.querySelectorAll("a").forEach(a => {
  a.addEventListener("click", () => {
    menuBtn.setAttribute("aria-expanded", "false");
    mobileNav.hidden = true;
  });
});

// --------------------
// Footer year
// --------------------
document.getElementById("year").textContent = new Date().getFullYear();

// --------------------
// Gallery from GitHub /assets folder
// --------------------
const GITHUB_OWNER = "Snoxxey";     // change if needed
const GITHUB_REPO  = "portfolio";  // change if needed
const ASSETS_PATH  = "assets";

const exts = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

let galleryItems = [];

const grid = document.getElementById("galleryGrid");
const statusEl = document.getElementById("galleryStatus");
const searchEl = document.getElementById("gallerySearch");
const sortEl = document.getElementById("gallerySort");

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function matchesSearch(item, q) {
  if (!q) return true;
  const s = q.toLowerCase().trim();
  const nameNoExt = item.name.toLowerCase().replace(/\.[^/.]+$/, "");
  return nameNoExt.includes(s);
}

function sortItems(items, mode) {
  const copy = [...items];
  if (mode === "name-desc") copy.sort((a, b) => b.name.localeCompare(a.name));
  else copy.sort((a, b) => a.name.localeCompare(b.name)); // name-asc
  return copy;
}

function renderGallery() {
  if (!grid) return;

  const q = searchEl?.value || "";
  const mode = sortEl?.value || "name-asc";

  const filtered = galleryItems.filter(it => matchesSearch(it, q));
  const sorted = sortItems(filtered, mode);

  if (sorted.length === 0) {
    grid.innerHTML = "";
    statusEl.textContent = galleryItems.length
      ? "No matches. Try a different search."
      : "No images found in /assets yet.";
    return;
  }

  // Click opens image in a new tab (no overlay)
  grid.innerHTML = sorted.map((img) => {
    const safeName = escapeHtml(img.name);
    return `
      <a class="gcard" href="${img.download_url}" target="_blank" rel="noreferrer" aria-label="Open ${safeName}">
        <img class="gimg" src="${img.download_url}" alt="${safeName}" loading="lazy">
        <div class="gcap">${safeName}</div>
      </a>
    `;
  }).join("");

  statusEl.textContent = `Showing ${sorted.length} of ${galleryItems.length} image(s).`;
}

searchEl?.addEventListener("input", renderGallery);
sortEl?.addEventListener("change", renderGallery);

async function loadGalleryFromGitHub() {
  if (!statusEl) return;

  statusEl.textContent = "Loading images…";
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${ASSETS_PATH}`;

  try {
    const res = await fetch(apiUrl, {
      headers: { "Accept": "application/vnd.github+json" }
    });

    if (!res.ok) {
      statusEl.textContent =
        `Couldn’t load images (GitHub API: ${res.status}). Make sure the repo is public and /assets exists.`;
      return;
    }

    const items = await res.json();
    galleryItems = items
      .filter(x => x.type === "file")
      .filter(x => exts.some(ext => x.name.toLowerCase().endsWith(ext)));

    if (galleryItems.length === 0) {
      statusEl.textContent = "No images found in /assets yet.";
      grid.innerHTML = "";
      return;
    }

    renderGallery();
  } catch (err) {
    statusEl.textContent = "Error loading images. Check your connection / repo settings.";
  }
}

loadGalleryFromGitHub();

