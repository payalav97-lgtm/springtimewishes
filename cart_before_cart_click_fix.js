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
    },
    stock: {
      "XS/S": 2,
      "S/M": 2,
      "M/L": 4
    }
  };

  function product() {
    return window.STW_PRODUCT || DEFAULT_PRODUCT;
  }

  function clean(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function sizeKey(text) {
    return clean(text).toUpperCase();
  }

  function readCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    renderCart();
  }

  function stockFor(size) {
    const stock = product().stock || {};
    const value = stock[size];

    if (value === undefined || value === null) return Infinity;

    const number = Number(value);
    return Number.isFinite(number) ? number : Infinity;
  }

  function variantFor(size) {
    const variants = product().variants || {};
    return variants[size];
  }

  function selectedSize() {
    if (window.STW_SELECTED_SIZE) return window.STW_SELECTED_SIZE;

    const active = document.querySelector(
      '[data-choice="size"].is-active, [data-choice="size"].selected, [data-choice="size"][aria-pressed="true"]'
    );

    return active ? sizeKey(active.textContent) : "";
  }

  function setSelectedSize(button) {
    const size = sizeKey(button.textContent);

    if (!variantFor(size) || stockFor(size) <= 0) return;

    window.STW_SELECTED_SIZE = size;

    document.querySelectorAll('[data-choice="size"]').forEach((btn) => {
      const isActive = sizeKey(btn.textContent) === size;
      btn.classList.toggle("is-active", isActive);
      btn.classList.toggle("selected", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function applyStock() {
    document.querySelectorAll('[data-choice="size"]').forEach((btn) => {
      const size = sizeKey(btn.textContent);
      const soldOut = stockFor(size) <= 0 || !variantFor(size);

      btn.disabled = soldOut;
      btn.classList.toggle("is-sold-out", soldOut);
      btn.classList.toggle("sold-out", soldOut);
      btn.setAttribute("aria-disabled", soldOut ? "true" : "false");

      if (soldOut && sizeKey(btn.textContent) === window.STW_SELECTED_SIZE) {
        window.STW_SELECTED_SIZE = "";
        btn.classList.remove("is-active", "selected");
        btn.setAttribute("aria-pressed", "false");
      }
    });

    if (!selectedSize()) {
      const firstAvailable = Array.from(document.querySelectorAll('[data-choice="size"]'))
        .find((btn) => !btn.disabled && stockFor(sizeKey(btn.textContent)) > 0);

      if (firstAvailable) setSelectedSize(firstAvailable);
    }
  }

  function currentImage() {
    const img =
      document.querySelector("#arenaPhoto") ||
      document.querySelector(".arena-photo") ||
      document.querySelector(".product-image img") ||
      document.querySelector("img");

    return img ? img.currentSrc || img.src || "" : "";
  }

  function addToCart() {
    const p = product();
    const size = selectedSize();

    if (!size) {
      alert("please select a size.");
      return;
    }

    const variantId = variantFor(size);

    if (!variantId || stockFor(size) <= 0) {
      alert("this size is sold out.");
      return;
    }

    const items = readCart();
    const existing = items.find((item) => item.variantId === variantId);
    const currentQty = existing ? Number(existing.qty || 0) : 0;

    if (currentQty + 1 > stockFor(size)) {
      alert("this size is sold out.");
      return;
    }

    if (existing) {
      existing.qty = currentQty + 1;
    } else {
      items.push({
        variantId,
        title: p.title,
        size,
        price: Number(p.price || 0),
        qty: 1,
        image: currentImage()
      });
    }

    saveCart(items);
    openCart();
  }

  function ensureCartUI() {
    let overlay = document.querySelector(".cart-overlay");
    let drawer = document.querySelector(".cart-drawer");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "cart-overlay";
      overlay.setAttribute("data-cart-close", "");
      document.body.appendChild(overlay);
    }

    if (!drawer) {
      drawer = document.createElement("aside");
      drawer.className = "cart-drawer";
      drawer.setAttribute("aria-hidden", "true");
      drawer.innerHTML = `
        <button type="button" class="cart-close" data-cart-close>close</button>
        <div class="cart-items"></div>
        <button type="button" class="cart-checkout" data-checkout>shop now</button>
      `;
      document.body.appendChild(drawer);
    }

    let itemsEl =
      drawer.querySelector(".cart-items") ||
      drawer.querySelector("#cartItems") ||
      drawer.querySelector("[data-cart-items]");

    if (!itemsEl) {
      itemsEl = document.createElement("div");
      itemsEl.className = "cart-items";
      drawer.appendChild(itemsEl);
    }

    return { overlay, drawer, itemsEl };
  }

  function renderCart() {
    const items = readCart();
    const { itemsEl } = ensureCartUI();

    if (!items.length) {
      itemsEl.innerHTML = `<p class="cart-empty">your cart is empty.</p>`;
    } else {
      itemsEl.innerHTML = items.map((item, index) => `
        <div class="cart-item">
          ${item.image ? `<img class="cart-item-image" src="${item.image}" alt="">` : ""}
          <div class="cart-item-info">
            <div class="cart-item-title">${item.title}</div>
            <div class="cart-item-size">${item.size}</div>
            <div class="cart-item-qty">qty ${item.qty}</div>
            <button type="button" data-cart-remove="${index}" class="cart-remove">remove</button>
          </div>
        </div>
      `).join("");
    }

    const count = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    document.querySelectorAll(".cart-count, #cartCount, [data-cart-count]").forEach((el) => {
      el.textContent = String(count);
    });
  }

  function openCart() {
    const { overlay, drawer } = ensureCartUI();

    overlay.classList.add("is-open", "open", "active");
    drawer.classList.add("is-open", "open", "active");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("cart-open");
  }

  function closeCart() {
    const { overlay, drawer } = ensureCartUI();

    overlay.classList.remove("is-open", "open", "active");
    drawer.classList.remove("is-open", "open", "active");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cart-open");
  }

  function checkout() {
    const items = readCart().filter((item) => item.variantId && Number(item.qty || 0) > 0);

    if (!items.length) {
      alert("your cart is empty.");
      return;
    }

    const path = items
      .map((item) => `${item.variantId}:${Number(item.qty || 1)}`)
      .join(",");

    window.location.href = `https://${STORE}/cart/${path}`;
  }

  function detailControlFromEvent(event) {
    const control = event.target.closest(
      "button, summary, a, [role='button'], .detail-title, .detail-toggle, .accordion-header, .spec-label"
    );

    if (!control) return null;

    const label = clean(control.textContent).toLowerCase();

    if (
      label === "fabric" ||
      label === "care" ||
      label === "sizing" ||
      label.startsWith("fabric ") ||
      label.startsWith("care ") ||
      label.startsWith("sizing ")
    ) {
      return control;
    }

    return null;
  }

  function toggleDetail(control) {
    const details = control.closest("details");

    if (details && control.tagName.toLowerCase() === "summary") {
      details.open = !details.open;
      return;
    }

    const row =
      control.closest(".detail, .detail-row, .accordion-item, .product-detail, .spec, .info-row") ||
      control.parentElement;

    let panel = control.nextElementSibling;

    if (!panel && row) {
      panel = Array.from(row.children).find((node) => {
        if (node === control) return false;
        const tag = (node.tagName || "").toLowerCase();
        return (tag === "p" || tag === "div") && clean(node.textContent).length > 0;
      });
    }

    const isOpen =
      control.getAttribute("aria-expanded") === "true" ||
      (row && row.classList.contains("is-open"));

    const nextOpen = !isOpen;

    control.classList.toggle("is-active", nextOpen);
    control.setAttribute("aria-expanded", nextOpen ? "true" : "false");

    if (row) row.classList.toggle("is-open", nextOpen);

    if (panel) {
      panel.hidden = false;
      panel.style.display = nextOpen ? "block" : "none";
      panel.classList.toggle("is-open", nextOpen);
    }
  }

  document.addEventListener("click", function (event) {
    const detailControl = detailControlFromEvent(event);

    if (detailControl) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      toggleDetail(detailControl);
      return;
    }

    const sizeButton = event.target.closest('[data-choice="size"]');

    if (sizeButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setSelectedSize(sizeButton);
      return;
    }

    const addButton = event.target.closest("[data-add-to-cart], .add-cart, #mobileAdd");

    if (addButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      addToCart();
      return;
    }

    const removeButton = event.target.closest("[data-cart-remove]");

    if (removeButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const items = readCart();
      const index = Number(removeButton.getAttribute("data-cart-remove"));
      items.splice(index, 1);
      saveCart(items);
      return;
    }

    const checkoutButton = event.target.closest("[data-checkout], .cart-checkout, .checkout-btn");

    if (checkoutButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      checkout();
      return;
    }

    const openButton = event.target.closest("[data-cart-open], .cart-label, .cart-toggle, #cartToggle");

    if (openButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openCart();
      return;
    }

    const closeButton = event.target.closest("[data-cart-close], .cart-close, .cart-overlay");

    if (closeButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      closeCart();
    }
  }, true);

  function init() {
    applyStock();
    renderCart();

    window.STWCartAdd = addToCart;
    window.STWCartOpen = openCart;
    window.STWSetSelectedSize = function (size) {
      const button = Array.from(document.querySelectorAll('[data-choice="size"]'))
        .find((btn) => sizeKey(btn.textContent) === sizeKey(size));

      if (button) setSelectedSize(button);
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
