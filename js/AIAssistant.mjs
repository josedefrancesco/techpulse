export default class AIAssistant {
  constructor(products = []) {
    this.products = products;
  }

  setProducts(products) {
    this.products = Array.isArray(products) ? products : [];
  }

  async recommend(query) {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return {
        mode: "fallback",
        summary: "Please describe what you need so I can recommend products.",
        matches: [],
      };
    }

    const candidates = this.#rankCandidates(cleanQuery);

    // Attempt 1: Chrome Built-in AI (Prompt API / LanguageModel)
    const builtInReply = await this.#tryChromeBuiltInAI(cleanQuery, candidates);
    if (builtInReply) {
      return {
        mode: "chrome-built-in-ai",
        summary: builtInReply,
        matches: candidates.slice(0, 3),
      };
    }

    // Attempt 2: Smart local matching over DummyJSON catalog
    return {
      mode: "smart-match",
      summary: this.#buildLocalSummary(cleanQuery, candidates.slice(0, 3)),
      matches: candidates.slice(0, 3),
    };
  }

  #extractMaxPrice(text) {
    const match = text.match(/(?:under|below|less than|up to|max|maximum|\$)\s*(\d+(?:\.\d+)?)/i);
    return match ? Number(match[1]) : null;
  }

  #rankCandidates(query) {
    const lower = query.toLowerCase();
    const maxPrice = this.#extractMaxPrice(lower);
    const terms = lower
      .replace(/[^\w\s$]/gi, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2);

    const categoryHints = {
      laptop: "laptops",
      notebook: "laptops",
      computer: "laptops",
      macbook: "laptops",
      phone: "smartphones",
      smartphone: "smartphones",
      iphone: "smartphones",
      samsung: "smartphones",
      tablet: "tablets",
      ipad: "tablets",
      charger: "mobile-accessories",
      cable: "mobile-accessories",
      accessory: "mobile-accessories",
      accessories: "mobile-accessories",
      earbuds: "mobile-accessories",
      headphones: "mobile-accessories",
    };

    const scored = this.products
      .filter((product) => (maxPrice !== null ? product.price <= maxPrice : true))
      .map((product) => {
        const haystack = [
          product.title,
          product.brand,
          product.category,
          product.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        let score = 0;

        for (const [keyword, category] of Object.entries(categoryHints)) {
          if (lower.includes(keyword) && product.category === category) {
            score += 6;
          }
        }

        for (const term of terms) {
          if (haystack.includes(term)) {
            score += 2;
          }
        }

        if (typeof product.rating === "number") {
          score += product.rating * 0.25;
        }

        return { product, score };
      });

    scored.sort((a, b) => b.score - a.score);

    const positiveMatches = scored.filter((item) => item.score > 0.5);
    const pool = positiveMatches.length > 0 ? positiveMatches : scored;
    return pool.map((item) => item.product);
  }

  async #tryChromeBuiltInAI(query, candidates) {
    try {
      const hasLanguageModel =
        typeof globalThis.LanguageModel !== "undefined" &&
        typeof globalThis.LanguageModel.create === "function";

      if (!hasLanguageModel) {
        return null;
      }

      const availability = await globalThis.LanguageModel.availability();
      if (availability === "unavailable") {
        return null;
      }

      const topItems = candidates.slice(0, 6).map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        price: p.price,
        rating: p.rating,
      }));

      const session = await globalThis.LanguageModel.create({
        systemPrompt:
          "You are TechPulse's concise shopping assistant. Recommend items strictly from the provided JSON product catalog. Reply in 2-3 short, helpful sentences.",
      });

      const prompt = `User request: "${query}"\nAvailable products: ${JSON.stringify(topItems)}`;
      const response = await session.prompt(prompt);
      if (typeof session.destroy === "function") {
        session.destroy();
      }
      return typeof response === "string" && response.trim() ? response.trim() : null;
    } catch {
      return null;
    }
  }

  #buildLocalSummary(query, matches) {
    if (!matches.length) {
      return `No exact matches were found for "${query}". Try a different category or a higher budget.`;
    }
    const names = matches.map((p) => `${p.title} ($${p.price})`).join(", ");
    return `Based on "${query}", these options from our current catalog fit best: ${names}.`;
  }
}