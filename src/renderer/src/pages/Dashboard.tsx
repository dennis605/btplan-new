import { useState, useEffect, ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Appointment, Activity } from '../types';

export function Dashboard(): ReactElement {
  const navigate = useNavigate();
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const loadTodayData = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [appts, acts] = await Promise.all([
      window.api.db.getAppointments({ start: today, end: today }),
      window.api.db.getActivities()
    ]);
    setTodayAppts(appts);
    setActivities(acts);
  };

  useEffect(() => {
    loadTodayData();
  }, []);

  return (
    <div className="dashboard">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Guten Tag, Sozialer Dienst!</h1>
          <p style={{ margin: 0 }}>Hier ist die Übersicht für heute, den {format(new Date(), 'dd. MMMM yyyy', { locale: de })}.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Button variant="secondary" onClick={() => navigate('/dayview')}>Zur Durchführung</Button>
          <Button variant="primary" onClick={() => navigate('/calendar')}>+ Neuer Termin</Button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 'var(--spacing-lg)' }}>
        <div className="surface">
          <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Heutige Aktivitäten</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {todayAppts.map(appt => {
              const act = activities.find(a => a.id === appt.activityId);
              return (
                <div key={appt.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  padding: '12px', 
                  backgroundColor: 'var(--bg-color)', 
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `4px solid ${act?.color || 'var(--primary)'}`
                }}>
                  <div style={{ fontWeight: 700, minWidth: '100px', color: 'var(--text-muted)' }}>
                    {appt.startTime} - {appt.endTime}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{act?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{appt.room || 'Kein Ort angegeben'}</div>
                  </div>
                  <Button variant="ghost" onClick={() => navigate('/calendar')}>Details</Button>
                </div>
              );
            })}
            {todayAppts.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                Für heute sind noch keine Aktivitäten geplant. Starten Sie mit dem Wochenplan!
              </p>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <div className="surface">
            <h3>Schnellzugriff</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
              <Button variant="secondary" onClick={() => navigate('/reports')}>📄 Monatsnachweis erstellen</Button>
              <Button variant="secondary" onClick={() => navigate('/residents')}>👥 Bewohnerdaten importieren</Button>
            </div>
          </div>

          <div className="surface" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
            <h3 style={{ color: 'white' }}>Statistik (Vorschau)</h3>
            <div style={{ fontSize: '2rem', fontWeight: 700, margin: '12px 0' }}>128</div>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.9rem' }}>Teilnahmen diese Woche dokumentiert.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
