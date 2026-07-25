/* ===========================================================
   FreshBite - Checkout Page Logic
   Prefill, saved addresses, delivery/payment method toggling,
   live order summary, validation, and order placement.
   =========================================================== */

let checkoutAppliedCoupon = null;

document.addEventListener("DOMContentLoaded", () => {
  const cart = getCart();

  if (!cart.length) {
    document.getElementById("emptyCheckoutState").style.display = "block";
    document.getElementById("checkoutSection").style.display = "none";
    return;
  }

  document.getElementById("emptyCheckoutState").style.display = "none";
  document.getElementById("checkoutSection").style.display = "block";

  prefillCustomerInfo();
  renderSavedAddressPicker();
  renderCheckoutItems();
  updateCheckoutSummary();
  setMinScheduleDate();

  setupDeliveryTimeToggle();
  setupPaymentMethodToggle();
  setupCouponHandler();
  setupPlaceOrder();
});

/* ---------- Prefill ---------- */
function prefillCustomerInfo() {
  const user = getCurrentUser();
  if (!user) return;

  document.getElementById("customerName").value = user.fullName;
  document.getElementById("customerEmail").value = user.email;
  document.getElementById("customerPhone").value = user.phone;
}

function renderSavedAddressPicker() {
  const container = document.getElementById("savedAddressPicker");
  if (!isLoggedIn()) return;

  const addresses = getSavedAddresses();
  if (!addresses.length) return;

  container.innerHTML = `
    <p class="saved-address-label">Use a saved address:</p>
    <div class="saved-address-list">
      ${addresses
        .map(
          (addr) => `
        <button type="button" class="saved-address-chip" data-id="${addr.id}">
          <i class="fa-solid fa-location-dot"></i> ${addr.label}: ${addr.street}, ${addr.city}
          ${addr.isDefault ? '<span class="default-tag">Default</span>' : ""}
        </button>`
        )
        .join("")}
    </div>`;

  container.querySelectorAll(".saved-address-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const address = addresses.find((a) => a.id === chip.dataset.id);
      if (!address) return;

      document.getElementById("addressLabel").value = address.label;
      document.getElementById("street").value = address.street;
      document.getElementById("apartment").value = address.apartment || "";
      document.getElementById("area").value = address.area;
      document.getElementById("city").value = address.city;
      document.getElementById("instructions").value = address.instructions || "";

      showToast("Saved address applied.", "info");
    });
  });
}

/* ---------- Order Summary Rendering ---------- */
function renderCheckoutItems() {
  const cart = getCart();
  const restaurant = restaurants.find((r) => r.id === cart[0].restaurantId);

  document.getElementById("checkoutRestaurantName").innerHTML = restaurant
    ? `<i class="fa-solid fa-store"></i> Ordering from <strong>${restaurant.name}</strong>`
    : "";

  document.getElementById("checkoutItemsList").innerHTML = cart
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
}

function updateCheckoutSummary() {
  const subtotal = calculateSubtotal();
  const delivery = calculateDeliveryFee(checkoutAppliedCoupon);
  const service = calculateServiceFee();
  const discount = calculateDiscount(checkoutAppliedCoupon);
  const total = calculateTotal(checkoutAppliedCoupon);

  document.getElementById("summarySubtotal").textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("summaryDelivery").textContent = `$${delivery.toFixed(2)}`;
  document.getElementById("summaryService").textContent = `$${service.toFixed(2)}`;
  document.getElementById("summaryDiscount").textContent = `-$${discount.toFixed(2)}`;
  document.getElementById("summaryTotal").textContent = `$${total.toFixed(2)}`;

  document.getElementById("discountRow").style.display = discount > 0 ? "flex" : "none";

  const timeOption = document.querySelector('input[name="deliveryTimeOption"]:checked')?.value;
  document.getElementById("estimatedDeliveryLabel").innerHTML =
    `<i class="fa-solid fa-clock"></i> ${estimatedDeliveryText(timeOption)}`;
}

function estimatedDeliveryText(option) {
  if (option === "schedule") {
    const date = document.getElementById("scheduledDate").value;
    const time = document.getElementById("scheduledTime").value;
    return date && time ? `Scheduled for ${date} at ${time}` : "Choose a date and time below";
  }
  const labels = { asap: "Estimated delivery: 20-30 min", "30-45": "Estimated delivery: 30-45 min", "45-60": "Estimated delivery: 45-60 min" };
  return labels[option] || "Estimated delivery: 30-45 min";
}

/* ---------- Delivery Time Toggle ---------- */
function setMinScheduleDate() {
  const dateInput = document.getElementById("scheduledDate");
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;
}

