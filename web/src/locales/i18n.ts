import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import cs from './cs.json'
import en from './en.json'

i18n.use(initReactI18next).init({
  resources: {
    cs: { translation: cs },
    en: { translation: en },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
