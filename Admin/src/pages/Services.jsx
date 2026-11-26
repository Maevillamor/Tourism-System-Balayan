
import { useEffect, useMemo, useState } from 'react';
import {
  getServices,
  createService,
  updateService,
  changeServiceStatus,
  getBlockedDates,
  createBlockedDate,
  deleteBlockedDate,
} from '../api';

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const emptyForm = {
  name: '',
  operating_days: [1, 2, 3, 4, 5, 6],
  open_time: '08:00',
  close_time: '17:00',
  slot_minutes: 60,
  capacity: 10,
  break_start: '',
  break_end: '',
  active: 1,
};

function getErrorMessage(error) {
  if (error?.errors) {
    if (Array.isArray(error.errors)) {
      return error.errors.map((item) => item.message || item).join(', ');
    }
    return typeof error.errors === 'string'
      ? error.errors
      : JSON.stringify(error.errors);
  }

  return error?.message || 'Something went wrong.';
}

function formatDays(days) {
  if (!days?.length) return 'No operating days';

  return days
    .map((day) => DAYS.find((item) => item.value === Number(day))?.label)
    .filter(Boolean)
    .join(', ');
}

function normalizeService(service) {
  let days = service.operating_days;

  if (typeof days === 'string') {
    try {
      days = JSON.parse(days);
    } catch {
      days = days.split(',').map(Number);
    }
  }

  return {
    ...service,
    operating_days: Array.isArray(days) ? days.map(Number) : [],
  };
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [blockedServiceId, setBlockedServiceId] = useState('');
  const [blockedDate, setBlockedDate] = useState('');
  const [blockedLabel, setBlockedLabel] = useState('');
  const [addingBlocked, setAddingBlocked] = useState(false);

  const activeCount = useMemo(
    () => services.filter((service) => Number(service.active) === 1).length,
    [services]
  );

  async function loadServices() {
    const data = await getServices();
    setServices((Array.isArray(data) ? data : []).map(normalizeService));
  }

  async function loadBlockedDates(serviceId = blockedServiceId) {
    const data = await getBlockedDates(serviceId);
    setBlockedDates(Array.isArray(data) ? data : []);
  }

  async function loadPage() {
    setLoading(true);
    setError('');

    try {
      await Promise.all([loadServices(), loadBlockedDates('')]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyForm, operating_days: [...emptyForm.operating_days] });
    setError('');
    setNotice('');
    setShowForm(true);
  }

  function openEditForm(service) {
    setEditingId(service.id);
    setForm({
      name: service.name || '',
      operating_days: service.operating_days || [],
      open_time: String(service.open_time || '').slice(0, 5),
      close_time: String(service.close_time || '').slice(0, 5),
      slot_minutes: service.slot_minutes ?? 60,
      capacity: service.capacity ?? 10,
      break_start: service.break_start
        ? String(service.break_start).slice(0, 5)
        : '',
      break_end: service.break_end
        ? String(service.break_end).slice(0, 5)
        : '',
      active: Number(service.active) === 1 ? 1 : 0,
    });
    setError('');
    setNotice('');
    setShowForm(true);
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleDay(day) {
    setForm((current) => {
      const exists = current.operating_days.includes(day);

      return {
        ...current,
        operating_days: exists
          ? current.operating_days.filter((item) => item !== day)
          : [...current.operating_days, day].sort((a, b) => a - b),
      };
    });
  }

  async function handleSave(event) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!form.name.trim()) {
      setError('Please enter a service name.');
      return;
    }

    if (form.operating_days.length === 0) {
      setError('Please select at least one operating day.');
      return;
    }

    if (form.break_start && !form.break_end) {
      setError('Please enter the end time of the break.');
      return;
    }

    if (!form.break_start && form.break_end) {
      setError('Please enter the start time of the break.');
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      slot_minutes: Number(form.slot_minutes),
      capacity: Number(form.capacity),
      operating_days: [...form.operating_days].sort((a, b) => a - b),
      break_start: form.break_start || null,
      break_end: form.break_end || null,
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateService(editingId, payload);
        setNotice('Service updated successfully.');
      } else {
        await createService(payload);
        setNotice('Service created successfully.');
      }

      setShowForm(false);
      await loadServices();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(service) {
    const nextStatus = Number(service.active) === 1 ? 0 : 1;
    const action = nextStatus ? 'activate' : 'deactivate';

    if (!window.confirm(`Are you sure you want to ${action} "${service.name}"?`)) {
      return;
    }

    setError('');
    setNotice('');

    try {
      await changeServiceStatus(service.id, nextStatus);
      await loadServices();
      setNotice(`Service ${nextStatus ? 'activated' : 'deactivated'} successfully.`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleAddBlockedDate(event) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!blockedServiceId || !blockedDate) {
      setError('Please select a service and blocked date.');
      return;
    }

    setAddingBlocked(true);

    try {
      await createBlockedDate({
        service_id: Number(blockedServiceId),
        date: blockedDate,
        label: blockedLabel.trim(),
      });

      setBlockedDate('');
      setBlockedLabel('');
      await loadBlockedDates();
      setNotice('Blocked date added successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAddingBlocked(false);
    }
  }

  async function handleDeleteBlockedDate(item) {
    if (!window.confirm(`Remove blocked date ${item.date}?`)) return;

    setError('');
    setNotice('');

    try {
      await deleteBlockedDate(item.id);
      await loadBlockedDates();
      setNotice('Blocked date removed successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleBlockedFilter(value) {
    setBlockedServiceId(value);
    setError('');

    try {
      await loadBlockedDates(value);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="services-page">
      <div className="services-heading">
        <div>
          <h1>Services &amp; Availability</h1>
          <p className="sub">
            Manage bookable services, operating hours, capacity, and blocked dates.
          </p>
        </div>

        <button className="services-primary-btn" onClick={openAddForm}>
          + Add Service
        </button>
      </div>

      {error && <div className="services-alert error">{error}</div>}
      {notice && <div className="services-alert success">{notice}</div>}

      <div className="services-summary">
        <div className="services-summary-card">
          <span>Total Services</span>
          <strong>{services.length}</strong>
        </div>
        <div className="services-summary-card">
          <span>Active Services</span>
          <strong>{activeCount}</strong>
        </div>
        <div className="services-summary-card">
          <span>Inactive Services</span>
          <strong>{services.length - activeCount}</strong>
        </div>
      </div>

      {showForm && (
        <section className="services-form-card">
          <div className="services-section-heading">
            <div>
              <h2>{editingId ? 'Edit Service' : 'Add New Service'}</h2>
              <p>Set the service schedule and booking capacity.</p>
            </div>
            <button
              type="button"
              className="services-close-btn"
              onClick={() => setShowForm(false)}
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSave}>
            <div className="services-form-grid">
              <label className="services-field full">
                Service Name
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Beach Tour"
                  maxLength={100}
                  required
                />
              </label>

              <div className="services-field full">
                <span>Operating Days</span>
                <div className="services-days">
                  {DAYS.map((day) => (
                    <label key={day.value} className="services-day-option">
                      <input
                        type="checkbox"
                        checked={form.operating_days.includes(day.value)}
                        onChange={() => toggleDay(day.value)}
                      />
                      {day.label.slice(0, 3)}
                    </label>
                  ))}
                </div>
              </div>

              <label className="services-field">
                Opening Time
                <input
                  type="time"
                  value={form.open_time}
                  onChange={(e) => updateField('open_time', e.target.value)}
                  required
                />
              </label>

              <label className="services-field">
                Closing Time
                <input
                  type="time"
                  value={form.close_time}
                  onChange={(e) => updateField('close_time', e.target.value)}
                  required
                />
              </label>

              <label className="services-field">
                Appointment Duration (minutes)
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={form.slot_minutes}
                  onChange={(e) => updateField('slot_minutes', e.target.value)}
                  required
                />
              </label>

              <label className="services-field">
                Slot Capacity
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => updateField('capacity', e.target.value)}
                  required
                />
              </label>

              <label className="services-field">
                Break Start <small>(Optional)</small>
                <input
                  type="time"
                  value={form.break_start}
                  onChange={(e) => updateField('break_start', e.target.value)}
                />
              </label>

              <label className="services-field">
                Break End <small>(Optional)</small>
                <input
                  type="time"
                  value={form.break_end}
                  onChange={(e) => updateField('break_end', e.target.value)}
                />
              </label>

              <label className="services-field">
                Initial Status
                <select
                  value={form.active}
                  onChange={(e) => updateField('active', Number(e.target.value))}
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </label>
            </div>

            <div className="services-form-actions">
              <button
                type="button"
                className="services-secondary-btn"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="services-primary-btn"
                disabled={saving}
              >
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Service'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="services-list-card">
        <div className="services-section-heading">
          <div>
            <h2>Service List</h2>
            <p>All services configured in the tourism system.</p>
          </div>
        </div>

        {loading ? (
          <div className="services-empty">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="services-empty">
            No services found. Click “Add Service” to create one.
          </div>
        ) : (
          <div className="services-table-scroll">
            <table className="services-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Operating Days</th>
                  <th>Hours</th>
                  <th>Duration</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td><strong>{service.name}</strong></td>
                    <td>{formatDays(service.operating_days)}</td>
                    <td>
                      {String(service.open_time).slice(0, 5)} –{' '}
                      {String(service.close_time).slice(0, 5)}
                    </td>
                    <td>{service.slot_minutes} min</td>
                    <td>{service.capacity}</td>
                    <td>
                      <span
                        className={`services-status ${
                          Number(service.active) === 1 ? 'active' : 'inactive'
                        }`}
                      >
                        {Number(service.active) === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="services-row-actions">
                        <button
                          type="button"
                          onClick={() => openEditForm(service)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={Number(service.active) === 1 ? 'deactivate' : 'activate'}
                          onClick={() => handleStatusChange(service)}
                        >
                          {Number(service.active) === 1 ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="services-blocked-card">
        <div className="services-section-heading">
          <div>
            <h2>Blocked Dates</h2>
            <p>Prevent bookings on selected dates for a specific service.</p>
          </div>
        </div>

        <form className="services-blocked-form" onSubmit={handleAddBlockedDate}>
          <label className="services-field">
            Service
            <select
              value={blockedServiceId}
              onChange={(e) => setBlockedServiceId(e.target.value)}
              required
            >
              <option value="">Select service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>

          <label className="services-field">
            Date
            <input
              type="date"
              value={blockedDate}
              onChange={(e) => setBlockedDate(e.target.value)}
              required
            />
          </label>

          <label className="services-field">
            Reason / Label <small>(Optional)</small>
            <input
              type="text"
              value={blockedLabel}
              onChange={(e) => setBlockedLabel(e.target.value)}
              placeholder="e.g. Maintenance"
              maxLength={60}
            />
          </label>

          <button
            type="submit"
            className="services-primary-btn"
            disabled={addingBlocked}
          >
            {addingBlocked ? 'Adding...' : 'Add Blocked Date'}
          </button>
        </form>

        <div className="services-blocked-filter">
          <label className="services-field">
            Filter by Service
            <select
              value={blockedServiceId}
              onChange={(e) => handleBlockedFilter(e.target.value)}
            >
              <option value="">All Services</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {blockedDates.length === 0 ? (
          <div className="services-empty">No blocked dates found.</div>
        ) : (
          <div className="services-blocked-list">
            {blockedDates.map((item) => (
              <div className="services-blocked-item" key={item.id}>
                <div>
                  <strong>{item.date}</strong>
                  <span>{item.service_name || 'Service'}</span>
                  {item.label && <small>{item.label}</small>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteBlockedDate(item)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
