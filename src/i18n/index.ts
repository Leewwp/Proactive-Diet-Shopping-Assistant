/* eslint-disable import/no-named-as-default-member */
import 'intl-pluralrules';
import i18nextInstance from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';

i18nextInstance.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: 'en',
  fallbackLng: 'en',
  compatibilityJSON: 'v4',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18nextInstance;
