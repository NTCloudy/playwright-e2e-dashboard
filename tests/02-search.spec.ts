import { expect, test } from '../src/fixtures';
import { isSorted, parseMoney } from '../src/support/ui';

/** Grid page size: the caption counts all matches, the grid shows at most one page. */
const PAGE_SIZE = 9;

test.describe('Search', () => {
  test('TC04 Search by keyword', async ({ home }) => {
    await test.step('Search for "hammer"', async () => {
      await home.open();
      await home.search('hammer');
    });

    await test.step('The search term is shown and every result name contains "hammer"', async () => {
      const reported = await home.reportedResultCount();
      expect(reported, 'number of products found').toBeGreaterThan(0);
      await expect(home.productCards).toHaveCount(Math.min(reported, PAGE_SIZE));
      for (const name of await home.productNameList()) {
        expect(name.toLowerCase(), `"${name}" should match the keyword`).toContain('hammer');
      }
    });
  });

  test('TC05 Find a specific product', async ({ home }) => {
    await test.step('Search for "Claw Hammer"', async () => {
      await home.open();
      await home.search('Claw Hammer');
    });

    await test.step('The product is in the results with a price', async () => {
      const card = home.card('Claw Hammer');
      await expect(card).toHaveCount(1);
      await expect(card).toBeVisible();
      await expect(card.getByTestId('product-price')).toHaveText(/^\$\d+\.\d{2}$/);
    });
  });

  test('TC06 Search with no results', async ({ home }) => {
    const term = 'NoSuchTool12345';

    await test.step(`Search for "${term}"`, async () => {
      await home.open();
      await home.search(term);
    });

    await test.step('A "no products found" message is shown and the grid is empty', async () => {
      await expect(home.noResults).toHaveText('There are no products found.');
      await expect(home.productCards).toHaveCount(0);
      expect(await home.reportedResultCount(), 'number of products found').toBe(0);
    });
  });

  test('TC07 Sort by price (low to high)', async ({ home }) => {
    await test.step('Choose "Price (Low - High)"', async () => {
      await home.open();
      await home.sortBy('Price (Low - High)');
      await expect(home.sort).toHaveValue('price,asc');
    });

    await test.step('Prices are in ascending order', async () => {
      await expect
        .poll(
          async () => {
            const prices = await home.productPriceList();
            return prices.length > 1 && isSorted(prices, 'asc');
          },
          { message: 'product prices should be sorted from low to high' },
        )
        .toBe(true);
      test.info().annotations.push({ type: 'prices', description: (await home.productPriceList()).join(', ') });
    });
  });

  test('TC08 Product details match the search result', async ({ home }) => {
    const name = 'Thor Hammer';
    let listPrice = 0;

    await test.step(`Search for "hammer" and note the price of "${name}"`, async () => {
      await home.open();
      await home.search('hammer');
      listPrice = parseMoney(await home.card(name).getByTestId('product-price').innerText());
    });

    await test.step('Open the product: name and price match; quantity and "Add to cart" are usable', async () => {
      // openProduct verifies the name, quantity "1" and that the purchase controls are enabled.
      const product = await home.openProduct(name);
      expect(await product.getUnitPrice(), 'price on the product page').toBeCloseTo(listPrice, 2);
    });
  });
});
