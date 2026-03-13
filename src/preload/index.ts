import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  db: {
    getResidents: () => ipcRenderer.invoke('db:get-residents'),
    createResident: (data: any) => ipcRenderer.invoke('db:create-resident', data),
    updateResident: (data: any) => ipcRenderer.invoke('db:update-resident', data),
    deleteResident: (id: string) => ipcRenderer.invoke('db:delete-resident', id),
    bulkSyncResidents: (residents: any[]) => ipcRenderer.invoke('db:bulk-sync-residents', residents),
    // Staff
    getStaff: () => ipcRenderer.invoke('db:get-staff'),
    createStaff: (data: any) => ipcRenderer.invoke('db:create-staff', data),
    updateStaff: (data: any) => ipcRenderer.invoke('db:update-staff', data),
    deleteStaff: (id: string) => ipcRenderer.invoke('db:delete-staff', id),
    // Activities
    getActivities: () => ipcRenderer.invoke('db:get-activities'),
    createActivity: (data: any) => ipcRenderer.invoke('db:create-activity', data),
    updateActivity: (data: any) => ipcRenderer.invoke('db:update-activity', data),
    deleteActivity: (id: string) => ipcRenderer.invoke('db:delete-activity', id),
    // Appointments
    getAppointments: (dateRange?: { start: string; end: string }) => ipcRenderer.invoke('db:get-appointments', dateRange),
    createAppointment: (data: any) => ipcRenderer.invoke('db:create-appointment', data),
    updateAppointment: (data: any) => ipcRenderer.invoke('db:update-appointment', data),
    deleteAppointment: (id: string) => ipcRenderer.invoke('db:delete-appointment', id),
    // Templates
    getTemplates: () => ipcRenderer.invoke('db:get-templates'),
    createTemplate: (data: any) => ipcRenderer.invoke('db:create-template', data),
    // Attendance
    getAttendance: (appointmentId: string) => ipcRenderer.invoke('db:get-attendance', appointmentId),
    updateAttendance: (appointmentId: string, residents: any[]) => ipcRenderer.invoke('db:update-attendance', appointmentId, residents)
  },
  app: {
    selectFile: () => ipcRenderer.invoke('app:select-file'),
    readFile: (path: string) => ipcRenderer.invoke('app:read-file', path),
    savePdf: (fileName: string) => ipcRenderer.invoke('app:save-pdf', fileName)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
