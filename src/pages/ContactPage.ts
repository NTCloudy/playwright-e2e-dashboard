import { expect, type Locator, type Page } from '@playwright/test';
import type { SampleFile } from '../support/files';

/** Sender and message for the contact form. */
export interface ContactMessage {
  firstName: string;
  lastName: string;
  email: string;
  /** Value of a subject option, e.g. "customer-service". */
  subject: string;
  message: string;
}

/** What the form shows after "Send": the confirmation, or the error messages (field errors and the server's). */
export interface SendOutcome {
  sent: boolean;
  error: string;
}

/** `accept` tokens of the file types that user story US6100 allows. */
const FILE_TYPES: Record<string, string> = {
  '.txt': 'txt',
  'text/plain': 'txt',
  '.pdf': 'pdf',
  'application/pdf': 'pdf',
  '.jpg': 'jpg',
  '.jpeg': 'jpg',
  'image/jpeg': 'jpg',
};

/** Contact form (/contact). */
export class ContactPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly email: Locator;
  readonly subject: Locator;
  readonly message: Locator;
  readonly attachment: Locator;
  readonly submit: Locator;
  /** "Thanks for your message! …", shown instead of the form once the message is sent. */
  readonly confirmation: Locator;
  /** Field errors (data-test="…-error") and the error returned by the server share this style. */
  readonly errors: Locator;

  constructor(private readonly page: Page) {
    this.firstName = page.getByTestId('first-name');
    this.lastName = page.getByTestId('last-name');
    this.email = page.getByTestId('email');
    this.subject = page.getByTestId('subject');
    this.message = page.getByTestId('message');
    this.attachment = page.getByTestId('attachment');
    this.submit = page.getByTestId('contact-submit');
    this.confirmation = page.locator('.alert-success');
    this.errors = page.locator('.alert-danger');
  }

  async verifyLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/contact$/);
    for (const field of [this.firstName, this.lastName, this.email, this.subject, this.message]) {
      await expect(field).toBeEditable();
    }
    await expect(this.attachment).toBeEnabled();
    await expect(this.submit).toBeEnabled();
  }

  /**
   * Fills every field except the attachment. The form takes a value when its field loses focus, so the
   * subject list is focused before an option is chosen and the next field then takes the focus away.
   */
  async fillMessage(content: ContactMessage): Promise<void> {
    await this.firstName.fill(content.firstName);
    await this.lastName.fill(content.lastName);
    await this.email.fill(content.email);
    await this.subject.focus();
    await this.subject.selectOption(content.subject);
    await this.message.fill(content.message);
  }

  /** Attaches a file through the file dialog that the attachment field opens. */
  async attach(file: SampleFile): Promise<void> {
    const fileChooser = this.page.waitForEvent('filechooser');
    await this.attachment.click();
    await (await fileChooser).setFiles(file);
  }

  /**
   * File types that the attachment's file dialog offers, from the field's `accept` attribute, e.g.
   * ".txt,application/pdf" -> ["pdf", "txt"]; ["any file"] when the field sets no restriction.
   */
  async dialogFileTypes(): Promise<string[]> {
    const accept = (await this.attachment.getAttribute('accept')) ?? '';
    const tokens = accept
      .split(',')
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean);
    if (tokens.length === 0) return ['any file'];
    return [...new Set(tokens.map((token) => FILE_TYPES[token] ?? token))].sort();
  }

  /** Clicks "Send" and waits until the form shows the confirmation or an error; returns what it shows. */
  async send(): Promise<SendOutcome> {
    await this.submit.click();
    await expect(this.confirmation.or(this.errors).first()).toBeVisible();
    return {
      sent: await this.confirmation.isVisible(),
      error: (await this.errors.allInnerTexts()).map((text) => text.replace(/\s+/g, ' ').trim()).join(' | '),
    };
  }
}
