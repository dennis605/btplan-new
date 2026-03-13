import { useState, useEffect, ReactElement } from 'react';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Appointment, Activity } from '../types';
import './DayList.css';

export function DayListPage(): ReactElement {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const loadData = async () => {
    try {
      const [apptData, actData] = await Promise.all([
        window.api.db.getAppointments({ start: selectedDate, end: selectedDate }),
        window.api.db.getActivities()
      ]);
      setAppointments(apptData);
      setActivities(actData);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, [selectedDate]);

  const goDay = (offset: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    const next = addDays(d, offset);
    setSelectedDate(format(next, 'yyyy-MM-dd'));
  };

  const openInCalendar = (appt: Appointment) => {
    // navigate to calendar with the appointment's date
    navigate('/calendar', { state: { date: appt.date } });
  };

  return (
    <div className="day-list-page">
      <header className="page-header">
        <div>
          <h1>Tagesübersicht</h1>
          <p>{format(new Date(selectedDate + 'T00:00:00'), 'EEEE, dd. MMMM yyyy', { locale: de })}</p>
        </div>
        <div className="day-list-nav">
          <button className="day-nav-btn" onClick={() => goDay(-1)}>‹ Vorher</button>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="date-picker-input"
          />
          <button className="day-nav-btn" onClick={() => goDay(1)}>Nächster ›</button>
        </div>
      </header>

      <div className="surface day-list-container">
        {appointments.length === 0 ? (
          <p className="empty">Keine Veranstaltungen für diesen Tag.</p>
        ) : (
          appointments
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
            .map(a => {
              const act = activities.find(x => x.id === a.activityId);
              return (
                <div key={a.id} className="day-list-item" style={{ borderLeftColor: act?.color || 'var(--primary)' }}>
                  <div className="item-time">{a.startTime} – {a.endTime}</div>
                  <div className="item-info">
                    <div className="item-title">{act?.name || '–'}</div>
                    {a.room && <div className="item-meta">{a.room}</div>}
                  </div>
                  <button className="day-list-action-btn" onClick={() => openInCalendar(a)}>
                    Im Kalender anzeigen
                  </button>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
