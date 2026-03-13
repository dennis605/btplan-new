import { useState, useEffect, ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

export function Dashboard(): ReactElement {
  const navigate = useNavigate();
  const [todayAppts, setTodayAppts] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    try {
      window.api.db.getAppointments({ start: today, end: today }).then(setTodayAppts).catch(console.error);
      window.api.db.getActivities().then(setActivities).catch(console.error);
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  }, []);

  const todayStr = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Übersicht</h1>
          <p>{todayStr}</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/calendar')}>
          + Neuer Termin
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Heutige Aktivitäten */}
        <div className="surface" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
            Heutige Aktivitäten
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {todayAppts.map(appt => {
              const act = activities.find(a => a.id === appt.activityId);
              return (
                <div key={appt.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-color)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `3px solid ${act?.color || 'var(--primary)'}`,
                }}>
                  <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-muted)', minWidth: '90px', fontVariantNumeric: 'tabular-nums' }}>
                    {appt.startTime} – {appt.endTime}
                  </span>
                  <span style={{ fontWeight: 500, fontSize: '0.9375rem', flex: 1 }}>{act?.name || 'Unbekannt'}</span>
                  {appt.room && <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{appt.room}</span>}
                </div>
              );
            })}
            {todayAppts.length === 0 && (
              <p style={{ color: 'var(--text-muted)', margin: '12px 0', fontSize: '0.9375rem' }}>
                Für heute sind keine Aktivitäten geplant.
              </p>
            )}
          </div>
        </div>

        {/* Rechte Spalte */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="surface" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
              Schnellzugriff
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Button variant="secondary" onClick={() => navigate('/reports')}>
                Monatsnachweis erstellen
              </Button>
              <Button variant="secondary" onClick={() => navigate('/dayview')}>
                Zur Durchführung
              </Button>
              <Button variant="secondary" onClick={() => navigate('/residents')}>
                Bewohnerdaten verwalten
              </Button>
            </div>
          </div>

          <div className="surface" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '4px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
              Diese Woche
            </h3>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px' }}>
              {todayAppts.length}
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Termine heute geplant
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
