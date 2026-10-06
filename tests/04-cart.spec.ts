import { expect, test } from '../src/fixtures';
import { expectMoney } from '../src/support/ui';

const PRODUCT = 'Claw Hammer';
const SECOND_PRODUCT = 'Thor Hammer';

test.describe('Cart', () => {
  test('TC11 Add a product to the cart', async ({ home, nav }) => {
    await test.step(`Open "${PRODUCT}" and click "Add to cart"`, async () => {
      await home.open();
      const product = await home.findAndOpenProduct(PRODUCT);
      // addToCart() also waits for the "Product added to shopping cart." toast.
      await product.addToCart();
    });

    await test.step('The cart badge shows 1', async () => {
      await nav.verifyCartQuantity(1);
    });
  });

  test('TC12 Increase quantity in the cart', async ({ home, nav, cartPage }) => {
    let unitPrice = 0;

    await test.step(`Precondition: "${PRODUCT}" x1 in the cart`, async () => {
      await home.open();
      const product = await home.findAndOpenProduct(PRODUCT);
      unitPrice = await product.getUnitPrice();
      await product.addToCart();
      await nav.openCart();
      await cartPage.verifyLoaded();
      await cartPage.verifyLine(PRODUCT, 1, unitPrice);
    });

    await test.step('Change the quantity to 3', async () => {
      await cartPage.setQuantity(PRODUCT, 3);
    });

    await test.step('Line total = unit price x 3; cart total and badge are updated', async () => {
      await cartPage.verifyLine(PRODUCT, 3, unitPrice);
      await nav.verifyCartQuantity(3);
    });
  });

  test('TC13 Decrease quantity in the cart', async ({ home, nav, cartPage }) => {
    let unitPrice = 0;

    await test.step(`Precondition: "${PRODUCT}" x3 in the cart`, async () => {
      await home.open();
      const product = await home.findAndOpenProduct(PRODUCT);
      unitPrice = await product.getUnitPrice();
      await product.increaseQuantityTo(3);
      await product.addToCart();
      await nav.verifyCartQuantity(3);
      await nav.openCart();
      await cartPage.verifyLoaded();
      await cartPage.verifyLine(PRODUCT, 3, unitPrice);
    });

    await test.step('Change the quantity back to 1', async () => {
      await cartPage.setQuantity(PRODUCT, 1);
    });

    await test.step('Line total and cart total go back to the unit price; badge shows 1', async () => {
      await cartPage.verifyLine(PRODUCT, 1, unitPrice);
      await nav.verifyCartQuantity(1);
    });
  });

  test('TC14 Remove products from the cart', async ({ home, nav, cartPage }) => {
    let firstPrice = 0;
    let secondPrice = 0;

    await test.step(`Precondition: "${PRODUCT}" and "${SECOND_PRODUCT}" in the cart`, async () => {
      await home.open();
      let product = await home.findAndOpenProduct(PRODUCT);
      firstPrice = await product.getUnitPrice();
      await product.addToCart();

      await nav.goHome();
      await home.verifyLoaded();
      product = await home.findAndOpenProduct(SECOND_PRODUCT);
      secondPrice = await product.getUnitPrice();
      await product.addToCart();
      await nav.verifyCartQuantity(2);

      await nav.openCart();
      await cartPage.verifyLoaded();
      await expect(cartPage.rows).toHaveCount(2);
      await expectMoney(cartPage.cartTotal, firstPrice + secondPrice, 'cart total for both products');
    });

    await test.step(`Remove "${PRODUCT}": the cart total is recalculated`, async () => {
      await cartPage.remove(PRODUCT);
      await expect(cartPage.row(PRODUCT)).toHaveCount(0);
      await expect(cartPage.rows).toHaveCount(1);
      await expectMoney(cartPage.cartTotal, secondPrice, 'cart total after removing one product');
      await nav.verifyCartQuantity(1);
    });

    await test.step(`Remove "${SECOND_PRODUCT}": the cart is empty`, async () => {
      await cartPage.remove(SECOND_PRODUCT);
      await expect(cartPage.emptyMessage).toBeVisible();
      await expect(cartPage.rows).toHaveCount(0);
      await expect(nav.cartQuantity).toHaveCount(0);
    });
  });
});
