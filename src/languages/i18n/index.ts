import { I18n } from 'i18n-js';
import en from './en';
import ru from './ru';
import { I18nManager } from 'react-native';

const i18n = new I18n({ en, ru });

i18n.locale = I18nManager.isRTL ? 'ar' : 'en';
i18n.enableFallback = true;

type TranslationKeys = keyof typeof en;

export const setLocale = (locale: 'en' | 'ru') => {
    (i18n as any).locale = locale;
};

export const getLocale = () => i18n.locale;
export const t = (key: TranslationKeys) => i18n.t(key);
export default i18n;
