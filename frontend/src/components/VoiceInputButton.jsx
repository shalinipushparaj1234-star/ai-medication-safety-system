import { useState } from 'react'
import { useLanguage } from '../LanguageContext.jsx'

const LANG_CODES = { en: 'en-US', hi: 'hi-IN', es: 'es-ES' }

export default function VoiceInputButton({ onResult }) {
  const { lang } = useLanguage()
  const [listening, setListening] = useState(false)

  const start = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge, or type instead.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = LANG_CODES[lang] || 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onResult(transcript)
    }
    recognition.start()
  }

  return (
    <button
      type="button"
      className={`voice-btn ${listening ? 'voice-btn-active' : ''}`}
      onClick={start}
      title="Tap and speak to fill this field"
    >
      {listening ? '🔴' : '🎤'}
    </button>
  )
}