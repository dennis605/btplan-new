import { useState, useEffect, ReactElement } from 'react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Staff } from '../types';

export function StaffPage(): ReactElement {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<Staff> | null>(null);

  const fetchStaff = async () => {
    const data = await window.api.db.getStaff();
    setStaff(data);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenAddModal = () => {
    setEditingStaff({ name: '', role: 'Betreuungskraft' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (s: Staff) => {
    setEditingStaff(s);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff?.name) return;

    try {
      if (editingStaff.id) {
        await window.api.db.updateStaff(editingStaff);
      } else {
        await window.api.db.createStaff(editingStaff);
      }
      fetchStaff();
      setIsModalOpen(false);
    } catch (error) {
      alert('Fehler beim Speichern des Mitarbeiters');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Soll dieser Mitarbeiter wirklich gelöscht werden?')) {
      await window.api.db.deleteStaff(id);
      fetchStaff();
    }
  };

  return (
    <div className="staff-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1>Mitarbeiter & Betreuer</h1>
          <p>Verwaltung des Teams für Therapie und soziale Dienste</p>
        </div>
        <Button variant="primary" onClick={handleOpenAddModal}>+ Mitarbeiter hinzufügen</Button>
      </header>

      <div className="surface table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Rolle / Funktion</th>
              <th className="text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.name}</strong></td>
                <td>{s.role}</td>
                <td className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(s)}>✏️</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>🗑️</Button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                  Noch keine Mitarbeiter angelegt.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff?.id ? 'Mitarbeiter bearbeiten' : 'Neuen Mitarbeiter hinzufügen'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Abbrechen</Button>
            <Button variant="primary" onClick={handleSave}>Speichern</Button>
          </>
        }
      >
        <form className="staff-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <Input 
            label="Vollständiger Name" 
            value={editingStaff?.name || ''} 
            onChange={e => setEditingStaff({...editingStaff, name: e.target.value})}
            required
            fullWidth
          />
          <Input 
            label="Rolle (z.B. Ergotherapeut, Alltagsbegleiter)" 
            value={editingStaff?.role || ''} 
            onChange={e => setEditingStaff({...editingStaff, role: e.target.value})}
            fullWidth
          />
        </form>
      </Modal>
    </div>
  );
}
