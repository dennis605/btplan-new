import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      db: {
        getResidents: () => Promise<any[]>
        createResident: (data: any) => Promise<{ success: boolean; id?: string; error?: string }>
        updateResident: (data: any) => Promise<{ success: boolean; error?: string }>
        deleteResident: (id: string) => Promise<{ success: boolean; error?: string }>
        bulkSyncResidents: (residents: any[]) => Promise<{ success: boolean; count?: number; error?: string }>
        // Staff
        getStaff: () => Promise<any[]>
        createStaff: (data: any) => Promise<{ success: boolean; id?: string; error?: string }>
        updateStaff: (data: any) => Promise<{ success: boolean; error?: string }>
        deleteStaff: (id: string) => Promise<{ success: boolean; error?: string }>
        // Activities
        getActivities: () => Promise<any[]>
        createActivity: (data: any) => Promise<{ success: boolean; id?: string; error?: string }>
        updateActivity: (data: any) => Promise<{ success: boolean; error?: string }>
        deleteActivity: (id: string) => Promise<{ success: boolean; error?: string }>
        // Appointments
        getAppointments: (dateRange?: { start: string; end: string }) => Promise<any[]>
        createAppointment: (data: any) => Promise<{ success: boolean; id?: string; error?: string }>
        updateAppointment: (data: any) => Promise<{ success: boolean; error?: string }>
        deleteAppointment: (id: string) => Promise<{ success: boolean; error?: string }>
        // Templates
        getTemplates: () => Promise<any[]>
        createTemplate: (data: any) => Promise<{ success: boolean; id?: string; error?: string }>
        deleteTemplate: (id: string) => Promise<{ success: boolean; error?: string }>
        // Attendance
        getAttendance: (appointmentId: string) => Promise<any[]>
        updateAttendance: (appointmentId: string, residents: any[]) => Promise<{ success: boolean; error?: string }>
        // Locations
        getLocations: () => Promise<any[]>
        createLocation: (data: any) => Promise<{ success: boolean; id?: string; error?: string }>
        updateLocation: (data: any) => Promise<{ success: boolean; error?: string }>
        deleteLocation: (id: string) => Promise<{ success: boolean; error?: string }>
        // Categories
        getCategories: () => Promise<any[]>
        createCategory: (data: any) => Promise<{ success: boolean; id?: string; error?: string }>
        updateCategory: (data: any) => Promise<{ success: boolean; error?: string }>
        deleteCategory: (id: string) => Promise<{ success: boolean; error?: string }>
      },
      app: {
        selectFile: () => Promise<string | null>,
        readFile: (path: string) => Promise<string | null>,
        savePdf: (fileName: string) => Promise<{ success: boolean; error?: string }>
      }
    }
  }
}
