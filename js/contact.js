/* ===========================================================
   FreshBite - Contact Page
   Validates the contact form, generates a simulated ticket
   number, and stores inquiries in localStorage. No real email
   is sent - this is a frontend-only simulation.
   =========================================================== */

const CONTACT_INQUIRIES_KEY = "freshbite_contact_inquiries";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", handleContactSubmit);
});

function handleContactSubmit(e) {
  e.preventDefault();

  const fullName = document.getElementById("contactName").value.trim();
  const email = document.getElementById("contactEmail").value.trim();
  const phone = document.getElementById("contactPhone").value.trim();
  const subject = document.getElementById("contactSubject").value.trim();
  const message = document.getElementById("contactMessage").value.trim();
  const reason = document.getElementById("contactReason").value;
  const responseMethod = document.querySelector('input[name="responseMethod"]:checked')?.value;

  clearContactErrors();
  let isValid = true;

  if (!fullName) {
    setContactError("contactName", "Full name is required.");
    isValid = false;
  }
  if (!email || !isValidEmail(email)) {
    setContactError("contactEmail", "Enter a valid email address.");
    isValid = false;
  }
  if (!phone || !isValidPhone(phone)) {
    setContactError("contactPhone", "Enter a valid phone number.");
    isValid = false;
  }
  if (!subject) {
    setContactError("contactSubject", "Subject is required.");
    isValid = false;
  }
  if (!message || message.length < 10) {
    setContactError("contactMessage", "Message must be at least 10 characters.");
    isValid = false;
  }
  if (!responseMethod) {
    document.getElementById("responseMethodError").textContent = "Please choose a preferred response method.";
    isValid = false;
  }

  if (!isValid) {
    showToast("Please fix the highlighted fields.", "error");
    return;
  }

  const submitBtn = document.getElementById("contactSubmitBtn");
  submitBtn.disabled = true;
  submitBtn.classList.add("is-loading");
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending...`;

  // Short simulated delay so the loading state is visible, then "send".
  setTimeout(() => {
    const ticketNumber = generateTicketNumber();

    const inquiry = {
      ticketNumber,
      fullName,
      email,
      phone,
      subject,
      message,
      reason,
      responseMethod,
      createdAt: new Date().toISOString(),
    };

    const inquiries = readStorage(CONTACT_INQUIRIES_KEY, []);
    inquiries.push(inquiry);
    writeStorage(CONTACT_INQUIRIES_KEY, inquiries);

    if (typeof addNotification === "function") {
      addNotification("Support request received", `Your ticket ${ticketNumber} has been logged. We'll respond via ${responseMethod}.`, "fa-solid fa-headset");
    }

    showContactSuccess(ticketNumber);
    document.getElementById("contactForm").reset();

    submitBtn.disabled = false;
    submitBtn.classList.remove("is-loading");
    submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Send Message`;
  }, 900);
}

function generateTicketNumber() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `FB-TICKET-${Date.now().toString().slice(-6)}${random}`;
}

function showContactSuccess(ticketNumber) {
  const successBox = document.getElementById("contactSuccessMessage");
  successBox.hidden = false;
  successBox.innerHTML = `
    <i class="fa-solid fa-circle-check"></i>
    <div>
      <strong>Message sent!</strong>
      <p>Your ticket number is <strong>${ticketNumber}</strong>. Our (simulated) support team will follow up soon.</p>
    </div>`;
  successBox.scrollIntoView({ behavior: "smooth", block: "center" });
  showToast(`Message sent! Ticket ${ticketNumber} created.`, "success");
}

function clearContactErrors() {
  document.querySelectorAll("#contactForm .field-error").forEach((el) => (el.textContent = ""));
}

function setContactError(inputId, message) {
  const errorEl = document.getElementById(`${inputId}Error`);
  if (errorEl) errorEl.textContent = message;
}
