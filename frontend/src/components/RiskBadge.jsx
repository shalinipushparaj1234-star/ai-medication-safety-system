import { useLanguage } from '../LanguageContext.jsx'

const KEY_MAP = {
  HIGH: 'risk_high',
  MEDIUM: 'risk_medium',
  LOW: 'risk_low',
  PENDING: 'status_pending',
  APPROVED: 'status_approved',
  REJECTED: 'status_rejected',
}

export default function RiskBadge({ level }) {
  const { t } = useLanguage()
  if (!level) return null
  const key = KEY_MAP[level]
  return <span className={`badge badge-${level}`}>{key ? t(key) : level}</span>
}