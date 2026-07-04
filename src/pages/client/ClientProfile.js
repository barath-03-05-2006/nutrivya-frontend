import React, { useState, useEffect } from 'react';
import { clientAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Save, User, Activity, Mail } from 'lucide-react';

const TOGGLE_FIELDS = [
  { key: 'medicalDiagnosis', label: 'Medical Diagnosis', desc: 'Do you have any current medical diagnosis?' },
  { key: 'regularMedicine', label: 'Regular Medicine', desc: 'Are you taking any regular medicines?' },
  { key: 'pastMedicalHistory', label: 'Past Medical History', desc: 'Any significant past medical history?' },
  { key: 'medicalSurgery', label: 'Medical Surgery', desc: 'Have you had any surgeries?' },
  { key: 'supplements', label: 'Supplements', desc: 'Do you take any supplements?' },
  { key: 'foodAllergy', label: 'Food Allergy', desc: 'Do you have any food allergies?' },
];

function YesNoToggle({ value, onChange }) {
  return (
    <div className="toggle-group">
      <button type="button" className={`toggle-btn ${value === 'Yes' ? 'active-yes' : ''}`} onClick={() => onChange('Yes')}>Yes</button>
      <button type="button" className={`toggle-btn ${value === 'No' ? 'active-no' : ''}`} onClick={() => onChange('No')}>No</button>
    </div>
  );
}

