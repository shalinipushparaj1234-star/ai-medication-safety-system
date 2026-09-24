import { useEffect, useState } from 'react'
import { usePatientContext } from '../PatientContext.jsx'
import { runAnalysis, getAnalyses } from '../api.js'
import RiskBadge from '../components/RiskBadge.jsx'
import SpeakButton from '../components/SpeakButton.jsx'
import { useLanguage } from '../LanguageContext.jsx'

export default function AgentAnalysisPage() {
  const { selectedPatient } = usePatientContext()
  const { t } = useLanguage()
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    if (!selectedPatient) return
    getAnalyses(selectedPatient.id).then(setAnalyses)
  }

  useEffect(() => { load() }, [selectedPatient])

  if (!selectedPatient) {
    return (
      <div>
        <div className="page-title">{t('analysis_title')}</div>
        <div className="empty-state">{t('select_patient_first')}</div>
      </div>
    )
  }

  const run = async () => {
    setLoading(true)
    setError('')
    try {
      await runAnalysis(selectedPatient.id)
      load()
    } catch (e) {
      setError(e?.response?.data?.detail || t('analysis_error_default'))
    } finally {
      setLoading(false)
    }
  }

  const latest = analyses[0]

  return (
    <div>
      <div className="page-title">{t('analysis_title')}</div>
      <div className="page-subtitle">{t('analysis_subtitle')}</div>

      <div className="safety-banner">
        {t('ai_safety_note')}
      </div>

      <div className="card">
        <button onClick={run} disabled={loading}>{loading ? t('running_agents') : t('run_multi_agent')}</button>
        {error && <div style={{color: 'var(--high)', marginTop: 8, fontSize: 13}}>{error}</div>}
      </div>

      {latest && (
        <>
          <div className="card">
            <h3>{t('overall_risk')} <RiskBadge level={latest.overall_risk} /> <RiskBadge level={latest.review_status} />
              <SpeakButton text={latest.recommendation} />
            </h3>
            <div className="report-block">{latest.recommendation}</div>
          </div>

          <div className="card">
            <div className="agent-label">🛡️ {t('guardian_agent_label')} <SpeakButton text={latest.guardian_report} /></div>
            <div className="report-block">{latest.guardian_report}</div>
          </div>

          <div className="card">
            <div className="agent-label">🩺 {t('physician_agent_label')} <SpeakButton text={latest.physician_report} /></div>
            <div className="report-block">{latest.physician_report}</div>
          </div>

          <div className="card">
            <div className="agent-label">💊 {t('pharmacist_agent_label')} <SpeakButton text={latest.pharmacist_report} /></div>
            <div className="report-block">{latest.pharmacist_report}</div>
          </div>

          <div className="card">
            {t('next_go_review')} <strong>{t('final_review_link')}</strong> {t('to_approve_reject')}
          </div>
        </>
      )}

      {analyses.length > 1 && (
        <div className="card">
          <h3>{t('previous_analyses')}</h3>
          <table>
            <thead><tr><th>{t('th_hash')}</th><th>{t('th_date_col')}</th><th>{t('th_risk')}</th><th>{t('th_status')}</th></tr></thead>
            <tbody>
              {analyses.slice(1).map(a => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{new Date(a.created_at).toLocaleString()}</td>
                  <td><RiskBadge level={a.overall_risk} /></td>
                  <td><RiskBadge level={a.review_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}