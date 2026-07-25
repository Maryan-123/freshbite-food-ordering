# Project Report: FreshBite Online Food Ordering Platform

## 1. Project Title

FreshBite - A Frontend-Only Online Food Ordering Simulation

## 2. Introduction

FreshBite is a multi-page food-ordering web application built entirely with HTML5, CSS3, and vanilla JavaScript. It simulates the core experience of a modern food-delivery platform - browsing restaurants, customizing and ordering food, applying coupons, checking out, tracking delivery, and managing an account - without any backend server, database, or real payment processor. All application state (users, carts, orders, reviews, wishlists, addresses, notifications) is persisted in the browser's `localStorage`.

The project was built in stages: a static responsive home page, a dynamic restaurant/menu/cart/checkout flow, a simulated authentication and account system, and finally this stage - product detail pages, offers, informational pages, and a set of bonus UX features (dark mode, global search, notifications, recommendations, and more).

## 3. Objective

To demonstrate strong frontend fundamentals - semantic HTML, maintainable CSS architecture, and modular vanilla JavaScript - by building a realistically-scoped, multi-page e-commerce-style application without relying on any framework, build tool, or backend, while still delivering features (accounts, carts, coupons, order tracking, reviews) that usually require one.

## 4. Technologies Used

- **HTML5** - semantic elements (`<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`), forms with proper labels
- **CSS3** - custom properties for theming (including a full dark mode), Flexbox and Grid layouts, transitions/animations, and a mobile-first responsive system
- **Vanilla JavaScript (ES6+)** - modular functions organized by concern across ~19 script files, `localStorage` for all persistence, no external JS frameworks
- **Font Awesome 6** and **Google Fonts** via CDN for icons and typography
- No npm, no bundler, no backend language, no database

## 5. Development Process

The project progressed in four broad stages:

1. **Static foundation** - responsive home page, design system (colors, typography, spacing, buttons, cards) defined once in CSS variables and reused everywhere.
2. **Dynamic commerce core** - restaurant listing and menu pages driven by a shared `foodItems`/`restaurants` dataset, a cart engine with a single-restaurant-per-order rule, and a coupon system.
3. **Accounts and checkout** - simulated registration/login, a full checkout flow (address, delivery method/time, payment method), order creation, order confirmation, and simulated order tracking.
4. **Enrichment and polish** (this stage) - a full product detail page with customization and per-dish reviews, an offers page, informational pages (About, Contact, FAQ, 404), and bonus UX features (dark mode, global search, notifications, support chat, recommendations, skeleton loading states, and simulated payment failure).

Each stage reused and extended the design system and JavaScript conventions established earlier, rather than introducing new patterns per page.

## 6. Core Features

- Responsive navigation and footer shared across every page
- Restaurant discovery: search, filter (cuisine, rating, price, delivery time, free delivery, open now), and sort
- Menu browsing: search, category/dietary filters, sort, per-restaurant reviews
- Product detail pages with size/spice/extras customization that affects the final cart price
- Shopping cart with quantity controls, a strict one-restaurant-per-cart rule (with a confirmation modal to start a new order), and live totals
- Coupon engine supporting percentage, flat, and free-delivery discounts with minimum-order, category-restricted, and first-order-only conditions
- Checkout with customer info, address entry/save, delivery method & time (including scheduling with past-date/time prevention), and three simulated payment methods
- Order confirmation and a five-stage simulated order-tracking timeline with a demo driver, "Advance Status," and "Reset Tracking" controls
- Simulated authentication (register/login/logout/session) and an account dashboard (profile, order history + reorder, saved addresses, wishlist, reviews)

## 7. Bonus Features

- **Global search** across restaurants, dishes, categories, cuisines, and offers, with full keyboard navigation (arrow keys, Enter, Escape)
- **Dark mode** using CSS custom properties, persisted in `localStorage`, respecting the OS-level preference on first visit
- **Recently viewed** dishes (max 8, de-duplicated, user-clearable)
- **"Recommended for You"** - a simple, clearly-labeled rule-based suggestion list built from wishlist categories, past order categories, and recently-viewed items (explicitly not an AI/ML feature)
- **Notification center** with simulated order-status and coupon notifications, unread counts, and mark-as-read/delete actions
- **Support chat simulation** - a floating widget with predefined quick questions and canned responses
- **Skeleton loading states** for restaurant and menu grids
- **Simulated payment failure scenarios** (declined, invalid, insufficient balance, timeout) with a clear error banner and retry, guaranteeing no order is created on failure

