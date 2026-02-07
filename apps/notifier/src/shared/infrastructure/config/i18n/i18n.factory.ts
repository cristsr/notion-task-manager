import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { I18nService } from './i18n.service';

export class I18nFactory {
  static create() {
    return async (config: ConfigService): Promise<I18nService> => {
      const defaultLang = config.get('I18N_DEFAULT_LANG', 'es');
      const fallbackLang = config.get('I18N_FALLBACK_LANG', 'es');

      await i18next.use(Backend).init({
        lng: defaultLang,
        fallbackLng: fallbackLang,
        ns: ['task'],
        defaultNS: 'task',
        backend: {
          loadPath: join(__dirname, 'i18n/{{lng}}/{{ns}}.json'),
        },
        interpolation: {
          escapeValue: false,
        },
      });

      return new I18nService(i18next);
    };
  }
}
