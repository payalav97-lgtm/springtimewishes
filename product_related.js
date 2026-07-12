cat > product_related.js <<'JS'
console.log("STW related products loaded");

const RELATED_PRODUCTS = [
  {
    title: "nila skirt",
    channel: "nila_skirt",
    url: "#"
  },
  {
    title: "misty meadow corset",
    channel: "misty_meadow_corset",
    url: "#"
  },
  {
    title: "midnight spell dress [silver moon]",
    channel: "midnight_spell_silver_moon",
    url: "#"
  }
];

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
    console.warn("related image failed:", channel, error);
    return "";
  }
}

function addRelatedStyles() {
  if (document.getElementById("stw-related-styles")) return;

  const style = document.createElement("style");
  style.id = "stw-related-styles";

  style.textContent = `
    .stw-related-fixed {
      background-size: cover !important;
      background-position: center !important;
      background-repeat: no-repeat !important;
      position: relative !important;
      overflow: hidden !important;
    }

    .stw-related-fixed::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(2,1,1,.08), rgba(2,1,1,.78));
      z-index: 1;
      pointer-events: none;
    }

    .stw-related-fixed canvas,
    .stw-related-fixed img,
    .stw-related-fixed .piece-card__canvas,
    .stw-related-fixed .piece-card__veil {
      display: none !important;
    }

    .stw-related-fixed > * {
      position: relative !important;
      z-index: 2 !important;
    }
  `;

  document.head.appendChild(style);
}

function findRelatedCards() {
  const cards = Array.from(document.querySelectorAll("a, article, div"))
    .filter(el => {
      const text = el.textContent.toLowerCase();
      const rect = el.getBoundingClientRect();

      return (
        text.includes("related") &&
        rect.width > 120 &&
        rect.width < 420 &&
        rect.height > 100 &&
        rect.height < 360
      );
    })
    .sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();

      if (Math.abs(ra.top - rb.top) > 20) return ra.top - rb.top;
      return ra.left - rb.left;
    });

  const unique = [];

  for (const card of cards) {
    if (!unique.some(existing => existing.contains(card) || card.contains(existing))) {
      unique.push(card);
    }
  }

  return unique.slice(0, 3);
}

function replaceTitleKeepingStructure(card, newTitle) {
  const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
  const nodes = [];

  while (walker.nextNode()) {
    const text = walker.currentNode.nodeValue.trim();

    if (
      text &&
      !text.toLowerCase().includes("related") &&
      !text.match(/^\s*$/)
    ) {
      nodes.push(walker.currentNode);
    }
  }

  const titleNode = nodes
    .sort((a, b) => b.nodeValue.trim().length - a.nodeValue.trim().length)[0];

  if (titleNode) {
    titleNode.nodeValue = newTitle;
  }
}

async function applyRelatedProducts() {
  addRelatedStyles();

  const cards = findRelatedCards();

  for (let i = 0; i < RELATED_PRODUCTS.length; i++) {
    const card = cards[i];
    const product = RELATED_PRODUCTS[i];

    if (!card) continue;

    const imageUrl = await getArenaCover(product.channel);

    card.classList.add("stw-related-fixed");

    if (imageUrl) {
      card.style.backgroundImage = `url("${imageUrl}")`;
    }

    if (card.tagName.toLowerCase() === "a") {
      card.href = product.url;
    }

    replaceTitleKeepingStructure(card, product.title);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyRelatedProducts);
} else {
  applyRelatedProducts();
}

window.addEventListener("load", applyRelatedProducts);
JS