import { expect, test } from '../src/fixtures';

test.describe('Checkout', () => {
  // Payment is always "Cash on Delivery" on a demo site: no card data is ever entered.
  test('TC16 Complete checkout (Cash on Delivery)', async ({ home, nav, cartPage, checkoutPage, user, data }) => {
    const product = data.text('product');
    const quantity = data.number('quantity');

    await test.step(`Cart: "${product}" x${quantity}, proceed to checkout`, async () => {
      await home.open();
      const productPage = await home.findAndOpenProduct(product);
      const unitPrice = await productPage.getUnitPrice();
      await productPage.increaseQuantityTo(quantity);
      await productPage.addToCart();
      await nav.openCart();
      await cartPage.verifyLoaded();
      await cartPage.verifyLine(product, quantity, unitPrice);
      await cartPage.proceed();
    });

    await test.step('Sign in with the test account', async () => {
      await checkoutPage.signIn(user.email, user.password);
    });

    await test.step('Billing address is prefilled and completed by the postcode lookup; continue', async () => {
      await checkoutPage.confirmBillingAddress();
    });

    await test.step('Pay with "Cash on Delivery" and confirm', async () => {
      const invoice = await checkoutPage.payCashOnDeliveryAndConfirm();
      expect(invoice).toMatch(/^INV-\d+$/);
      test.info().annotations.push({ type: 'invoice', description: invoice });
    });

    await test.step('The order is placed and the cart is empty', async () => {
      await expect(checkoutPage.orderConfirmation).toBeVisible();
      await expect(nav.cartQuantity).toHaveCount(0);
    });
  });
});
