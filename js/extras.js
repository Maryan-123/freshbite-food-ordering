/* ===========================================================
   FreshBite - Extra Bonus UI
   Notification center (navbar bell), floating support-chat
   simulation, and scroll-triggered stat counters (about.html).
   Loaded on every page alongside auth.js/theme.js/global-search.js.
   =========================================================== */

const NOTIFICATIONS_KEY = "freshbite_notifications";

document.addEventListener("DOMContentLoaded", () => {
  seedNotificationsIfEmpty();
  injectNotificationBell();
  injectSupportChat();
  setupStatCounters();
  renderPartnerLogos();
});

/* ---------- About Page: Restaurant Partner Logos ---------- */
function renderPartnerLogos() {
  const container = document.getElementById("partnersLogos");
  if (!container || typeof restaurants === "undefined") return;

  container.innerHTML = restaurants
    .slice(0, 8)
    .map((r) => `<div class="partner-logo-chip"><img src="${r.logo}" alt="${r.name} logo" loading="lazy" /><span>${r.name}</span></div>`)
    .join("");
}

/* ===========================================================
   Notification Center
   =========================================================== */
function getNotifications() {
  return readStorage(NOTIFICATIONS_KEY, []);
}

function saveNotifications(list) {
  writeStorage(NOTIFICATIONS_KEY, list);
  updateNotificationBadge();
}

function addNotification(title, message, icon = "fa-solid fa-bell") {
  const list = getNotifications();
  list.unshift({
    id: `note_${Date.now()}`,
    title,
    message,
    icon,
    read: false,
    createdAt: new Date().toISOString(),
  });
  saveNotifications(list.slice(0, 30));
}

function markNotificationRead(id) {
  const list = getNotifications();
  const note = list.find((n) => n.id === id);
  if (note) note.read = true;
  saveNotifications(list);
}

function markAllNotificationsRead() {
  const list = getNotifications().map((n) => ({ ...n, read: true }));
  saveNotifications(list);
}

function deleteNotification(id) {
  saveNotifications(getNotifications().filter((n) => n.id !== id));
}

function seedNotificationsIfEmpty() {
  if (localStorage.getItem(NOTIFICATIONS_KEY)) return;

  const sample = [
    { id: "note_1", title: "Welcome to FreshBite!", message: "Explore restaurants near you and enjoy 50% off your first order with WELCOME50.", icon: "fa-solid fa-gift", read: false, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: "note_2", title: "New restaurant added", message: "Pasta Palace just joined FreshBite - check out their fresh pasta menu.", icon: "fa-solid fa-store", read: false, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: "note_3", title: "Coupon expiring soon", message: "PIZZA20 expires soon - use it before it's gone.", icon: "fa-solid fa-tag", read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  ];
  writeStorage(NOTIFICATIONS_KEY, sample);
}

function injectNotificationBell() {
  if (document.getElementById("notificationBellBtn")) return;

  const navActions = document.querySelector(".nav-actions");
  if (!navActions) return;

  const wrapper = document.createElement("div");
  wrapper.className = "notification-center";
  wrapper.innerHTML = `
    <button type="button" class="icon-btn" id="notificationBellBtn" aria-label="View notifications" aria-expanded="false">
      <i class="fa-solid fa-bell"></i>
      <span class="cart-count notification-badge" id="notificationBadge" hidden>0</span>
    </button>
    <div class="notification-panel" id="notificationPanel" hidden>
      <div class="notification-panel-head">
        <h3>Notifications</h3>
        <button type="button" id="markAllReadBtn">Mark all as read</button>
      </div>
      <div class="notification-list" id="notificationList"></div>
    </div>`;

  const cartBtn = navActions.querySelector(".cart-btn");
  if (cartBtn) {
    navActions.insertBefore(wrapper, cartBtn);
  } else {
    navActions.insertBefore(wrapper, navActions.firstChild);
  }

  document.getElementById("notificationBellBtn").addEventListener("click", toggleNotificationPanel);
  document.getElementById("markAllReadBtn").addEventListener("click", () => {
    markAllNotificationsRead();
    renderNotificationList();
  });

  document.addEventListener("click", (e) => {
    const panel = document.getElementById("notificationPanel");
    const btn = document.getElementById("notificationBellBtn");
    if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) {
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    }
  });

  updateNotificationBadge();
}

function toggleNotificationPanel() {
  const panel = document.getElementById("notificationPanel");
  const btn = document.getElementById("notificationBellBtn");
  const willOpen = panel.hidden;

  panel.hidden = !willOpen;
  btn.setAttribute("aria-expanded", String(willOpen));

  if (willOpen) renderNotificationList();
}

