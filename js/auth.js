/* ===========================================================
   FreshBite - Simulated Authentication & Shared Storage Helpers
   Loaded on every page. Provides generic localStorage helpers,
   a reusable toast system, and simulated register/login/logout.

   IMPORTANT (educational project): authentication here is fully
   simulated on the client. Passwords are NOT hashed with a real
   cryptographic algorithm, sessions are NOT secure tokens, and
   nothing here should be treated as production-grade security.
   =========================================================== */

const STORAGE_KEYS = {
  USERS: "freshbite_users",
  SESSION: "freshbite_session",
  ADDRESSES_PREFIX: "freshbite_addresses_",
  WISHLIST_PREFIX: "freshbite_wishlist_",
  ORDERS: "freshbite_orders",
  REVIEWS: "freshbite_reviews",
};

/* ---------- Generic Storage Helpers ---------- */
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (err) {
    console.warn(`FreshBite: could not read "${key}" from localStorage, using fallback.`, err);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`FreshBite: could not write "${key}" to localStorage.`, err);
    return false;
  }
}

function removeStorage(key) {
  localStorage.removeItem(key);
}

/* ---------- Reusable Toast Notifications ---------- */
// type: "success" | "error" | "warning" | "info"
const TOAST_ICONS = {
  success: "fa-solid fa-circle-check",
  error: "fa-solid fa-circle-exclamation",
  warning: "fa-solid fa-triangle-exclamation",
  info: "fa-solid fa-circle-info",
};

let authToastTimeout;

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerHTML = `<i class="${TOAST_ICONS[type] || TOAST_ICONS.success}"></i> ${message}`;
  toast.classList.remove("toast-success", "toast-error", "toast-warning", "toast-info");
  toast.classList.add(`toast-${type}`, "show");

  clearTimeout(authToastTimeout);
  authToastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* ---------- Validation Helpers ---------- */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone) {
  return /^[+]?[\d\s-()]{7,16}$/.test(phone.trim());
}

/* ---------- Users ---------- */
function getUsers() {
  return readStorage(STORAGE_KEYS.USERS, []);
}

function saveUsers(users) {
  writeStorage(STORAGE_KEYS.USERS, users);
}

function findUserByEmail(email) {
  return getUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
}

