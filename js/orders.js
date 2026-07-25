/* ===========================================================
   FreshBite - Order Management
   Creating orders, reading order history, simulated status
   tracking, and reordering. Orders are stored in localStorage
   under STORAGE_KEYS.ORDERS as a single array shared by all users
   (each order carries a userId so it can be filtered per account).
   =========================================================== */

const TRACKING_STAGES = [
  "Order Confirmed",
  "Restaurant Preparing",
  "Ready for Pickup",
  "Out for Delivery",
  "Delivered",
];

const DRIVER_NAMES = ["Ahmed Ali", "Layla Hassan", "Omar Yusuf", "Sara Noor", "Khalid Warsame"];
const VEHICLE_TYPES = ["Motorbike", "Scooter", "Bicycle", "Compact Car"];

/* ---------- Read / Write ---------- */
function getAllOrders() {
  return readStorage(STORAGE_KEYS.ORDERS, []);
}

function saveAllOrders(orders) {
  writeStorage(STORAGE_KEYS.ORDERS, orders);
}

function getOrderById(orderId) {
  return getAllOrders().find((o) => o.id === orderId) || null;
}

function getUserOrders(userId) {
  return getAllOrders()
    .filter((o) => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getLastOrder() {
  const lastOrderId = readStorage("freshbite_last_order_id", null);
  if (!lastOrderId) return null;
  return getOrderById(lastOrderId);
}

/* ---------- Create Order ---------- */
// checkoutData: { customer, delivery, deliveryMethod, deliveryTimeOption,
//                  scheduledDate, scheduledTime, paymentMethod, mobileProvider,
//                  coupon, totals: { subtotal, deliveryFee, serviceFee, discount, total } }
function createOrder(checkoutData) {
  const cart = getCart();
  if (!cart.length) return null;

  const restaurant = restaurants.find((r) => r.id === cart[0].restaurantId);
  const user = getCurrentUser();

  const order = {
    id: generateOrderId(),
    userId: user ? user.id : null,
    restaurantId: restaurant ? restaurant.id : null,
    restaurantName: restaurant ? restaurant.name : "FreshBite Restaurant",
    items: cart.map((item) => ({
      foodId: item.foodId,
      name: item.name,
      image: item.image,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      dietaryType: item.dietaryType,
      size: item.size || null,
      extras: item.extras || [],
      instructions: item.instructions || "",
    })),
    customer: checkoutData.customer,
    delivery: checkoutData.delivery,
    deliveryMethod: checkoutData.deliveryMethod,
    deliveryTimeOption: checkoutData.deliveryTimeOption,
    scheduledDate: checkoutData.scheduledDate || null,
    scheduledTime: checkoutData.scheduledTime || null,
    estimatedDelivery: buildEstimatedDeliveryLabel(checkoutData),
    paymentMethod: checkoutData.paymentMethod,
    mobileProvider: checkoutData.mobileProvider || null,
    coupon: checkoutData.coupon || null,
    subtotal: checkoutData.totals.subtotal,
    deliveryFee: checkoutData.totals.deliveryFee,
    serviceFee: checkoutData.totals.serviceFee,
    discount: checkoutData.totals.discount,
    total: checkoutData.totals.total,
    status: TRACKING_STAGES[0],
    statusIndex: 0,
    driver: {
      name: DRIVER_NAMES[Math.floor(Math.random() * DRIVER_NAMES.length)],
      phone: generateSimulatedPhone(),
      vehicle: VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)],
    },
    createdAt: new Date().toISOString(),
  };

  const orders = getAllOrders();
  orders.push(order);
  saveAllOrders(orders);
  writeStorage("freshbite_last_order_id", order.id);

  clearCart();

  if (typeof addNotification === "function") {
    addNotification("Order confirmed", `Your order ${order.id} from ${order.restaurantName} has been confirmed.`, "fa-solid fa-circle-check");
  }

  return order;
}

function generateOrderId() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `FB-${Date.now().toString().slice(-6)}${random}`;
}

function generateSimulatedPhone() {
  const line = Math.floor(1000000 + Math.random() * 8999999);
  return `+252 61 ${String(line).slice(0, 3)} ${String(line).slice(3)}`;
}

