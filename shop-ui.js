(function () {
  "use strict";

  const catalog = window.STW_CATALOG || [];
  const cartKey = "stw-shop-cart-v2";
  const checkoutBase = "https://springtime-wishes-2.myshopify.com/cart";
  let cart = readCart();

  function formatPrice(value) {
    return "$" + Number(value).toLocaleString("en-US") + " mxn";
  }

  function readCart() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(cartKey) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveCart() {
    try {
      window.localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch (error) {
      // The cart remains usable during this visit.
    }
  }

  function cartCount() {
    return cart.reduce(function (total, line) { return total + line.quantity; }, 0);
  }

  function updateBagCount() {
    document.querySelectorAll("[data-cart-count]").forEach(function (node) {
      node.textContent = String(cartCount()).padStart(2, "0");
    });
  }

  function injectCart() {
    document.body.insertAdjacentHTML("beforeend", [
      '<div class="cart-backdrop" data-cart-close></div>',
      '<aside class="cart-drawer" aria-label="shopping bag" aria-hidden="true">',
      '  <header class="cart-head">',
      '    <h2>your bag / <span data-drawer-count>00</span></h2>',
      '    <p>selected garments are held locally until checkout</p>',
      '    <button class="cart-close" type="button" aria-label="close bag" data-cart-close>×</button>',
      '  </header>',
      '  <div class="cart-lines" data-cart-lines></div>',
      '  <footer class="cart-foot">',
      '    <div class="cart-subtotal"><span>subtotal</span><strong data-cart-subtotal>$0 mxn</strong></div>',
      '    <a class="checkout-button is-disabled" href="#" data-checkout>continue to checkout</a>',
      '    <p>taxes and shipping calculated at checkout.</p>',
      '  </footer>',
      '</aside>'
    ].join("\n"));

    document.querySelectorAll("[data-cart-open]").forEach(function (button) {
      button.addEventListener("click", openCart);
    });
    document.querySelectorAll("[data-cart-close]").forEach(function (button) {
      button.addEventListener("click", closeCart);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeCart();
    });
    renderCart();
  }

  function openCart() {
    document.body.classList.add("cart-open");
    const drawer = document.querySelector(".cart-drawer");
    if (drawer) drawer.setAttribute("aria-hidden", "false");
  }

  function closeCart() {
    document.body.classList.remove("cart-open");
    const drawer = document.querySelector(".cart-drawer");
    if (drawer) drawer.setAttribute("aria-hidden", "true");
  }

  function renderCart() {
    const lines = document.querySelector("[data-cart-lines]");
    const count = cartCount();
    const subtotal = cart.reduce(function (total, line) { return total + line.price * line.quantity; }, 0);
    const drawerCount = document.querySelector("[data-drawer-count]");
    const subtotalNode = document.querySelector("[data-cart-subtotal]");
    const checkout = document.querySelector("[data-checkout]");

    updateBagCount();
    if (drawerCount) drawerCount.textContent = String(count).padStart(2, "0");
    if (subtotalNode) subtotalNode.textContent = formatPrice(subtotal);

    if (!cart.length) {
      lines.innerHTML = '<div class="cart-empty">your bag is quiet.</div>';
      checkout.href = "#";
      checkout.classList.add("is-disabled");
    } else {
      lines.innerHTML = cart.map(function (line) {
        return [
          '<article class="cart-line">',
          '  <img src="' + line.image + '" alt="">',
          '  <div>',
          '    <a href="' + line.file + '">' + line.title + '</a>',
          '    <span>size ' + line.size + ' / quantity ' + String(line.quantity).padStart(2, "0") + '</span>',
          '    <button type="button" data-remove-variant="' + line.variantId + '">remove</button>',
          '  </div>',
          '  <strong>' + formatPrice(line.price * line.quantity) + '</strong>',
          '</article>'
        ].join("\n");
      }).join("");
      checkout.href = checkoutBase + "/" + cart.map(function (line) {
        return line.variantId + ":" + line.quantity;
      }).join(",");
      checkout.classList.remove("is-disabled");
    }

    lines.querySelectorAll("[data-remove-variant]").forEach(function (button) {
      button.addEventListener("click", function () {
        cart = cart.filter(function (line) { return line.variantId !== button.dataset.removeVariant; });
        saveCart();
        renderCart();
      });
    });
  }

  function addToCart(product, size, quantity) {
    const existing = cart.find(function (line) { return line.variantId === size.variantId; });
    if (existing) {
      existing.quantity = Math.min(size.stock, existing.quantity + quantity);
    } else {
      cart.push({
        slug: product.slug,
        file: product.file,
        title: product.title,
        image: product.images[0],
        price: product.price,
        size: size.label,
        variantId: size.variantId,
        quantity: Math.min(size.stock, quantity)
      });
    }
    saveCart();
    renderCart();
    openCart();
  }

  function productCard(product) {
    const stock = product.sizes.reduce(function (total, size) { return total + size.stock; }, 0);
    return [
      '<a class="product-card" href="' + product.file + '">',
      '  <figure class="card-image">',
      '    <img src="' + product.images[0] + '" alt="' + product.title + '">',
      '    <img class="card-image-alt" src="' + product.images[1] + '" alt="" aria-hidden="true">',
      '    <span class="card-stock">' + (stock <= 2 ? "last pieces" : "available") + '</span>',
      '  </figure>',
      '  <div class="card-copy">',
      '    <h2>' + product.title + '</h2>',
      '    <span class="card-price">' + formatPrice(product.price) + '</span>',
      '    <span class="card-material">' + product.material + '</span>',
      '    <span class="card-view">view garment →</span>',
      '  </div>',
      '</a>'
    ].join("\n");
  }

  function initShop() {
    const grid = document.querySelector("[data-product-grid]");
    const count = document.querySelector("[data-catalog-count]");
    const sort = document.querySelector("[data-sort]");
    const filters = Array.from(document.querySelectorAll("[data-filter]"));
    let activeFilter = "all";

    function render() {
      let visible = activeFilter === "all" ? catalog.slice() : catalog.filter(function (product) {
        return product.category === activeFilter;
      });
      if (sort.value === "price-low") visible.sort(function (a, b) { return a.price - b.price; });
      if (sort.value === "price-high") visible.sort(function (a, b) { return b.price - a.price; });
      grid.innerHTML = visible.map(productCard).join("");
      count.textContent = String(visible.length).padStart(2, "0") + " garments";
    }

    filters.forEach(function (button) {
      button.addEventListener("click", function () {
        activeFilter = button.dataset.filter;
        filters.forEach(function (item) {
          const selected = item === button;
          item.classList.toggle("is-active", selected);
          item.setAttribute("aria-pressed", String(selected));
        });
        render();
      });
    });
    sort.addEventListener("change", render);
    render();
  }

  function initProduct() {
    const slug = document.body.dataset.product;
    const product = catalog.find(function (item) { return item.slug === slug; });
    const root = document.querySelector("[data-product-root]");
    if (!product) {
      root.innerHTML = '<p style="padding:120px 24px">garment unavailable.</p>';
      return;
    }

    const index = catalog.indexOf(product);
    const previous = catalog[(index - 1 + catalog.length) % catalog.length];
    const next = catalog[(index + 1) % catalog.length];
    const availableCount = product.sizes.reduce(function (total, size) { return total + size.stock; }, 0);
    let selectedSize = product.sizes.find(function (size) { return size.stock > 0; }) || product.sizes[0];
    let quantity = 1;

    document.title = product.title + " — Springtime Wishes";
    root.innerHTML = [
      '<div class="product-layout">',
      '  <section class="product-gallery" aria-label="' + product.title + ' images">',
      product.images.map(function (image, imageIndex) {
        return '<figure class="' + (imageIndex === 0 ? "gallery-main" : "gallery-side") + '"><img src="' + image + '" alt="' + product.title + ' — view ' + (imageIndex + 1) + '"><span>' + String(imageIndex + 1).padStart(2, "0") + '</span></figure>';
      }).join(""),
      '  </section>',
      '  <aside class="product-info">',
      '    <div class="product-topline"><a href="shop.html">← back to shop</a><span>garment ' + String(index + 1).padStart(2, "0") + ' / ' + String(catalog.length).padStart(2, "0") + '</span></div>',
      '    <p class="product-record">' + product.record + ' / archive</p>',
      '    <h1>' + product.title + '</h1>',
      '    <div class="product-price-line"><strong>' + formatPrice(product.price) + '</strong><span>' + (availableCount <= 2 ? availableCount + " pieces available" : "available") + '</span></div>',
      '    <div class="product-description">' + product.description.map(function (paragraph) { return '<p>' + paragraph + '</p>'; }).join("") + '<p>designed and sewn in mexico.</p></div>',
      '    <section class="purchase-box" aria-label="purchase options">',
      '      <div class="selector-label"><span>select size</span><a href="mailto:contact@springtimewishes.com?subject=private%20sizing">private sizing</a></div>',
      '      <div class="size-options" role="group" aria-label="select size">' + product.sizes.map(function (size) {
        return '<button type="button" data-size="' + size.label + '" ' + (size.stock < 1 ? "disabled" : "") + ' aria-pressed="false">' + size.label + '</button>';
      }).join("") + '</div>',
      '      <div class="purchase-actions">',
      '        <div class="quantity-control" aria-label="quantity"><button type="button" data-quantity-down aria-label="decrease quantity">−</button><span data-quantity>01</span><button type="button" data-quantity-up aria-label="increase quantity">+</button></div>',
      '        <button class="add-button" type="button" data-add>add to bag — ' + formatPrice(product.price) + '</button>',
      '      </div>',
      '      <p class="purchase-note">' + product.color + ' / ships from mexico city</p>',
      '    </section>',
      '    <section class="product-details" aria-label="garment details">',
      '      <details open><summary>fabric</summary><p>' + product.details.fabric + '</p></details>',
      '      <details><summary>fit &amp; sizing</summary><p>' + product.details.fit + '</p></details>',
      '      <details><summary>care</summary><p>' + product.details.care + '</p></details>',
      '      <details><summary>shipping &amp; returns</summary><p>' + product.details.shipping + '</p></details>',
      '    </section>',
      '    <nav class="product-nav" aria-label="other garments"><a href="' + previous.file + '">← ' + previous.title + '</a><a href="' + next.file + '">' + next.title + ' →</a></nav>',
      '  </aside>',
      '</div>',
      '<div class="mobile-buybar"><span data-mobile-selection></span><button type="button" data-mobile-add>add to bag</button></div>'
    ].join("\n");

    const sizeButtons = Array.from(root.querySelectorAll("[data-size]"));
    const quantityNode = root.querySelector("[data-quantity]");
    const mobileSelection = root.querySelector("[data-mobile-selection]");

    function updateSelection() {
      sizeButtons.forEach(function (button) {
        const selected = button.dataset.size === selectedSize.label;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      quantity = Math.min(quantity, Math.max(1, selectedSize.stock));
      quantityNode.textContent = String(quantity).padStart(2, "0");
      mobileSelection.textContent = selectedSize.label + " / " + formatPrice(product.price);
    }

    sizeButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        selectedSize = product.sizes.find(function (size) { return size.label === button.dataset.size; });
        updateSelection();
      });
    });
    root.querySelector("[data-quantity-down]").addEventListener("click", function () {
      quantity = Math.max(1, quantity - 1);
      updateSelection();
    });
    root.querySelector("[data-quantity-up]").addEventListener("click", function () {
      quantity = Math.min(selectedSize.stock, quantity + 1);
      updateSelection();
    });
    function add() {
      if (selectedSize.stock > 0) addToCart(product, selectedSize, quantity);
    }
    root.querySelector("[data-add]").addEventListener("click", add);
    root.querySelector("[data-mobile-add]").addEventListener("click", add);
    updateSelection();
  }

  injectCart();
  if (document.body.dataset.page === "shop") initShop();
  if (document.body.dataset.page === "product") initProduct();
})();
