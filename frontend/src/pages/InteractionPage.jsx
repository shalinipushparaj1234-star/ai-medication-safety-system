import { useState } from 'react'
import { usePatientContext } from '../PatientContext.jsx'
import { checkInteractions } from '../api.js'
import RiskBadge from '../components/RiskBadge.jsx'
import SpeakButton from '../components/SpeakButton.jsx'
import { useLanguage } from '../LanguageContext.jsx'

export default function InteractionPage() {
  const { selectedPatient } = usePatientContext()
  const { t } = useLanguage()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!selectedPatient) {
    return (
      <div>
        <div className="page-title">{t('interactions_title')}</div>
        <div className="empty-state">{t('select_patient_first')}</div>
      </div>
    )
  }

  const run = async () => {
    setLoading(true)
    try {
      const res = await checkInteractions(selectedPatient.id)
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-title">{t('interactions_title')}</div>
      <div className="page-subtitle">{t('interactions_subtitle')}</div>

      <div className="card">
        <button onClick={run} disabled={loading}>{loading ? t('checking') : t('run_interaction_check')}</button>
      </div>

      {result && (
        <>
          <div className="card">
            <h3>{t('overall_risk')} <RiskBadge level={result.risk} /></h3>
          </div>

          <div className="card">
            <h3>{t('interactions_found')} ({result.interaction_hits.length})</h3>
            {result.interaction_hits.length === 0 && <div className="empty-state">{t('no_interactions_found')}</div>}
            {result.interaction_hits.map((h, i) => (
              <div key={i} className="report-block" style={{marginBottom: 8}}>
                <RiskBadge level={h.risk} /> <strong>{h.medicine_a} + {h.medicine_b}</strong>
                <SpeakButton text={`${h.medicine_a} and ${h.medicine_b}. Risk level: ${h.risk}. ${h.description}`} />
                <div>{h.description}</div>
              </div>
            ))}
          </div>

          {result.duplicates.length > 0 && (
            <div className="card">
              <h3>{t('duplicate_medications')}</h3>
              <div className="report-block">{result.duplicates.join(', ')}</div>
            </div>
          )}

          {result.allergy_conflicts.length > 0 && (
            <div className="card">
              <h3>{t('allergy_conflicts')}</h3>
              {result.allergy_conflicts.map((c, i) => (
                <div key={i} className="report-block">{c.medicine} {t('conflicts_with_allergy')} "{c.allergy}"</div>
              ))}
            </div>
          )}

          <div className="card">
            {t('next_go_analysis')} <strong>{t('ai_agent_analysis_link')}</strong> {t('to_get_recommendation')}
          </div>
        </>
      )}
    </div>
  )
}