import { NavLink } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'
import { useLanguage } from '../LanguageContext.jsx'
import { LANGUAGES } from '../i18n.js'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t, lang, changeLang } = useLanguage()

  const links = [
    { to: '/', label: t('nav_patients'), end: true },
    { to: '/prescriptions', label: t('nav_prescriptions') },
    { to: '/interactions', label: t('nav_interactions') },
    { to: '/analysis', label: t('nav_analysis') },
    { to: '/review', label: t('nav_review') },
    { to: '/audit-log', label: t('nav_auditlog') },
  ]

  return (
    <div className="sidebar">
      <h1>🩺 {t('appName')}<br /><span style={{fontWeight:400, fontSize:12}}>{t('appTagline')}</span></h1>

      {links.map(l => (
        <NavLink key={l.to} to={l.to} end={l.end} className={({isActive}) => isActive ? 'active' : ''}>
          {l.label}
        </NavLink>
      ))}

      <div className="sidebar-footer">
        <select className="sidebar-lang-select" value={lang} onChange={e => changeLang(e.target.value)}>
          {Object.entries(LANGUAGES).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>

        {user && (
          <div className="sidebar-user">
            <div>{t('welcome')}, <strong>{user.name}</strong></div>
            <div style={{opacity: 0.7, fontSize: 11}}>{user.role}</div>
            <button className="secondary" style={{marginTop: 8, width: '100%'}} onClick={logout}>
              {t('logout')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}