## 8. Data Storage Approach

Every piece of dynamic state uses a small set of `localStorage` keys, all read/written through generic helper functions (`readStorage`/`writeStorage` in `js/auth.js`) that safely fall back to sensible defaults if the stored JSON is missing or corrupted. Examples: `freshbite_cart`, `freshbite_users`, `freshbite_session`, `freshbite_orders`, `freshbite_wishlist_<userId>`, `freshbite_addresses_<userId>`, `freshbite_reviews`, `freshbite_food_reviews`, `freshbite_notifications`, and `freshbite_theme`. Cart line items carry a unique `cartItemId` so that a plain "Add to Cart" and a fully customized product-page add of the *same* dish never incorrectly merge into one row.

## 9. Challenges Encountered

- **Customized cart items merging incorrectly.** The original cart model matched line items purely by food ID, which is fine for plain adds but breaks once a dish can have different sizes/extras. This required introducing a `cartItemId` concept and updating every cart mutation function (add, remove, increase/decrease/update quantity, rendering) consistently.
- **Keeping every page's navbar in sync.** Auth state, cart count, theme, search, and notifications all needed to appear identically across 16 HTML pages without a templating engine, which meant designing small JS modules that inject their own markup into a shared `.nav-actions` container rather than hand-duplicating markup everywhere.
- **Dark mode without breaking brand color usage.** Several UI elements (footer, toast, badges) intentionally use the dark brand brown regardless of theme, so a single new `--color-text`/`--color-surface` pair had to be introduced instead of repurposing the existing `--color-dark` variable, to avoid breaking those fixed-color elements.
- **Avoiding inline JavaScript/CSS.** Several natural implementation shortcuts (inline `onclick`, inline `<script>` blocks, inline `style="width:..."` for rating bars) were deliberately refactored into external, event-listener-driven code to respect the project's "no inline JS/CSS" constraint.

## 10. Solutions

Each challenge above was solved by extending existing shared modules rather than creating one-off logic per page: cart line identity was centralized in `cart.js`, navbar injection logic lives in dedicated files (`theme.js`, `global-search.js`, `extras.js`) that any page can opt into with a single `<script>` tag, and the CSS variable system was extended (not replaced) to support theming.

## 11. Testing

Manual testing covered the full customer journey end-to-end: registration, login, restaurant search/filtering, menu filtering, product customization, wishlist, cart quantity changes, coupon application (valid, expired, below-minimum, already-used, non-existent), checkout (including scheduled delivery and all three payment methods, plus simulated payment failures), order confirmation, order tracking through all five stages, review submission, order history and reorder, profile/address editing, dark mode persistence, global search keyboard navigation, mobile navigation, and logout. All JavaScript files were also syntax-checked with Node's `--check`, and every HTML file was verified for balanced tags.

## 12. Learning Outcomes

- Structuring a non-trivial multi-page vanilla JS application without a framework, using shared modules and consistent conventions instead of components
- Designing a `localStorage`-backed data layer with defensive parsing, and modeling relationships (users → orders → reviews → addresses) without a real database
- Building an accessible, theme-aware CSS system from custom properties that scales across dozens of components
- Balancing feature scope against maintainability when a project grows from a single page into a full simulated product

## 13. Limitations

This is a **frontend simulation**, not a production food-delivery system: authentication is not cryptographically secure, no real payment is ever processed, there is no server so data does not sync across devices or survive a cleared browser profile, and third-party integrations (maps, SMS, email) are all static placeholders.

## 14. Future Improvements

A real backend with a database and authentication provider, an actual payment gateway, live WebSocket-based order tracking, server-side image optimization, and automated end-to-end test coverage would be the natural next steps toward a production-ready version of FreshBite.

## 15. Conclusion

FreshBite demonstrates that a rich, realistic e-commerce-style user experience - accounts, carts, coupons, checkout, order tracking, reviews, and several bonus UX features - can be built entirely on the frontend with disciplined vanilla JavaScript and a well-organized CSS design system. It is intended purely as a learning and portfolio project and explicitly should not be used as-is for real transactions.
