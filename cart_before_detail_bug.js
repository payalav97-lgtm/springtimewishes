
// STW safeguard: product detail toggles must never add to cart
document.addEventListener("click", function(event) {
  const detailButton = event.target.closest("button");
  if (!detailButton) return;

  const label = (detailButton.textContent || "").trim().toLowerCase();

  if (label === "fabric" || label === "care" || label === "sizing") {
    event.stopImmediatePropagation();
    event.preventDefault();

    const item = detailButton.closest(".detail, .accordion-item, .spec, li, div");
    const panel = item ? item.querySelector(".detail-body, .accordion-body, p") : null;

    detailButton.classList.toggle("is-active");
    if (panel) panel.classList.toggle("is-open");

    return false;
  }
}, true);


(function () {
  const STORE = "springtime-wishes-2.myshopify.com";
  const STORAGE_KEY = "stw_cart_v1";

  const DEFAULT_PRODUCT = {
    title: "night breeze top",
    price: 1880,
    variants: {
      "XS/S": "44495072919603",
      "S/M": "44495072952371",
      "M/L": "44495072985139"
    }
  };

  function currentProduct() {
    return window.STW_PRODUCT || DEFAULT_PRODUCT;
  }

  function normalize(value) {
    return String(value || "").trim().toUpperCase();
  }

  function readCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    renderCart();
  }

  function money(amount) {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN"
    }).format(amount);
  }

  function productVariantKeys() {
    return Object.keys(currentProduct().variants || {});
  }

  function stockFor(size) {
    const product = currentProduct();
    if (!product.stock) return Infinity;
    if (typeof product.stock[size] === "number") return product.stock[size];
    return Infinity;
  }

  function setSelectedSize(size) {
    const normalized = normalize(size);
    const product = currentProduct();

    if (!product.variants[normalized]) return;
    if (stockFor(normalized) <= 0) return;

    window.STW_SELECTED_SIZE = normalized;

    const keys = productVariantKeys();

    Array.from(document.querySelectorAll("button, .choice, [data-choice], [role='button']"))
      .forEach(el => {
        const text = normalize(el.textContent);
        if (!keys.includes(text)) return;

        const selected = text === normalized;

        el.setAttribute("aria-pressed", selected ? "true" : "false");
        el.classList.toggle("active", selected);
        el.classList.toggle("selected", selected);
        el.classList.toggle("is-active", selected);
      });
  }

  function selectedSize() {
    const product = currentProduct();

    if (window.STW_SELECTED_SIZE && product.variants[window.STW_SELECTED_SIZE]) {
      return window.STW_SELECTED_SIZE;
    }

    const keys = productVariantKeys();

    const selected = Array.from(
      document.querySelectorAll('[aria-pressed="true"], .active, .selected, .is-active')
    )
      .map(el => normalize(el.textContent))
      .find(text => keys.includes(text) && stockFor(text) > 0);

    if (selected) {
      window.STW_SELECTED_SIZE = selected;
      return selected;
    }

    return null;
  }

  function quantity() {
    const qty = document.getElementById("qtyOut");
    return Math.max(1, Number(qty?.value || 1));
  }

  function productImage() {
    const images = Array.from(document.querySelectorAll("img"))
      .filter(img => {
        if (!img.src) return false;

        const rect = img.getBoundingClientRect();
        if (rect.width < 180 || rect.height < 180) return false;

        const src = img.src.toLowerCase();
        if (src.includes("logo")) return false;
        if (src.includes("icon")) return false;
        if (src.includes("svg")) return false;

        return true;
      })
      .sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return bRect.width * bRect.height - aRect.width * aRect.height;
      });

    return images[0]?.src || "";
  }

  function addToCart() {
    const product = currentProduct();
    const size = selectedSize();

    if (!size) {
      alert("Please select a size.");
      return;
    }

    const available = stockFor(size);
    const qty = quantity();

    if (available <= 0) {
      alert("This size is sold out.");
      return;
    }

    if (qty > available) {
      alert(`Only ${available} available in this size.`);
      return;
    }

    const variantId = product.variants[size];
    const cart = readCart();
    const existing = cart.find(item => item.variantId === variantId);

    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        variantId,
        title: product.title,
        size: size.toLowerCase(),
        price: product.price,
        qty,
        image: productImage()
      });
    }

    saveCart(cart);
    openCart();
  }

  function cartCount() {
    return readCart().reduce((sum, item) => sum + item.qty, 0);
  }

  function cartTotal() {
    return readCart().reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function createCartOnce() {
    if (document.querySelector("[data-stw-cart]")) return;

    const style = document.createElement("style");
    style.textContent = `
      .stw-cart-overlay {
        position: fixed;
        inset: 0;
        background: rgba(2, 1, 1, .58);
        opacity: 0;
        pointer-events: none;
        z-index: 9998;
        transition: opacity .25s ease;
      }

      .stw-cart-drawer {
        position: fixed;
        top: 0;
        right: 0;
        width: min(430px, 100vw);
        height: 100vh;
        background: rgba(5, 3, 2, .98);
        color: rgba(232, 225, 213, .92);
        border-left: 1px solid rgba(232, 225, 213, .15);
        transform: translateX(100%);
        transition: transform .3s ease;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        font-family: inherit;
      }

      body.stw-cart-open .stw-cart-overlay {
        opacity: 1;
        pointer-events: auto;
      }

      body.stw-cart-open .stw-cart-drawer {
        transform: translateX(0);
      }

      .stw-cart-head {
        display: flex;
        justify-content: space-between;
        padding: 22px;
        border-bottom: 1px solid rgba(232, 225, 213, .12);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: .08em;
      }

      .stw-cart-head button,
      .stw-cart-controls button {
        background: transparent;
        color: rgba(232, 225, 213, .7);
        border: 0;
        font: inherit;
        cursor: pointer;
        text-transform: lowercase;
      }

      .stw-cart-items {
        flex: 1;
        overflow: auto;
        padding: 10px 22px;
      }

      .stw-cart-item {
        display: grid;
        grid-template-columns: 92px 1fr;
        gap: 15px;
        padding: 18px 0;
        border-bottom: 1px solid rgba(232, 225, 213, .1);
      }

      .stw-cart-item img {
        width: 92px;
        height: 118px;
        object-fit: cover;
        object-position: center;
        opacity: 1;
        display: block;
        background: rgba(255,255,255,.03);
      }

      .stw-cart-title {
        font-size: 13px;
        text-transform: lowercase;
      }

      .stw-cart-meta {
        margin-top: 6px;
        font-size: 11px;
        color: rgba(232, 225, 213, .58);
        text-transform: lowercase;
      }

      .stw-cart-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 13px;
        font-size: 11px;
      }

      .stw-cart-controls button {
        border: 1px solid rgba(232, 225, 213, .15);
        padding: 3px 8px;
      }

      .stw-cart-remove {
        margin-left: auto;
      }

      .stw-cart-foot {
        padding: 22px;
        border-top: 1px solid rgba(232, 225, 213, .12);
      }

      .stw-cart-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 16px;
        font-size: 12px;
        text-transform: lowercase;
      }

      .stw-cart-checkout {
        width: 100%;
        background: rgba(232, 225, 213, .9);
        color: #020101;
        border: 0;
        padding: 15px 18px;
        font: inherit;
        font-size: 12px;
        letter-spacing: .08em;
        text-transform: uppercase;
        cursor: pointer;
      }

      .stw-cart-empty {
        margin-top: 18px;
        color: rgba(232, 225, 213, .55);
        font-size: 13px;
        text-transform: lowercase;
      }

      .choice.sold-out,
      .choice[disabled] {
        opacity: .28 !important;
        cursor: not-allowed !important;
        text-decoration: line-through !important;
        pointer-events: none !important;
      }
    `;

    document.head.appendChild(style);

    const cart = document.createElement("div");
    cart.setAttribute("data-stw-cart", "");
    cart.innerHTML = `
      <div class="stw-cart-overlay" data-stw-close-cart></div>

      <aside class="stw-cart-drawer">
        <div class="stw-cart-head">
          <span>cart</span>
          <button type="button" data-stw-close-cart>close</button>
        </div>

        <div class="stw-cart-items" data-stw-cart-items></div>

        <div class="stw-cart-foot">
          <div class="stw-cart-row">
            <span>subtotal</span>
            <span data-stw-cart-total>$0.00</span>
          </div>

          <button type="button" class="stw-cart-checkout" data-stw-checkout>
            shop now
          </button>
        </div>
      </aside>
    `;

    document.body.appendChild(cart);
  }

  function renderCart() {
    createCartOnce();

    const cart = readCart();
    const items = document.querySelector("[data-stw-cart-items]");
    const total = document.querySelector("[data-stw-cart-total]");

    const existingCartLabel = Array.from(document.querySelectorAll("a, button, div, span"))
      .find(el => /^cart\s*\/\s*\d+$/i.test(el.textContent.trim()));

    if (existingCartLabel) {
      existingCartLabel.textContent = `CART / ${cartCount()}`;
    }

    if (!items || !total) return;

    if (!cart.length) {
      items.innerHTML = `<p class="stw-cart-empty">your cart is empty.</p>`;
      total.textContent = money(0);
      return;
    }

    items.innerHTML = cart.map(item => `
      <div class="stw-cart-item">
        ${item.image ? `<img src="${item.image}" alt="">` : ""}
        <div>
          <div class="stw-cart-title">${item.title}</div>
          <div class="stw-cart-meta">${item.size}</div>
          <div class="stw-cart-meta">${money(item.price)}</div>

          <div class="stw-cart-controls">
            <button type="button" data-stw-minus="${item.variantId}">−</button>
            <span>${item.qty}</span>
            <button type="button" data-stw-plus="${item.variantId}">+</button>
            <button type="button" class="stw-cart-remove" data-stw-remove="${item.variantId}">remove</button>
          </div>
        </div>
      </div>
    `).join("");

    total.textContent = money(cartTotal());
  }

  function openCart() {
    createCartOnce();
    renderCart();
    document.body.classList.add("stw-cart-open");
  }

  function closeCart() {
    document.body.classList.remove("stw-cart-open");
  }

  function checkout() {
    const cart = readCart();

    if (!cart.length) return;

    const items = cart
      .map(item => `${item.variantId}:${item.qty}`)
      .join(",");

    window.location.href = `https://${STORE}/cart/${items}`;
  }

  function changeQty(variantId, amount) {
    const cart = readCart();
    const item = cart.find(product => product.variantId === variantId);

    if (!item) return;

    item.qty += amount;

    if (item.qty <= 0) {
      saveCart(cart.filter(product => product.variantId !== variantId));
      return;
    }

    saveCart(cart);
  }

  function applyStockToSizeButtons() {
    const keys = productVariantKeys();

    Array.from(document.querySelectorAll("button, .choice, [data-choice], [role='button']"))
      .forEach(el => {
        const text = normalize(el.textContent);
        if (!keys.includes(text)) return;

        const soldOut = stockFor(text) <= 0;

        el.disabled = soldOut;
        el.setAttribute("aria-disabled", soldOut ? "true" : "false");
        el.classList.toggle("sold-out", soldOut);

        if (soldOut) {
          el.setAttribute("aria-pressed", "false");
          el.classList.remove("active", "selected", "is-active");
        }
      });
  }

  document.addEventListener("click", function (event) {
    const target = event.target.closest("button, a, [role='button'], .choice, [data-choice], span, div");
    if (!target) return;

    const label = target.textContent.trim();
    const normalized = normalize(label);
    const product = currentProduct();

    if (product.variants && product.variants[normalized]) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setSelectedSize(normalized);
      return;
    }

    if (label.toLowerCase().includes("add to cart")) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      addToCart();
      return;
    }

    if (/cart\s*\/\s*\d+/i.test(label)) {
      event.preventDefault();
      openCart();
      return;
    }

    if (target.matches("[data-stw-close-cart]")) {
      closeCart();
      return;
    }

    if (target.matches("[data-stw-checkout]")) {
      checkout();
      return;
    }

    if (target.hasAttribute("data-stw-plus")) {
      changeQty(target.getAttribute("data-stw-plus"), 1);
      return;
    }

    if (target.hasAttribute("data-stw-minus")) {
      changeQty(target.getAttribute("data-stw-minus"), -1);
      return;
    }

    if (target.hasAttribute("data-stw-remove")) {
      saveCart(readCart().filter(item => item.variantId !== target.getAttribute("data-stw-remove")));
    }
  }, true);

  document.addEventListener("submit", function (event) {
    const label = event.target.textContent.trim().toLowerCase();

    if (!label.includes("add to cart")) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    addToCart();
  }, true);

  function init() {
    applyStockToSizeButtons();
    renderCart();

    window.STWCartAdd = addToCart;
    window.STWCartOpen = openCart;
    window.STWSetSelectedSize = setSelectedSize;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
