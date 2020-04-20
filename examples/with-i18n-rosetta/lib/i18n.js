import { createContext } from 'react'
import rosetta from 'rosetta'

// import rosetta from 'rosetta/debug';

const i18n = rosetta()

export const defaultLanguage = 'en'
export const languages = ['de', 'en']
export const contentLanguageMap = { de: 'de-DE', en: 'en-US' }

export const I18nContext = createContext()

// default language
i18n.locale(defaultLanguage)

export default function I18n({ children }) {
  return <I18nContext.Provider value={i18n}>{children}</I18nContext.Provider>
}
