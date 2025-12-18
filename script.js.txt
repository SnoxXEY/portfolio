// Theme toggle (stores preference)
const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

function setTheme(theme) {
  if (theme) root.setAttribute("data-theme", theme);
  else root.removeAttribute("data-theme");
  localStorage.setItem("theme", theme || "");
}

const saved = localStorage.getItem("theme");
if (saved) setTheme(saved);

themeToggle?.addEventListener("click", () => {
  const current = root.getAttribute("data-theme");
  setTheme(current === "light" ? "" : "light");
});

// Mobile menu
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

// Project filters
const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".pcard");

filters.forEach(btn => {
  btn.addEventListener("click", () => {
    filters.forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");

    const f = btn.dataset.filter;
    cards.forEach(card => {
      const tags = (card.dataset.tags || "").split(",").map(s => s.trim());
      card.style.display = (f === "all" || tags.includes(f)) ? "" : "none";
    });
  });
});

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();