function setupDeliveryTimeToggle() {
  const radios = document.querySelectorAll('input[name="deliveryTimeOption"]');
  const scheduleFields = document.getElementById("scheduleFields");

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      scheduleFields.hidden = radio.value !== "schedule" || !radio.checked;
      updateCheckoutSummary();
    });
  });

  document.getElementById("scheduledDate").addEventListener("change", updateCheckoutSummary);
  document.getElementById("scheduledTime").addEventListener("change", updateCheckoutSummary);
}

/* ---------- Payment Method Toggle ---------- */
function setupPaymentMethodToggle() {
  const radios = document.querySelectorAll('input[name="paymentMethod"]');
  const cardFields = document.getElementById("cardFields");
  const mobileFields = document.getElementById("mobileFields");
  const scenarioField = document.getElementById("paymentScenarioField");

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      cardFields.hidden = radio.value !== "card";
      mobileFields.hidden = radio.value !== "mobile";
      scenarioField.hidden = radio.value === "cod";
      hidePaymentError();
    });
  });
}

/* ---------- Coupon ---------- */
function setupCouponHandler() {
  document.getElementById("applyCouponBtn").addEventListener("click", () => {
    const input = document.getElementById("couponInput");
    const message = document.getElementById("couponMessage");
    const result = validateCoupon(input.value);

    message.classList.remove("success", "error");
    message.textContent = result.message;
    message.classList.add(result.type === "success" ? "success" : "error");

    checkoutAppliedCoupon = result.valid ? result.coupon : null;
    showToast(result.message, result.valid ? "success" : result.type);
    updateCheckoutSummary();
  });
}

/* ---------- Validation ---------- */
function clearFieldErrors() {
  document.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
  document.querySelectorAll(".form-field input, .form-field textarea").forEach((el) => el.classList.remove("invalid"));
}

function setFieldError(inputId, message) {
  const errorEl = document.getElementById(`${inputId}Error`);
  const input = document.getElementById(inputId);
  if (errorEl) errorEl.textContent = message;
  if (input) input.classList.add("invalid");
}

function validateCheckoutForm() {
  clearFieldErrors();
  let isValid = true;

  const name = document.getElementById("customerName").value.trim();
  const email = document.getElementById("customerEmail").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const street = document.getElementById("street").value.trim();
  const area = document.getElementById("area").value.trim();
  const city = document.getElementById("city").value.trim();

  if (!name) {
    setFieldError("customerName", "Full name is required.");
    isValid = false;
  }
  if (!email || !isValidEmail(email)) {
    setFieldError("customerEmail", "Enter a valid email address.");
    isValid = false;
  }
  if (!phone || !isValidPhone(phone)) {
    setFieldError("customerPhone", "Enter a valid phone number.");
    isValid = false;
  }
  if (!street) {
    setFieldError("street", "Street or building name is required.");
    isValid = false;
  }
  if (!area) {
    setFieldError("area", "Area or district is required.");
    isValid = false;
  }
  if (!city) {
    setFieldError("city", "City is required.");
    isValid = false;
  }

  const timeOption = document.querySelector('input[name="deliveryTimeOption"]:checked').value;
  if (timeOption === "schedule") {
    const dateVal = document.getElementById("scheduledDate").value;
    const timeVal = document.getElementById("scheduledTime").value;

    if (!dateVal) {
      setFieldError("scheduledDate", "Please choose a date.");
      isValid = false;
    }
    if (!timeVal) {
      setFieldError("scheduledTime", "Please choose a time.");
      isValid = false;
    }

    if (dateVal && timeVal) {
      const chosen = new Date(`${dateVal}T${timeVal}`);
      if (chosen < new Date()) {
        setFieldError("scheduledDate", "Scheduled time cannot be in the past.");
        setFieldError("scheduledTime", "Scheduled time cannot be in the past.");
        isValid = false;
      }
    }
  }

  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

  if (paymentMethod === "card") {
    const cardName = document.getElementById("cardName").value.trim();
    const cardNumber = document.getElementById("cardNumber").value.replace(/\s/g, "");
    const cardExpiry = document.getElementById("cardExpiry").value.trim();
    const cardCvv = document.getElementById("cardCvv").value.trim();

    if (!cardName) {
      setFieldError("cardName", "Cardholder name is required.");
      isValid = false;
    }
    if (!/^\d{13,16}$/.test(cardNumber)) {
      setFieldError("cardNumber", "Enter a valid 13-16 digit card number.");
      isValid = false;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) {
      setFieldError("cardExpiry", "Use MM/YY format.");
      isValid = false;
    }
    if (!/^\d{3,4}$/.test(cardCvv)) {
      setFieldError("cardCvv", "Enter a valid CVV.");
      isValid = false;
    }
  }

  if (paymentMethod === "mobile") {
    const mobileNumber = document.getElementById("mobileNumber").value.trim();
    if (!mobileNumber || !isValidPhone(mobileNumber)) {
      setFieldError("mobileNumber", "Enter a valid mobile money number.");
      isValid = false;
    }
  }

  if (!document.getElementById("termsCheckbox").checked) {
    document.getElementById("termsError").textContent = "You must agree to the terms to place an order.";
    isValid = false;
  } else {
    document.getElementById("termsError").textContent = "";
  }

  return isValid;
}

