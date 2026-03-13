import { useState, useEffect, ReactElement } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Activity, Staff } from '../types';
import './DayView.css';

interface Appointment {
  id: string;
  activityId: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  room?: string;
  notes?: string;
  status: string;
}

interface AttendanceRecord {
  residentId: string;
  status: string;
  firstName: string;
  lastName: string;
}

export function DayViewPage(): ReactElement {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const today = format(new Date(), 'yyyy-MM-dd');

  const loadDayData = async () => {
    const [apptData, actData, staffData] = await Promise.all([
      window.api.db.getAppointments({ start: today, end: today }),
      window.api.db.getActivities(),
      window.api.db.getStaff()
    ]);
    setAppointments(apptData);
    setActivities(actData);
    setStaff(staffData);
    if (apptData.length > 0 && !selectedAppt) {
      handleSelectAppointment(apptData[0]);
    }
  };

  const loadAttendance = async (apptId: string) => {
    const data = await window.api.db.getAttendance(apptId);
    setAttendance(data);
  };

  useEffect(() => {
    loadDayData();
  }, []);

  const handleSelectAppointment = (appt: Appointment) => {
    setSelectedAppt(appt);
    loadAttendance(appt.id);
  };

  const updateStatus = async (residentId: string, newStatus: string) => {
    const newAttendance = attendance.map(a => 
      a.residentId === residentId ? { ...a, status: newStatus } : a
    );
    setAttendance(newAttendance);
    await window.api.db.updateAttendance(selectedAppt!.id, newAttendance);
  };

  return (
    <div className="day-view">
      <div className="appt-list-sidebar surface">
        <h3>Termine Heute</h3>
        <p className="subtitle">{format(new Date(), 'EEEE, dd.MM.', { locale: de })}</p>
        <div className="appt-items">
          {appointments.map(a => {
            const act = activities.find(x => x.id === a.activityId);
            return (
              <div 
                key={a.id} 
                className={`appt-item ${selectedAppt?.id === a.id ? 'active' : ''}`}
                onClick={() => handleSelectAppointment(a)}
              >
                <div className="time">{a.startTime}</div>
                <div className="title">{act?.name}</div>
              </div>
            );
          })}
          {appointments.length === 0 && <p className="empty">Keine Termine für heute.</p>}
        </div>
      </div>

      <div className="day-content">
        {selectedAppt ? (
          <div className="attendance-tracker surface">
            <header className="tracker-header">
              <div>
                <h2>{activities.find(a => a.id === selectedAppt.activityId)?.name}</h2>
                <p>{selectedAppt.startTime} - {selectedAppt.endTime} | Raum: {selectedAppt.room || '-'}</p>
              </div>
              <div className="staff-info">
                Betreuer: {staff.find(s => s.id === selectedAppt.staffId)?.name || '-'}
              </div>
            </header>

            <div className="resident-grid">
              {attendance.map(a => (
                <div key={a.residentId} className={`resident-card status-${a.status}`}>
                  <div className="name">{a.lastName}, {a.firstName}</div>
                  <div className="status-actions">
                    <button 
                      className={`status-btn btn-present ${a.status === 'attended' ? 'active' : ''}`}
                      onClick={() => updateStatus(a.residentId, 'attended')}
                    >
                      ✅ Anwesend
                    </button>
                    <button 
                      className={`status-btn btn-absent ${a.status === 'cancelled' ? 'active' : ''}`}
                      onClick={() => updateStatus(a.residentId, 'cancelled')}
                    >
                      ❌ Abwesend
                    </button>
                    <button 
                      className={`status-btn btn-sick ${a.status === 'sick' ? 'active' : ''}`}
                      onClick={() => updateStatus(a.residentId, 'sick')}
                    >
                      🤒 Krank
                    </button>
                  </div>
                </div>
              ))}
              {attendance.length === 0 && (
                <div className="empty-attendance">
                  Keine Bewohner für diesen Termin eingetragen. 
                  <br />Bitte im Kalender Teilnehmer hinzufügen.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state surface">
            Wähle einen Termin aus der Liste links.
          </div>
        )}
      </div>
    </div>
  );
}
