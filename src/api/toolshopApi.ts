import type { APIRequestContext } from '@playwright/test';

export const API_URL = process.env.API_URL ?? 'https://api.practicesoftwaretesting.com';

export interface TestUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  /** "registered" = fresh account created for this run, "demo" = public fallback account. */
  source: 'registered' | 'demo';
  note?: string;
}

/** Public demo account documented in the Toolshop README; used only as a fallback. */
const DEMO_USER: TestUser = {
  firstName: 'Jack',
  lastName: 'Howe',
  email: 'customer2@practicesoftwaretesting.com',
  password: 'welcome01',
  source: 'demo',
};

/**
 * Registers a brand-new customer through the REST API.
 *
 * A dedicated account per run keeps tests independent from the shared demo
 * accounts, which anyone on the internet can modify or lock. If the
 * registration API is unavailable, the documented demo account is used and
 * the reason is surfaced in the report via a test annotation.
 */
export async function registerTestUser(api: APIRequestContext): Promise<TestUser> {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const user: TestUser = {
    firstName: 'E2E',
    lastName: 'Tester',
    email: `e2e.${stamp}@example.com`,
    password: `Pw#${stamp}aZ`,
    source: 'registered',
  };

  try {
    const response = await api.post('/users/register', {
      data: {
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        password: user.password,
        phone: '0912345678',
        dob: '1990-01-01',
        address: {
          street: 'Test Street',
          house_number: '1',
          city: 'Taipei',
          state: 'Taipei',
          country: 'TW',
          postal_code: '100',
        },
      },
    });
    if (response.status() === 201) return user;
    return { ...DEMO_USER, note: `register API returned HTTP ${response.status()}` };
  } catch (error) {
    return { ...DEMO_USER, note: `register API failed: ${(error as Error).message.split('\n')[0]}` };
  }
}
