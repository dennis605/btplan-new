import { useState, useEffect, ReactElement } from 'react';
import { format, startOfWeek, addDays, subWeeks, addWeeks, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Activity, Staff, Resident, Appointment, Attendance } from '../types';
import './Calendar.tsx.css';

type ApptForm = Partial<Appointment>;

export function CalendarPage(): ReactElement {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<ApptForm | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
    const firstActivity = activities[0];
    const firstStaff = staff[0];
    setSaveError(null);
    setEditingAppt({
      date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      activityId: firstActivity?.id || '',
      staffId: firstStaff?.id || '',
      room: '',
      notes: '',
      notesInternal: '',
      prepMinutes: 0,
      isTP: false,
    });
    setAttendance([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (appt: Appointment) => {
    setSaveError(null);
    setEditingAppt({ ...appt });
    try {
      const att = await window.api.db.getAttendance(appt.id);
      setAttendance(att);
    } catch {
      setAttendance([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingAppt) return;
    if (!editingAppt.activityId) { setSaveError('Bitte eine Aktivität wählen.'); return; }
    if (!editingAppt.date) { setSaveError('Bitte ein Datum eingeben.'); return; }
    if (!editingAppt.startTime) { setSaveError('Bitte Startzeit eingeben.'); return; }
    if (!editingAppt.endTime) { setSaveError('Bitte Endzeit eingeben.'); return; }

    setSaving(true);
    setSaveError(null);
    try {
      let apptId = editingAppt.id;
      if (apptId) {
        const result = await window.api.db.updateAppointment({
          ...editingAppt,
          isTP: editingAppt.isTP ? true : false,
          status: editingAppt.status || 'scheduled',
        });
        if (!result.success) throw new Error(result.error || 'Unbekannter Fehler');
      } else {
        const result = await window.api.db.createAppointment({
          ...editingAppt,
          isTP: editingAppt.isTP ? true : false,
          status: 'scheduled',
        });
        if (!result.success) throw new Error(result.error || 'Unbekannter Fehler');
        apptId = result.id;
      }

      if (apptId) {
        await window.api.db.updateAttendance(apptId, attendance);
      }

      await loadData();
      setIsModalOpen(false);
    } catch (e: any) {
      setSaveError('Fehler beim Speichern: ' + String(e.message || e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Termin wirklich löschen?')) return;
    await window.api.db.deleteAppointment(id);
    await loadData();
    setIsModalOpen(false);
  };

  const toggleResident = (residentId: string) => {
    const isIn = attendance.some(a => a.residentId === residentId);
    if (isIn) {
      setAttendance(attendance.filter(a => a.residentId !== residentId));
    } else {
      setAttendance([...attendance, {
        appointmentId: editingAppt?.id || '',
        residentId,
        status: 'planned',
        isP: false,
      }]);
    }
  };

  const set = (key: keyof ApptForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditingAppt(prev => ({ ...prev, [key]: e.target.value }));
  };

  return (
    <div className="calendar-page">
      <header className="page-header">
        <div>
          <h1>Wochenplanung</h1>
          <p>{format(weekDays[0], 'dd. MMMM', { locale: de })} – {format(weekDays[6], 'dd. MMMM yyyy', { locale: de })}</p>
        </div>
        <div className="calendar-nav">
          <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>Heute</Button>
          <div className="nav-group">
            <Button variant="ghost" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>‹</Button>
            <Button variant="ghost" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>›</Button>
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

      {/* Appointment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAppt?.id ? 'Termin bearbeiten' : 'Neuen Termin anlegen'}
        width="860px"
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
          {/* Left: Form fields */}
          <div className="appt-form-left">
            <div className="form-field">
              <label>Aktivität *</label>
              <select
                className="form-select-input"
                value={editingAppt?.activityId || ''}
                onChange={set('activityId')}
              >
                <option value="">-- Aktivität wählen --</option>
                {activities.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Datum *</label>
              <input
                type="date"
                className="form-input"
                value={editingAppt?.date || ''}
                onChange={set('date')}
              />
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
              <select className="form-select-input" value={editingAppt?.room || ''} onChange={set('room')}>
                <option value="">-- kein Ort --</option>
                <option value="Büro">Büro</option>
                <option value="Arbeitstherapie">Arbeitstherapie</option>
                <option value="Beschäftigungstherapie">Beschäftigungstherapie</option>
                <option value="Bewohnerzimmer">Bewohnerzimmer</option>
                <option value="Aufenthaltsraum">Aufenthaltsraum</option>
                <option value="Garten">Garten</option>
              </select>
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
              <textarea
                className="form-textarea"
                rows={3}
                value={editingAppt?.notes || ''}
                onChange={set('notes')}
                placeholder="Öffentliche Notizen..."
              />
            </div>

            <div className="form-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={!!editingAppt?.isTP}
                  onChange={e => setEditingAppt(p => ({ ...p, isTP: e.target.checked }))}
                />
                Als Therapieplan-Termin (TP) markieren
              </label>
            </div>
          </div>

          {/* Right: Resident selection */}
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
                    <input
                      type="checkbox"
                      checked={isIn}
                      onChange={() => toggleResident(r.id)}
                    />
                    <span className="resident-name">{r.lastName}, {r.firstName}</span>
                    {r.ward && <span className="resident-ward">{r.ward}</span>}
                  </label>
                );
              })}
              {residents.length === 0 && (
                <p style={{ color: 'var(--text-muted)', padding: '12px' }}>Keine Bewohner angelegt.</p>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
