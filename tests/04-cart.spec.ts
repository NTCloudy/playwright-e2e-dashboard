import { expect, softExpect, test } from '../src/fixtures';
import { expectMoney, toast } from '../src/support/ui';

/** The site's limit per product, on the product page and in the cart (larger quantities are reduced to it). */
const MAX_QUANTITY = 99;
/**
 * Quantities the cart must accept: 10 and 11 on either side of the cap of 10 that an older release had
 * (bug #47), and the limit itself. MAX_QUANTITY + 1 is the value just above the limit.
 */
const ACCEPTED_QUANTITIES = [10, 11, MAX_QUANTITY];

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

  test('TC18 Purchase quantity upper limit', async ({ page, home, nav, cartPage, data }) => {
    // A failing boundary value waits for the whole expect timeout; this leaves time to report them all.
    test.slow();
    const product = data.text('product');
    let unitPrice = 0;
    /** The expected cart: the quantity and the cart total for it. */
    const cartWith = (quantity: number) => ({ quantity, total: (unitPrice * quantity).toFixed(2) });

    await test.step(`Precondition: "${product}" x1 in the cart`, async () => {
      await home.open();
      const productPage = await home.findAndOpenProduct(product);
      unitPrice = await productPage.getUnitPrice();
      // This case checks the cart itself; TC11 checks the "added" message.
      await productPage.addToCartWithoutToastCheck();
      await nav.verifyCartQuantity(1);
      await nav.openCart();
      await cartPage.verifyLoaded();
      await expect.poll(() => cartPage.quantityAndTotal(product), { message: 'cart before the change' }).toEqual(cartWith(1));
    });

    for (const quantity of ACCEPTED_QUANTITIES) {
      await test.step(`Change the quantity to ${quantity}: accepted, the cart total follows`, async () => {
        await cartPage.typeQuantity(product, quantity);
        await softExpect
          .poll(() => cartPage.quantityAndTotal(product), {
            message: `[TC18 qty-${quantity}] A quantity of ${quantity} must be accepted (the limit is ${MAX_QUANTITY})`,
          })
          .toEqual(cartWith(quantity));
      });
    }

    await test.step(`Change the quantity to ${MAX_QUANTITY + 1}: reduced to ${MAX_QUANTITY} with a warning`, async () => {
      await cartPage.typeQuantity(product, MAX_QUANTITY + 1);
      // The warning shows at once (the update follows), so it is checked first.
      await expect
        .soft(
          toast(page, `You can order at most ${MAX_QUANTITY} of this product.`),
          `[TC18 qty-${MAX_QUANTITY + 1}-warning] A warning must explain the limit of ${MAX_QUANTITY}`,
        )
        .toBeVisible();
      await softExpect
        .poll(() => cartPage.quantityAndTotal(product), {
          message: `[TC18 qty-${MAX_QUANTITY + 1}] A quantity of ${MAX_QUANTITY + 1} must be reduced to the limit of ${MAX_QUANTITY}`,
        })
        .toEqual(cartWith(MAX_QUANTITY));
    });
  });
});
