import { useState, useEffect, ReactElement } from 'react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input, Select } from '../components/Input';
import { Resident } from '../types';
import './Residents.css';

export function ResidentsPage(): ReactElement {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Partial<Resident> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResidents = async () => {
    setIsLoading(true);
    try {
      const data = await window.api.db.getResidents();
      setResidents(data);
    } catch (error) {
      console.error('Error fetching residents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  const handleOpenAddModal = () => {
    setEditingResident({ firstName: '', lastName: '', ward: '', status: 'active', notes: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (resident: Resident) => {
    setEditingResident(resident);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingResident(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResident?.firstName || !editingResident?.lastName) return;

    try {
      if (editingResident.id) {
        await window.api.db.updateResident(editingResident);
      } else {
        await window.api.db.createResident(editingResident);
      }
      fetchResidents();
      handleCloseModal();
    } catch (error) {
      alert('Fehler beim Speichern des Bewohners');
    }
  };

  const handleImport = async () => {
    const filePath = await window.api.app.selectFile();
    if (!filePath) return;

    const content = await window.api.app.readFile(filePath);
    if (!content) return;

    const Papa = await import('papaparse');
    
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const residentsToImport = results.data.map((row: any) => ({
          firstName: row.Vorname || row.firstName,
          lastName: row.Nachname || row.lastName,
          ward: row.Wohnbereich || row.ward || '',
          notes: row.Anmerkungen || row.notes || '',
          status: 'active'
        })).filter(r => r.firstName && r.lastName);

        if (residentsToImport.length > 0) {
          const result = await window.api.db.bulkSyncResidents(residentsToImport);
          if (result.success) {
            alert(`${result.count} Bewohner erfolgreich importiert.`);
            fetchResidents();
          } else {
            alert('Fehler beim Import: ' + result.error);
          }
        } else {
          alert('Keine gültigen Bewohnerdaten in der Datei gefunden. Erwartet werden Spalten wie "Vorname" und "Nachname".');
        }
      },
      error: (err) => {
        alert('Fehler beim Parsen der CSV: ' + err.message);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Soll dieser Bewohner wirklich gelöscht werden?')) {
      await window.api.db.deleteResident(id);
      fetchResidents();
    }
  };

  return (
    <div className="residents-page">
      <header className="page-header">
        <div>
          <h1>Bewohnerverwaltung</h1>
          <p>{residents.length} Bewohner insgesamt</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={handleImport}>
            📥 CSV Import
          </Button>
          <Button variant="primary" onClick={handleOpenAddModal}>
            + Bewohner anlegen
          </Button>
        </div>
      </header>

      <div className="surface table-container">
        {isLoading ? (
          <p>Lade Bewohner...</p>
        ) : residents.length === 0 ? (
          <div className="empty-state">
            <p>Noch keine Bewohner angelegt.</p>
            <Button variant="primary" onClick={handleOpenAddModal}>Ersten Bewohner anlegen</Button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Wohnbereich</th>
                <th>Status</th>
                <th className="text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {residents.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.lastName}</strong>, {r.firstName}
                  </td>
                  <td>{r.ward || '-'}</td>
                  <td>
                    <span className={`badge badge-${r.status}`}>
                      {r.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(r)}>✏️</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}>🗑️</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingResident?.id ? 'Bewohner bearbeiten' : 'Neuen Bewohner anlegen'}
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>Abbrechen</Button>
            <Button variant="primary" onClick={handleSave}>Speichern</Button>
          </>
        }
      >
        <form className="resident-form" onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <Input 
              label="Vorname" 
              value={editingResident?.firstName || ''} 
              onChange={e => setEditingResident({...editingResident, firstName: e.target.value})}
              required
            />
            <Input 
              label="Nachname" 
              value={editingResident?.lastName || ''} 
              onChange={e => setEditingResident({...editingResident, lastName: e.target.value})}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <Input 
              label="Wohnbereich / Station" 
              value={editingResident?.ward || ''} 
              onChange={e => setEditingResident({...editingResident, ward: e.target.value})}
            />
            <Select 
              label="Status" 
              value={editingResident?.status || 'active'}
              onChange={e => setEditingResident({...editingResident, status: e.target.value as any})}
              options={[
                { value: 'active', label: 'Aktiv' },
                { value: 'inactive', label: 'Inaktiv' }
              ]}
            />
          </div>
          <Input 
            label="Anmerkungen" 
            value={editingResident?.notes || ''} 
            onChange={e => setEditingResident({...editingResident, notes: e.target.value})}
            fullWidth
          />
        </form>
      </Modal>
    </div>
  );
}
