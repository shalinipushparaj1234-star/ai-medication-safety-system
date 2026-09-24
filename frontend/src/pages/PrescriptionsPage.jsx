import { useEffect, useState } from 'react'
import { usePatientContext } from '../PatientContext.jsx'
import { getPrescriptions, addPrescription, deletePrescription, getKnownMedicines } from '../api.js'
import { useLanguage } from '../LanguageContext.jsx'
import VoiceInputButton from '../components/VoiceInputButton.jsx'

const emptyForm = { doctor_name: '', hospital: '', medicine_name: '', dosage: '', date_prescribed: '' }

export default function PrescriptionsPage() {
  const { selectedPatient } = usePatientContext()
  const { t } = useLanguage()
  const [prescriptions, setPrescriptions] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [knownMeds, setKnownMeds] = useState([])
  const [loading, setLoading] = useState(false)

  const load = () => {
    if (!selectedPatient) return
    getPrescriptions(selectedPatient.id).then(setPrescriptions)
  }

  useEffect(() => { load() }, [selectedPatient])
  useEffect(() => { getKnownMedicines().then(setKnownMeds) }, [])

  if (!selectedPatient) {
    return (
      <div>
        <div className="page-title">{t('prescriptions_title')}</div>
        <div className="empty-state">{t('select_patient_first')}</div>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.doctor_name.trim() || !form.medicine_name.trim()) return
    setLoading(true)
    try {
      await addPrescription(selectedPatient.id, form)
      setForm(emptyForm)
      load()
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id) => {
    await deletePrescription(id)
    load()
  }

  return (
    <div>
      <div className="page-title">{t('prescriptions_title')}</div>
      <div className="page-subtitle">{t('prescriptions_subtitle')}</div>

      <div className="card">
        <h3>{t('add_prescription_title')}</h3>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label>{t('doctor_name')}</label>
              <div className="input-with-voice">
                <input value={form.doctor_name} onChange={e => setForm({...form, doctor_name: e.target.value})} placeholder={t('doctor_name_ph')} required />
                <VoiceInputButton onResult={(txt) => setForm(f => ({...f, doctor_name: txt}))} />
              </div>
            </div>
            <div className="form-group">
              <label>{t('hospital_label')}</label>
              <input value={form.hospital} onChange={e => setForm({...form, hospital: e.target.value})} placeholder={t('hospital_ph')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('medicine_name')}</label>
              <div className="input-with-voice">
                <input list="known-meds" value={form.medicine_name} onChange={e => setForm({...form, medicine_name: e.target.value})} placeholder={t('medicine_name_ph')} required />
                <VoiceInputButton onResult={(txt) => setForm(f => ({...f, medicine_name: txt}))} />
              </div>
              <datalist id="known-meds">
                {knownMeds.map(m => <option key={m} value={m} />)}
              </datalist>
            </div>
            <div className="form-group">
              <label>{t('dosage_label')}</label>
              <div className="input-with-voice">
                <input value={form.dosage} onChange={e => setForm({...form, dosage: e.target.value})} placeholder={t('dosage_ph')} />
                <VoiceInputButton onResult={(txt) => setForm(f => ({...f, dosage: txt}))} />
              </div>
            </div>
            <div className="form-group">
              <label>{t('date_prescribed')}</label>
              <input type="date" value={form.date_prescribed} onChange={e => setForm({...form, date_prescribed: e.target.value})} />
            </div>
          </div>
          <button type="submit" disabled={loading}>{loading ? t('adding') : t('add_prescription_btn')}</button>
        </form>
      </div>

      <div className="card">
        <h3>{t('current_prescriptions')} ({prescriptions.length})</h3>
        {prescriptions.length === 0 && <div className="empty-state">{t('no_prescriptions')}</div>}
        {prescriptions.length > 0 && (
          <table>
            <thead>
              <tr><th>{t('th_medicine')}</th><th>{t('th_dosage')}</th><th>{t('th_doctor')}</th><th>{t('th_hospital')}</th><th>{t('th_date')}</th><th></th></tr>
            </thead>
            <tbody>
              {prescriptions.map(rx => (
                <tr key={rx.id}>
                  <td>{rx.medicine_name}</td>
                  <td>{rx.dosage || '-'}</td>
                  <td>{rx.doctor_name}</td>
                  <td>{rx.hospital || '-'}</td>
                  <td>{rx.date_prescribed || '-'}</td>
                  <td><button className="secondary" onClick={() => remove(rx.id)}>{t('remove_btn')}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}