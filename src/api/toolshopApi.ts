import type { APIRequestContext, APIResponse } from '@playwright/test';
import { currentTarget, type Target } from '../support/target';

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

/** Public demo account documented in the Toolshop README; used only as a last resort. */
const DEMO_USER: TestUser = {
  firstName: 'Jack',
  lastName: 'Howe',
  email: 'customer2@practicesoftwaretesting.com',
  password: 'welcome01',
  source: 'demo',
};

/**
 * Address of the test account, in the shape each release's register API expects:
 * production takes a nested `address` object, the older with-bugs API takes flat fields.
 */
function addressFields(target: Target): Record<string, unknown> {
  if (target === 'with-bugs') {
    return { address: 'Test Street 1', city: 'Taipei', state: 'Taipei', country: 'TW', postcode: '100' };
  }
  return {
    address: { street: 'Test Street', house_number: '1', city: 'Taipei', state: 'Taipei', country: 'TW', postal_code: '100' },
  };
}

/** e.g. `HTTP 422: {"first_name":["The first name format is invalid."]}` */
async function describeResponse(response: APIResponse): Promise<string> {
  const body = (await response.text().catch(() => '')).replace(/\s+/g, ' ').trim();
  return `HTTP ${response.status()}${body ? `: ${body.slice(0, 200)}` : ''}`;
}

/**
 * Registers a brand-new customer through the REST API.
 *
 * A dedicated account per run keeps tests independent from the shared demo
 * accounts, which anyone on the internet can modify or lock. The names are
 * letters only because the with-bugs release accepts nothing else. Network
 * and server errors are retried once; only if registration still fails is
 * the documented demo account used, with the reason in `note` (the fixtures
 * log it and record it as a test annotation).
 */
export async function registerTestUser(api: APIRequestContext, target: Target = currentTarget()): Promise<TestUser> {
  let problem = 'register API was not called';
  for (let attempt = 1; attempt <= 2; attempt++) {
    const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const user: TestUser = {
      firstName: 'Playwright',
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
          ...addressFields(target),
        },
      });
      if (response.status() === 201) return user;
      problem = `register API returned ${await describeResponse(response)}`;
      // A rejected request (4xx) would be rejected again; only server errors are worth a retry.
      if (response.status() < 500) break;
    } catch (error) {
      problem = `register API failed: ${(error as Error).message.split('\n')[0]}`;
    }
  }
  return { ...DEMO_USER, note: `${problem} (target: ${target})` };
}
