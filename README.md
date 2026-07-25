# FreshBite - Online Food Ordering Platform

A full-featured, frontend-only food ordering web application built with **HTML5, CSS3, and vanilla JavaScript** - no frameworks, no build tools, no backend.

## Internship Task Information

- **Project**: FreshBite Online Food Ordering Website
- **Track**: Frontend Web Development Internship
- **Student Code**: *(add your assigned student/intern code here)*
- **Submission stage**: Final stage - full simulated e-commerce food-ordering experience

> **Important disclaimer:** FreshBite is an educational simulation. Authentication, payments, delivery tracking, and notifications are all simulated on the client and stored in the browser's `localStorage`. Nothing here should be treated as a production-ready or secure system.

## Table of Contents

- [Features](#features)
- [Bonus Features](#bonus-features)
- [Technologies](#technologies)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Running with VS Code Live Server](#running-with-vs-code-live-server)
- [Test Account Information](#test-account-information)
- [Sample Coupon Codes](#sample-coupon-codes)
- [Simulated Payment Instructions](#simulated-payment-instructions)
- [Screenshots](#screenshots)
- [Live Demo](#live-demo)
- [Video Demo](#video-demo)
- [Project Report](#project-report)
- [Limitations](#limitations)
- [Future Improvements](#future-improvements)
- [Author](#author)
- [Task Submission](#task-submission)

## Features

**Browsing & Discovery**
- Responsive home page with hero search, categories, featured restaurants, popular dishes, and offers
- Restaurant listing with search, cuisine/rating/price/delivery-time/free-delivery/open-now filters, and sorting
- Restaurant menu pages with search, category & dietary filters, sorting, and per-restaurant reviews
- Full product detail page with customization (size, spice, extras, instructions), related dishes, and reviews
- Global search across restaurants, dishes, categories, cuisines, and offers with keyboard navigation

**Ordering**
- Shopping cart with quantity controls, per-item customization, and the single-restaurant-per-order rule
- Coupon system with minimum order, expiry, category/first-order conditions, and reuse prevention
- Checkout with customer info, saved/entered delivery address, delivery method & time, and payment method
- Simulated payment (Cash on Delivery, Card, Mobile Payment) including simulated success/failure scenarios
- Order confirmation page and simulated 5-stage order tracking with a demo driver and "advance status" control

**Account**
- Simulated registration and login (client-side only, passwords never leave the browser)
- Account dashboard: profile editing, order history with reorder, saved addresses, wishlist, and reviews
- Wishlist and recently-viewed history, both usable as a guest and merged into your account on login

## Bonus Features

- **Global Search** (`js/global-search.js`) - live dropdown search with arrow-key/Enter/Escape navigation
- **Dark Mode** (`js/theme.js`) - persisted light/dark theme using CSS variables, respects system preference
- **Recently Viewed** - last 8 viewed dishes, de-duplicated, clearable
- **Recommended for You** - simple rule-based suggestions from wishlist/order/recently-viewed categories (clearly labeled as simulated, not AI-powered)
- **Notification Center** - navbar bell with simulated order/coupon notifications, read/unread state
- **Support Chat Simulation** - floating chat widget with predefined quick-question responses
- **Loading Skeletons** - skeleton cards while restaurant/menu lists "load"
- **Simulated Payment Failure** - selectable test scenarios (declined, invalid, insufficient funds, timeout) with retry
- **Custom 404 Page** with a search field

## Technologies

- HTML5 (semantic markup)
- CSS3 (custom properties/variables, Grid, Flexbox, animations, dark theme)
- Vanilla JavaScript (ES6+, modular functions, no frameworks)
- Font Awesome 6 (icons, via CDN)
- Google Fonts - Poppins & Nunito (via CDN)
- Browser `localStorage` for all persistence

No React, Vue, Angular, npm, Node.js backend, or database is used anywhere in this project.

## Folder Structure

```
freshbite-food-ordering/
├── index.html                 Home page
├── restaurants.html           Restaurant listing
├── menu.html                  Restaurant menu (?restaurantId=)
├── product.html                Dish detail page (?foodId=)
├── cart.html                   Shopping cart
├── checkout.html                Checkout + payment simulation
├── order-confirmation.html      Order confirmation
├── order-tracking.html          Simulated order tracking
├── login.html / register.html   Simulated auth
├── account.html                 Account dashboard
├── offers.html                  Offers & coupons
├── about.html                   About FreshBite
├── contact.html                 Contact form
├── faq.html                     FAQ accordion
├── 404.html                     Custom not-found page
├── css/
│   └── style.css                All styles (variables, components, dark theme, responsive)
├── js/
│   ├── data.js                  Static data: categories, restaurants, foodItems, offers, coupons
│   ├── auth.js                  Storage helpers, toasts, register/login/session, navbar auth UI
│   ├── cart.js                  Cart engine (localStorage), coupon validation, conflict modal
│   ├── orders.js                Order creation, history, tracking, reorder
│   ├── wishlist.js              Wishlist CRUD + UI hooks
│   ├── reviews.js               Restaurant/order reviews
│   ├── product.js               Product page, customization, product reviews, recently viewed, recommendations
│   ├── checkout.js              Checkout form logic, payment simulation
│   ├── account.js               Account dashboard tabs and panels
│   ├── restaurants.js           Restaurant listing filters/sort
│   ├── menu.js                  Menu filters/sort
│   ├── contact.js               Contact form + simulated ticketing
│   ├── offers.js                Offers page rendering/filtering
│   ├── faq.js                   FAQ accordion/search/filter
│   ├── global-search.js         Global navbar search
│   ├── theme.js                 Dark mode toggle
│   ├── extras.js                Notifications, support chat, about-page counters
│   ├── script.js                Home page rendering
│   └── nav.js                   Shared mobile menu / newsletter / footer year
├── images/                      (reserved for local image assets)
├── README.md
└── PROJECT-REPORT.md
```

## Installation

1. Download or clone this project folder - no `npm install` or build step is required.
2. Open the folder in VS Code (or any code editor).

## Running with VS Code Live Server

1. Install the **Live Server** extension (by Ritwick Dey) in VS Code.
2. Right-click `index.html` → **"Open with Live Server"** (or click "Go Live" in the status bar).
3. The site opens at `http://127.0.0.1:5500/index.html`.
4. Navigate the site using the navbar - all pages are linked with relative paths.

## Test Account Information

No pre-seeded login exists (accounts are created by you, in your own browser). To test:

1. Go to **Register**, fill in a name, any email (e.g. `test@example.com`), a phone number, and a password of 8+ characters.
2. You'll be logged in immediately and redirected to your account dashboard.
3. Use **Logout** from the navbar user menu, then **Login** again with the same email/password to test the login flow.

## Sample Coupon Codes

| Code | Discount | Notes |
|---|---|---|
| `FRESH10` | 10% off | Minimum order $10 |
| `WELCOME5` | $5 off | Minimum order $15 |
| `FREEDELIVERY` | Free delivery | No minimum |
| `PIZZA20` | 20% off pizza items | Cart must contain a Pizza-category item |
| `FIRSTORDER` | 15% off | Requires login; only valid before your first completed order |

Try an invalid code, an already-used code, or a code below its minimum order to see the corresponding error/warning message.

## Simulated Payment Instructions

At checkout, choose **Card** or **Mobile Payment** to reveal a **Test Payment Scenario** dropdown:

- **Successful Payment** - order is created normally
- **Declined Card**, **Invalid Card Details**, **Insufficient Balance**, **Mobile Payment Timeout** - checkout shows a clear error banner and does **not** create an order; use **Place Order** again (with "Successful Payment" selected) to retry

Card numbers, expiry, and CVV are validated for format only and are **never stored** - only the payment *method* is saved on the order.

## Screenshots

- [x] [Home - Desktop](images/Home%20-%20Desktop.png)
- [x] [Home - Mobile](images/home%20-mobile.png)
- [x] [Restaurant Listing](images/resturentListing.png)
- [x] [Restaurant Menu](images/Restaurant%20Menu.png)
- [x] [Product Details](images/productDetails.png)
- [x] [Cart](images/Cart.png)
- [x] [Checkout](images/checkout.png)
- [x] [Order Confirmation](images/Order%20Confirmation.png)
- [x] [Order Tracking](images/Order%20Tracking.png)
- [x] [User Account](images/user%20Account.png)
- [x] [Wishlist](images/wishlists.png)
- [x] [Offers](images/offers.png)
- [x] [Dark Mode](images/darkmode.png)
- [x] [Contact Page](images/contactPage.png)
- [x] [Mobile Navigation](images/mobile%20nav.png)

## Live Demo

[https://maryan-123.github.io/freshbite-food-ordering/](https://maryan-123.github.io/freshbite-food-ordering/)

## Video Demo

[https://youtu.be/sZ875CAGyPw](https://youtu.be/sZ875CAGyPw)

## Project Report

See [PROJECT-REPORT.md](PROJECT-REPORT.md) for the full written report.

## Limitations

- Authentication is fully simulated - passwords are lightly obfuscated (not securely hashed) and stored in `localStorage`; do not enter a real password you use elsewhere.
- No real backend, database, or payment processor - all data lives only in the current browser and is lost if site data is cleared.
- Data is not shared between browsers/devices; there is no server to sync accounts, orders, or carts.
- Product nutrition/ingredient/allergen data on the product page is deterministically simulated per dish, not sourced from real restaurants.
- Global search matches simple substring queries; it is not a fuzzy/full-text search engine.
- Map views (checkout delivery, order tracking) are static placeholders, not real maps.

## Future Improvements

- Connect to a real backend (Node/Express + database) for persistent, multi-device accounts and orders
- Real payment gateway integration (Stripe/PayPal) behind proper server-side validation
- Real-time order tracking via WebSockets instead of a manual "Advance Status" button
- Server-rendered image optimization and a CDN for restaurant/dish photography
- Automated end-to-end tests (Cypress/Playwright) covering the full customer journey

## Author

**Maryan Hussein Ulusow**

- 📧 Email: [maryanhussein621@gmail.com](mailto:maryanhussein621@gmail.com)
- 💻 GitHub: [Maryan-123](https://github.com/Maryan-123)

## Task Submission

*(Add your internship task submission link here.)*
