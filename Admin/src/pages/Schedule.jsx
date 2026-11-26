
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAppointments } from '../api.js';

const pad = (n) => String(n).padStart(2, '0');

const dateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const startOfWeek = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(0, 0, 0, 0);
  return result;
};

const formatLongDate = (date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const formatShortDate = (date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const formatTime = (value) => {
  if (!value) return 'Time not set';
  const [hour, minute] = String(value).slice(0, 5).split(':').map(Number);
  if (Number.isNaN(hour)) return value;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${pad(minute || 0)} ${suffix}`;
};

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00',
  '16:00',
];

export default function Schedule() {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('Day');
  const [service, setService] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAppointments();
      const records = Array.isArray(data) ? data : [];

      setAppointments(
        records.filter((item) =>
          ['Confirmed', 'Completed'].includes(item.status)
        )
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

  const services = useMemo(
    () => [...new Set(appointments.map((item) => item.service_name).filter(Boolean))],
    [appointments]
  );

  const filteredAppointments = useMemo(
    () => appointments.filter((item) => !service || item.service_name === service),
    [appointments, service]
  );

  const weekDates = useMemo(() => {
    const first = startOfWeek(selectedDate);
    return Array.from({ length: 5 }, (_, index) => addDays(first, index));
  }, [selectedDate]);

  const appointmentsByDate = useMemo(() => {
    const grouped = {};

    filteredAppointments.forEach((item) => {
      const date = parseDate(item.date);
      if (!date) return;

      const key = dateKey(date);
      if (!grouped[key]) grouped[key] = [];

      grouped[key].push(item);
    });

    Object.values(grouped).forEach((items) =>
      items.sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
    );

    return grouped;
  }, [filteredAppointments]);

  const dayAppointments = appointmentsByDate[dateKey(selectedDate)] || [];

  const selected = dayAppointments.find((item) => item.id === selectedId)
    || dayAppointments[0]
    || null;

  useEffect(() => {
    setSelectedId(dayAppointments[0]?.id ?? null);
  }, [dateKey(selectedDate), service, appointments]);

  const navigate = (direction) => {
    if (view === 'Day') {
      setSelectedDate((date) => addDays(date, direction));
    } else if (view === 'Week') {
      setSelectedDate((date) => addDays(date, direction * 7));
    } else {
      setSelectedDate((date) =>
        new Date(date.getFullYear(), date.getMonth() + direction, 1)
      );
    }
  };

  const heading = useMemo(() => {
    if (view === 'Day') return formatLongDate(selectedDate);

    if (view === 'Week') {
      return `${formatShortDate(weekDates[0])} – ${formatShortDate(weekDates[4])}, ${selectedDate.getFullYear()}`;
    }

    return selectedDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [view, selectedDate, weekDates]);

  const countForDate = (date) =>
    (appointmentsByDate[dateKey(date)] || []).length;

  const monthDates = useMemo(() => {
    const first = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    const offset = (first.getDay() + 6) % 7;
    const gridStart = addDays(first, -offset);

    return Array.from({ length: 35 }, (_, index) =>
      addDays(gridStart, index)
    );
  }, [selectedDate]);

  const changeView = (nextView) => {
    setView(nextView);
  };

  return (
    <div className="schedule-page">
      <div className="schedule-page-heading">
        <div>
          <h1>Schedule</h1>
          <p className="sub">
            Confirmed appointments by day, week or month.
          </p>
        </div>

        <div className="schedule-view-switch">
          {['Day', 'Week', 'Month'].map((item) => (
            <button
              type="button"
              key={item}
              className={view === item ? 'active' : ''}
              onClick={() => changeView(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="schedule-controls">
        <div className="schedule-date-navigation">
          <button type="button" onClick={() => navigate(-1)}>‹</button>
          <h2>{heading}</h2>
          <button type="button" onClick={() => navigate(1)}>›</button>
          <button
            type="button"
            className="schedule-today"
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </button>
        </div>

        <div className="schedule-filter">
          <select
            aria-label="Filter by service"
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="">All services</option>
            {services.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <button
            type="button"
            className="btn"
            onClick={loadAppointments}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="alert" role="alert">{error}</div>}

      {loading ? (
        <div className="card schedule-loading">Loading appointments...</div>
      ) : (
        <>
          {view !== 'Month' && (
            <div className="schedule-week-summary">
              {weekDates.map((date) => {
                const key = dateKey(date);
                const active = key === dateKey(selectedDate);
                const count = countForDate(date);

                return (
                  <button
                    type="button"
                    key={key}
                    className={`schedule-day-card ${active ? 'active' : ''}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <span>{formatShortDate(date)}</span>
                    <strong>{count}</strong>
                    <small>{count === 1 ? 'appointment' : 'appointments'}</small>
                  </button>
                );
              })}
            </div>
          )}

          {view === 'Month' ? (
            <div className="schedule-month card">
              <div className="schedule-month-grid">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <strong className="schedule-month-weekday" key={day}>{day}</strong>
                ))}

                {monthDates.map((date) => {
                  const key = dateKey(date);
                  const items = appointmentsByDate[key] || [];
                  const outside = date.getMonth() !== selectedDate.getMonth();

                  return (
                    <button
                      type="button"
                      key={key}
                      className={`schedule-month-day ${outside ? 'outside' : ''} ${key === dateKey(selectedDate) ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedDate(date);
                        setView('Day');
                      }}
                    >
                      <strong>{date.getDate()}</strong>
                      {items.length > 0 && (
                        <span>{items.length} appointments</span>
                      )}
                      {items.slice(0, 2).map((item) => (
                        <small key={item.id}>{formatTime(item.time)} · {item.full_name}</small>
                      ))}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="schedule-main-layout">
              <section className="schedule-timeline-card">
                <div className="schedule-timeline-heading">
                  <strong>{view === 'Day' ? formatLongDate(selectedDate) : 'Weekly schedule'}</strong>
                  <span>{dayAppointments.length} appointments</span>
                </div>

                {view === 'Day' ? (
                  TIME_SLOTS.map((time) => {
                    const items = dayAppointments.filter(
                      (item) => String(item.time || '').slice(0, 5) === time
                    );

                    return (
                      <div className="schedule-time-row" key={time}>
                        <div className="schedule-time-label">{formatTime(time)}</div>

                        <div className="schedule-time-content">
                          {time === '12:00' ? (
                            <div className="schedule-lunch">Lunch break</div>
                          ) : items.length === 0 ? (
                            <div className="schedule-empty-slot">No appointments in this slot</div>
                          ) : (
                            items.map((item) => (
                              <button
                                type="button"
                                key={item.id}
                                className={`schedule-event-card ${selected?.id === item.id ? 'selected' : ''}`}
                                onClick={() => setSelectedId(item.id)}
                              >
                                <span>
                                  <strong>{item.full_name}</strong>
                                  <small>{item.service_name}</small>
                                </span>
                                <span className={`schedule-event-status ${item.status.toLowerCase()}`}>
                                  {item.status}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  weekDates.map((date) => {
                    const items = appointmentsByDate[dateKey(date)] || [];

                    return (
                      <div className="schedule-week-row" key={dateKey(date)}>
                        <strong>{formatShortDate(date)}</strong>
                        <div>
                          {items.length === 0 ? (
                            <span className="schedule-muted">No appointments</span>
                          ) : items.map((item) => (
                            <button
                              type="button"
                              key={item.id}
                              className="schedule-week-event"
                              onClick={() => {
                                setSelectedDate(date);
                                setSelectedId(item.id);
                                setView('Day');
                              }}
                            >
                              {formatTime(item.time)} · {item.full_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </section>

              <aside className="schedule-detail-card">
                {!selected ? (
                  <div className="schedule-detail-empty">
                    <h3>No appointment selected</h3>
                    <p>Choose an appointment from the schedule to see its details.</p>
                  </div>
                ) : (
                  <>
                    <span className="schedule-detail-eyebrow">
                      Appointment · {formatTime(selected.time)}
                    </span>
                    <h2>{selected.full_name}</h2>

                    <div className="schedule-detail-item">
                      <small>Reference</small>
                      <strong>{selected.reference}</strong>
                    </div>

                    <div className="schedule-detail-item">
                      <small>Service</small>
                      <strong>{selected.service_name}</strong>
                    </div>

                    <div className="schedule-detail-item">
                      <small>Contact</small>
                      <strong>{selected.mobile || 'No contact number'}</strong>
                    </div>

                    <div className="schedule-detail-item">
                      <small>Purpose of visit</small>
                      <p>{selected.purpose || 'No purpose provided.'}</p>
                    </div>

                    <div className="schedule-outcome">
                      <strong>Update outcome</strong>
                      <button type="button" disabled title="Outcome API is not available yet.">
                        Mark as completed
                      </button>
                      <button type="button" disabled title="Outcome API is not available yet.">
                        Mark as no-show
                      </button>
                      <small>
                        Outcome updates are not connected yet. Changes will require API support.
                      </small>
                    </div>
                  </>
                )}
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
}
