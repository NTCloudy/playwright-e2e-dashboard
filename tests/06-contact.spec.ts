import { expect, test } from '../src/fixtures';
import type { ContactMessage, SendOutcome } from '../src/pages/ContactPage';
import { KB, sampleFile, type SampleFile } from '../src/support/files';
import { currentTarget } from '../src/support/target';

/** A message that passes every other check of the form, so only the attachment decides the outcome. */
const MESSAGE: ContactMessage = {
  firstName: 'Playwright',
  lastName: 'Tester',
  email: 'e2e.contact@example.com',
  subject: 'customer-service',
  message: 'Automated end-to-end test of the attachment rules of the contact form. Please ignore.',
};

interface AttachmentRow {
  /** Stable id used in the assertion message: "[TC19 <check>] <requirement>". */
  check: string;
  requirement: string;
  file: SampleFile;
}

interface RejectedRow extends AttachmentRow {
  /** The error must name the problem, e.g. the file's size or type. */
  problem: RegExp;
}

// Equivalence classes and boundary values of user story US6100 (ACC2: txt, pdf and jpg only;
// ACC4: more than 0 KB and at most 500 KB; ACC5: an invalid file gets an error that describes the problem).
const MUST_BE_ACCEPTED: AttachmentRow[] = [
  { check: 'txt-accepted', requirement: 'A 1 KB TXT file must be sent (US6100 ACC2, ACC4)', file: sampleFile('txt', 1 * KB) },
  { check: 'pdf-accepted', requirement: 'A 1 KB PDF file must be sent (US6100 ACC2)', file: sampleFile('pdf', 1 * KB) },
  { check: 'jpg-accepted', requirement: 'A 1 KB JPG file must be sent (US6100 ACC2)', file: sampleFile('jpg', 1 * KB) },
];

const MUST_BE_REJECTED: RejectedRow[] = [
  {
    check: 'empty-rejected',
    requirement: 'An empty (0 KB) TXT file must be refused with an error about its size (US6100 ACC4, ACC5)',
    file: sampleFile('txt', 0),
    problem: /empty|size|0 ?kb/i,
  },
  {
    check: 'oversize-rejected',
    requirement: 'A 501 KB TXT file must be refused with an error about its size (US6100 ACC4, ACC5)',
    file: sampleFile('txt', 501 * KB),
    problem: /500 ?kb|size|large/i,
  },
  {
    check: 'png-rejected',
    requirement: 'A 1 KB PNG file must be refused with an error about its type (US6100 ACC2, ACC5)',
    file: sampleFile('png', 1 * KB),
    problem: /type|extension|format/i,
  },
];

test.describe('Contact', () => {
  test('TC19 Contact form attachment (US6100)', async ({ page, home, nav, contactPage, botCheck }) => {
    // eslint-disable-next-line playwright/no-skipped-test -- US6100 is a requirement of the with-bugs release only
    test.skip(currentTarget() !== 'with-bugs', 'US6100 applies to the with-bugs release only; production implements a different upload rule (txt only, empty file)');
    // One page load and one submission per file.
    test.slow();

    /** Reloads the page for an empty form (a full page load, see BotCheck). */
    const freshForm = async (): Promise<void> => {
      await page.reload();
      await botCheck.waitFor(contactPage.submit);
      await contactPage.verifyLoaded();
    };

    /** Sends the message with `file` attached through the file dialog, and records what the form showed. */
    const sendWith = async (file: SampleFile): Promise<SendOutcome> => {
      await freshForm();
      await contactPage.fillMessage(MESSAGE);
      await contactPage.attach(file);
      const outcome = await contactPage.send();
      test.info().annotations.push({ type: 'attachment', description: `${file.name}: ${JSON.stringify(outcome)}` });
      return outcome;
    };

    await test.step('Open the contact form from the navigation bar', async () => {
      await home.open();
      await nav.openContact();
      await contactPage.verifyLoaded();
    });

    for (const { check, requirement, file } of MUST_BE_ACCEPTED) {
      await test.step(`Send with ${file.name}: the message is sent`, async () => {
        expect.soft(await sendWith(file), `[TC19 ${check}] ${requirement}`).toEqual({ sent: true, error: '' });
      });
    }

    for (const { check, requirement, file, problem } of MUST_BE_REJECTED) {
      await test.step(`Send with ${file.name}: refused with an error that says why`, async () => {
        expect
          .soft(await sendWith(file), `[TC19 ${check}] ${requirement}`)
          .toEqual({ sent: false, error: expect.stringMatching(problem) });
      });
    }

    await test.step('The file dialog offers only txt, pdf and jpg files', async () => {
      await freshForm();
      expect
        .soft(await contactPage.dialogFileTypes(), '[TC19 accept-filter] The file dialog must offer only txt, pdf and jpg files (US6100 ACC3)')
        .toEqual(['jpg', 'pdf', 'txt']);
    });
  });
});