export default function ClientProfile() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [bmi, setBmi] = useState(null);

  const [physical, setPhysical] = useState({ age: '', gender: 'Male', height: '', currentWeight: '', goalWeight: '' });
  const [questionnaire, setQuestionnaire] = useState({
    medicalDiagnosis: '', regularMedicine: '', pastMedicalHistory: '',
    medicalSurgery: '', workLifestyle: '', socialHabits: '',
    physicalActivityLevel: '', supplements: '', dietType: '',
    foodAllergy: '', foodAllergyDetails: '',
  });

  useEffect(() => {
    clientAPI.getMyProfile()
      .then(res => {
        if (res.data) {
          const p = res.data;
          setPhysical({ age: p.age || '', gender: p.gender || 'Male', height: p.height || '', currentWeight: p.currentWeight || '', goalWeight: p.goalWeight || '' });
          setQuestionnaire({
            medicalDiagnosis: p.medicalDiagnosis != null ? (p.medicalDiagnosis ? 'Yes' : 'No') : '',
            regularMedicine: p.regularMedicine != null ? (p.regularMedicine ? 'Yes' : 'No') : '',
            pastMedicalHistory: p.pastMedicalHistory != null ? (p.pastMedicalHistory ? 'Yes' : 'No') : '',
            medicalSurgery: p.medicalSurgery != null ? (p.medicalSurgery ? 'Yes' : 'No') : '',
            workLifestyle: p.workLifestyle || '', socialHabits: p.socialHabits || '',
            physicalActivityLevel: p.physicalActivityLevel || '',
            supplements: p.supplements != null ? (p.supplements ? 'Yes' : 'No') : '',
            dietType: p.dietType || '',
            foodAllergy: p.foodAllergy != null ? (p.foodAllergy ? 'Yes' : 'No') : '',
            foodAllergyDetails: p.foodAllergyDetails || '',
          });
          if (p.height && p.currentWeight) calcBMI(p.currentWeight, p.height);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const calcBMI = (weight, height) => {
    if (weight && height) {
      const h = parseFloat(height) / 100;
      const b = parseFloat(weight) / (h * h);
      setBmi(b.toFixed(1));
    }
  };

  const handlePhysicalChange = (field, val) => {
    const updated = { ...physical, [field]: val };
    setPhysical(updated);
    if (field === 'height' || field === 'currentWeight') {
      calcBMI(field === 'currentWeight' ? val : updated.currentWeight, field === 'height' ? val : updated.height);
    }
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    const b = parseFloat(bmi);
    if (b < 18.5) return { label: 'Underweight', color: '#F59E0B' };
    if (b < 25) return { label: 'Normal', color: '#22C55E' };
    if (b < 30) return { label: 'Overweight', color: '#F59E0B' };
    return { label: 'Obese', color: '#EF4444' };
  };

  const sendReset = async () => {
    setSendingReset(true);
    try {
      await authAPI.forgotPassword(user?.email);
      setResetSent(true);
      addToast('Password reset link sent to your email!', 'success');
    } catch {
      addToast('Failed to send reset link', 'error');
    } finally { setSendingReset(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const boolVal = (v) => v === 'Yes' ? true : v === 'No' ? false : null;
      await clientAPI.saveProfile({
        ...physical,
        age: physical.age ? parseInt(physical.age) : null,
        height: physical.height ? parseFloat(physical.height) : null,
        currentWeight: physical.currentWeight ? parseFloat(physical.currentWeight) : null,
        goalWeight: physical.goalWeight ? parseFloat(physical.goalWeight) : null,
        medicalDiagnosis: boolVal(questionnaire.medicalDiagnosis),
        regularMedicine: boolVal(questionnaire.regularMedicine),
        pastMedicalHistory: boolVal(questionnaire.pastMedicalHistory),
        medicalSurgery: boolVal(questionnaire.medicalSurgery),
        supplements: boolVal(questionnaire.supplements),
        foodAllergy: boolVal(questionnaire.foodAllergy),
        workLifestyle: questionnaire.workLifestyle,
        socialHabits: questionnaire.socialHabits,
        physicalActivityLevel: questionnaire.physicalActivityLevel,
        dietType: questionnaire.dietType,
        foodAllergyDetails: questionnaire.foodAllergyDetails,
      });
      addToast('Profile saved successfully!', 'success');
    } catch {
      addToast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const bmiCat = getBMICategory(bmi);

  if (loading) return <div className="loading-spinner" />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Keep your health information up to date</p>
      </div>

      <form onSubmit={handleSave}>
        {/* Physical Info */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, background: '#DBEAFE', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color="#2563EB" />
            </div>
            <h3 className="section-title" style={{ margin: 0 }}>Physical Information</h3>
          </div>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Age</label>
              <input className="form-input" type="number" placeholder="e.g. 25" value={physical.age} onChange={e => handlePhysicalChange('age', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-input" value={physical.gender} onChange={e => handlePhysicalChange('gender', e.target.value)}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input className="form-input" type="number" placeholder="e.g. 170" value={physical.height} onChange={e => handlePhysicalChange('height', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Current Weight (kg)</label>
              <input className="form-input" type="number" step="0.1" placeholder="e.g. 70.5" value={physical.currentWeight} onChange={e => handlePhysicalChange('currentWeight', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Goal Weight (kg)</label>
              <input className="form-input" type="number" step="0.1" placeholder="e.g. 65" value={physical.goalWeight} onChange={e => handlePhysicalChange('goalWeight', e.target.value)} />
            </div>
            {bmi && bmiCat && (
              <div className="form-group">
                <label className="form-label">BMI</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 8, background: 'var(--bg)' }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: bmiCat.color }}>{bmi}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: bmiCat.color }}>{bmiCat.label}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Health Questionnaire */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, background: '#DCFCE7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={18} color="#22C55E" />
            </div>
            <h3 className="section-title" style={{ margin: 0 }}>Health Questionnaire</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {TOGGLE_FIELDS.map(field => (
              <div key={field.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{field.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{field.desc}</div>
                  </div>
                  <YesNoToggle value={questionnaire[field.key]} onChange={val => setQuestionnaire(q => ({ ...q, [field.key]: val }))} />
                </div>
                {field.key === 'foodAllergy' && questionnaire.foodAllergy === 'Yes' && (
                  <div style={{ marginTop: 10 }}>
                    <input className="form-input" placeholder="Describe your food allergies..." value={questionnaire.foodAllergyDetails} onChange={e => setQuestionnaire(q => ({ ...q, foodAllergyDetails: e.target.value }))} />
                  </div>
                )}
                <div style={{ marginTop: 12, height: 1, background: 'var(--border)' }} />
              </div>
            ))}

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Work Lifestyle</label>
                <select className="form-input" value={questionnaire.workLifestyle} onChange={e => setQuestionnaire(q => ({ ...q, workLifestyle: e.target.value }))}>
                  <option value="">Select...</option>
                  <option>Sedentary</option><option>Lightly Active</option><option>Moderately Active</option><option>Very Active</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Physical Activity Level</label>
                <select className="form-input" value={questionnaire.physicalActivityLevel} onChange={e => setQuestionnaire(q => ({ ...q, physicalActivityLevel: e.target.value }))}>
                  <option value="">Select...</option>
                  <option>None</option><option>Light (1-2x/week)</option><option>Moderate (3-4x/week)</option><option>Heavy (5+/week)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Diet Type</label>
                <select className="form-input" value={questionnaire.dietType} onChange={e => setQuestionnaire(q => ({ ...q, dietType: e.target.value }))}>
                  <option value="">Select...</option>
                  <option>Vegetarian</option><option>Vegan</option><option>Non-Vegetarian</option><option>Eggetarian</option><option>Jain</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Social Habits</label>
                <select className="form-input" value={questionnaire.socialHabits} onChange={e => setQuestionnaire(q => ({ ...q, socialHabits: e.target.value }))}>
                  <option value="">Select...</option>
                  <option>None</option><option>Smoker</option><option>Occasional Drinker</option><option>Regular Drinker</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary btn-lg" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Save size={17} /> {saving ? 'Saving...' : 'Save Profile'}
        </button>
        <button type="button" onClick={sendReset} disabled={sendingReset || resetSent} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mail size={16} /> {resetSent ? '✓ Reset link sent!' : sendingReset ? 'Sending...' : 'Send Password Reset Link'}
        </button>
        </div>
      </form>
    </div>
  );
}
