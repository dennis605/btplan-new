import { useState, useEffect, ReactElement } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Appointment, Activity } from '../types';
import './DayList.css';

export function DayListPage(): ReactElement {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const loadData = async () => {
    const [apptData, actData] = await Promise.all([
      window.api.db.getAppointments({ start: selectedDate, end: selectedDate }),
      window.api.db.getActivities()
    ]);
    setAppointments(apptData);
    setActivities(actData);
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  return (
    <div className="day-list-page">
      <header className="page-header">
        <h1>Veranstaltungen vom {format(new Date(selectedDate), 'EEEE, dd.MM.yyyy', { locale: de })}</h1>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={e => setSelectedDate(e.target.value)} 
          className="date-picker-input"
        />
      </header>

      <div className="surface day-list-container">
        {appointments.map(a => {
          const act = activities.find(x => x.id === a.activityId);
          return (
            <div key={a.id} className="day-list-item">
              <div className="item-text">
                {act?.name}, {a.room ? `in ${a.room}` : ''} am {format(new Date(a.date), 'EEEE, dd.MM.yyyy', { locale: de })} von {a.startTime} bis {a.endTime}
              </div>
              <button className="legacy-btn" onClick={() => {}}>anzeigen</button>
            </div>
          );
        })}
        {appointments.length === 0 && <p className="empty">Keine Veranstaltungen für diesen Tag.</p>}
      </div>
    </div>
  );
}
