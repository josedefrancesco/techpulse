import ProductData from "./ProductData.mjs";
import ProductList from "./ProductList.mjs";
import AIAssistant from "./AIAssistant.mjs";

const productData = new ProductData();
const listElement = document.querySelector("#product-list");
const productList = new ProductList(productData, listElement);

const aiForm = document.querySelector("#ai-form");
const aiPromptInput = document.querySelector("#ai-prompt");
const aiStatus = document.querySelector("#ai-status");
const aiResults = document.querySelector("#ai-results");
const aiAssistant = new AIAssistant();

function renderAIRecommendations({ summary, matches }) {
  if (!aiStatus || !aiResults) return;

  aiStatus.textContent = summary;
  aiResults.innerHTML = matches
    .map(
      (item) => `
      <article class="ai-card">
        <h3>${item.title}</h3>
        <p>Category: ${item.category} — <strong>$${item.price}</strong></p>
        <p>${item.description ?? ""}</p>
        <a href="product.html?id=${item.id}">View Details</a>
      </article>
    `
    )
    .join("");
}

async function init() {
  const products = await productList.init();
  if (Array.isArray(products)) {
    aiAssistant.setProducts(products);
  } else if (typeof productData.getProducts === "function") {
    const fetched = await productData.getProducts();
    aiAssistant.setProducts(fetched);
  }
}

init();

if (aiForm && aiPromptInput) {
  aiForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (aiStatus) {
      aiStatus.textContent = "Analyzing catalog...";
    }
    const recommendation = await aiAssistant.recommend(aiPromptInput.value);
    renderAIRecommendations(recommendation);
  });
}