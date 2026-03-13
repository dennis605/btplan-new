import { useState, useEffect, ReactElement } from 'react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input, Select } from '../components/Input';
import { Activity } from '../types';
import './Activities.css';

export function ActivitiesPage(): ReactElement {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Partial<Activity> | null>(null);

  const fetchActivities = async () => {
    const data = await window.api.db.getActivities();
    setActivities(data);
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleOpenAddModal = () => {
    setEditingActivity({ name: '', category: 'Gruppe', durationMinutes: 30, color: '#4f46e5' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (activity: Activity) => {
    setEditingActivity(activity);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity?.name) return;

    try {
      if (editingActivity.id) {
        await window.api.db.updateActivity(editingActivity);
      } else {
        await window.api.db.createActivity(editingActivity);
      }
      fetchActivities();
      setIsModalOpen(false);
    } catch (error) {
      alert('Fehler beim Speichern der Aktivität');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Soll diese Aktivitätsart gelöscht werden?')) {
      await window.api.db.deleteActivity(id);
      fetchActivities();
    }
  };

  return (
    <div className="activities-page">
      <header className="page-header">
        <div>
          <h1>Aktivitätstypen</h1>
          <p>Definition von regelmäßigen Betreuungsangeboten</p>
        </div>
        <Button variant="primary" onClick={handleOpenAddModal}>+ Aktivitätstyp erstellen</Button>
      </header>

      <div className="activity-grid">
        {activities.map(a => (
          <div key={a.id} className="surface activity-card" style={{ borderLeft: `6px solid ${a.color}` }}>
            <div className="activity-info">
              <h3>{a.name}</h3>
              <p className="badge badge-secondary">{a.category}</p>
              <p className="duration">⏱ {a.durationMinutes} Min.</p>
            </div>
            <div className="card-actions">
              <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(a)}>✏️</Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}>🗑️</Button>
            </div>
          </div>
        ))}
        {activities.length === 0 && <p className="empty-msg">Noch keine Aktivitäten definiert.</p>}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingActivity?.id ? 'Aktivität bearbeiten' : 'Neue Aktivität erstellen'}
        footer={
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Abbrechen</Button>
            <Button variant="primary" onClick={handleSave}>Speichern</Button>
          </div>
        }
      >
        <form className="activity-form" onSubmit={handleSave}>
          <Input 
            label="Name der Aktivität" 
            value={editingActivity?.name || ''} 
            onChange={e => setEditingActivity({...editingActivity, name: e.target.value})}
            required
            fullWidth
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <Select 
              label="Kategorie" 
              value={editingActivity?.category || 'Gruppe'}
              onChange={e => setEditingActivity({...editingActivity, category: e.target.value})}
              options={[
                { value: 'Gruppe', label: 'Gruppe' },
                { value: 'Einzel', label: 'Einzelangebot' },
                { value: 'Ausflug', label: 'Ausflug' }
              ]}
            />
            <Input 
              label="Standard-Dauer (Min)" 
              type="number"
              value={editingActivity?.durationMinutes || 30} 
              onChange={e => setEditingActivity({...editingActivity, durationMinutes: parseInt(e.target.value)})}
            />
          </div>
          <Input 
            label="Farbe im Kalender" 
            type="color"
            value={editingActivity?.color || '#4f46e5'} 
            onChange={e => setEditingActivity({...editingActivity, color: e.target.value})}
            style={{ padding: '2px', height: '44px' }}
          />
        </form>
      </Modal>
    </div>
  );
}