function buildEstimatedDeliveryLabel(checkoutData) {
  if (checkoutData.deliveryTimeOption === "schedule" && checkoutData.scheduledDate && checkoutData.scheduledTime) {
    return `Scheduled for ${checkoutData.scheduledDate} at ${checkoutData.scheduledTime}`;
  }

  const labels = {
    asap: "20-30 min (ASAP)",
    "30-45": "30-45 min",
    "45-60": "45-60 min",
  };

  return labels[checkoutData.deliveryTimeOption] || "30-45 min";
}

/* ---------- Simulated Tracking ---------- */
function advanceOrderStatus(orderId) {
  const orders = getAllOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return null;

  if (order.statusIndex < TRACKING_STAGES.length - 1) {
    order.statusIndex += 1;
    order.status = TRACKING_STAGES[order.statusIndex];

    if (typeof addNotification === "function") {
      const icons = { 1: "fa-solid fa-kitchen-set", 2: "fa-solid fa-bag-shopping", 3: "fa-solid fa-truck-fast", 4: "fa-solid fa-champagne-glasses" };
      addNotification(order.status, `Order ${order.id} is now: ${order.status}.`, icons[order.statusIndex] || "fa-solid fa-bell");
    }
  }

  saveAllOrders(orders);
  return order;
}

function resetOrderStatus(orderId) {
  const orders = getAllOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return null;

  order.statusIndex = 0;
  order.status = TRACKING_STAGES[0];

  saveAllOrders(orders);
  return order;
}

/* ---------- Reorder ---------- */
// Restores an order's items into the cart, respecting the
// single-restaurant cart rule (shows the shared conflict modal if needed).
function reorder(orderId) {
  const order = getOrderById(orderId);
  if (!order) return;

  const cart = getCart();

  if (cart.length && cart[0].restaurantId !== order.restaurantId) {
    pendingReorderId = orderId;
    const modal = document.getElementById("conflictModal");
    if (modal) modal.classList.add("show");
    return;
  }

  restoreOrderItemsToCart(order);
}

let pendingReorderId = null;

function restoreOrderItemsToCart(order) {
  const newCart = order.items.map((item, index) => ({
    cartItemId: `reorder_${order.id}_${index}_${Date.now()}`,
    foodId: item.foodId,
    restaurantId: order.restaurantId,
    name: item.name,
    image: item.image,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    dietaryType: item.dietaryType,
    size: item.size || null,
    extras: item.extras || [],
    instructions: item.instructions || "",
  }));

  saveCart(newCart);
  showToast(`Items from order ${order.id} added to your cart.`, "success");
}

// Hook the reorder conflict flow into the same modal used for add-to-cart conflicts.
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("conflictModal");
  if (!modal) return;

  const confirmBtn = document.getElementById("modalConfirmBtn");
  if (!confirmBtn) return;

  confirmBtn.addEventListener("click", () => {
    if (pendingReorderId !== null) {
      const order = getOrderById(pendingReorderId);
      if (order) restoreOrderItemsToCart(order);
      pendingReorderId = null;
    }
  });
});

/* ---------- Order Status Applicability for Reviews ---------- */
function isOrderDelivered(order) {
  return order.status === "Delivered";
}

/* ===========================================================
   Order Confirmation Page (order-confirmation.html)
   =========================================================== */
