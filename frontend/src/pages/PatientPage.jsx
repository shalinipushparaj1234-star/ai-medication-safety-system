import { useEffect, useState } from 'react'
import { getPatients, createPatient } from '../api.js'
import { usePatientContext } from '../PatientContext.jsx'
import { useLanguage } from '../LanguageContext.jsx'
import VoiceInputButton from '../components/VoiceInputButton.jsx'

const emptyForm = { name: '', age: '', gender: '', allergies: '', conditions: '', notes: '' }

export default function PatientPage() {
  const [patients, setPatients] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const { selectedPatient, setSelectedPatient } = usePatientContext()
  const { t } = useLanguage()

  const load = () => getPatients().then(setPatients)

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      const patient = await createPatient({
        ...form,
        age: form.age ? parseInt(form.age) : null,
      })
      setForm(emptyForm)
      await load()
      setSelectedPatient(patient)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-title">{t('patient_title')}</div>
      <div className="page-subtitle">{t('patient_subtitle')}</div>

      <div className="safety-banner">
        {t('demo_banner')}
      </div>

      <div className="card">
        <h3>{t('add_new_patient')}</h3>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label>{t('full_name')}</label>
              <div className="input-with-voice">
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder={t('full_name_ph')} required />
                <VoiceInputButton onResult={(txt) => setForm(f => ({...f, name: txt}))} />
              </div>
            </div>
            <div className="form-group">
              <label>{t('age')}</label>
              <input type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} placeholder={t('age_ph')} />
            </div>
            <div className="form-group">
              <label>{t('gender')}</label>
              <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                <option value="">{t('select')}</option>
                <option value="Male">{t('gender_male')}</option>
                <option value="Female">{t('gender_female')}</option>
                <option value="Other">{t('gender_other')}</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('allergies_label')}</label>
              <div className="input-with-voice">
                <input value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})} placeholder={t('allergies_ph')} />
                <VoiceInputButton onResult={(txt) => setForm(f => ({...f, allergies: txt}))} />
              </div>
            </div>
            <div className="form-group">
              <label>{t('conditions_label')}</label>
              <div className="input-with-voice">
                <input value={form.conditions} onChange={e => setForm({...form, conditions: e.target.value})} placeholder={t('conditions_ph')} />
                <VoiceInputButton onResult={(txt) => setForm(f => ({...f, conditions: txt}))} />
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('notes_label')}</label>
              <div className="input-with-voice">
                <textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder={t('notes_ph')} />
                <VoiceInputButton onResult={(txt) => setForm(f => ({...f, notes: txt}))} />
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading}>{loading ? t('adding') : t('add_patient_btn')}</button>
        </form>
      </div>

      <div className="card">
        <h3>{t('patients_count')} ({patients.length})</h3>
        {patients.length === 0 && <div className="empty-state">{t('no_patients')}</div>}
        {patients.length > 0 && (
          <table>
            <thead>
              <tr><th>{t('th_name')}</th><th>{t('th_age_gender')}</th><th>{t('th_allergies')}</th><th>{t('th_conditions')}</th><th></th></tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id} style={{ background: selectedPatient?.id === p.id ? '#eef4ff' : 'transparent' }}>
                  <td>{p.name}</td>
                  <td>{p.age || '-'} / {p.gender || '-'}</td>
                  <td>{p.allergies || '-'}</td>
                  <td>{p.conditions || '-'}</td>
                  <td>
                    <button
                      className={selectedPatient?.id === p.id ? '' : 'secondary'}
                      onClick={() => setSelectedPatient(p)}
                    >
                      {selectedPatient?.id === p.id ? t('selected_btn') : t('select_btn')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedPatient && (
        <div className="card">
          {t('working_on')} <strong>{selectedPatient.name}</strong> {t('continue_to_prescriptions')}
        </div>
      )}
    </div>
  )
}