// Simple non-cryptographic obfuscation - NOT secure password hashing.
// Good enough for a frontend-only simulation where no real passwords are used.
function simpleHash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash)}`;
}

function registerUser({ fullName, email, phone, password }) {
  const users = getUsers();

  const newUser = {
    id: `user_${Date.now()}`,
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    passwordHash: simpleHash(password),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

function loginUser(email, password) {
  const user = findUserByEmail(email);
  if (!user) return null;
  if (user.passwordHash !== simpleHash(password)) return null;
  return user;
}

/* ---------- Session ---------- */
function setSession(userId, remember) {
  writeStorage(STORAGE_KEYS.SESSION, { userId, remember, loggedInAt: new Date().toISOString() });
}

function getSession() {
  return readStorage(STORAGE_KEYS.SESSION, null);
}

function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  const users = getUsers();
  return users.find((u) => u.id === session.userId) || null;
}

function isLoggedIn() {
  return !!getCurrentUser();
}

function logoutUser() {
  removeStorage(STORAGE_KEYS.SESSION);
  showToast("You have been logged out.", "info");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 700);
}

function updateCurrentUser(updates) {
  const session = getSession();
  if (!session) return null;

  const users = getUsers();
  const index = users.findIndex((u) => u.id === session.userId);
  if (index === -1) return null;

  users[index] = { ...users[index], ...updates };
  saveUsers(users);
  return users[index];
}

/* ---------- Saved Addresses ---------- */
function getAddressesKey() {
  const user = getCurrentUser();
  return user ? `${STORAGE_KEYS.ADDRESSES_PREFIX}${user.id}` : null;
}

function getSavedAddresses() {
  const key = getAddressesKey();
  return key ? readStorage(key, []) : [];
}

function saveAddress(address) {
  const key = getAddressesKey();
  if (!key) return null;

  const addresses = getSavedAddresses();
  const newAddress = { id: `addr_${Date.now()}`, ...address };

  if (newAddress.isDefault) {
    addresses.forEach((a) => (a.isDefault = false));
  } else if (!addresses.length) {
    newAddress.isDefault = true;
  }

  addresses.push(newAddress);
  writeStorage(key, addresses);
  return newAddress;
}

function updateAddress(addressId, updates) {
  const key = getAddressesKey();
  if (!key) return null;

  const addresses = getSavedAddresses();
  const index = addresses.findIndex((a) => a.id === addressId);
  if (index === -1) return null;

  if (updates.isDefault) {
    addresses.forEach((a) => (a.isDefault = false));
  }

  addresses[index] = { ...addresses[index], ...updates };
  writeStorage(key, addresses);
  return addresses[index];
}

function deleteAddress(addressId) {
  const key = getAddressesKey();
  if (!key) return;

  let addresses = getSavedAddresses();
  const wasDefault = addresses.find((a) => a.id === addressId)?.isDefault;
  addresses = addresses.filter((a) => a.id !== addressId);

  if (wasDefault && addresses.length) {
    addresses[0].isDefault = true;
  }

  writeStorage(key, addresses);
}

function setDefaultAddress(addressId) {
  const key = getAddressesKey();
  if (!key) return;

  const addresses = getSavedAddresses();
  addresses.forEach((a) => (a.isDefault = a.id === addressId));
  writeStorage(key, addresses);
}

function getDefaultAddress() {
  return getSavedAddresses().find((a) => a.isDefault) || getSavedAddresses()[0] || null;
}

/* ---------- Route Protection ---------- */
// Call on pages that require a logged-in user (e.g. account.html).
function requireLogin(redirectTo = "login.html") {
  if (!isLoggedIn()) {
    showToast("Please log in to continue.", "warning");
    setTimeout(() => {
      window.location.href = `${redirectTo}?redirect=${encodeURIComponent(window.location.pathname.split("/").pop())}`;
    }, 600);
    return false;
  }
  return true;
}

/* ---------- Navbar Auth UI ---------- */
function renderNavAuthUI() {
  const loginBtn = document.querySelector(".login-btn");
  if (!loginBtn) return;

  const user = getCurrentUser();

  if (!user) {
    loginBtn.innerHTML = `<i class="fa-solid fa-user"></i> <span>Login</span>`;
    loginBtn.setAttribute("aria-label", "Login to your account");
    loginBtn.addEventListener("click", () => {
      window.location.href = "login.html";
    });
    return;
  }

  // Replace the plain login button with a user menu dropdown
  const userMenu = document.createElement("div");
  userMenu.className = "user-menu";
  userMenu.innerHTML = `
    <button class="user-menu-btn" id="userMenuBtn" aria-haspopup="true" aria-expanded="false">
      <i class="fa-solid fa-circle-user"></i>
      <span>${firstNameOnly(user.fullName)}</span>
      <i class="fa-solid fa-chevron-down"></i>
    </button>
    <div class="user-dropdown" id="userDropdown" role="menu">
      <a href="account.html" role="menuitem"><i class="fa-solid fa-user"></i> My Account</a>
      <a href="account.html#orders" role="menuitem"><i class="fa-solid fa-receipt"></i> Order History</a>
      <a href="account.html#wishlist" role="menuitem"><i class="fa-solid fa-heart"></i> Wishlist</a>
      <button type="button" id="navLogoutBtn" role="menuitem"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
    </div>`;

  loginBtn.replaceWith(userMenu);

  const menuBtn = document.getElementById("userMenuBtn");
  const dropdown = document.getElementById("userDropdown");

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (e) => {
    if (!userMenu.contains(e.target)) {
      dropdown.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });

  document.getElementById("navLogoutBtn").addEventListener("click", logoutUser);
}

function firstNameOnly(fullName) {
  return fullName.trim().split(" ")[0];
}

/* ===========================================================
   Login Page (login.html)
   =========================================================== */
function initLoginPage() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  document.getElementById("forgotPasswordLink").addEventListener("click", (e) => {
    e.preventDefault();
    showToast("Password reset is simulated in this project - no email will be sent.", "info");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const remember = document.getElementById("rememberMe").checked;

    document.getElementById("loginEmailError").textContent = "";
    document.getElementById("loginPasswordError").textContent = "";

    let hasError = false;
    if (!email || !isValidEmail(email)) {
      document.getElementById("loginEmailError").textContent = "Enter a valid email address.";
      hasError = true;
    }
    if (!password) {
      document.getElementById("loginPasswordError").textContent = "Password is required.";
      hasError = true;
    }
    if (hasError) {
      showToast("Please fix the highlighted fields.", "error");
      return;
    }

    const user = loginUser(email, password);
    if (!user) {
      document.getElementById("loginPasswordError").textContent = "Incorrect email or password.";
      showToast("Incorrect email or password.", "error");
      return;
    }

    setSession(user.id, remember);
    if (typeof mergeGuestWishlistIntoUser === "function") mergeGuestWishlistIntoUser();

    // Default to the home page - unless the user was bounced here from a
    // protected page (e.g. Account, Checkout), in which case send them back.
    const redirectTarget = new URLSearchParams(window.location.search).get("redirect") || "index.html";

    showToast(`Welcome back, ${firstNameOnly(user.fullName)}!`, "success");
    setTimeout(() => {
      window.location.href = redirectTarget;
    }, 600);
  });
}

/* ===========================================================
   Register Page (register.html)
   =========================================================== */
function initRegisterPage() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fullName = document.getElementById("regFullName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regConfirmPassword").value;
    const termsAccepted = document.getElementById("regTerms").checked;

    ["regFullName", "regEmail", "regPhone", "regPassword", "regConfirmPassword", "regTerms"].forEach((id) => {
      const errorEl = document.getElementById(`${id}Error`);
      if (errorEl) errorEl.textContent = "";
    });

    let hasError = false;

    if (!fullName) {
      document.getElementById("regFullNameError").textContent = "Full name is required.";
      hasError = true;
    }
    if (!email || !isValidEmail(email)) {
      document.getElementById("regEmailError").textContent = "Enter a valid email address.";
      hasError = true;
    } else if (findUserByEmail(email)) {
      document.getElementById("regEmailError").textContent = "An account with this email already exists.";
      hasError = true;
    }
    if (!phone || !isValidPhone(phone)) {
      document.getElementById("regPhoneError").textContent = "Enter a valid phone number.";
      hasError = true;
    }
    if (!password || password.length < 8) {
      document.getElementById("regPasswordError").textContent = "Password must be at least 8 characters.";
      hasError = true;
    }
    if (password !== confirmPassword) {
      document.getElementById("regConfirmPasswordError").textContent = "Passwords do not match.";
      hasError = true;
    }
    if (!termsAccepted) {
      document.getElementById("regTermsError").textContent = "You must accept the Terms of Service.";
      hasError = true;
    }

    if (hasError) {
      showToast("Please fix the highlighted fields.", "error");
      return;
    }

    const user = registerUser({ fullName, email, phone, password });
    setSession(user.id, true);
    if (typeof mergeGuestWishlistIntoUser === "function") mergeGuestWishlistIntoUser();

    showToast("Account created successfully! Welcome to FreshBite.", "success");
    setTimeout(() => {
      window.location.href = "account.html";
    }, 700);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderNavAuthUI();
  initLoginPage();
  initRegisterPage();
});
