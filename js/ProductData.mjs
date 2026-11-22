const BASE_URL = "https://dummyjson.com/products";
const TECH_CATEGORIES = [
  "smartphones",
  "laptops",
  "tablets",
  "mobile-accessories",
];

export default class ProductData {
  async getProducts() {
    const responses = await Promise.all(
      TECH_CATEGORIES.map((category) =>
        fetch(`${BASE_URL}/category/${category}`)
      )
    );

    const allProducts = [];
    for (const response of responses) {
      if (!response.ok) {
        throw new Error("Failed to fetch tech products from API");
      }
      const data = await response.json();
      allProducts.push(...data.products);
    }

    return allProducts;
  }

  async getProductById(id) {
    const response = await fetch(`${BASE_URL}/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch product details");
    }
    return await response.json();
  }
}