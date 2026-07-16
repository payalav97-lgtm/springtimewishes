console.log("STW shop arena loaded");

async function getArenaCover(channel) {
  try {
    const response = await fetch(`https://api.are.na/v2/channels/${channel}/contents?per=100`);
    const data = await response.json();

    const block = data.contents.find(item =>
      item.class === "Image" &&
      item.image &&
      (item.image.display || item.image.large || item.image.original)
    );

    if (!block) return "";

    return block.image.display?.url || block.image.large?.url || block.image.original?.url || "";
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
    .piece-card.stw-real-product-card .piece-card__canvas,
    .piece-card.stw-real-product-card .piece-card__veil {
      display: none !important;
    }

    .piece-card.stw-real-product-card .piece-card__image {
      display: block !important;
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      opacity: .48;
      filter: grayscale(.15) contrast(.9) brightness(.62);
      z-index: 0;
    }

    .piece-card.stw-real-product-card .piece-card__meta,
    .piece-card.stw-real-product-card .piece-card__content,
    .piece-card.stw-real-product-card .piece-card__actions {
      position: relative;
      z-index: 2;
    }

    .piece-card.stw-real-product-card .piece-card__meta {
      left: 22px !important;
      right: 22px !important;
      width: auto !important;
      max-width: calc(100% - 44px) !important;
      display: flex !important;
      justify-content: space-between !important;
      gap: 18px !important;
      overflow: visible !important;
      box-sizing: border-box !important;
    }

    .piece-card.stw-real-product-card .piece-card__meta span {
      white-space: nowrap !important;
    }

    .piece-card.stw-real-product-card .status-dot {
      font-size: 10px !important;
      letter-spacing: .12em !important;
    }

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
    linear-gradient(180deg, rgba(0,0,0,.10), transparent 28%, transparent 68%, rgba(0,0,0,.72)),
    radial-gradient(ellipse at center, transparent 46%, rgba(0,0,0,.52) 100%);
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

@media (max-width: 760px) {
  .stw-shop-hero-media {
    top: calc(var(--safe-t) + 82px);
    width: 88vw;
    height: 46svh;
    transform: translateX(-50%);
  }

  .stw-shop-hero-media img {
    opacity: .58;
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

  let media = hero.querySelector(".stw-shop-hero-media");

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
  const cards = Array.from(document.querySelectorAll(".piece-card"));
  return cards.find(card => card.textContent.toLowerCase().includes(name.toLowerCase()));
}

async function replaceProductImage(name, channel) {
  const card = findPieceCardByName(name);
  if (!card) return;

  const imageUrl = await getArenaCover(channel);
  if (!imageUrl) return;

  card.classList.add("stw-real-product-card");

  const canvas = card.querySelector(".piece-card__canvas");
  const veil = card.querySelector(".piece-card__veil");

  if (canvas) canvas.style.display = "none";
  if (veil) veil.style.display = "none";

  let img = card.querySelector(".piece-card__image");

  if (!img) {
    img = document.createElement("img");
    img.className = "piece-card__image";
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    card.prepend(img);
  }

  img.src = imageUrl;
}

function initShopArena() {
  addShopArenaStyles();

  replaceShopHeroImage("shop_html");


  replaceProductImage("night breeze", "night_breeze_top");
  replaceProductImage("nila skirt", "nila_skirt");
  replaceProductImage("misty meadow corset", "misty_meadow_corset");
  replaceProductImage("midnight spell dress [silver moon]", "midnight_spell_silver_moon");
  replaceProductImage("midnight spell dress [chocolate]", "midnight_spell_chocolate");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initShopArena);
} else {
  initShopArena();
}
