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
  `;

  document.head.appendChild(style);
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
