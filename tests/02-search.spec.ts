import { expect, test } from '../src/fixtures';
import { isSorted, parseMoney } from '../src/support/ui';

/** Grid page size: the caption counts all matches, the grid shows at most one page. */
const PAGE_SIZE = 9;

/** Sort options as the site labels them (config/cases.json lists the values). */
const SORT_LABELS: Record<string, string> = {
  'price,asc': 'Price (Low - High)',
  'price,desc': 'Price (High - Low)',
  'name,asc': 'Name (A - Z)',
  'name,desc': 'Name (Z - A)',
};

test.describe('Search', () => {
  test('TC04 Search by keyword', async ({ home, data }) => {
    const keyword = data.text('keyword');

    await test.step(`Search for "${keyword}"`, async () => {
      await home.open();
      await home.search(keyword);
    });

    await test.step(`The search term is shown and every result name contains "${keyword}"`, async () => {
      const reported = await home.reportedResultCount();
      expect(reported, 'number of products found').toBeGreaterThan(0);
      await expect(home.productCards).toHaveCount(Math.min(reported, PAGE_SIZE));
      for (const name of await home.productNameList()) {
        expect(name.toLowerCase(), `"${name}" should match the keyword`).toContain(keyword.toLowerCase());
      }
    });
  });

  test('TC05 Find a specific product', async ({ home, data }) => {
    const product = data.text('product');

    await test.step(`Search for "${product}"`, async () => {
      await home.open();
      await home.search(product);
    });

    await test.step('The product is in the results with a price', async () => {
      const card = home.card(product);
      await expect(card).toHaveCount(1);
      await expect(card).toBeVisible();
      await expect(card.getByTestId('product-price')).toHaveText(/^\$\d+\.\d{2}$/);
    });
  });

  test('TC06 Search with no results', async ({ home, data }) => {
    const keyword = data.text('keyword');

    await test.step(`Search for "${keyword}"`, async () => {
      await home.open();
      await home.search(keyword);
    });

    await test.step('A "no products found" message is shown and the grid is empty', async () => {
      await expect(home.noResults).toHaveText('There are no products found.');
      await expect(home.productCards).toHaveCount(0);
      expect(await home.reportedResultCount(), 'number of products found').toBe(0);
    });
  });

  test('TC07 Sort products', async ({ home, data }) => {
    const sort = data.text('sort');
    const [field, direction] = sort.split(',') as ['name' | 'price', 'asc' | 'desc'];
    const label = SORT_LABELS[sort];

    await test.step(`Choose "${label}"`, async () => {
      await home.open();
      await home.sortBy(sort);
      await expect(home.selectedSortOption()).toHaveText(label);
    });

    await test.step(`Products are sorted by ${field}, ${direction === 'asc' ? 'ascending' : 'descending'}`, async () => {
      const values = () => (field === 'price' ? home.productPriceList() : home.productNameList());
      await expect
        .poll(
          async () => {
            const list = await values();
            return list.length > 1 && isSorted(list, direction);
          },
          { message: `products should be sorted by ${field} (${direction})` },
        )
        .toBe(true);
      test.info().annotations.push({ type: field === 'price' ? 'prices' : 'names', description: (await values()).join(', ') });
    });
  });

  test('TC08 Product details match the search result', async ({ home, data }) => {
    const keyword = data.text('keyword');
    const product = data.text('product');
    let listPrice = 0;

    await test.step(`Search for "${keyword}" and note the price of "${product}"`, async () => {
      await home.open();
      await home.search(keyword);
      await expect(home.card(product), `"${product}" should be on the first page of results`).toHaveCount(1);
      listPrice = parseMoney(await home.card(product).getByTestId('product-price').innerText());
    });

    await test.step('Open the product: name and price match; quantity and "Add to cart" are usable', async () => {
      // openProduct verifies the name, quantity "1" and that the purchase controls are enabled.
      const productPage = await home.openProduct(product);
      expect(await productPage.getUnitPrice(), 'price on the product page').toBeCloseTo(listPrice, 2);
    });
  });
});
