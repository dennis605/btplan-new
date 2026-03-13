export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  ward?: string;
  notes?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
}

export interface Activity {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  color: string;
}

export interface Appointment {
  id: string;
  activityId: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  room?: string;
  notes?: string;
  notesInternal?: string;
  prepMinutes?: number;
  isTP?: boolean;
  status: string;
}

export interface Attendance {
  appointmentId: string;
  residentId: string;
  status: string;
  notes?: string;
  isP?: boolean;
  firstName?: string;
  lastName?: string;
}

export interface Template {
  id: string;
  name: string;
  activityId: string;
  startTime: string;
  endTime: string;
  room?: string;
  notes?: string;
  isTP?: boolean;
}
