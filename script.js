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
// Gallery: load images from GitHub /assets
// --------------------
const GITHUB_OWNER = "SnoxxEY";
const GITHUB_REPO  = "portfolio";
const ASSETS_PATH  = "assets";

const exts = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const EXCLUDE_NAMES = new Set(["avatar.png"].map(x => x.toLowerCase()));

const grid = document.getElementById("galleryGrid");

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderGallery(items) {
  if (!grid) return;

  if (!items.length) {
    grid.innerHTML = "";
    return;
  }

  grid.innerHTML = items.map((img) => {
    const safeName = escapeHtml(img.name);
    return `
      <a class="gcard" href="${img.download_url}" target="_blank" rel="noreferrer" aria-label="Open ${safeName}">
        <img class="gimg" src="${img.download_url}" alt="${safeName}" loading="lazy">
      </a>
    `;
  }).join("");
}

async function loadGalleryFromGitHub() {
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${ASSETS_PATH}`;

  try {
    const res = await fetch(apiUrl, {
      headers: { "Accept": "application/vnd.github+json" }
    });

    if (!res.ok) {
      // silently fail (no status text)
      renderGallery([]);
      return;
    }

    const items = await res.json();

    const images = items
      .filter(x => x.type === "file")
      .filter(x => exts.some(ext => x.name.toLowerCase().endsWith(ext)))
      .filter(x => !EXCLUDE_NAMES.has(x.name.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));

    renderGallery(images);
  } catch (err) {
    // silently fail
    renderGallery([]);
  }
}

loadGalleryFromGitHub();
