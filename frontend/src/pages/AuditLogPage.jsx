import { useEffect, useState } from 'react'
import { getAuditLog, getPatientAuditLog } from '../api.js'
import { usePatientContext } from '../PatientContext.jsx'
import { useLanguage } from '../LanguageContext.jsx'

export default function AuditLogPage() {
  const [logs, setLogs] = useState([])
  const [scope, setScope] = useState('all')
  const { selectedPatient } = usePatientContext()
  const { t } = useLanguage()

  const load = () => {
    if (scope === 'patient' && selectedPatient) {
      getPatientAuditLog(selectedPatient.id).then(setLogs)
    } else {
      getAuditLog().then(setLogs)
    }
  }

  useEffect(() => { load() }, [scope, selectedPatient])

  return (
    <div>
      <div className="page-title">{t('auditlog_title')}</div>
      <div className="page-subtitle">{t('auditlog_subtitle')}</div>

      <div className="card">
        <div style={{display: 'flex', gap: 10, marginBottom: 10}}>
          <button className={scope === 'all' ? '' : 'secondary'} onClick={() => setScope('all')}>{t('all_patients_btn')}</button>
          <button
            className={scope === 'patient' ? '' : 'secondary'}
            onClick={() => setScope('patient')}
            disabled={!selectedPatient}
          >
            {selectedPatient ? `${t('only_patient_btn')} ${selectedPatient.name}` : t('select_patient_first_short')}
          </button>
        </div>

        {logs.length === 0 && <div className="empty-state">{t('no_audit_entries')}</div>}
        {logs.map(l => (
          <div key={l.id} className="log-item">
            <div className="log-time">{new Date(l.timestamp).toLocaleString()} · {t('patient_hash')}{l.patient_id ?? '-'}</div>
            <strong>{l.action}</strong>
            <div>{l.details}</div>
          </div>
        ))}
      </div>
    </div>
  )
}