import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { API, apiFetch } from '../api.js';
import { PET_TYPE_OPTIONS, PLANT_TYPE_OPTIONS, petTypeLabel, plantTypeLabel } from '../careOptions.js';

const MODE_OPTIONS = [
  {
    value: 'owner',
    label: 'Pet & plant owner',
    hint: 'I need someone to care for my animals and plants',
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

function needsOwnerDetails(mode) {
  return mode === 'owner' || mode === 'both';
}

function ownerCareToFormState(ownerCare) {
  return {
    petType: ownerCare?.petType ?? '',
    plantType: ownerCare?.plantType ?? '',
    mealsPerDay: ownerCare?.mealsPerDay != null ? String(ownerCare.mealsPerDay) : '',
    wateringSchedule: ownerCare?.wateringSchedule ?? '',
    wateringAmount: ownerCare?.wateringAmount ?? '',
    careNotes: ownerCare?.careNotes ?? '',
  };
}

export default function ProfilePage({
  authUser,
  accountMode,
  sitterProfile,
  ownerCare,
  onProfileChange,
  onNavigate,
}) {
  const hasProfile = Boolean(sitterProfile);
  const [mode, setMode] = useState(accountMode || 'owner');
  const [editingCaregiver, setEditingCaregiver] = useState(
    needsCaregiverDetails(accountMode) && !hasProfile
  );
  const [feedback, setFeedback] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  function showError(text) {
    setFeedback({ type: 'error', text });
  }

  function showSuccess(text) {
    setFeedback({ type: 'success', text });
  }
  const [form, setForm] = useState(() => profileToFormState(sitterProfile));
  const [ownerForm, setOwnerForm] = useState(() => ownerCareToFormState(ownerCare));

  useEffect(() => {
    setMode(accountMode || 'owner');
    setForm(profileToFormState(sitterProfile));
    setOwnerForm(ownerCareToFormState(ownerCare));
    setEditingCaregiver(needsCaregiverDetails(accountMode) && !sitterProfile);
  }, [accountMode, sitterProfile, ownerCare]);

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

  function validateOwnerForm() {
    const hasPet = Boolean(ownerForm.petType || ownerForm.mealsPerDay);
    const hasPlant = Boolean(
      ownerForm.plantType || ownerForm.wateringSchedule || ownerForm.wateringAmount
    );

    if (!hasPet && !hasPlant) {
      showError('Tell us about your pet, your plants, or both (type and care instructions).');
      return false;
    }

    if (hasPet) {
      if (!ownerForm.petType) {
        showError('Select what type of pet you have.');
        return false;
      }
      const meals = Number.parseInt(ownerForm.mealsPerDay, 10);
      if (!Number.isFinite(meals) || meals < 1 || meals > 12) {
        showError('Enter meals per day for your pet (1–12).');
        return false;
      }
    }

    if (hasPlant) {
      if (!ownerForm.plantType) {
        showError('Select what type of plants you have.');
        return false;
      }
      if (!ownerForm.wateringSchedule.trim()) {
        showError('Describe when to water your plants.');
        return false;
      }
      if (!ownerForm.wateringAmount.trim()) {
        showError('Describe how much water to use for your plants.');
        return false;
      }
    }

    return true;
  }

  function buildOwnerCarePayload() {
    return {
      ownerCare: {
        petType: ownerForm.petType || null,
        plantType: ownerForm.plantType || null,
        mealsPerDay: ownerForm.mealsPerDay || null,
        wateringSchedule: ownerForm.wateringSchedule.trim() || null,
        wateringAmount: ownerForm.wateringAmount.trim() || null,
        careNotes: ownerForm.careNotes.trim() || null,
      },
    };
  }

  function validateCaregiverForm() {
    if (!form.availabilityStart || !form.availabilityEnd) {
      showError('Select both start and end availability dates for caregiver scheduling.');
      return false;
    }

    const start = new Date(form.availabilityStart);
    const end = new Date(form.availabilityEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      showError('Availability end date must be after the start date.');
      return false;
    }

    if ((form.careType === 'pet' || form.careType === 'both') && form.petTypes.length === 0) {
      showError('Select at least one animal type you can care for.');
      return false;
    }
    return true;
  }

  async function handleSaveAll(event) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    const updatingCaregiverListing =
      needsCaregiverDetails(mode) && (editingCaregiver || !hasProfile);

    try {
      if (needsOwnerDetails(mode) && !validateOwnerForm()) {
        return;
      }

      if (updatingCaregiverListing && !validateCaregiverForm()) {
        return;
      }

      const modeResponse = await apiFetch(API.accountMode, {
        method: 'PUT',
        body: JSON.stringify({ mode }),
      });

      if (!modeResponse.response.ok) {
        showError(modeResponse.data?.error || 'Could not save account type');
        return;
      }

      const savedParts = ['Account type'];

      if (needsOwnerDetails(mode)) {
        const ownerResponse = await apiFetch(API.ownerCare, {
          method: 'PUT',
          body: JSON.stringify(buildOwnerCarePayload()),
        });

        if (!ownerResponse.response.ok) {
          showError(ownerResponse.data?.error || 'Could not save your pet/plant details');
          return;
        }
        savedParts.push('Pet & plant details');
      }

      if (updatingCaregiverListing) {
        const profileResponse = await apiFetch(API.caregiverProfile, {
          method: hasProfile ? 'PUT' : 'POST',
          body: JSON.stringify(buildCaregiverPayload()),
        });

        if (!profileResponse.response.ok) {
          showError(profileResponse.data?.error || 'Could not save caregiver details');
          return;
        }
        savedParts.push('Caregiver listing');
      }

      await onProfileChange();
      setEditingCaregiver(false);
      showSuccess(
        savedParts.length > 1
          ? `Profile saved successfully (${savedParts.join(', ')}).`
          : 'Profile saved successfully.'
      );
    } catch {
      showError('Could not connect to the server.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteCaregiverProfile() {
    if (!window.confirm('Delete your caregiver listing? You will stay a pet & plant owner.')) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const { response, data } = await apiFetch(API.caregiverProfile, { method: 'DELETE' });

      if (!response.ok) {
        showError(data?.error || 'Could not delete caregiver profile');
        return;
      }

      setMode('owner');
      await onProfileChange();
      setEditingCaregiver(false);
      showSuccess(data.message || 'Caregiver listing removed.');
    } catch {
      showError('Could not connect to the server.');
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

        {needsOwnerDetails(mode) && (
          <fieldset className="owner-care-fieldset">
            <legend>Your pets and plants</legend>
            <p className="hero-note">
              These details appear on your care requests so sitters know what you have and how to care for them.
            </p>

            <div className="owner-care-block">
              <h3 className="owner-care-heading">Pet at home</h3>
              <label>
                Animal type
                <select
                  value={ownerForm.petType}
                  onChange={(e) => setOwnerForm((current) => ({ ...current, petType: e.target.value }))}
                >
                  <option value="">No pet / skip</option>
                  {PET_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {ownerForm.petType && (
                <label>
                  Meals per day
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={ownerForm.mealsPerDay}
                    onChange={(e) => setOwnerForm((current) => ({ ...current, mealsPerDay: e.target.value }))}
                    placeholder="e.g. 2"
                    required
                  />
                </label>
              )}
            </div>

            <div className="owner-care-block">
              <h3 className="owner-care-heading">Plants at home</h3>
              <label>
                Plant type
                <select
                  value={ownerForm.plantType}
                  onChange={(e) => setOwnerForm((current) => ({ ...current, plantType: e.target.value }))}
                >
                  <option value="">No plants / skip</option>
                  {PLANT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {ownerForm.plantType && (
                <>
                  <label>
                    When to water
                    <input
                      value={ownerForm.wateringSchedule}
                      onChange={(e) =>
                        setOwnerForm((current) => ({ ...current, wateringSchedule: e.target.value }))
                      }
                      placeholder="e.g. Every 3 days, Mon & Thu mornings"
                      required
                    />
                  </label>
                  <label>
                    How much water
                    <input
                      value={ownerForm.wateringAmount}
                      onChange={(e) =>
                        setOwnerForm((current) => ({ ...current, wateringAmount: e.target.value }))
                      }
                      placeholder="e.g. 200 ml per pot until soil is moist"
                      required
                    />
                  </label>
                </>
              )}
            </div>

            <label>
              Extra care notes (optional)
              <textarea
                rows={3}
                value={ownerForm.careNotes}
                onChange={(e) => setOwnerForm((current) => ({ ...current, careNotes: e.target.value }))}
                placeholder="Allergies, food brand, plant locations, etc."
              />
            </label>

            {(ownerCare?.petType || ownerCare?.plantType) && (
              <p className="hero-note owner-care-summary">
                Saved:{' '}
                {ownerCare.petType ? `${petTypeLabel(ownerCare.petType)}, ${ownerCare.mealsPerDay} meal(s)/day` : ''}
                {ownerCare.petType && ownerCare.plantType ? ' · ' : ''}
                {ownerCare.plantType
                  ? `${plantTypeLabel(ownerCare.plantType)} — ${ownerCare.wateringSchedule}`
                  : ''}
              </p>
            )}
          </fieldset>
        )}

        {feedback && (
          <p
            className={
              feedback.type === 'success'
                ? 'profile-feedback profile-feedback-success'
                : 'profile-feedback profile-feedback-error'
            }
            role="status"
          >
            {feedback.text}
          </p>
        )}

        <button type="submit" className="action-btn" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
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
  ownerCare: PropTypes.object,
  onProfileChange: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
};