function initOrderConfirmationPage() {
  const card = document.getElementById("confirmationCard");
  if (!card) return;

  const order = getLastOrder();
  const emptyState = document.getElementById("noOrderState");

  if (!order) {
    card.hidden = true;
    emptyState.hidden = false;
    return;
  }

  const paymentLabels = { cod: "Cash on Delivery", card: "Credit / Debit Card", mobile: "Mobile Payment" };

  document.getElementById("confOrderId").textContent = order.id;
  document.getElementById("confRestaurant").textContent = order.restaurantName;
  document.getElementById("confAddress").textContent =
    `${order.delivery.street}${order.delivery.apartment ? ", " + order.delivery.apartment : ""}, ${order.delivery.area}, ${order.delivery.city}`;
  document.getElementById("confPayment").textContent = paymentLabels[order.paymentMethod] || order.paymentMethod;
  document.getElementById("confEta").textContent = order.estimatedDelivery;
  document.getElementById("confTotal").textContent = `$${order.total.toFixed(2)}`;

  document.getElementById("confItemsList").innerHTML = order.items
    .map(
      (item) => `
      <div class="checkout-item-row">
        <img src="${item.image}" alt="${item.name}" loading="lazy" />
        <div class="checkout-item-info">
          <span class="checkout-item-name">${item.name}</span>
          <span class="checkout-item-qty">Qty: ${item.quantity}</span>
        </div>
        <span class="checkout-item-subtotal">$${(item.unitPrice * item.quantity).toFixed(2)}</span>
      </div>`
    )
    .join("");

  document.getElementById("trackOrderBtn").href = `order-tracking.html?orderId=${order.id}`;
}

/* ===========================================================
   Order Tracking Page (order-tracking.html)
   =========================================================== */
let trackedOrderId = null;

function initOrderTrackingPage() {
  const wrapper = document.getElementById("trackingCard");
  if (!wrapper) return;

  const params = new URLSearchParams(window.location.search);
  trackedOrderId = params.get("orderId") || readStorage("freshbite_last_order_id", null);

  const order = trackedOrderId ? getOrderById(trackedOrderId) : null;
  const emptyState = document.getElementById("noTrackingState");

  if (!order) {
    wrapper.hidden = true;
    emptyState.hidden = false;
    return;
  }

  wrapper.hidden = false;
  emptyState.hidden = true;

  renderTrackingCard(order);

  document.getElementById("advanceStatusBtn").addEventListener("click", () => {
    const updated = advanceOrderStatus(trackedOrderId);
    if (updated) renderTrackingCard(updated);
  });

  document.getElementById("resetTrackingBtn").addEventListener("click", () => {
    const updated = resetOrderStatus(trackedOrderId);
    if (updated) renderTrackingCard(updated);
  });

  document.getElementById("contactDriverBtn").addEventListener("click", () => {
    showToast(`Simulated message sent to ${order.driver.name}: "On my way, thanks!"`, "info");
  });
}

function renderTrackingCard(order) {
  document.getElementById("trackOrderId").textContent = order.id;
  document.getElementById("trackRestaurant").textContent = order.restaurantName;
  document.getElementById("trackAddress").textContent =
    `${order.delivery.street}${order.delivery.apartment ? ", " + order.delivery.apartment : ""}, ${order.delivery.area}, ${order.delivery.city}`;
  document.getElementById("trackEta").textContent = order.estimatedDelivery;
  document.getElementById("trackTotal").textContent = `$${order.total.toFixed(2)}`;
  document.getElementById("trackDriverName").textContent = order.driver.name;
  document.getElementById("trackDriverPhone").textContent = order.driver.phone;
  document.getElementById("trackDriverVehicle").textContent = order.driver.vehicle;
  document.getElementById("trackCurrentStatus").textContent = order.status;

  document.getElementById("trackItemsList").innerHTML = order.items
    .map((item) => `<li>${item.quantity}x ${item.name}</li>`)
    .join("");

  // Timeline
  const timeline = document.getElementById("trackingTimeline");
  timeline.innerHTML = TRACKING_STAGES.map((stage, index) => {
    const state = index < order.statusIndex ? "done" : index === order.statusIndex ? "current" : "upcoming";
    return `
      <div class="timeline-step ${state}">
        <span class="timeline-dot"><i class="fa-solid ${state === "done" ? "fa-check" : "fa-circle"}"></i></span>
        <span class="timeline-label">${stage}</span>
      </div>`;
  }).join("");

  const advanceBtn = document.getElementById("advanceStatusBtn");
  const deliveredNotice = document.getElementById("deliveredNotice");
  const isFinalStage = order.statusIndex >= TRACKING_STAGES.length - 1;

  advanceBtn.disabled = isFinalStage;
  deliveredNotice.hidden = !isFinalStage;
}

document.addEventListener("DOMContentLoaded", () => {
  initOrderConfirmationPage();
  initOrderTrackingPage();
});
