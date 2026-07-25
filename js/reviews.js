/* ===========================================================
   FreshBite - Reviews & Ratings
   One review per delivered order (tied to its restaurant).
   Reviews are stored in a single array in localStorage and
   rendered on the restaurant's menu page and the account page.
   =========================================================== */

/* ---------- Read / Write ---------- */
function getAllReviews() {
  return readStorage(STORAGE_KEYS.REVIEWS, getSampleReviews());
}

function saveAllReviews(reviews) {
  writeStorage(STORAGE_KEYS.REVIEWS, reviews);
}

function getReviewsForRestaurant(restaurantId) {
  return getAllReviews()
    .filter((r) => r.restaurantId === restaurantId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getReviewsByUser(userId) {
  return getAllReviews()
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function hasReviewedOrder(orderId) {
  return getAllReviews().some((r) => r.orderId === orderId);
}

/* ---------- Create / Delete ---------- */
function submitReview({ orderId, restaurantId, rating, title, comment }) {
  const user = getCurrentUser();
  if (!user) {
    showToast("Please log in to write a review.", "warning");
    return null;
  }

  if (hasReviewedOrder(orderId)) {
    showToast("You already reviewed this order.", "warning");
    return null;
  }

  if (!rating || rating < 1 || rating > 5) {
    showToast("Please select a star rating from 1 to 5.", "error");
    return null;
  }

  if (!title.trim() || !comment.trim()) {
    showToast("Please fill in both the review title and comment.", "error");
    return null;
  }

  const review = {
    id: `rev_${Date.now()}`,
    orderId,
    restaurantId,
    userId: user.id,
    userName: user.fullName,
    rating: Number(rating),
    title: title.trim(),
    comment: comment.trim(),
    createdAt: new Date().toISOString(),
  };

  const reviews = getAllReviews();
  reviews.push(review);
  saveAllReviews(reviews);

  showToast("Thanks! Your review has been submitted.", "success");
  return review;
}

function deleteReview(reviewId) {
  const user = getCurrentUser();
  const reviews = getAllReviews();
  const review = reviews.find((r) => r.id === reviewId);

  if (!review || !user || review.userId !== user.id) return false;

  const updated = reviews.filter((r) => r.id !== reviewId);
  saveAllReviews(updated);
  showToast("Review deleted.", "info");
  return true;
}

/* ---------- Aggregates ---------- */
function getRestaurantRatingSummary(restaurantId) {
  const reviews = getReviewsForRestaurant(restaurantId);
  if (!reviews.length) return { average: 0, count: 0 };

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return { average: +(total / reviews.length).toFixed(1), count: reviews.length };
}

/* ---------- Render: Restaurant reviews (menu.html) ---------- */
function renderRestaurantReviews(restaurantId, containerId = "reviewsList") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const reviews = getReviewsForRestaurant(restaurantId);
  const summary = getRestaurantRatingSummary(restaurantId);

  const summaryEl = document.getElementById("reviewsSummary");
  if (summaryEl) {
    summaryEl.innerHTML = reviews.length
      ? `<span class="reviews-average"><i class="fa-solid fa-star"></i> ${summary.average}</span> based on ${summary.count} review${summary.count === 1 ? "" : "s"}`
      : "No reviews yet - be the first to review this restaurant!";
  }

  if (!reviews.length) {
    container.innerHTML = `<p class="no-reviews">This restaurant hasn't been reviewed yet.</p>`;
    return;
  }

  const currentUser = getCurrentUser();

  container.innerHTML = reviews
    .map(
      (review) => `
      <article class="review-card">
        <div class="review-card-head">
          <div>
            <strong>${review.userName}</strong>
            <div class="review-stars">${renderStars(review.rating)}</div>
          </div>
          <span class="review-date">${new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
        <h4>${review.title}</h4>
        <p>${review.comment}</p>
        ${
          currentUser && currentUser.id === review.userId
            ? `<button class="delete-review-btn" data-id="${review.id}" type="button"><i class="fa-solid fa-trash"></i> Delete</button>`
            : ""
        }
      </article>`
    )
    .join("");

  container.querySelectorAll(".delete-review-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (deleteReview(btn.dataset.id)) {
        renderRestaurantReviews(restaurantId, containerId);
      }
    });
  });
}

function renderStars(rating) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += `<i class="fa-${i <= rating ? "solid" : "regular"} fa-star"></i>`;
  }
  return html;
}

/* ---------- Sample Data ---------- */
// Seed a handful of reviews so the UI isn't empty on first load.
function getSampleReviews() {
  const sample = [
    {
      id: "rev_sample_1",
      orderId: "sample-order-1",
      restaurantId: 1,
      userId: "sample_user_1",
      userName: "Amina K.",
      rating: 5,
      title: "Best pizza in town!",
      comment: "The Margherita was fresh, cheesy, and delivered hot. Will order again for sure.",
      createdAt: "2026-06-10T18:30:00.000Z",
    },
    {
      id: "rev_sample_2",
      orderId: "sample-order-2",
      restaurantId: 3,
      userId: "sample_user_2",
      userName: "Farah M.",
      rating: 5,
      title: "Tastes just like home",
      comment: "The suqaar and bariis were incredibly authentic. Portion size was generous too.",
      createdAt: "2026-06-02T12:15:00.000Z",
    },
    {
      id: "rev_sample_3",
      orderId: "sample-order-3",
      restaurantId: 2,
      userId: "sample_user_3",
      userName: "James O.",
      rating: 4,
      title: "Solid burgers, fast delivery",
      comment: "Burger was juicy and the delivery arrived quicker than the estimate. Fries could be crispier.",
      createdAt: "2026-05-20T20:05:00.000Z",
    },
  ];

  writeStorage(STORAGE_KEYS.REVIEWS, sample);
  return sample;
}
