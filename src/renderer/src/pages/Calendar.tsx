import { useState, useEffect, ReactElement } from 'react';
import { format, startOfWeek, addDays, subWeeks, addWeeks, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input, Select } from '../components/Input';
import { AttendanceModal } from '../components/AttendanceModal';
import { Activity, Staff, Resident, Appointment, Attendance } from '../types';
import './Calendar.tsx.css';

export function CalendarPage(): ReactElement {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Partial<Appointment> | null>(null);
  const [apptAttendance, setApptAttendance] = useState<Attendance[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const loadData = async () => {
    const start = format(weekDays[0], 'yyyy-MM-dd');
    const end = format(weekDays[6], 'yyyy-MM-dd');
    
    const [apptData, actData, staffData, resData, tempData] = await Promise.all([
      window.api.db.getAppointments({ start, end }),
      window.api.db.getActivities(),
      window.api.db.getStaff(),
      window.api.db.getResidents(),
      window.api.db.getTemplates()
    ]);
    
    setAppointments(apptData);
    setActivities(actData);
    setStaff(staffData);
    setResidents(resData);
    setTemplates(tempData);
  };

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleOpenAddModal = (date?: Date) => {
    setEditingAppt({ 
      date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      activityId: activities[0]?.id || '',
      staffId: staff[0]?.id || '',
      prepMinutes: 0,
      isTP: false,
    });
    setApptAttendance([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (appt: Appointment) => {
    setEditingAppt(appt);
    const attendance = await window.api.db.getAttendance(appt.id);
    setApptAttendance(attendance);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppt?.activityId || !editingAppt?.date) return;

    try {
      let apptId = editingAppt.id;
      if (apptId) {
        await window.api.db.updateAppointment(editingAppt);
      } else {
        const result = await window.api.db.createAppointment(editingAppt);
        apptId = result.id;
      }
      
      // Save attendance
      if (apptId) {
        await window.api.db.updateAttendance(apptId, apptAttendance);
      }

      loadData();
      setIsModalOpen(false);
    } catch (error) {
      alert('Fehler beim Speichern des Termins');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Termin wirklich löschen?')) {
      await window.api.db.deleteAppointment(id);
      loadData();
      setIsModalOpen(false);
    }
  };

  const toggleResident = (residentId: string) => {
    const isAttending = apptAttendance.some(a => a.residentId === residentId);
    if (isAttending) {
      setApptAttendance(apptAttendance.filter(a => a.residentId !== residentId));
    } else {
      setApptAttendance([...apptAttendance, { 
        appointmentId: editingAppt?.id || '', 
        residentId, 
        status: 'planned', 
        isP: false 
      }]);
    }
  };

  const toggleP = (residentId: string) => {
    setApptAttendance(apptAttendance.map(a => 
      a.residentId === residentId ? { ...a, isP: !a.isP } : a
    ));
  };

  const applyTemplate = (template: any) => {
    setEditingAppt({
      ...editingAppt,
      activityId: template.activityId,
      startTime: template.startTime,
      endTime: template.endTime,
      room: template.room,
      notes: template.notes,
      isTP: template.isTP === 1
    });
    setIsTemplateModalOpen(false);
  };

  return (
    <div className="calendar-page">
      <header className="page-header">
        <div>
          <h1>Wochenplanung</h1>
          <p>{format(weekDays[0], 'dd. MMMM', { locale: de })} - {format(weekDays[6], 'dd. MMMM yyyy', { locale: de })}</p>
        </div>
        <div className="calendar-nav">
          <Button variant="secondary" onClick={handleToday}>Heute</Button>
          <div className="nav-group">
            <Button variant="ghost" onClick={handlePrevWeek}>&lsaquo;</Button>
            <Button variant="ghost" onClick={handleNextWeek}>&rsaquo;</Button>
          </div>
          <Button variant="primary" onClick={() => handleOpenAddModal()}>+ Termin</Button>
        </div>
      </header>

      <div className="calendar-grid">
        <div className="time-column">
          <div className="time-spacer"></div>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="time-slot-label">{8 + i}:00</div>
          ))}
        </div>
        
        {weekDays.map((day) => (
          <div key={day.toString()} className="day-column">
            <div className={`day-header ${isSameDay(day, new Date()) ? 'today' : ''}`}>
              <span className="day-name">{format(day, 'EEEE', { locale: de })}</span>
              <span className="day-number">{format(day, 'dd.MM.')}</span>
            </div>
            <div className="day-body" onClick={() => handleOpenAddModal(day)}>
              {appointments
                .filter(a => a.date === format(day, 'yyyy-MM-dd'))
                .map(appt => {
                  const activity = activities.find(act => act.id === appt.activityId);
                  return (
                    <div 
                      key={appt.id} 
                      className="appt-card" 
                      style={{ 
                        borderLeftColor: activity?.color || 'var(--primary)',
                        top: `${(parseInt(appt.startTime.split(':')[0]) - 8) * 60 + parseInt(appt.startTime.split(':')[1])}px`
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(appt);
                      }}
                    >
                      <div className="appt-time">{appt.startTime}-{appt.endTime}</div>
                      <div className="appt-title">{activity?.name || 'Unbekannt'}</div>
                      <div className="appt-staff">{staff.find(s => s.id === appt.staffId)?.name}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Complex Appointment Modal matching Schloss Binau layout */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAppt?.id ? 'Termin bearbeiten' : 'Neue Veranstaltung anlegen'}
        width="1100px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              {editingAppt?.id && (
                <Button variant="danger" onClick={() => handleDelete(editingAppt.id!)}>Löschen</Button>
              )}
              <Button variant="secondary" onClick={() => setIsTemplateModalOpen(true)}>Vorlage auswählen</Button>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Abbrechen</Button>
              <Button variant="primary" onClick={handleSave}>Anlegen / Speichern</Button>
            </div>
          </div>
        }
      >
        <div className="legacy-form-container">
          {/* Left Column: Form Fields */}
          <div className="legacy-form-col">
            <Input 
              label="Name" 
              value={activities.find(a => a.id === editingAppt?.activityId)?.name || ''} 
              readOnly
              fullWidth
            />
            <div className="checkbox-row">
              <label><input type="checkbox" checked={editingAppt?.isTP || false} onChange={e => setEditingAppt({...editingAppt, isTP: e.target.checked})} /> in TP</label>
            </div>
            <Input 
              label="Datum" 
              type="date"
              value={editingAppt?.date || ''} 
              onChange={e => setEditingAppt({...editingAppt, date: e.target.value})}
              fullWidth
            />
            <div className="time-row">
              <div style={{flex: 1}}><Input label="Anfang" type="time" value={editingAppt?.startTime || ''} onChange={e => setEditingAppt({...editingAppt, startTime: e.target.value})} /></div>
              <div style={{flex: 1}}><Input label="Ende" type="time" value={editingAppt?.endTime || ''} onChange={e => setEditingAppt({...editingAppt, endTime: e.target.value})} /></div>
            </div>
            <div className="prep-row">
              <Input label="Vorbereitung" type="number" value={editingAppt?.prepMinutes?.toString() || '0'} onChange={e => setEditingAppt({...editingAppt, prepMinutes: parseInt(e.target.value)})} />
              <span>Minuten</span>
            </div>
            <Select 
              label="Ort" 
              value={editingAppt?.room || ''}
              onChange={e => setEditingAppt({...editingAppt, room: e.target.value})}
              options={[
                { value: 'Büro', label: 'Büro' },
                { value: 'Arbeitstherapie', label: 'in der Arbeitstherapie' },
                { value: 'Beschäftigungstherapie', label: 'in der Beschäftigungstherapie' },
                { value: 'Bewohnerzimmer', label: 'im Bewohnerzimmer' }
              ]}
              fullWidth
            />
            <Input 
              label="Beschr." 
              value={editingAppt?.notes || ''} 
              onChange={e => setEditingAppt({...editingAppt, notes: e.target.value})}
              multiline
              fullWidth
            />
            <Input 
              label="Beschr. intern" 
              value={editingAppt?.notesInternal || ''} 
              onChange={e => setEditingAppt({...editingAppt, notesInternal: e.target.value})}
              multiline
              fullWidth
            />
          </div>

          {/* Middle Column: Residents Selection */}
          <div className="legacy-list-col">
            <h3>Bewohner</h3>
            <div className="legacy-list-header">
              <span className="col-name">Name</span>
              <span className="col-vorname">Vorname</span>
              <span className="col-check">dabei</span>
              <span className="col-check">P</span>
            </div>
            <div className="legacy-list-body">
              {residents.map(r => {
                const att = apptAttendance.find(a => a.residentId === r.id);
                return (
                  <div key={r.id} className="legacy-list-item">
                    <span className="col-name">{r.lastName}</span>
                    <span className="col-vorname">{r.firstName}</span>
                    <span className="col-check"><input type="checkbox" checked={!!att} onChange={() => toggleResident(r.id)} /></span>
                    <span className="col-check"><input type="checkbox" checked={att?.isP || false} disabled={!att} onChange={() => toggleP(r.id)} /></span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Staff Selection */}
          <div className="legacy-list-col">
            <h3>Mitarbeiter</h3>
            <div className="legacy-list-header">
              <span className="col-name">Name</span>
              <span className="col-vorname">Vorname</span>
              <span className="col-check">dabei</span>
            </div>
            <div className="legacy-list-body">
              {staff.map(s => {
                const [lastName, firstName] = (s.name || '').includes(' ') ? s.name.split(' ') : [s.name, ''];
                return (
                  <div key={s.id} className="legacy-list-item">
                    <span className="col-name">{lastName}</span>
                    <span className="col-vorname">{firstName}</span>
                    <span className="col-check"><input type="checkbox" checked={editingAppt?.staffId === s.id} onChange={() => setEditingAppt({...editingAppt, staffId: s.id})} /></span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Template Selection Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Vorlage auswählen"
        width="600px"
      >
        <div className="template-list-dialog">
          <div className="template-list-body">
            {templates.map(t => (
              <div key={t.id} className="template-item" onClick={() => applyTemplate(t)}>
                <div className="template-info">
                  <strong>{t.name}</strong>, {activities.find(a => a.id === t.activityId)?.name} von {t.startTime} bis {t.endTime}
                </div>
              </div>
            ))}
            {templates.length === 0 && <p className="empty">Keine Vorlagen vorhanden.</p>}
          </div>
          <div className="template-footer">
            <Button variant="primary" onClick={() => setIsTemplateModalOpen(false)}>Abbrechen</Button>
          </div>
        </div>
      </Modal>

      {editingAppt?.id && (
        <AttendanceModal 
          isOpen={isAttendanceModalOpen} 
          onClose={() => setIsAttendanceModalOpen(false)}
          appointmentId={editingAppt.id}
          appointmentTitle={activities.find(a => a.id === editingAppt.activityId)?.name || ''}
        />
      )}
    </div>
  );
}
