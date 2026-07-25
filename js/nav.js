/* ===========================================================
   FreshBite - Shared Navigation & Footer Behavior
   Used on restaurants.html, menu.html, and cart.html.
   =========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  setupNewsletter();
  setCurrentYear();
});

/* ---------- Mobile Hamburger Menu ---------- */
function setupMobileMenu() {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener("click", () => {
    const isActive = navLinks.classList.toggle("active");
    hamburger.classList.toggle("active", isActive);
    hamburger.setAttribute("aria-expanded", String(isActive));
  });

  navLinks.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
      hamburger.classList.remove("active");
      hamburger.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------- Newsletter Validation ---------- */
function setupNewsletter() {
  const form = document.getElementById("newsletterForm");
  const emailInput = document.getElementById("newsletterEmail");
  const message = document.getElementById("newsletterMessage");
  if (!form || !emailInput || !message) return;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();

    message.classList.remove("success", "error");

    if (!email || !emailPattern.test(email)) {
      message.textContent = "Please enter a valid email address.";
      message.classList.add("error");
      return;
    }

    message.textContent = "Thanks for subscribing! Check your inbox soon.";
    message.classList.add("success");
    form.reset();
  });
}

/* ---------- Footer Year ---------- */
function setCurrentYear() {
  const yearEl = document.getElementById("currentYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}
