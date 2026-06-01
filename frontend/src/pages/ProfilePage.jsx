import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { API, apiFetch } from '../api.js';

const PET_TYPE_OPTIONS = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'bird', label: 'Bird' },
  { value: 'rabbit', label: 'Rabbit' },
  { value: 'reptile', label: 'Reptile' },
  { value: 'other', label: 'Other' },
];

const MODE_OPTIONS = [
  {
    value: 'owner',
    label: 'Pet owner',
    hint: 'I need someone to care for my animals',
  },
  {
    value: 'caregiver',
    label: 'Caregiver',
    hint: 'I offer pet or plant care services',
  },
  {
    value: 'both',
    label: 'Both',
    hint: 'I book care and I also offer services',
  },
];

function petTypeLabel(value) {
  return PET_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function careTypeLabel(type) {
  const labels = { pet: 'Pet care', plant: 'Plant care', both: 'Pet & plant care' };
  return labels[type] ?? type;
}

function profileToFormState(profile) {
  if (!profile) {
    return {
      careType: 'pet',
      petTypes: ['dog', 'cat'],
      availability: '',
      availabilityStart: '',
      availabilityEnd: '',
      location: '',
      pricePerHour: '15',
    };
  }

  return {
    careType: profile.type,
    petTypes: profile.petTypes ?? [],
    availability: profile.availability ?? '',
    availabilityStart: '',
    availabilityEnd: '',
    location: profile.location ?? '',
    pricePerHour: String(profile.pricePerHour ?? 15),
  };
}

function needsCaregiverDetails(mode) {
  return mode === 'caregiver' || mode === 'both';
}

export default function ProfilePage({
  authUser,
  accountMode,
  sitterProfile,
  onProfileChange,
  onNavigate,
}) {
  const hasProfile = Boolean(sitterProfile);
  const [mode, setMode] = useState(accountMode || 'owner');
  const [editingCaregiver, setEditingCaregiver] = useState(
    needsCaregiverDetails(accountMode) && !hasProfile
  );
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(() => profileToFormState(sitterProfile));

  useEffect(() => {
    setMode(accountMode || 'owner');
    setForm(profileToFormState(sitterProfile));
    setEditingCaregiver(needsCaregiverDetails(accountMode) && !sitterProfile);
  }, [accountMode, sitterProfile]);

  function togglePetType(value) {
    setForm((current) => ({
      ...current,
      petTypes: current.petTypes.includes(value)
        ? current.petTypes.filter((item) => item !== value)
        : [...current.petTypes, value],
    }));
  }

  function formatDatetimeLocal(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }

  function buildCaregiverPayload() {
    const availabilityText = form.availabilityStart && form.availabilityEnd
      ? `From ${formatDatetimeLocal(form.availabilityStart)} to ${formatDatetimeLocal(form.availabilityEnd)}`
      : form.availability.trim();

    return {
      caregiverProfile: {
        careType: form.careType,
        petTypes: form.careType === 'plant' ? [] : form.petTypes,
        availability: availabilityText,
        location: form.location.trim(),
        pricePerHour: form.pricePerHour,
      },
    };
  }

  function validateCaregiverForm() {
    if (!form.availabilityStart || !form.availabilityEnd) {
      setMessage('Select both start and end availability dates for caregiver scheduling.');
      return false;
    }

    const start = new Date(form.availabilityStart);
    const end = new Date(form.availabilityEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setMessage('Availability end date must be after the start date.');
      return false;
    }

    if ((form.careType === 'pet' || form.careType === 'both') && form.petTypes.length === 0) {
      setMessage('Select at least one animal type you can care for.');
      return false;
    }
    return true;
  }

  async function handleSaveAll(event) {
    event.preventDefault();
    setMessage('');
    setIsSaving(true);

    try {
      const modeResponse = await apiFetch(API.accountMode, {
        method: 'PUT',
        body: JSON.stringify({ mode }),
      });

      if (!modeResponse.response.ok) {
        setMessage(modeResponse.data?.error || 'Could not save account type');
        return;
      }

      if (needsCaregiverDetails(mode)) {
        if (!validateCaregiverForm()) {
          return;
        }

        const profileResponse = await apiFetch(API.caregiverProfile, {
          method: hasProfile ? 'PUT' : 'POST',
          body: JSON.stringify(buildCaregiverPayload()),
        });

        if (!profileResponse.response.ok) {
          setMessage(profileResponse.data?.error || 'Could not save caregiver details');
          return;
        }
      }

      await onProfileChange();
      setEditingCaregiver(false);
      setMessage('Profile saved successfully');
    } catch {
      setMessage('Could not connect to the server.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteCaregiverProfile() {
    if (!window.confirm('Delete your caregiver listing? You will stay a pet owner.')) {
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      const { response, data } = await apiFetch(API.caregiverProfile, { method: 'DELETE' });

      if (!response.ok) {
        setMessage(data?.error || 'Could not delete caregiver profile');
        return;
      }

      setMode('owner');
      await onProfileChange();
      setEditingCaregiver(false);
      setMessage(data.message || 'Caregiver listing removed');
    } catch {
      setMessage('Could not connect to the server.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="status-card profile-page-card">
      <header className="profile-page-header">
        <button type="button" className="back-btn" onClick={() => onNavigate('dashboard')}>
          Back to dashboard
        </button>
        <div>
          <p className="kicker">Profile</p>
          <h1>My account</h1>
          <p className="hero-note">
            Choose if you are looking for care, offering care, or both. Caregivers add availability below.
          </p>
        </div>
      </header>

      <section className="panel profile-account-strip">
        <p>
          <strong>{authUser.name}</strong> · {authUser.email}
        </p>
      </section>

      <form onSubmit={handleSaveAll} className="auth-form profile-form">
        <fieldset className="account-mode-fieldset">
          <legend>What are you looking for?</legend>
          <div className="account-mode-grid">
            {MODE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={mode === option.value ? 'role-option active account-mode-option' : 'role-option account-mode-option'}
              >
                <input
                  type="radio"
                  name="accountMode"
                  value={option.value}
                  checked={mode === option.value}
                  onChange={() => setMode(option.value)}
                />
                <span className="account-mode-label">{option.label}</span>
                <span className="account-mode-hint">{option.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {needsCaregiverDetails(mode) && (
          <>
            {hasProfile && !editingCaregiver ? (
              <section className="panel caregiver-profile-panel">
                <h3>Your caregiver listing</h3>
                <ul className="caregiver-profile-details">
                  <li>
                    <strong>Services:</strong> {careTypeLabel(sitterProfile.type)}
                  </li>
                  {sitterProfile.petTypes?.length > 0 && (
                    <li>
                      <strong>I care for:</strong>{' '}
                      {sitterProfile.petTypes.map((value) => petTypeLabel(value)).join(', ')}
                    </li>
                  )}
                  <li>
                    <strong>Free time:</strong> {sitterProfile.availability}
                  </li>
                  <li>
                    <strong>Area:</strong> {sitterProfile.location}
                  </li>
                  <li>
                    <strong>Rate:</strong> ${sitterProfile.pricePerHour}/hr
                  </li>
                </ul>
                <div className="profile-actions">
                  <button type="button" className="secondary-btn" onClick={() => setEditingCaregiver(true)}>
                    Edit caregiver details
                  </button>
                  <button type="button" className="secondary-btn" onClick={handleDeleteCaregiverProfile} disabled={isSaving}>
                    Remove caregiver listing
                  </button>
                </div>
              </section>
            ) : (
              <fieldset className="caregiver-register-fields">
                <legend>Caregiver details</legend>

                <label>
                  Care you provide
                  <select
                    value={form.careType}
                    onChange={(e) => setForm((current) => ({ ...current, careType: e.target.value }))}
                  >
                    <option value="pet">Pet care</option>
                    <option value="plant">Plant care</option>
                    <option value="both">Pet and plant care</option>
                  </select>
                </label>

                {(form.careType === 'pet' || form.careType === 'both') && (
                  <div className="pet-type-checkboxes">
                    <span className="field-label">What I can care for</span>
                    <div className="checkbox-row">
                      {PET_TYPE_OPTIONS.map((option) => (
                        <label key={option.value} className="checkbox-option">
                          <input
                            type="checkbox"
                            checked={form.petTypes.includes(option.value)}
                            onChange={() => togglePetType(option.value)}
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <label>
                  Available from
                  <input
                    type="datetime-local"
                    value={form.availabilityStart}
                    onChange={(e) => setForm((current) => ({ ...current, availabilityStart: e.target.value }))}
                    required
                  />
                </label>

                <label>
                  Available until
                  <input
                    type="datetime-local"
                    value={form.availabilityEnd}
                    onChange={(e) => setForm((current) => ({ ...current, availabilityEnd: e.target.value }))}
                    required
                  />
                </label>

                <label>
                  Service area
                  <input
                    value={form.location}
                    onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))}
                    placeholder="e.g. Downtown"
                  />
                </label>

                <label>
                  Hourly rate (USD)
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.pricePerHour}
                    onChange={(e) => setForm((current) => ({ ...current, pricePerHour: e.target.value }))}
                  />
                </label>

                {hasProfile && (
                  <button type="button" className="secondary-btn" onClick={() => setEditingCaregiver(false)}>
                    Cancel edit
                  </button>
                )}
              </fieldset>
            )}
          </>
        )}

        {mode === 'owner' && (
          <p className="hero-note">
            As a pet owner you can book sitters from the dashboard. No caregiver listing is required.
          </p>
        )}

        <button type="submit" className="action-btn" disabled={isSaving}>
          Save profile
        </button>
      </form>

      {message && <p className="auth-feedback">{message}</p>}
    </article>
  );
}

ProfilePage.propTypes = {
  authUser: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
  }).isRequired,
  accountMode: PropTypes.string,
  sitterProfile: PropTypes.object,
  onProfileChange: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
};