function renderNotificationList() {
  const list = getNotifications();
  const container = document.getElementById("notificationList");

  if (!list.length) {
    container.innerHTML = `<p class="notification-empty">You're all caught up - no notifications yet.</p>`;
    return;
  }

  container.innerHTML = list
    .map(
      (note) => `
      <div class="notification-item ${note.read ? "" : "unread"}" data-id="${note.id}">
        <span class="notification-icon"><i class="${note.icon}"></i></span>
        <div class="notification-text">
          <strong>${note.title}</strong>
          <p>${note.message}</p>
          <span class="notification-time">${new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>
        <div class="notification-actions">
          ${!note.read ? `<button class="mark-read-btn" data-id="${note.id}" aria-label="Mark as read"><i class="fa-solid fa-check"></i></button>` : ""}
          <button class="delete-notification-btn" data-id="${note.id}" aria-label="Delete notification"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>`
    )
    .join("");

  container.querySelectorAll(".mark-read-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      markNotificationRead(btn.dataset.id);
      renderNotificationList();
    });
  });

  container.querySelectorAll(".delete-notification-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteNotification(btn.dataset.id);
      renderNotificationList();
    });
  });
}

function updateNotificationBadge() {
  const badge = document.getElementById("notificationBadge");
  if (!badge) return;
  const unreadCount = getNotifications().filter((n) => !n.read).length;
  badge.textContent = unreadCount;
  badge.hidden = unreadCount === 0;
}

/* ===========================================================
   Floating Support Chat (fully simulated - no external API)
   =========================================================== */
const CHAT_QUICK_QUESTIONS = [
  { label: "Where is my order?", key: "order-status" },
  { label: "I need help with a coupon", key: "coupon-help" },
  { label: "I have a payment question", key: "payment-help" },
  { label: "Talk to support", key: "contact-support" },
];

const CHAT_RESPONSES = {
  "order-status": "You can track any order in real time from Account > Order History, or the Track Order button on your confirmation page. Tracking is simulated for this demo project.",
  "coupon-help": "Try FRESH10, WELCOME5, FREEDELIVERY, PIZZA20, or FIRSTORDER at checkout. Each coupon shows a clear success or error message when applied.",
  "payment-help": "Checkout supports simulated Cash on Delivery, Card, and Mobile Payment. No real payment is processed and card details are never stored.",
  "contact-support": "You can reach our (simulated) support team any time on the Contact page - it's open 24/7 in this demo.",
};

function injectSupportChat() {
  if (document.getElementById("supportChatBtn")) return;

  const chatButton = document.createElement("button");
  chatButton.type = "button";
  chatButton.id = "supportChatBtn";
  chatButton.className = "support-chat-fab";
  chatButton.setAttribute("aria-label", "Open support chat");
  chatButton.innerHTML = `<i class="fa-solid fa-comments"></i>`;

  const chatWindow = document.createElement("div");
  chatWindow.id = "supportChatWindow";
  chatWindow.className = "support-chat-window";
  chatWindow.hidden = true;
  chatWindow.innerHTML = `
    <div class="support-chat-header">
      <span><i class="fa-solid fa-headset"></i> FreshBite Support</span>
      <button type="button" id="closeSupportChatBtn" aria-label="Close support chat"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="support-chat-body" id="supportChatBody">
      <div class="chat-bubble bot">Hi! I'm the FreshBite support assistant (simulated for this demo). How can I help today?</div>
      <div class="chat-quick-questions" id="chatQuickQuestions">
        ${CHAT_QUICK_QUESTIONS.map((q) => `<button type="button" class="chat-quick-btn" data-key="${q.key}">${q.label}</button>`).join("")}
      </div>
    </div>`;

  document.body.appendChild(chatButton);
  document.body.appendChild(chatWindow);

  chatButton.addEventListener("click", () => {
    chatWindow.hidden = !chatWindow.hidden;
  });

  document.getElementById("closeSupportChatBtn").addEventListener("click", () => {
    chatWindow.hidden = true;
  });

  document.getElementById("chatQuickQuestions").addEventListener("click", (e) => {
    const btn = e.target.closest(".chat-quick-btn");
    if (!btn) return;
    handleChatQuickQuestion(btn.dataset.key, btn.textContent);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !chatWindow.hidden) chatWindow.hidden = true;
  });
}

function handleChatQuickQuestion(key, label) {
  const body = document.getElementById("supportChatBody");

  const userBubble = document.createElement("div");
  userBubble.className = "chat-bubble user";
  userBubble.textContent = label;
  body.appendChild(userBubble);

  const botBubble = document.createElement("div");
  botBubble.className = "chat-bubble bot";
  botBubble.textContent = CHAT_RESPONSES[key] || "Thanks for your message - our (simulated) support team will follow up soon.";
  body.appendChild(botBubble);

  body.scrollTop = body.scrollHeight;
}

/* ===========================================================
   Animated Stat Counters (about.html)
   =========================================================== */
function setupStatCounters() {
  const counters = document.querySelectorAll(".stat-counter[data-target]");
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function animateCounter(el) {
  const target = Number(el.dataset.target);
  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.floor(progress * target);
    el.textContent = value.toLocaleString();
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target.toLocaleString() + (el.dataset.suffix || "");
    }
  }

  requestAnimationFrame(tick);
}
