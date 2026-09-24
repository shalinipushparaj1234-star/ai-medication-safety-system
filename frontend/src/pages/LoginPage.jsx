import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'
import { useLanguage } from '../LanguageContext.jsx'
import { LANGUAGES } from '../i18n.js'

export default function LoginPage() {
  const { login } = useAuth()
  const { t, lang, changeLang } = useLanguage()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Doctor')

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim() || !password.trim()) return
    login(name.trim(), role)
    navigate('/')
  }

  return (
    <div className="login-page">
      <div className="login-lang-picker">
        <select value={lang} onChange={e => changeLang(e.target.value)}>
          {Object.entries(LANGUAGES).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      <div className="login-card">
        <div className="login-icon">🩺</div>
        <h1>{t('login_title')}</h1>
        <p className="login-subtitle">{t('login_subtitle')}</p>

        <form onSubmit={submit}>
          <div className="form-group" style={{marginBottom: 14}}>
            <label>{t('login_name')}</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={t('login_name_ph')} required />
          </div>

          <div className="form-group" style={{marginBottom: 14}}>
            <label>{t('login_role')}</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="Doctor">{t('login_role_doctor')}</option>
              <option value="Pharmacist">{t('login_role_pharmacist')}</option>
              <option value="Administrator">{t('login_role_admin')}</option>
            </select>
          </div>

          <div className="form-group" style={{marginBottom: 20}}>
            <label>{t('login_password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('login_password_ph')} required />
          </div>

          <button type="submit" style={{width: '100%'}}>{t('login_button')}</button>
        </form>

        <p className="login-demo-note">{t('login_demo_note')}</p>
      </div>
    </div>
  )
}