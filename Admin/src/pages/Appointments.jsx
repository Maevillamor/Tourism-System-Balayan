
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAppointments,
  confirmAppointment,
  declineAppointment,
} from '../api.js';

const STATUSES = [
  'All',
  'Pending',
  'Confirmed',
  'Rescheduled',
  'Declined',
  'Cancelled',
];

const PAGE_SIZE = 7;

const getValidDate = (value) => {
  if (!value) return null;

  const match = String(value)
    .slice(0, 10)
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    year < 1000 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

const formatDate = (value) => {
  const date = getValidDate(value);

  if (!date) return 'Date unavailable';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

const shortDate = (value) => {
  const date = getValidDate(value);

  if (!date) return '—';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

const formatTime = (value) => {
  if (!value) return '—';

  const match = String(value)
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (!match) return value;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return value;

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [service, setService] = useState('');
  const [status, setStatus] = useState('All');
  const [remarks, setRemarks] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAppointments();
      const records = Array.isArray(data) ? data : [];

      setAppointments(records);

      setSelectedId((previous) =>
        records.some((item) => item.id === previous)
          ? previous
          : records[0]?.id ?? null
      );
    } catch (e) {
      setError(e.message || 'Unable to load appointments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const counts = useMemo(() => ({
    All: appointments.length,
    Pending: appointments.filter((a) => a.status === 'Pending').length,
    Confirmed: appointments.filter((a) => a.status === 'Confirmed').length,
    Rescheduled: appointments.filter((a) => a.status === 'Rescheduled').length,
    Declined: appointments.filter((a) => a.status === 'Declined').length,
    Cancelled: appointments.filter((a) => a.status === 'Cancelled').length,
  }), [appointments]);

  const services = useMemo(
    () => [
      ...new Set(
        appointments.map((a) => a.service_name).filter(Boolean)
      ),
    ],
    [appointments]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return appointments.filter((item) => {
      const matchesSearch =
        !term ||
        [item.reference, item.full_name, item.email, item.mobile]
          .some((value) =>
            String(value || '').toLowerCase().includes(term)
          );

      const matchesDate =
        !date || String(item.date || '').slice(0, 10) === date;

      const matchesService =
        !service || item.service_name === service;

      const matchesStatus =
        status === 'All' || item.status === status;

      return (
        matchesSearch &&
        matchesDate &&
        matchesService &&
        matchesStatus
      );
    });
  }, [appointments, search, date, service, status]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  const pageItems = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const selected =
    filtered.find((item) => item.id === selectedId) ||
    pageItems[0] ||
    null;

  useEffect(() => {
    if (selected && selected.id !== selectedId) {
      setSelectedId(selected.id);
    }
  }, [selected, selectedId]);

  useEffect(() => {
    setPage(1);
  }, [search, date, service, status]);

  const handleConfirm = async () => {
    if (!selected || selected.status !== 'Pending') return;

    if (
      !window.confirm(
        `Confirm appointment ${selected.reference}?`
      )
    ) {
      return;
    }

    setActionLoading(true);
    setError('');
    setNotice('');

    try {
      const result = await confirmAppointment(selected.reference);

      setNotice(
        result.message || 'Appointment confirmed successfully.'
      );

      await loadAppointments();
    } catch (e) {
      setError(e.message || 'Unable to confirm appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!selected || selected.status !== 'Pending') return;

    if (!remarks.trim()) {
      setError('Please provide remarks before declining.');
      return;
    }

    if (
      !window.confirm(
        `Decline appointment ${selected.reference}?`
      )
    ) {
      return;
    }

    setActionLoading(true);
    setError('');
    setNotice('');

    try {
      const result = await declineAppointment(
        selected.reference,
        remarks.trim()
      );

      setNotice(
        result.message || 'Appointment declined successfully.'
      );

      setRemarks('');
      await loadAppointments();
    } catch (e) {
      setError(e.message || 'Unable to decline appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  const chooseStatus = (value) => {
    setStatus(value);
    setPage(1);
    setNotice('');
  };

  return (
    <>
      <div className="requests-title">
        <div>
          <h1>Appointment requests</h1>
          <p className="sub">
            Review, confirm, decline or reschedule what visitors have requested.
          </p>
        </div>

        <button
          type="button"
          className="btn"
          onClick={loadAppointments}
          disabled={loading || actionLoading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="requests-filters">
        <label className="request-filter search-filter">
          Search
          <input
            type="search"
            placeholder="Reference number or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <label className="request-filter">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label className="request-filter">
          Service
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="">All services</option>
            {services.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="request-filter">
          Status
          <select
            value={status}
            onChange={(e) => chooseStatus(e.target.value)}
          >
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item === 'All' ? 'All statuses' : item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="request-status-tabs">
        {STATUSES.map((item) => (
          <button
            type="button"
            key={item}
            className={`request-tab ${status === item ? 'active' : ''} tab-${item.toLowerCase()}`}
            onClick={() => chooseStatus(item)}
          >
            {item} <span>{counts[item]}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="request-notice" role="status">
          {notice}
        </div>
      )}

      <div className="requests-layout">
        <section className="request-table-card">
          <div className="request-table-scroll">
            <table className="request-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Visitor</th>
                  <th>Service</th>
                  <th>Requested schedule</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="request-empty">
                      Loading appointment records...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="request-empty">
                      No appointment requests found.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item) => (
                    <tr
                      key={item.id}
                      className={
                        selected?.id === item.id ? 'selected-row' : ''
                      }
                      onClick={() => {
                        setSelectedId(item.id);
                        setRemarks('');
                        setError('');
                      }}
                    >
                      <td>
                        <strong>{item.reference}</strong>
                      </td>

                      <td>
                        <strong>{item.full_name}</strong>
                        <small>{item.visitor_type}</small>
                      </td>

                      <td>{item.service_name}</td>

                      <td>
                        {shortDate(item.date)}
                        <span className="request-time">
                          {formatTime(item.time)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`request-status status-${String(item.status).toLowerCase()}`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="request-pagination">
            <span>
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
              –{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} requests
            </span>

            <div>
              <button
                type="button"
                className="btn"
                disabled={page <= 1}
                onClick={() =>
                  setPage((p) => Math.max(1, p - 1))
                }
              >
                Previous
              </button>

              <button
                type="button"
                className="btn"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <aside className="selected-request-card">
          {!selected ? (
            <div className="request-empty">
              Select an appointment to view its details.
            </div>
          ) : (
            <>
              <div className="selected-request-heading">
                <div>
                  <span className="detail-label">
                    Selected request
                  </span>
                  <h2>{selected.reference}</h2>
                </div>

                <span
                  className={`request-status status-${String(selected.status).toLowerCase()}`}
                >
                  {selected.status}
                </span>
              </div>

              <div className="request-detail">
                <span className="detail-label">Visitor</span>
                <strong>
                  {selected.full_name} · {selected.visitor_type}
                </strong>
              </div>

              <div className="request-detail">
                <span className="detail-label">Contact</span>
                <strong>
                  {selected.mobile || 'No mobile number'}
                </strong>
                <span>
                  {selected.email || 'No email address'}
                </span>
              </div>

              <div className="request-detail">
                <span className="detail-label">
                  Requested schedule
                </span>
                <strong>
                  {formatDate(selected.date)} · {formatTime(selected.time)}
                </strong>
              </div>

              <div className="request-detail">
                <span className="detail-label">Service</span>
                <strong>{selected.service_name}</strong>
              </div>

              <div className="request-detail">
                <span className="detail-label">
                  Purpose of visit
                </span>
                <p>
                  {selected.purpose || 'No purpose provided.'}
                </p>
              </div>

              <div className="request-slot-note">
                Slot capacity information is not currently provided by the appointment list API.
              </div>

              {selected.status === 'Pending' ? (
                <>
                  <label className="remarks-field">
                    Remarks (required when declining)
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Visible to the visitor"
                      rows="3"
                    />
                  </label>

                  <div className="request-actions">
                    <button
                      type="button"
                      className="btn confirm-action"
                      onClick={handleConfirm}
                      disabled={actionLoading}
                    >
                      {actionLoading
                        ? 'Processing...'
                        : 'Confirm appointment'}
                    </button>

                    <button
                      type="button"
                      className="btn reschedule-action"
                      disabled
                      title="Reschedule API is not available in the current Admin API."
                    >
                      Reschedule
                    </button>

                    <button
                      type="button"
                      className="btn decline-action"
                      onClick={handleDecline}
                      disabled={actionLoading}
                    >
                      Decline
                    </button>
                  </div>
                </>
              ) : (
                <p className="request-action-note">
                  No actions available for this appointment status.
                </p>
              )}

              <p className="request-footer-note">
                Each action is recorded with your name and the time, and the visitor sees the updated status.
              </p>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
