import { useState, ReactElement } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Appointment, Activity } from '../types';
import './Search.css';

export function SearchPage(): ReactElement {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState<Appointment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    // In a real app, we would have a specific search IPC handler.
    // For now, we fetch all and filter in frontend for MVP simplicity.
    const [allAppts, allActs] = await Promise.all([
      window.api.db.getAppointments(),
      window.api.db.getActivities()
    ]);
    
    setActivities(allActs);
    
    const filtered = allAppts.filter(a => {
      const act = allActs.find(x => x.id === a.activityId);
      const matchesName = act?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (a.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFrom = !dateFrom || a.date >= dateFrom;
      const matchesTo = !dateTo || a.date <= dateTo;
      return matchesName && matchesFrom && matchesTo;
    });

    setResults(filtered);
    setHasSearched(true);
  };

  return (
    <div className="search-page">
      <header className="page-header">
        <h1>Veranstaltung suchen</h1>
      </header>

      <div className="surface search-form">
        <div className="form-group-inline">
          <Input 
            label="Name" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Name oder Stichwort..."
          />
        </div>
        <div className="form-group-inline">
          <Input 
            label="Datum von" 
            type="date" 
            value={dateFrom} 
            onChange={e => setDateFrom(e.target.value)} 
          />
        </div>
        <div className="form-group-inline">
          <Input 
            label="Datum bis" 
            type="date" 
            value={dateTo} 
            onChange={e => setDateTo(e.target.value)} 
          />
        </div>
        <div className="search-actions">
          <Button variant="primary" onClick={handleSearch}>suchen</Button>
        </div>
      </div>

      {hasSearched && (
        <div className="search-results surface">
          <h3>Ergebnisse ({results.length})</h3>
          <div className="results-list">
            {results.map(r => {
              const act = activities.find(a => a.id === r.activityId);
              return (
                <div key={r.id} className="result-item">
                  <div className="result-date">{format(new Date(r.date), 'dd.MM.yyyy', { locale: de })}</div>
                  <div className="result-info">
                    <strong>{act?.name}</strong> von {r.startTime} bis {r.endTime}
                    {r.room && <span className="result-room"> | Ort: {r.room}</span>}
                  </div>
                </div>
              );
            })}
            {results.length === 0 && <p className="empty">Keine Veranstaltungen gefunden.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
