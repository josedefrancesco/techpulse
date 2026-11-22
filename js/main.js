import ProductData from "./ProductData.mjs";
import ProductList from "./ProductList.mjs";

const productData = new ProductData();
const productListElement = document.querySelector("#product-list");

if (productListElement) {
  const productList = new ProductList(productData, productListElement);
  productList.init();
}