import type { TestUser } from '../src/api/toolshopApi';
import { expect, test } from '../src/fixtures';
import type { AccountPage, LoginPage } from '../src/pages/AuthPages';
import type { HomePage } from '../src/pages/HomePage';

/** Signs in through the UI, starting from the home page. */
async function signIn(home: HomePage, loginPage: LoginPage, accountPage: AccountPage, user: TestUser): Promise<void> {
  await home.open();
  await home.nav.openSignIn();
  await loginPage.verifyLoaded();
  await loginPage.login(user.email, user.password);
  await accountPage.verifyLoaded();
}

test.describe('Account', () => {
  test('TC09 Sign in with a valid account', async ({ home, nav, loginPage, accountPage, user }) => {
    await test.step('Sign in with the test account', async () => {
      await signIn(home, loginPage, accountPage, user);
    });

    await test.step('"My account" is shown and the navigation bar shows the user name', async () => {
      await nav.verifySignedInAs(`${user.firstName} ${user.lastName}`);
    });
  });

  test('TC10 Sign in with an unknown account is rejected', async ({ page, home, nav, loginPage }) => {
    // An address that does not exist: wrong passwords for a real account could lock it.
    const email = `unknown.${Date.now()}@example.com`;

    await test.step('Sign in with an account that does not exist', async () => {
      await home.open();
      await nav.openSignIn();
      await loginPage.verifyLoaded();
      await loginPage.login(email, 'Wrong#Pass123');
    });

    await test.step('An error is shown and the user stays signed out', async () => {
      await expect(loginPage.error).toHaveText('Invalid email or password');
      await expect(page).toHaveURL(/\/auth\/login$/);
      await nav.verifySignedOut();
    });
  });

  test('TC15 Sign out', async ({ page, home, nav, loginPage, accountPage, user }) => {
    await test.step('Precondition: signed in', async () => {
      await signIn(home, loginPage, accountPage, user);
      await nav.verifySignedInAs(`${user.firstName} ${user.lastName}`);
    });

    await test.step('User menu > Sign out', async () => {
      await nav.signOutViaMenu();
    });

    await test.step('Signed out: "Sign in" is back and the account page is no longer accessible', async () => {
      await nav.verifySignedOut();
      await page.goto('/account');
      await loginPage.verifyLoaded();
    });
  });
});
