import { expect, test } from '../src/fixtures';
import { categorySlug } from '../src/pages/NavBar';

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

  test('TC02 Return to the home page from a product page', async ({ page, home, nav, data }) => {
    const position = data.number('position');

    await test.step(`Open the home page and click product #${position}`, async () => {
      await home.open();
      // openProductAt checks that the product page shows the card's name and price.
      const name = await home.openProductAt(position);
      test.info().annotations.push({ type: 'product', description: name });
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

  test('TC03 Browse a category', async ({ page, home, nav, data }) => {
    const category = data.text('category');

    await test.step(`Open Categories > ${category}`, async () => {
      await home.open();
      await nav.openCategory(category);
    });

    await test.step('Category title and its products are shown', async () => {
      await expect(page).toHaveURL(new RegExp(`/category/${categorySlug(category)}$`));
      await expect(home.pageTitle).toHaveText(`Category: ${category}`);
      await expect.poll(() => home.productCards.count(), { message: 'products in the category' }).toBeGreaterThan(0);
    });
  });
});
