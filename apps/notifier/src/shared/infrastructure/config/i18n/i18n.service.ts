import { i18n } from 'i18next';

export class I18nService {
  constructor(private readonly i18n: i18n) {}

  t(key: string, options?: Record<string, unknown>): string {
    return this.i18n.t(key, options);
  }

  changeLanguage(lang: string): Promise<void> {
    return this.i18n.changeLanguage(lang).then(() => undefined);
  }

  get language(): string {
    return this.i18n.language;
  }
}
