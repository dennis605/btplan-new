import { useState, useEffect, ReactElement } from 'react';
import { format, startOfWeek, addDays, subWeeks, addWeeks, isSameDay,
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Activity, Staff, Resident, Appointment, Attendance } from '../types';
import './Calendar.tsx.css';

type ApptForm = Partial<Appointment>;

export function CalendarPage(): ReactElement {
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState(() => {
    const state = location.state as any;
    return state?.date ? new Date(state.date + 'T00:00:00') : new Date();
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<ApptForm | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Mini-Kalender Zustand
  const [miniMonth, setMiniMonth] = useState(() => new Date());

  // On-the-fly Aktivität
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [newActName, setNewActName] = useState('');
  const [newActColor, setNewActColor] = useState('#2563eb');
  const [creatingAct, setCreatingAct] = useState(false);

  // Sidebar Zustand
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const loadData = async () => {
    const start = format(weekDays[0], 'yyyy-MM-dd');
    const end = format(weekDays[6], 'yyyy-MM-dd');
    const [apptData, actData, staffData, resData] = await Promise.all([
      window.api.db.getAppointments({ start, end }),
      window.api.db.getActivities(),
      window.api.db.getStaff(),
      window.api.db.getResidents(),
    ]);
    setAppointments(apptData);
    setActivities(actData);
    setStaff(staffData);
    setResidents(resData);
  };

  useEffect(() => { loadData(); }, [currentDate]);

  const handleOpenAdd = (date?: Date) => {
    setSaveError(null);
    setShowNewActivity(false);
    setNewActName('');
    setEditingAppt({
      date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      activityId: activities[0]?.id || '',
      staffId: staff[0]?.id || '',
      room: '',
      notes: '',
      isTP: false,
    });
    setAttendance([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (appt: Appointment) => {
    setSaveError(null);
    setShowNewActivity(false);
    setEditingAppt({ ...appt });
    try {
      const att = await window.api.db.getAttendance(appt.id);
      setAttendance(att);
    } catch { setAttendance([]); }
    setIsModalOpen(true);
  };

  const createActivityOnTheFly = async () => {
    if (!newActName.trim()) return;
    setCreatingAct(true);
    try {
      const result = await window.api.db.createActivity({ name: newActName.trim(), color: newActColor, category: '', durationMinutes: 60 });
      if (result.success && result.id) {
        await loadData();
        setEditingAppt(p => ({ ...p, activityId: result.id }));
        setShowNewActivity(false);
        setNewActName('');
      }
    } finally { setCreatingAct(false); }
  };

  const handleSave = async () => {
    if (!editingAppt) return;
    if (!editingAppt.activityId) { setSaveError('Bitte eine Aktivität wählen.'); return; }
    if (!editingAppt.date) { setSaveError('Bitte ein Datum eingeben.'); return; }
    if (!editingAppt.startTime || !editingAppt.endTime) { setSaveError('Bitte Start- und Endzeit eingeben.'); return; }

    setSaving(true);
    setSaveError(null);
    try {
      let apptId = editingAppt.id;
      if (apptId) {
        const result = await window.api.db.updateAppointment({ ...editingAppt, status: editingAppt.status || 'scheduled' });
        if (!result.success) throw new Error(result.error || 'Unbekannter Fehler');
      } else {
        const result = await window.api.db.createAppointment({ ...editingAppt, status: 'scheduled' });
        if (!result.success) throw new Error(result.error || 'Unbekannter Fehler');
        apptId = result.id;
      }
      if (apptId && attendance.length > 0) {
        await window.api.db.updateAttendance(apptId, attendance);
      }
      await loadData();
      setIsModalOpen(false);
    } catch (e: any) {
      setSaveError('Fehler: ' + String(e.message || e));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Termin wirklich löschen?')) return;
    await window.api.db.deleteAppointment(id);
    await loadData();
    setIsModalOpen(false);
  };

  const toggleResident = (residentId: string) => {
    const isIn = attendance.some(a => a.residentId === residentId);
    setAttendance(isIn
      ? attendance.filter(a => a.residentId !== residentId)
      : [...attendance, { appointmentId: editingAppt?.id || '', residentId, status: 'planned', isP: false }]
    );
  };

  const set = (key: keyof ApptForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setEditingAppt(prev => ({ ...prev, [key]: e.target.value }));

  // Mini-Kalender
  const miniStart = startOfMonth(miniMonth);
  const miniEnd = endOfMonth(miniMonth);
  const miniDays = eachDayOfInterval({ start: miniStart, end: miniEnd });
  const firstDayOfWeek = (getDay(miniStart) + 6) % 7; // Mo=0
  const miniEmptyDays = Array.from({ length: firstDayOfWeek });

  const jumpToWeek = (day: Date) => { setCurrentDate(day); setMiniMonth(day); };

  return (
    <div className="calendar-layout">
      {/* Mini-Kalender Seitenleiste */}
      <aside className={`mini-cal-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
        {isSidebarOpen && (
          <>
            <div className="mini-cal-header">
              <button className="mini-nav-btn" onClick={() => setMiniMonth(subMonths(miniMonth, 1))}>‹</button>
              <div className="mini-cal-month">{format(miniMonth, 'MMMM yyyy', { locale: de })}</div>
              <button className="mini-nav-btn" onClick={() => setMiniMonth(addMonths(miniMonth, 1))}>›</button>
            </div>
            <div className="mini-cal-weekdays">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                <span key={d} className="mini-wd-label">{d}</span>
              ))}
            </div>
            <div className="mini-cal-grid">
              {miniEmptyDays.map((_, i) => <span key={`e-${i}`} />)}
              {miniDays.map(day => {
                const isToday = isSameDay(day, new Date());
                const isSelectedWeek = weekDays.some(wd => isSameDay(wd, day));
                return (
                  <button
                    key={day.toISOString()}
                    className={`mini-day${isToday ? ' mini-today' : ''}${isSelectedWeek ? ' mini-selected-week' : ''}`}
                    onClick={() => jumpToWeek(day)}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
            <div className="mini-cal-actions">
              <button className="mini-action-btn" onClick={() => { setCurrentDate(new Date()); setMiniMonth(new Date()); }}>
                Heute
              </button>
            </div>
          </>
        )}
      </aside>

      {/* Hauptbereich */}
      <div className="calendar-page">
        <header className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              className="calendar-sidebar-toggle" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Seitenleiste ausblenden" : "Seitenleiste einblenden"}
            >
              <span className="burger-icon" />
            </button>
            <div>
              <h1>Wochenplanung</h1>
              <p>{format(weekDays[0], 'dd. MMMM', { locale: de })} – {format(weekDays[6], 'dd. MMMM yyyy', { locale: de })}</p>
            </div>
          </div>
          <div className="calendar-nav">
            <div className="nav-group">
              <Button variant="ghost" onClick={() => { const d = subWeeks(currentDate, 1); setCurrentDate(d); setMiniMonth(d); }}>‹</Button>
              <Button variant="ghost" onClick={() => { const d = addWeeks(currentDate, 1); setCurrentDate(d); setMiniMonth(d); }}>›</Button>
            </div>
            <Button variant="primary" onClick={() => handleOpenAdd()}>+ Termin</Button>
          </div>
        </header>

        <div className="calendar-grid">
          <div className="time-column">
            <div className="time-spacer" />
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="time-slot-label">{8 + i}:00</div>
            ))}
          </div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="day-column">
              <div className={`day-header ${isSameDay(day, new Date()) ? 'today' : ''}`}>
                <span className="day-name">{format(day, 'EEE', { locale: de })}</span>
                <span className="day-number">{format(day, 'dd.MM.')}</span>
              </div>
              <div className="day-body" onClick={() => handleOpenAdd(day)}>
                {appointments
                  .filter(a => a.date === format(day, 'yyyy-MM-dd'))
                  .map(appt => {
                    const activity = activities.find(a => a.id === appt.activityId);
                    const [sh, sm] = (appt.startTime || '08:00').split(':').map(Number);
                    const topPx = (sh - 8) * 60 + (sm || 0);
                    return (
                      <div
                        key={appt.id}
                        className="appt-card"
                        style={{ borderLeftColor: activity?.color || 'var(--primary)', top: `${topPx}px` }}
                        onClick={e => { e.stopPropagation(); handleOpenEdit(appt); }}
                      >
                        <div className="appt-time">{appt.startTime}–{appt.endTime}</div>
                        <div className="appt-title">{activity?.name || '—'}</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Appointment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAppt?.id ? 'Termin bearbeiten' : 'Neuen Termin anlegen'}
        width="880px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div>
              {editingAppt?.id && (
                <Button variant="danger" onClick={() => handleDelete(editingAppt.id!)}>Löschen</Button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {saveError && <span style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{saveError}</span>}
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Abbrechen</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Speichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="appt-form-grid">
          <div className="appt-form-left">
            {/* Activity */}
            <div className="form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Aktivität *</label>
                <button
                  onClick={() => setShowNewActivity(!showNewActivity)}
                  style={{ fontSize: '0.8125rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                >
                  {showNewActivity ? '✕ Abbrechen' : '+ Neu anlegen'}
                </button>
              </div>
              {showNewActivity ? (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input type="color" value={newActColor} onChange={e => setNewActColor(e.target.value)} className="color-input" style={{ width: 36, height: 36, padding: 2, border: '1px solid #d1d5db', borderRadius: 5, cursor: 'pointer' }} />
                  <input
                    className="form-input"
                    placeholder="Name der neuen Aktivität..."
                    value={newActName}
                    onChange={e => setNewActName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && createActivityOnTheFly()}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                  <Button variant="primary" onClick={createActivityOnTheFly} disabled={!newActName.trim() || creatingAct}>
                    {creatingAct ? '...' : 'Erstellen'}
                  </Button>
                </div>
              ) : (
                <select className="form-select-input" value={editingAppt?.activityId || ''} onChange={set('activityId')}>
                  <option value="">-- Aktivität wählen --</option>
                  {activities.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-field">
              <label>Datum *</label>
              <input type="date" className="form-input" value={editingAppt?.date || ''} onChange={set('date')} />
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label>Beginn *</label>
                <input type="time" className="form-input" value={editingAppt?.startTime || ''} onChange={set('startTime')} />
              </div>
              <div className="form-field">
                <label>Ende *</label>
                <input type="time" className="form-input" value={editingAppt?.endTime || ''} onChange={set('endTime')} />
              </div>
            </div>

            <div className="form-field">
              <label>Ort / Raum</label>
              <input type="text" className="form-input" placeholder="z.B. Aufenthaltsraum" value={editingAppt?.room || ''} onChange={set('room')} />
            </div>

            <div className="form-field">
              <label>Zuständiger Mitarbeiter</label>
              <select className="form-select-input" value={editingAppt?.staffId || ''} onChange={set('staffId')}>
                <option value="">-- kein Mitarbeiter --</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Anmerkungen</label>
              <textarea className="form-textarea" rows={3} value={editingAppt?.notes || ''} onChange={set('notes')} placeholder="Öffentliche Notizen..." />
            </div>

            <div className="form-field">
              <label className="checkbox-label">
                <input type="checkbox" checked={!!editingAppt?.isTP} onChange={e => setEditingAppt(p => ({ ...p, isTP: e.target.checked }))} />
                Als Therapieplan-Termin (TP) markieren
              </label>
            </div>
          </div>

          {/* Bewohnerliste */}
          <div className="appt-form-right">
            <div className="resident-list-header">
              <span>Teilnehmer</span>
              <span className="resident-count">{attendance.length} gewählt</span>
            </div>
            <div className="resident-list">
              {residents.map(r => {
                const isIn = attendance.some(a => a.residentId === r.id);
                return (
                  <label key={r.id} className={`resident-row ${isIn ? 'selected' : ''}`}>
                    <input type="checkbox" checked={isIn} onChange={() => toggleResident(r.id)} />
                    <span className="resident-name">{r.lastName}, {r.firstName}</span>
                    {r.ward && <span className="resident-ward">{r.ward}</span>}
                  </label>
                );
              })}
              {residents.length === 0 && <p style={{ color: 'var(--text-muted)', padding: '12px', margin: 0 }}>Keine Bewohner angelegt.</p>}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
