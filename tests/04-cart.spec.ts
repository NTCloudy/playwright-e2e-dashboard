import { expect, test } from '../src/fixtures';
import { expectMoney } from '../src/support/ui';

test.describe('Cart', () => {
  test('TC11 Add a product to the cart', async ({ home, nav, data }) => {
    const product = data.text('product');
    const quantity = data.number('quantity');

    await test.step(`Open "${product}", set the quantity to ${quantity} and click "Add to cart"`, async () => {
      await home.open();
      const productPage = await home.findAndOpenProduct(product);
      await productPage.increaseQuantityTo(quantity);
      // addToCart() also waits for the "Product added to shopping cart." toast.
      await productPage.addToCart();
    });

    await test.step(`The cart badge shows ${quantity}`, async () => {
      await nav.verifyCartQuantity(quantity);
    });
  });

  test('TC12 Increase quantity in the cart', async ({ home, nav, cartPage, data }) => {
    const product = data.text('product');
    const quantity = data.number('quantity');
    let unitPrice = 0;

    await test.step(`Precondition: "${product}" x1 in the cart`, async () => {
      await home.open();
      const productPage = await home.findAndOpenProduct(product);
      unitPrice = await productPage.getUnitPrice();
      await productPage.addToCart();
      await nav.openCart();
      await cartPage.verifyLoaded();
      await cartPage.verifyLine(product, 1, unitPrice);
    });

    await test.step(`Change the quantity to ${quantity}`, async () => {
      await cartPage.setQuantity(product, quantity);
    });

    await test.step(`Line total = unit price x ${quantity}; cart total and badge are updated`, async () => {
      await cartPage.verifyLine(product, quantity, unitPrice);
      await nav.verifyCartQuantity(quantity);
    });
  });

  test('TC13 Decrease quantity in the cart', async ({ home, nav, cartPage, data }) => {
    const product = data.text('product');
    const from = data.number('from');
    const to = data.number('to');
    let unitPrice = 0;

    await test.step(`Precondition: "${product}" x${from} in the cart`, async () => {
      await home.open();
      const productPage = await home.findAndOpenProduct(product);
      unitPrice = await productPage.getUnitPrice();
      await productPage.increaseQuantityTo(from);
      await productPage.addToCart();
      await nav.verifyCartQuantity(from);
      await nav.openCart();
      await cartPage.verifyLoaded();
      await cartPage.verifyLine(product, from, unitPrice);
    });

    await test.step(`Change the quantity to ${to}`, async () => {
      await cartPage.setQuantity(product, to);
    });

    await test.step(`Line total = unit price x ${to}; cart total and badge are updated`, async () => {
      await cartPage.verifyLine(product, to, unitPrice);
      await nav.verifyCartQuantity(to);
    });
  });

  test('TC14 Remove products from the cart', async ({ home, nav, cartPage, data }) => {
    const first = data.text('first');
    const second = data.text('second');
    let firstPrice = 0;
    let secondPrice = 0;

    await test.step(`Precondition: "${first}" and "${second}" in the cart`, async () => {
      await home.open();
      let productPage = await home.findAndOpenProduct(first);
      firstPrice = await productPage.getUnitPrice();
      await productPage.addToCart();

      await nav.goHome();
      await home.verifyLoaded();
      productPage = await home.findAndOpenProduct(second);
      secondPrice = await productPage.getUnitPrice();
      await productPage.addToCart();
      await nav.verifyCartQuantity(2);

      await nav.openCart();
      await cartPage.verifyLoaded();
      await expect(cartPage.rows).toHaveCount(2);
      await expectMoney(cartPage.cartTotal, firstPrice + secondPrice, 'cart total for both products');
    });

    await test.step(`Remove "${first}": the cart total is recalculated`, async () => {
      await cartPage.remove(first);
      await expect(cartPage.row(first)).toHaveCount(0);
      await expect(cartPage.rows).toHaveCount(1);
      await expectMoney(cartPage.cartTotal, secondPrice, 'cart total after removing one product');
      await nav.verifyCartQuantity(1);
    });

    await test.step(`Remove "${second}": the cart is empty`, async () => {
      await cartPage.remove(second);
      await expect(cartPage.emptyMessage).toBeVisible();
      await expect(cartPage.rows).toHaveCount(0);
      await expect(nav.cartQuantity).toHaveCount(0);
    });
  });
});
