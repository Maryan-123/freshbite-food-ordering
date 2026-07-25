/* ===========================================================
   FreshBite - Dark Mode Theme Toggle
   Applies data-theme="light" | "dark" on <html>, persists the
   choice in localStorage, and injects a toggle button into the
   navbar on every page. Runs before other UI scripts so the
   correct theme is applied without a visible flash.
   =========================================================== */

const THEME_STORAGE_KEY = "freshbite_theme";

// Apply the saved (or system) theme immediately, before DOMContentLoaded,
// to avoid a flash of the wrong theme on page load.
(function applyStoredThemeEarly() {
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_STORAGE_KEY);
  } catch (err) {
    saved = null;
  }
  if (saved === "dark" || saved === "light") {
    document.documentElement.setAttribute("data-theme", saved);
  }
})();

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (err) {
    return null;
  }
}

function getActiveTheme() {
  const stored = getStoredTheme();
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (err) {
    console.warn("FreshBite: could not persist theme preference.", err);
  }
  updateThemeToggleIcon(theme);
}

function toggleTheme() {
  const next = getActiveTheme() === "dark" ? "light" : "dark";
  setTheme(next);
}

function updateThemeToggleIcon(theme) {
  const btn = document.getElementById("themeToggleBtn");
  if (!btn) return;
  const icon = btn.querySelector("i");
  if (icon) {
    icon.classList.toggle("fa-moon", theme === "light");
    icon.classList.toggle("fa-sun", theme === "dark");
  }
  btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
}

// Insert a theme toggle icon-button into the navbar, right before the
// hamburger menu, on every page that has the standard nav-actions bar.
function injectThemeToggle() {
  if (document.getElementById("themeToggleBtn")) return;

  const navActions = document.querySelector(".nav-actions");
  if (!navActions) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "themeToggleBtn";
  btn.className = "icon-btn theme-toggle-btn";
  btn.innerHTML = `<i class="fa-solid fa-moon"></i>`;

  const hamburger = document.getElementById("hamburger");
  if (hamburger) {
    navActions.insertBefore(btn, hamburger);
  } else {
    navActions.appendChild(btn);
  }

  btn.addEventListener("click", toggleTheme);
  updateThemeToggleIcon(getActiveTheme());
}

document.addEventListener("DOMContentLoaded", () => {
  setTheme(getActiveTheme());
  injectThemeToggle();
});
