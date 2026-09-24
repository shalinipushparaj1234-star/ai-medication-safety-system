import { useState } from 'react'
import { useLanguage } from '../LanguageContext.jsx'

const LANG_CODES = { en: 'en-US', hi: 'hi-IN', es: 'es-ES' }

export default function SpeakButton({ text }) {
  const { lang } = useLanguage()
  const [speaking, setSpeaking] = useState(false)

  const speak = () => {
    if (!window.speechSynthesis) {
      alert('Voice output is not supported in this browser.')
      return
    }
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = LANG_CODES[lang] || 'en-US'
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  return (
    <button type="button" className="speak-btn" onClick={speak}>
      {speaking ? '⏹ Stop' : '🔊 Listen'}
    </button>
  )
}