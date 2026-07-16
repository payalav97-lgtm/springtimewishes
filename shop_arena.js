console.log("STW shop arena loaded");

async function getArenaCover(channel) {
  try {
    const response = await fetch(
      `https://api.are.na/v2/channels/${channel}/contents?per=100`
    );

    const data = await response.json();

    const block = data.contents.find(item =>
      item.class === "Image" &&
      item.image &&
      (item.image.display || item.image.large || item.image.original)
    );

    if (!block) return "";

    return (
      block.image.display?.url ||
      block.image.large?.url ||
      block.image.original?.url ||
      ""
    );
  } catch (error) {
    console.warn("Are.na image failed:", channel, error);
    return "";
  }
}

function addShopArenaStyles() {
  if (document.getElementById("stw-shop-arena-styles")) return;

  const style = document.createElement("style");
  style.id = "stw-shop-arena-styles";

  style.textContent = `
    .hero {
      overflow: hidden;
    }

    .hero__inner {
      position: relative;
      z-index: 2;
    }

    .stw-shop-hero-media {
      position: absolute;
      inset: 0;
      z-index: 1;
      width: 100%;
      height: 100%;
      margin: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .stw-shop-hero-media::after {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(
          180deg,
          rgba(0,0,0,.10),
          transparent 28%,
          transparent 68%,
          rgba(0,0,0,.72)
        ),
        radial-gradient(
          ellipse at center,
          transparent 46%,
          rgba(0,0,0,.52) 100%
        );
      pointer-events: none;
    }

    .stw-shop-hero-media img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      opacity: .66;
      filter: grayscale(.12) contrast(.94) brightness(.72);
    }

    .shop-shell {
      display: block !important;
      padding:
        0
        clamp(14px, 2vw, 30px)
        clamp(72px, 8vh, 110px) !important;
    }

    .shop-head {
      display: grid !important;
      grid-template-columns:
        minmax(0, 1fr)
        minmax(260px, 420px) !important;
      gap: clamp(24px, 5vw, 90px) !important;
      padding:
        clamp(26px, 4vh, 44px)
        0
        clamp(26px, 4vh, 42px) !important;
      border-top:
        1px solid rgba(232,224,210,.12) !important;
    }

    .shop-head h2 {
      font-size: clamp(48px, 6vw, 106px) !important;
      line-height: .78 !important;
    }

    .shop-head p {
      align-self: end;
      max-width: 420px !important;
      font-size: 12px !important;
      line-height: 1.55 !important;
    }

    .piece-grid {
      display: grid !important;
      grid-template-columns:
        repeat(3, minmax(0, 1fr)) !important;
      gap: 1px !important;
      align-items: stretch !important;
      border: 1px solid rgba(232,224,210,.12);
      background: rgba(232,224,210,.12);
    }

    .piece-card,
    .piece-card:nth-child(n) {
      grid-column: auto !important;
      min-height: 0 !important;
      margin: 0 !important;
      display: grid !important;
      grid-template-rows: auto 1fr !important;
      overflow: visible !important;
      border: 0 !important;
      background: #040302 !important;
      box-shadow: none !important;
      animation: none !important;
      isolation: isolate;
    }

    .piece-card::before,
    .piece-card::after {
      display: none !important;
    }

    .stw-card-visual {
      position: relative;
      width: 100%;
      aspect-ratio: 4 / 5;
      overflow: hidden;
      background: #080605;
    }

    .piece-card .piece-card__canvas,
    .piece-card .piece-card__veil,
    .piece-card.stw-real-product-card .piece-card__canvas,
    .piece-card.stw-real-product-card .piece-card__veil {
      display: none !important;
    }

    .piece-card .piece-card__image,
    .piece-card.stw-real-product-card .piece-card__image {
      display: block !important;
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      object-position: center !important;
      opacity: .72 !important;
      filter:
        grayscale(.08)
        contrast(.93)
        brightness(.72) !important;
      z-index: 0 !important;
      transition:
        opacity .35s ease,
        filter .35s ease,
        transform .7s cubic-bezier(.16,1,.3,1);
    }

    .piece-card:hover .piece-card__image,
    .piece-card:focus-within .piece-card__image {
      opacity: .88 !important;
      filter:
        grayscale(.03)
        contrast(.98)
        brightness(.82) !important;
      transform: scale(1.012);
    }

    .piece-card__meta {
      position: absolute !important;
      z-index: 2 !important;
      left: 13px !important;
      right: 13px !important;
      top: 12px !important;
      width: auto !important;
      max-width: none !important;
      display: flex !important;
      justify-content: space-between !important;
      gap: 14px !important;
      color: rgba(239,232,220,.60) !important;
      font-size: 9px !important;
      letter-spacing: .14em !important;
    }

    .piece-card__meta span {
      white-space: nowrap !important;
    }

    .piece-card__copy {
      position: static !important;
      z-index: 2 !important;
      min-height: 142px;
      padding: 16px 17px 18px !important;
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-rows: auto 1fr;
      column-gap: 18px;
      row-gap: 11px !important;
      align-content: start;
      background:
        linear-gradient(
          180deg,
          rgba(14,10,8,.98),
          rgba(4,3,2,.99)
        ),
        #040302;
      border-top:
        1px solid rgba(232,224,210,.10);
    }

    .piece-card__copy h3 {
      grid-column: 1 / -1;
      margin: 0 !important;
      color: rgba(239,232,220,.84) !important;
      font-size:
        clamp(29px, 2.55vw, 48px) !important;
      line-height: .86 !important;
      letter-spacing: -.055em !important;
    }

    .piece-card__copy p {
      grid-column: 1;
      align-self: end;
      margin: 0 !important;
      color: rgba(232,224,210,.42) !important;
      font-size: 10px !important;
      line-height: 1.35 !important;
      letter-spacing: .08em !important;
      text-transform: uppercase;
    }

    .piece-card__actions {
      grid-column: 2;
      align-self: end;
      display: block !important;
      margin: 0 !important;
    }

    .piece-card__actions .piece-link {
      display: none !important;
    }

    .piece-card__actions .piece-button {
      min-height: 0 !important;
      padding: 0 0 3px !important;
      color: rgba(232,224,210,.62) !important;
      background: transparent !important;
      border: 0 !important;
      border-bottom:
        1px solid rgba(232,224,210,.22) !important;
      font-size: 10px !important;
      letter-spacing: .03em !important;
      white-space: nowrap;
    }

    .piece-card__actions .piece-button:hover {
      color: rgba(249,244,236,.96) !important;
      border-color:
        rgba(249,244,236,.66) !important;
    }

    .stw-empty-cell {
      min-width: 0;
      background:
        radial-gradient(
          ellipse at 50% 18%,
          rgba(232,224,210,.025),
          transparent 30%
        ),
        linear-gradient(180deg, #050403, #020101);
    }

    .reliquary,
    .archive-strip {
      display: none !important;
    }

    @media (max-width: 980px) {
      .piece-grid {
        grid-template-columns:
          repeat(2, minmax(0, 1fr)) !important;
      }

      .stw-empty-cell {
        display: none;
      }
    }

    @media (max-width: 760px) {
      .stw-shop-hero-media {
        inset: 0;
        width: 100%;
        height: 100%;
        transform: none;
      }

      .stw-shop-hero-media img {
        opacity: .58;
      }

      .shop-shell {
        padding: 0 10px 58px !important;
      }

      .shop-head {
        grid-template-columns: 1fr !important;
        gap: 14px !important;
      }

      .piece-grid {
        grid-template-columns: 1fr !important;
      }

      .stw-card-visual {
        aspect-ratio: 4 / 5;
      }

      .piece-card__copy {
        min-height: 124px;
      }

      .piece-card__copy h3 {
        font-size:
          clamp(34px, 11vw, 55px) !important;
      }
    }
  `;

  document.head.appendChild(style);
}

