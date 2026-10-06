import { expect, test } from '../src/fixtures';

const PRODUCT = 'Claw Hammer';

test.describe('Checkout', () => {
  // Payment is always "Cash on Delivery" on a demo site: no card data is ever entered.
  test('TC16 Complete checkout (Cash on Delivery)', async ({ home, nav, cartPage, checkoutPage, user }) => {
    await test.step(`Cart: "${PRODUCT}" x1, proceed to checkout`, async () => {
      await home.open();
      const product = await home.findAndOpenProduct(PRODUCT);
      const unitPrice = await product.getUnitPrice();
      await product.addToCart();
      await nav.openCart();
      await cartPage.verifyLoaded();
      await cartPage.verifyLine(PRODUCT, 1, unitPrice);
      await cartPage.proceed();
    });

    await test.step('Sign in with the test account', async () => {
      await checkoutPage.signIn(user.email, user.password);
    });

    await test.step('Billing address is prefilled; continue', async () => {
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
