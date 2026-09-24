import { createContext, useContext, useState } from 'react'
import { translations } from './i18n.js'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('medsafe_lang') || 'en')

  const changeLang = (newLang) => {
    setLang(newLang)
    localStorage.setItem('medsafe_lang', newLang)
  }

  const t = (key) => {
    return translations[lang]?.[key] || translations.en[key] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}