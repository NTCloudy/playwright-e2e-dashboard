import { expect, test } from '../src/fixtures';

test.describe('Account', () => {
  test('TC09 Sign in with a valid account', async ({ home, nav, loginPage, accountPage, botCheck, user }) => {
    await test.step('Sign in with the test account', async () => {
      await home.open();
      await nav.openSignIn();
      await loginPage.verifyLoaded();
      await loginPage.login(user.email, user.password);
    });

    await test.step('"My account" is shown and the navigation bar shows the user name', async () => {
      // After signing in, the app does a full page load of /account (see BotCheck).
      await botCheck.waitFor(accountPage.title);
      await accountPage.verifyLoaded();
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

  test('TC15 Sign out', async ({ page, home, nav, loginPage, session, botCheck, user }) => {
    await test.step('Precondition: signed in (through the API; TC09 covers the sign-in form)', async () => {
      await session.signInViaApi(user);
      await home.open();
      await nav.verifySignedInAs(`${user.firstName} ${user.lastName}`);
    });

    await test.step('User menu > Sign out', async () => {
      await nav.signOutViaMenu();
    });

    await test.step('Signed out: "Sign in" is back, the user menu is gone and the stored token is cleared', async () => {
      // Signing out reloads the page (see BotCheck).
      await botCheck.waitFor(nav.signIn);
      await nav.verifySignedOut();
      expect(await session.storedToken(), 'sign-in token in localStorage').toBeNull();
    });

    await test.step('The account page is no longer accessible: it redirects to sign-in', async () => {
      await page.goto('/account');
      await botCheck.waitFor(loginPage.form);
      await loginPage.verifyLoaded();
    });
  });
});
