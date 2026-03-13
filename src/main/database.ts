import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

let db: DatabaseType | null = null;

export function getDatabasePath() {
  const isDev = !app.isPackaged;
  const dbDir = isDev ? path.join(__dirname, '../../') : app.getPath('userData');
  return path.join(dbDir, 'btplan_data.sqlite');
}

export function initDatabase(): DatabaseType {
  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath, { verbose: console.log });
  db.pragma('journal_mode = WAL');

  db.exec(`CREATE TABLE IF NOT EXISTS residents (id TEXT PRIMARY KEY, firstName TEXT NOT NULL, lastName TEXT NOT NULL, status TEXT DEFAULT 'active', ward TEXT, notes TEXT);`);
  db.exec(`CREATE TABLE IF NOT EXISTS staff (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT DEFAULT 'Betreuungskraft');`);
  db.exec(`CREATE TABLE IF NOT EXISTS activities (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT, durationMinutes INTEGER DEFAULT 30, color TEXT DEFAULT '#4F46E5');`);
  db.exec(`CREATE TABLE IF NOT EXISTS appointments (id TEXT PRIMARY KEY, activityId TEXT NOT NULL, staffId TEXT, date TEXT NOT NULL, startTime TEXT NOT NULL, endTime TEXT NOT NULL, room TEXT, notes TEXT, notesInternal TEXT, prepMinutes INTEGER DEFAULT 0, isTP BOOLEAN DEFAULT 0, status TEXT DEFAULT 'scheduled', FOREIGN KEY (activityId) REFERENCES activities (id), FOREIGN KEY (staffId) REFERENCES staff (id));`);
  db.exec(`CREATE TABLE IF NOT EXISTS templates (id TEXT PRIMARY KEY, name TEXT NOT NULL, activityId TEXT, startTime TEXT, endTime TEXT, room TEXT, notes TEXT, isTP BOOLEAN DEFAULT 0);`);
  db.exec(`CREATE TABLE IF NOT EXISTS locations (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT);`);
  db.exec(`CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT DEFAULT '#6b7280');`);
  db.exec(`CREATE TABLE IF NOT EXISTS attendance (appointmentId TEXT NOT NULL, residentId TEXT NOT NULL, status TEXT DEFAULT 'planned', notes TEXT, isP BOOLEAN DEFAULT 0, PRIMARY KEY (appointmentId, residentId), FOREIGN KEY (appointmentId) REFERENCES appointments (id) ON DELETE CASCADE, FOREIGN KEY (residentId) REFERENCES residents (id) ON DELETE CASCADE);`);

  // Migrations: add missing columns to existing DBs
  const addColumnIfMissing = (table: string, column: string, def: string) => {
    try {
      db!.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`).run();
    } catch { /* Column already exists */ }
  };

  addColumnIfMissing('activities', 'category', 'TEXT');
  addColumnIfMissing('activities', 'durationMinutes', 'INTEGER DEFAULT 30');
  addColumnIfMissing('activities', 'color', 'TEXT DEFAULT "#4F46E5"');

  // Special Migration for attendance: eventId -> appointmentId
  try {
    const tableInfo = db!.prepare("PRAGMA table_info(attendance)").all() as any[];
    const hasEventId = tableInfo.some(col => col.name === 'eventId');
    if (hasEventId) {
      console.log('🔄 Migrating attendance table: eventId -> appointmentId');
      db!.transaction(() => {
        db!.exec(`
          CREATE TABLE attendance_new (
            appointmentId TEXT NOT NULL,
            residentId TEXT NOT NULL,
            status TEXT DEFAULT 'planned',
            notes TEXT,
            isP BOOLEAN DEFAULT 0,
            PRIMARY KEY (appointmentId, residentId),
            FOREIGN KEY (appointmentId) REFERENCES appointments (id) ON DELETE CASCADE,
            FOREIGN KEY (residentId) REFERENCES residents (id) ON DELETE CASCADE
          );
          INSERT INTO attendance_new (appointmentId, residentId, status)
          SELECT eventId, residentId, status FROM attendance;
          DROP TABLE attendance;
          ALTER TABLE attendance_new RENAME TO attendance;
        `);
      })();
    }
  } catch (e) {
    console.error('Migration failed:', e);
  }

  addColumnIfMissing('attendance', 'isP', 'BOOLEAN DEFAULT 0');
  addColumnIfMissing('attendance', 'notes', 'TEXT');
  addColumnIfMissing('appointments', 'notesInternal', 'TEXT');
  addColumnIfMissing('appointments', 'prepMinutes', 'INTEGER DEFAULT 0');
  addColumnIfMissing('appointments', 'isTP', 'BOOLEAN DEFAULT 0');

  console.log('✅ SQLite Database initialized at:', dbPath);
  return db;
}

export function getDb(): DatabaseType {
  if (!db) {
    throw new Error('Database not initialized! Call initDatabase first.');
  }
  return db;
}

export function seedDatabase(): void {
  const currentDb = getDb();
  const residentsCount = currentDb.prepare('SELECT COUNT(*) as count FROM residents').get() as { count: number };
  
  if (residentsCount.count > 0) return;

  console.log('🌱 Seeding database with realistic test data...');

  const residents = [
    { id: 'r1', firstName: 'Renate', lastName: 'Achtstätter', status: 'active', ward: 'WB 1' },
    { id: 'r2', firstName: 'Annette', lastName: 'Albert', status: 'active', ward: 'WB 1' },
    { id: 'r3', firstName: 'Gertrud', lastName: 'Andres', status: 'active', ward: 'WB 2' },
    { id: 'r4', firstName: 'Walter', lastName: 'Andrzejewski', status: 'active', ward: 'WB 2' },
    { id: 'r5', firstName: 'Mariana', lastName: 'Bucur', status: 'active', ward: 'WB 1' },
    { id: 'r6', firstName: 'Helmut', lastName: 'Böhmer', status: 'active', ward: 'WB 3' },
    { id: 'r7', firstName: 'Salvatore', lastName: 'Ciavolino', status: 'active', ward: 'WB 3' },
    { id: 'r8', firstName: 'Sibylle', lastName: 'Danner', status: 'active', ward: 'WB 2' },
    { id: 'r9', firstName: 'Herrmann', lastName: 'Endlich', status: 'active', ward: 'WB 1' },
    { id: 'r10', firstName: 'Heidrun', lastName: 'Fadler', status: 'active', ward: 'WB 2' },
  ];

  const staff = [
    { id: 's1', name: 'Eda Ambarian', role: 'Pflegefachkraft' },
    { id: 's2', name: 'Fabian Arnold', role: 'Sozialer Dienst' },
    { id: 's3', name: 'Rauda Assi', role: 'Betreuungskraft' },
    { id: 's4', name: 'Bennur Bekson', role: 'Ergotherapeut' },
    { id: 's5', name: 'Pietro Bellanova', role: 'Betreuungskraft' },
  ];

  const activities = [
    { id: 'a1', name: 'Gedächtnistraining', category: 'Therapie', durationMinutes: 60, color: '#4f46e5' },
    { id: 'a2', name: 'Sitzgymnastik', category: 'Mobilisierung', durationMinutes: 45, color: '#10b981' },
    { id: 'a3', name: 'Singkreis', category: 'Soziale Begleitung', durationMinutes: 60, color: '#f59e0b' },
    { id: 'a4', name: 'Einzelbetreuung Lesen', category: 'Einzelangebot', durationMinutes: 30, color: '#8b5cf6' },
    { id: 'a5', name: 'Industriemontage', category: 'Arbeitstherapie', durationMinutes: 180, color: '#6366f1' },
    { id: 'a6', name: 'Bibelstunde', category: 'Beschäftigungstherapie', durationMinutes: 90, color: '#0ea5e9' },
  ];

  const insertResident = currentDb.prepare('INSERT INTO residents (id, firstName, lastName, status, ward) VALUES (?, ?, ?, ?, ?)');
  const insertStaff = currentDb.prepare('INSERT INTO staff (id, name, role) VALUES (?, ?, ?)');
  const insertActivity = currentDb.prepare('INSERT INTO activities (id, name, category, durationMinutes, color) VALUES (?, ?, ?, ?, ?)');

  const tx = currentDb.transaction(() => {
    residents.forEach(r => insertResident.run(r.id, r.firstName, r.lastName, r.status, r.ward));
    staff.forEach(s => insertStaff.run(s.id, s.name, s.role));
    activities.forEach(a => insertActivity.run(a.id, a.name, a.category, a.durationMinutes, a.color));

    // Templates
    const insertTemplate = currentDb.prepare('INSERT INTO templates (id, name, activityId, startTime, endTime, room, notes, isTP) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertTemplate.run('t1', 'Gedächtnistraining WB 1', 'a1', '10:00', '11:00', 'Aufenthaltsraum', '', 1);
    insertTemplate.run('t2', 'Industriemontage Mo-Fr', 'a5', '08:30', '11:30', 'Arbeitstherapie', 'Mo-Fr Fokus', 1);

    // Appointments for today
    const dayStr = new Date().toISOString().split('T')[0];
    const insertAppt = currentDb.prepare('INSERT INTO appointments (id, activityId, staffId, date, startTime, endTime, room, notes, prepMinutes, isTP, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertAppt.run('temp-1', 'a5', 's2', dayStr, '08:30', '11:30', 'Arbeitstherapie', 'Regeltermin', 15, 1, 'scheduled');
  });

  tx();
  console.log('✅ Database seeded!');
}