/* ---------- Payment Simulation ---------- */
const PAYMENT_FAILURE_MESSAGES = {
  declined: "Your card was declined by the issuing bank. Please try a different card or payment method.",
  invalid: "The card details entered are invalid. Please double-check the number, expiry, and CVV.",
  insufficient: "Payment failed - insufficient balance on this card. Please try another payment method.",
  timeout: "The mobile payment confirmation timed out. Please try again or choose a different method.",
};

// Simulates a payment gateway round-trip with a short delay, resolving with
// { success: true } or rejecting with a scenario key. Cash on Delivery always
// succeeds instantly since no payment happens up front.
function simulatePayment(paymentMethod) {
  return new Promise((resolve, reject) => {
    if (paymentMethod === "cod") {
      resolve({ success: true });
      return;
    }

    const scenario = document.getElementById("paymentScenario").value;

    setTimeout(() => {
      if (scenario === "success") {
        resolve({ success: true });
      } else {
        reject(scenario);
      }
    }, 1200);
  });
}

function showPaymentError(scenario) {
  const banner = document.getElementById("paymentErrorBanner");
  document.getElementById("paymentErrorText").textContent =
    PAYMENT_FAILURE_MESSAGES[scenario] || "Payment could not be completed. Please try again.";
  banner.hidden = false;
  banner.scrollIntoView({ behavior: "smooth", block: "center" });
}

function hidePaymentError() {
  document.getElementById("paymentErrorBanner").hidden = true;
}

function setPlaceOrderLoading(isLoading) {
  const btn = document.getElementById("placeOrderBtn");
  const label = document.getElementById("placeOrderBtnLabel");
  btn.disabled = isLoading;
  label.innerHTML = isLoading
    ? `<i class="fa-solid fa-spinner fa-spin"></i> Processing Payment...`
    : `Place Order <i class="fa-solid fa-arrow-right"></i>`;
}

/* ---------- Place Order ---------- */
function setupPlaceOrder() {
  document.getElementById("placeOrderBtn").addEventListener("click", async () => {
    if (!getCart().length) {
      showToast("Your cart is empty.", "error");
      return;
    }

    if (!validateCheckoutForm()) {
      showToast("Please fix the highlighted fields before placing your order.", "error");
      return;
    }

    hidePaymentError();

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const deliveryTimeOption = document.querySelector('input[name="deliveryTimeOption"]:checked').value;
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked').value;

    setPlaceOrderLoading(true);

    try {
      await simulatePayment(paymentMethod);
    } catch (failedScenario) {
      setPlaceOrderLoading(false);
      showPaymentError(failedScenario);
      showToast("Payment failed. No order was created.", "error");
      return;
    }

    setPlaceOrderLoading(false);

    const customer = {
      name: document.getElementById("customerName").value.trim(),
      email: document.getElementById("customerEmail").value.trim(),
      phone: document.getElementById("customerPhone").value.trim(),
    };

    const delivery = {
      label: document.getElementById("addressLabel").value,
      street: document.getElementById("street").value.trim(),
      apartment: document.getElementById("apartment").value.trim(),
      area: document.getElementById("area").value.trim(),
      city: document.getElementById("city").value.trim(),
      instructions: document.getElementById("instructions").value.trim(),
    };

    if (document.getElementById("saveAddressCheckbox").checked && isLoggedIn()) {
      saveAddress({ ...delivery, isDefault: getSavedAddresses().length === 0 });
      showToast("Address saved to your account.", "success");
    }

    const checkoutData = {
      customer,
      delivery,
      deliveryMethod,
      deliveryTimeOption,
      scheduledDate: document.getElementById("scheduledDate").value,
      scheduledTime: document.getElementById("scheduledTime").value,
      paymentMethod,
      mobileProvider: paymentMethod === "mobile" ? document.getElementById("mobileProvider").value : null,
      coupon: checkoutAppliedCoupon ? { code: checkoutAppliedCoupon.code, description: checkoutAppliedCoupon.description } : null,
      totals: {
        subtotal: calculateSubtotal(),
        deliveryFee: calculateDeliveryFee(checkoutAppliedCoupon),
        serviceFee: calculateServiceFee(),
        discount: calculateDiscount(checkoutAppliedCoupon),
        total: calculateTotal(checkoutAppliedCoupon),
      },
    };

    const order = createOrder(checkoutData);

    if (!order) {
      showToast("Something went wrong placing your order. Please try again.", "error");
      return;
    }

    showToast("Order placed successfully!", "success");
    window.location.href = "order-confirmation.html";
  });
}
