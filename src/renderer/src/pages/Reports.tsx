import { useState, useEffect, ReactElement } from 'react';
import { format, eachMonthOfInterval, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '../components/Button';
import { Resident } from '../types';
import './Reports.css';

export function ReportsPage(): ReactElement {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResident, setSelectedResident] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));

  const months = eachMonthOfInterval({
    start: subMonths(new Date(), 6),
    end: new Date()
  }).reverse();

  useEffect(() => {
    window.api.db.getResidents().then(setResidents);
  }, []);

  const handleExportPDF = async () => {
    if (!selectedResident) {
      alert('Bitte wählen Sie einen Bewohner aus.');
      return;
    }

    const res = residents.find(r => r.id === selectedResident);
    const fileName = `Monatsnachweis_${res?.lastName}_${selectedMonth}.pdf`;

    // In a real app, we would probably open a specific hidden print window
    // with a specialized template. For this MVP, we use the current view's print.
    // We add a 'print-only' class to the body to trigger CSS media queries if needed.
    
    document.body.classList.add('exporting-pdf');
    const result = await window.api.app.savePdf(fileName);
    document.body.classList.remove('exporting-pdf');

    if (result.success) {
      // PDF was saved and opened
    } else if (result.error) {
      alert('Fehler beim Export: ' + result.error);
    }
  };

  return (
    <div className="reports-page">
      <header className="page-header">
        <div>
          <h1>Berichte & Dokumentation</h1>
          <p>Exportiere Teilnahmelisten und Monatsnachweise für Bewohner.</p>
        </div>
      </header>

      <div className="surface reports-form">
        <section className="export-section">
          <h3>Monatsnachweis (§ 43b)</h3>
          <p className="description">Generiere eine Übersicht aller besuchten Aktivitäten eines Bewohners für den gewählten Monat.</p>
          
          <div className="form-row">
            <div className="form-group">
              <label>Bewohner wählen</label>
              <select 
                className="form-select" 
                value={selectedResident} 
                onChange={e => setSelectedResident(e.target.value)}
              >
                <option value="">-- Bewohner wählen --</option>
                {residents.map(r => (
                  <option key={r.id} value={r.id}>{r.lastName}, {r.firstName}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Monat wählen</label>
              <select 
                className="form-select" 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value)}
              >
                {months.map(m => (
                  <option key={format(m, 'yyyy-MM')} value={format(m, 'yyyy-MM')}>
                    {format(m, 'MMMM yyyy', { locale: de })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button variant="primary" onClick={handleExportPDF} disabled={!selectedResident}>
            📄 Als PDF exportieren
          </Button>
        </section>

        <hr />

        <section className="export-section">
          <h3>Wochen-Aushang</h3>
          <p className="description">Drucken Sie den aktuellen Wochenplan für den Aushang im Wohnbereich.</p>
          <Button variant="secondary" onClick={() => window.print()}>
            🖨️ Wochenplan drucken
          </Button>
        </section>
      </div>

      <div className="print-template">
        {/* Dieses Element ist nur im PDF/Druck sichtbar via CSS */}
        <h1>Monatsnachweis Soziale Betreuung</h1>
        {selectedResident && (
          <div className="print-header">
            <p><strong>Bewohner:</strong> {residents.find(r => r.id === selectedResident)?.lastName}, {residents.find(r => r.id === selectedResident)?.firstName}</p>
            <p><strong>Zeitraum:</strong> {format(new Date(selectedMonth), 'MMMM yyyy', { locale: de })}</p>
          </div>
        )}
        <p>Dies ist eine automatisch generierte Übersicht der erbrachten Leistungen nach § 43b SGB XI.</p>
        <div className="empty-print-box">
          [Hier folgt die detaillierte Liste der Termine aus der Datenbank]
        </div>
      </div>
    </div>
  );
}
