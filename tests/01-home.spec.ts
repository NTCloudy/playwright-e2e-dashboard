import { expect, test } from '../src/fixtures';

test.describe('Home', () => {
  test('TC01 Home page loads', async ({ home }) => {
    await test.step('Open the home page', async () => {
      await home.open();
    });

    await test.step('Navigation, search, sorting and filters are usable; products are listed', async () => {
      // home.open() already verified the layout; here we check the product grid content.
      await expect.poll(() => home.productCards.count(), { message: 'product cards on the first page' }).toBeGreaterThan(0);
      const firstCard = home.productCards.first();
      await expect(firstCard.getByTestId('product-name')).not.toBeEmpty();
      await expect(firstCard.getByTestId('product-price')).toHaveText(/^\$\d+\.\d{2}$/);
    });
  });

  test('TC02 Return to the home page from a product page', async ({ page, home, nav }) => {
    await test.step('Open the home page and click the first product', async () => {
      await home.open();
      const name = (await home.productNames.first().innerText()).trim();
      await home.openProduct(name);
    });

    await test.step('Click "Home" in the navigation bar', async () => {
      await nav.goHome();
    });

    await test.step('Back on the home page: product grid and filters are shown again', async () => {
      await expect(page).toHaveURL(/\/$/);
      await home.verifyLoaded();
      await expect(home.searchInput).toHaveValue('');
    });
  });

  test('TC03 Browse a category', async ({ page, home, nav }) => {
    await test.step('Open Categories > Hand Tools', async () => {
      await home.open();
      await nav.openCategory('Hand Tools');
    });

    await test.step('Category title and its products are shown', async () => {
      await expect(page).toHaveURL(/\/category\/hand-tools$/);
      await expect(home.pageTitle).toHaveText('Category: Hand Tools');
      await expect.poll(() => home.productCards.count(), { message: 'products in the category' }).toBeGreaterThan(0);
    });
  });
});
