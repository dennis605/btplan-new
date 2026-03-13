import { useState, useEffect, ReactElement } from 'react';
import { Button } from '../components/Button';
import './Reports.css';

// Minimal, crash-safe implementation
export function ReportsPage(): ReactElement {
  const [residents, setResidents] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedResident, setSelectedResident] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasReport, setHasReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build current month default
  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  }, []);

  useEffect(() => {
    try {
      window.api.db.getResidents().then(setResidents).catch(console.error);
      window.api.db.getActivities().then(setActivities).catch(console.error);
    } catch (e) {
      console.error('Failed to load data', e);
    }
  }, []);

  // Generate month options from last 6 months
  const monthOptions = (() => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
      opts.push({ value, label });
    }
    return opts;
  })();

  const handleGenerateReport = async () => {
    if (!selectedResident) {
      alert('Bitte wählen Sie einen Bewohner aus.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const appts = await window.api.db.getAppointments({ start, end });
      const records: any[] = [];

      for (const appt of appts) {
        const attendance = await window.api.db.getAttendance(appt.id);
        const resAtt = attendance.find((a: any) => a.residentId === selectedResident);
        if (resAtt) {
          records.push({
            ...resAtt,
            appointment: appt,
            activity: activities.find((a: any) => a.id === appt.activityId),
          });
        }
      }

      setReportData(records);
      setHasReport(true);
    } catch (e: any) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    const res = residents.find((r: any) => r.id === selectedResident);
    const fileName = `Monatsnachweis_${res?.lastName || 'Unbekannt'}_${selectedMonth}.pdf`;
    try {
      const result = await window.api.app.savePdf(fileName);
      if (!result.success && result.error) {
        alert('Fehler: ' + result.error);
      }
    } catch (e) {
      alert('PDF-Export fehlgeschlagen: ' + e);
    }
  };

  const resident = residents.find((r: any) => r.id === selectedResident);
  const attendedCount = reportData.filter(r => r.status === 'attended').length;
  const monthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth;

  const formatDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      return `${d}.${m}.${y}`;
    } catch {
      return dateStr;
    }
  };

  const statusLabel = (status: string) => {
    if (status === 'attended') return { icon: '✅', text: 'Anwesend', cls: 'status-attended' };
    if (status === 'sick') return { icon: '🤒', text: 'Krank', cls: 'status-sick' };
    if (status === 'cancelled') return { icon: '❌', text: 'Abgelehnt', cls: 'status-cancelled' };
    return { icon: '⏳', text: 'Geplant', cls: 'status-planned' };
  };

  return (
    <div className="reports-page">
      <header className="page-header">
        <div>
          <h1>Berichte & Dokumentation</h1>
          <p>Exportiere Teilnahmelisten und Monatsnachweise nach § 43b SGB XI.</p>
        </div>
      </header>

      <div className="surface reports-controls">
        <div className="controls-row">
          <div className="form-group">
            <label>Bewohner</label>
            <select
              className="form-select"
              value={selectedResident}
              onChange={e => { setSelectedResident(e.target.value); setHasReport(false); }}
            >
              <option value="">-- Bewohner wählen --</option>
              {residents.map((r: any) => (
                <option key={r.id} value={r.id}>{r.lastName}, {r.firstName}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Monat</label>
            <select
              className="form-select"
              value={selectedMonth}
              onChange={e => { setSelectedMonth(e.target.value); setHasReport(false); }}
            >
              {monthOptions.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="controls-actions">
            <Button variant="secondary" onClick={handleGenerateReport} disabled={!selectedResident || isLoading}>
              {isLoading ? 'Lade...' : '🔍 Vorschau'}
            </Button>
            <Button variant="primary" onClick={handleExportPDF} disabled={!hasReport}>
              📄 PDF exportieren
            </Button>
          </div>
        </div>
        {error && <p style={{ color: 'red', marginTop: '8px' }}>Fehler: {error}</p>}
      </div>

      {hasReport && (
        <div className="surface report-preview" id="print-area">
          <div className="report-header-row">
            <div>
              <h2>Monatsnachweis Soziale Betreuung</h2>
              <p style={{ margin: 0 }}>
                <strong>{resident?.lastName}, {resident?.firstName}</strong> &mdash; {monthLabel}
              </p>
            </div>
            <div className="report-summary-badge">
              <span className="badge-number">{attendedCount}</span>
              <span className="badge-label">von {reportData.length} Terminen besucht</span>
            </div>
          </div>

          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Zeit</th>
                  <th>Aktivität</th>
                  <th>Ort</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty">
                      Keine Termine mit Teilnahme für diesen Monat gefunden.
                    </td>
                  </tr>
                ) : (
                  reportData.map((record: any, idx: number) => {
                    const s = statusLabel(record.status);
                    return (
                      <tr key={idx}>
                        <td>{record.appointment ? formatDate(record.appointment.date) : '-'}</td>
                        <td>{record.appointment?.startTime} – {record.appointment?.endTime}</td>
                        <td style={{ fontWeight: 600 }}>{record.activity?.name || '-'}</td>
                        <td>{record.appointment?.room || '-'}</td>
                        <td>
                          <span className={`status-badge ${s.cls}`}>
                            {s.icon} {s.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="report-footer">
            <p>Generiert am {new Date().toLocaleDateString('de-DE')} | Gemäß § 43b SGB XI</p>
          </div>
        </div>
      )}

      <div className="surface" style={{ padding: 'var(--spacing-lg)' }}>
        <h3>Wochen-Aushang drucken</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>
          Drucken Sie den aktuellen Wochenplan für den Aushang im Wohnbereich.
        </p>
        <Button variant="secondary" onClick={() => window.print()}>
          🖨️ Aktuellen Plan drucken
        </Button>
      </div>
    </div>
  );
}
