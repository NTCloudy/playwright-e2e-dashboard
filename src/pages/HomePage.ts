import { expect, type Locator, type Page } from '@playwright/test';
import { parseMoney } from '../support/ui';
import { NavBar } from './NavBar';
import { ProductPage } from './ProductPage';

/** Home page: product grid with search, sorting and filters. */
export class HomePage {
  readonly nav: NavBar;
  readonly searchInput: Locator;
  readonly searchSubmit: Locator;
  readonly sort: Locator;
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;
  readonly searchTerm: Locator;
  readonly searchResultCount: Locator;
  readonly searchCompleted: Locator;
  readonly sortingCompleted: Locator;
  readonly noResults: Locator;
  readonly pageTitle: Locator;
  readonly categoryFilters: Locator;

  constructor(private readonly page: Page) {
    this.nav = new NavBar(page);
    this.searchInput = page.getByTestId('search-query');
    this.searchSubmit = page.getByTestId('search-submit');
    this.sort = page.getByTestId('sort');
    // Product cards are anchors whose data-test is "product-<id>".
    this.productCards = page.locator('a[data-test^="product-"]');
    this.productNames = page.getByTestId('product-name');
    this.productPrices = page.getByTestId('product-price');
    this.searchTerm = page.getByTestId('search-term');
    this.searchResultCount = page.getByTestId('search-result-count');
    this.searchCompleted = page.getByTestId('search_completed');
    this.sortingCompleted = page.getByTestId('sorting_completed');
    this.noResults = page.getByTestId('no-results');
    this.pageTitle = page.getByTestId('page-title');
    // Sidebar "Filters" section: one checkbox per category (data-test="category-<id>").
    this.categoryFilters = page.locator('input[data-test^="category-"]');
  }

  /** Direct navigation is only used to start a test; later steps use the UI. */
  async open(): Promise<void> {
    await this.page.goto('/');
    await this.verifyLoaded();
  }

  /** Verifies the layout: navigation, search, sorting, filters and the product grid. */
  async verifyLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle(/Practice Software Testing - Toolshop/);
    await this.nav.verifyLinks();
    await expect(this.searchInput).toBeEditable();
    await expect(this.searchSubmit).toBeEnabled();
    await expect(this.sort).toBeEnabled();
    await expect(this.categoryFilters.first()).toBeVisible();
    await expect(this.productCards.first()).toBeVisible();
  }

  /**
   * Submits a search and waits until the grid reports completion. The grid's
   * data-test switches to "search_completed"; it can be empty (zero size) when
   * nothing matches, so the marker is checked for presence, not visibility.
   */
  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchSubmit.click();
    await expect(this.searchCompleted).toBeAttached();
    await expect(this.searchTerm).toHaveText(term);
  }

  /** Number reported by the "N products found for '…'" caption. */
  async reportedResultCount(): Promise<number> {
    const text = await this.searchResultCount.innerText();
    const match = /^(\d+) products? found/.exec(text.trim());
    if (!match) throw new Error(`Unexpected result caption: "${text}"`);
    return Number(match[1]);
  }

  /** Selects a sort option by value (e.g. "price,asc"). Callers should still poll for the expected order. */
  async sortBy(value: string): Promise<void> {
    await this.sort.selectOption(value);
    await expect(this.sort).toHaveValue(value);
    await expect(this.sortingCompleted).toBeAttached();
  }

  /** Text of the selected sort option, e.g. "Price (Low - High)". */
  selectedSortOption(): Locator {
    return this.sort.locator('option:checked');
  }

  async productNameList(): Promise<string[]> {
    return (await this.productNames.allInnerTexts()).map((name) => name.trim());
  }

  async productPriceList(): Promise<number[]> {
    return (await this.productPrices.allInnerTexts()).map(parseMoney);
  }

  /** Card whose product name matches exactly (not "Claw Hammer with …"). */
  card(name: string): Locator {
    return this.productCards.filter({ has: this.page.getByTestId('product-name').getByText(name, { exact: true }) });
  }

  async openProduct(name: string): Promise<ProductPage> {
    await this.card(name).click();
    const productPage = new ProductPage(this.page);
    await productPage.verifyLoaded(name);
    return productPage;
  }

  /**
   * Opens the product at a 1-based position of the grid and returns its name.
   * Only the name and price are checked: the product may be out of stock.
   */
  async openProductAt(position: number): Promise<string> {
    const card = this.productCards.nth(position - 1);
    await expect(card, `product #${position} on the page`).toBeVisible();
    const name = (await card.getByTestId('product-name').innerText()).trim();
    await card.click();
    await new ProductPage(this.page).verifyDetails(name);
    return name;
  }

  /** Searches for an exact product name and opens its detail page. */
  async findAndOpenProduct(name: string): Promise<ProductPage> {
    await this.search(name);
    await expect(this.card(name)).toHaveCount(1);
    return this.openProduct(name);
  }
}