async function replaceShopHeroImage(channel) {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const imageUrl = await getArenaCover(channel);
  if (!imageUrl) return;

  let media = hero.querySelector(
    ".stw-shop-hero-media"
  );

  if (!media) {
    media = document.createElement("figure");
    media.className = "stw-shop-hero-media";
    media.setAttribute("aria-hidden", "true");

    const img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.fetchPriority = "high";

    media.appendChild(img);
    hero.prepend(media);
  }

  media.querySelector("img").src = imageUrl;
}

function findPieceCardByName(name) {
  const cards = Array.from(
    document.querySelectorAll(".piece-card")
  );

  return cards.find(card =>
    card.textContent
      .toLowerCase()
      .includes(name.toLowerCase())
  );
}

function prepareCleanCatalogLayout() {
  const grid = document.getElementById("pieceGrid");

  if (
    !grid ||
    grid.dataset.cleanCatalog === "true"
  ) return;

  grid.dataset.cleanCatalog = "true";

  const products = [
    {
      type: "top",
      price: "$1,880 mxn"
    },
    {
      type: "skirt",
      price: "$5,500 mxn"
    },
    {
      type: "corset",
      price: "$8,300 mxn"
    },
    {
      type: "dress",
      price: "$2,500 mxn"
    },
    {
      type: "dress",
      price: "$2,500 mxn"
    }
  ];

  if (!document.getElementById("stw-price-styles")) {
    const priceStyles = document.createElement("style");
    priceStyles.id = "stw-price-styles";

    priceStyles.textContent = `
      .piece-card__copy {
        min-height: 118px !important;
        grid-template-columns:
          minmax(0, 1fr) auto auto !important;
      }

      .piece-card__copy p {
        grid-column: 1 !important;
        text-transform: lowercase !important;
      }

      .stw-product-price {
        grid-column: 2;
        align-self: end;
        color: rgba(232,224,210,.52);
        font-size: 10px;
        line-height: 1.35;
        letter-spacing: .04em;
        white-space: nowrap;
      }

      .piece-card__actions {
        grid-column: 3 !important;
      }
.piece-card__copy p,
.stw-product-price,
.piece-card__actions .piece-button {
  font-size: 13px !important;
  color: rgba(232,224,210,.72) !important;
}
      @media (max-width: 760px) {
        .piece-card__copy {
          min-height: 112px !important;
        }
      }
    `;

    document.head.appendChild(priceStyles);
  }

  const cards = Array.from(
    grid.querySelectorAll(".piece-card")
  );

  cards.forEach((card, index) => {
    const product =
      products[index] || {
        type: "available",
        price: ""
      };

    const visual = document.createElement("div");
    visual.className = "stw-card-visual";

    const selectors = [
      ".piece-card__image",
      ".piece-card__canvas",
      ".piece-card__veil",
      ".piece-card__meta"
    ];

    selectors.forEach(selector => {
      const element = card.querySelector(selector);

      if (element) {
        visual.appendChild(element);
      }
    });

    card.prepend(visual);

    const description = card.querySelector(
      ".piece-card__copy p"
    );

    if (description) {
      description.textContent = product.type;
    }

    const actions = card.querySelector(
      ".piece-card__actions"
    );

    if (actions && product.price) {
      const price = document.createElement("span");
      price.className = "stw-product-price";
      price.textContent = product.price;

      actions.before(price);
    }

    const viewLink = card.querySelector(
      ".piece-button"
    );

    if (viewLink) {
      viewLink.textContent = "view piece →";
    }
  });

  const emptyCell = document.createElement("div");
  emptyCell.className = "stw-empty-cell";
  emptyCell.setAttribute("aria-hidden", "true");

  grid.appendChild(emptyCell);
}

async function replaceProductImage(name, channel) {
  const card = findPieceCardByName(name);
  if (!card) return;

  const imageUrl = await getArenaCover(channel);
  if (!imageUrl) return;

  card.classList.add("stw-real-product-card");

  let img = card.querySelector(
    ".piece-card__image"
  );

  if (!img) {
    img = document.createElement("img");
    img.className = "piece-card__image";
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";

    const visual = card.querySelector(
      ".stw-card-visual"
    );

    if (visual) {
      visual.prepend(img);
    } else {
      card.prepend(img);
    }
  }

  img.src = imageUrl;
}

function initShopArena() {
  addShopArenaStyles();
  prepareCleanCatalogLayout();

  replaceShopHeroImage("shop_html");

  replaceProductImage(
    "night breeze",
    "night_breeze_top"
  );

  replaceProductImage(
    "nila skirt",
    "nila_skirt"
  );

  replaceProductImage(
    "misty meadow corset",
    "misty_meadow_corset"
  );

  replaceProductImage(
    "midnight spell dress [silver moon]",
    "midnight_spell_silver_moon"
  );

  replaceProductImage(
    "midnight spell dress [chocolate]",
    "midnight_spell_chocolate"
  );
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initShopArena
  );
} else {
  initShopArena();
}