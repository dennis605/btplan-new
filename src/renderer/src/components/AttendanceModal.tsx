import { useState, useEffect, ReactElement } from 'react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Resident } from '../types';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  appointmentTitle: string;
}

interface AttendanceRecord {
  residentId: string;
  status: string;
  firstName: string;
  lastName: string;
  notes?: string;
}

export function AttendanceModal({ 
  isOpen, 
  onClose, 
  appointmentId, 
  appointmentTitle 
}: AttendanceModalProps): ReactElement {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    if (!appointmentId) return;
    const [resData, attData] = await Promise.all([
      window.api.db.getResidents(),
      window.api.db.getAttendance(appointmentId)
    ]);
    setResidents(resData);
    setAttendance(attData);
  };

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen, appointmentId]);

  const toggleResident = (resident: Resident) => {
    const isAttending = attendance.some(a => a.residentId === resident.id);
    if (isAttending) {
      setAttendance(attendance.filter(a => a.residentId !== resident.id));
    } else {
      setAttendance([...attendance, { 
        residentId: resident.id, 
        status: 'planned', 
        firstName: resident.firstName, 
        lastName: resident.lastName 
      }]);
    }
  };

  const handleSave = async () => {
    await window.api.db.updateAttendance(appointmentId, attendance);
    onClose();
  };

  const filteredResidents = residents.filter(r => 
    `${r.firstName} ${r.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Teilnehmer: ${appointmentTitle}`}
      width="600px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" onClick={handleSave}>Teilnehmerliste speichern</Button>
        </>
      }
    >
      <div className="attendance-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <input 
          type="text" 
          placeholder="Bewohner suchen..." 
          className="form-input" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', maxHeight: '400px', overflowY: 'auto' }}>
          <div>
            <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Alle Bewohner</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filteredResidents.map(r => {
                const isSelected = attendance.some(a => a.residentId === r.id);
                return (
                  <div 
                    key={r.id} 
                    className={`surface ${isSelected ? 'selected' : ''}`}
                    style={{ 
                      padding: '8px 12px', 
                      cursor: 'pointer', 
                      fontSize: '0.875rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'white'
                    }}
                    onClick={() => toggleResident(r)}
                  >
                    <span>{r.lastName}, {r.firstName}</span>
                    <button style={{ border: 'none', background: 'none' }}>{isSelected ? '✅' : '➕'}</button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Teilnehmer ({attendance.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {attendance.map(a => (
                <div 
                  key={a.residentId} 
                  className="surface"
                  style={{ 
                    padding: '8px 12px', 
                    fontSize: '0.875rem',
                    borderLeft: '4px solid var(--primary)'
                  }}
                >
                  {a.lastName}, {a.firstName}
                </div>
              ))}
              {attendance.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Noch niemand zugewiesen.</p>}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
