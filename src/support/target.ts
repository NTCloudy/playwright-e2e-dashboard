/**
 * The release of the Toolshop demo site that the suite runs against:
 * - "production": https://practicesoftwaretesting.com (the default);
 * - "with-bugs": https://with-bugs.practicesoftwaretesting.com, an older release with known, documented bugs.
 *
 * The two releases differ in a few places that are not bugs (for example the register API's address format),
 * and some requirements only exist for one of them.
 */
export type Target = 'production' | 'with-bugs';

const TARGETS: readonly string[] = ['production', 'with-bugs'] satisfies Target[];

function isTarget(value: string | undefined): value is Target {
  return value !== undefined && TARGETS.includes(value);
}

/** The TARGET environment variable when it names a known release; otherwise derived from BASE_URL. */
export function currentTarget(): Target {
  const fromEnv = process.env.TARGET;
  if (isTarget(fromEnv)) return fromEnv;
  return (process.env.BASE_URL ?? '').includes('with-bugs') ? 'with-bugs' : 'production';
}
