export default class ProductList {
  constructor(dataSource, listElement) {
    this.dataSource = dataSource;
    this.listElement = listElement;
  }

  async init() {
    const products = await this.dataSource.getProducts(12);
    this.renderList(products);
  }

  renderList(products) {
    this.listElement.innerHTML = products
      .map(
        (product) => `
        <article class="product-card">
          <img src="${product.thumbnail}" alt="${product.title}" />
          <h3>${product.title}</h3>
          <p class="price">$${product.price}</p>
          <a href="product.html?id=${product.id}" class="btn">View Details</a>
        </article>
      `
      )
      .join("");
  }
}