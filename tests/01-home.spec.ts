import { expect, softExpect, test } from '../src/fixtures';
import { categorySlug } from '../src/pages/NavBar';
import { imagesNotShown, labelsOf } from '../src/support/ui';

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

  // Soft assertions: one run reports every wrong label and every image that is not shown.
  test('TC17 Page text and images', async ({ home, nav, productPage }) => {
    // A failing soft assertion waits for the whole expect timeout; this leaves time to report them all.
    test.slow();

    await test.step('Open the home page', async () => {
      await home.open();
    });

    await test.step('Home page: logo, navigation, sidebar headings, search button and product images', async () => {
      await expect.soft(nav.brand, '[TC17 logo] The Toolshop logo must be shown').toBeVisible();
      await softExpect
        .poll(() => imagesNotShown(nav.brand), { message: '[TC17 logo] The Toolshop logo must load (no broken image)' })
        .toEqual([]);
      await softExpect
        .poll(() => labelsOf(nav.links), { message: '[TC17 nav-labels] The navigation links must read "Home", "Categories", "Contact"' })
        .toEqual(['Home', 'Categories', 'Contact']);
      await softExpect
        .poll(() => labelsOf(home.sidebarHeadings), {
          message: '[TC17 sidebar-headings] The sidebar headings must read "Sort", "Price Range", "Search", "Filters"',
        })
        .toEqual(['Sort', 'Price Range', 'Search', 'Filters']);
      await softExpect
        .poll(() => imagesNotShown(home.searchHeading), {
          message: '[TC17 search-icon] The icon of the "Search" heading must load (no broken image)',
        })
        .toEqual([]);
      await expect.soft(home.searchSubmit, '[TC17 search-button] The search button must read "Search"').toHaveText('Search');
      await softExpect
        .poll(() => home.productsWithoutImage(), { message: '[TC17 product-images] Every product card must show its image' })
        .toEqual([]);
    });

    await test.step('Open the first product: the related products heading', async () => {
      const name = await home.openProductAt(1);
      test.info().annotations.push({ type: 'product', description: name });
      await expect
        .soft(productPage.relatedHeading, '[TC17 related-heading] The product page must show the heading "Related products"')
        .toHaveText('Related products');
    });
  });
});
