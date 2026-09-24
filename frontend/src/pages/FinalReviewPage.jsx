import { useEffect, useState } from 'react'
import { usePatientContext } from '../PatientContext.jsx'
import { getAnalyses, reviewAnalysis } from '../api.js'
import RiskBadge from '../components/RiskBadge.jsx'
import SpeakButton from '../components/SpeakButton.jsx'
import VoiceInputButton from '../components/VoiceInputButton.jsx'
import { useLanguage } from '../LanguageContext.jsx'

export default function FinalReviewPage() {
  const { selectedPatient } = usePatientContext()
  const { t } = useLanguage()
  const [analyses, setAnalyses] = useState([])
  const [reviewerName, setReviewerName] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const load = () => {
    if (!selectedPatient) return
    getAnalyses(selectedPatient.id).then(setAnalyses)
  }

  useEffect(() => { load() }, [selectedPatient])

  if (!selectedPatient) {
    return (
      <div>
        <div className="page-title">{t('review_title')}</div>
        <div className="empty-state">{t('select_patient_first')}</div>
      </div>
    )
  }

  const pending = analyses.find(a => a.review_status === 'PENDING')

  const decide = async (decision) => {
    if (!reviewerName.trim()) {
      alert(t('enter_reviewer_alert'))
      return
    }
    setLoading(true)
    try {
      await reviewAnalysis(pending.id, { decision, reviewer_name: reviewerName, comment })
      setComment('')
      load()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-title">{t('review_title')}</div>
      <div className="page-subtitle">{t('review_subtitle')}</div>

      {!pending && (
        <div className="card empty-state">
          {t('no_pending')}
        </div>
      )}

      {pending && (
        <div className="card">
          <h3>{t('pending_recommendation')} <RiskBadge level={pending.overall_risk} /> <SpeakButton text={pending.recommendation} /></h3>
          <div className="report-block">{pending.recommendation}</div>

          <div className="form-row" style={{marginTop: 16}}>
            <div className="form-group">
              <label>{t('reviewer_name')}</label>
              <div className="input-with-voice">
                <input value={reviewerName} onChange={e => setReviewerName(e.target.value)} placeholder={t('reviewer_name_ph')} />
                <VoiceInputButton onResult={setReviewerName} />
              </div>
            </div>
            <div className="form-group">
              <label>{t('comment_label')}</label>
              <div className="input-with-voice">
                <input value={comment} onChange={e => setComment(e.target.value)} placeholder={t('comment_ph')} />
                <VoiceInputButton onResult={setComment} />
              </div>
            </div>
          </div>
          <div style={{display: 'flex', gap: 10}}>
            <button className="approve" onClick={() => decide('APPROVED')} disabled={loading}>{t('approve_btn')}</button>
            <button className="danger" onClick={() => decide('REJECTED')} disabled={loading}>{t('reject_btn')}</button>
          </div>
        </div>
      )}

      <div className="card">
        <h3>{t('review_history')}</h3>
        {analyses.filter(a => a.review_status !== 'PENDING').length === 0 && (
          <div className="empty-state">{t('no_reviewed')}</div>
        )}
        {analyses.filter(a => a.review_status !== 'PENDING').length > 0 && (
          <table>
            <thead><tr><th>{t('th_hash')}</th><th>{t('th_risk')}</th><th>{t('th_status')}</th><th>{t('th_reviewer')}</th><th>{t('th_comment')}</th><th>{t('th_reviewed_at')}</th></tr></thead>
            <tbody>
              {analyses.filter(a => a.review_status !== 'PENDING').map(a => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td><RiskBadge level={a.overall_risk} /></td>
                  <td><RiskBadge level={a.review_status} /></td>
                  <td>{a.reviewer_name}</td>
                  <td>{a.review_comment || '-'}</td>
                  <td>{a.reviewed_at ? new Date(a.reviewed_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}