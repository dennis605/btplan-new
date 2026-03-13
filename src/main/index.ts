import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import fs from 'fs'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, getDb, seedDatabase } from './database'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200, // Make it wider for better overview
    height: 850,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Init DB first
  initDatabase()
  seedDatabase()

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Database IPC Handlers (MVP)
  // --- RESIDENTS ---
  ipcMain.handle('db:get-residents', () => {
    try {
      return getDb().prepare('SELECT * FROM residents ORDER BY lastName ASC').all()
    } catch (error) {
      console.error('Failed to get residents:', error)
      return []
    }
  })

  ipcMain.handle('db:create-resident', (_, data) => {
    try {
      const id = require('crypto').randomUUID()
      const stmt = getDb().prepare(`
        INSERT INTO residents (id, firstName, lastName, status, ward, notes)
        VALUES (@id, @firstName, @lastName, @status, @ward, @notes)
      `)
      stmt.run({ id, ...data, status: data.status || 'active' })
      return { success: true, id }
    } catch (error) {
      console.error('Failed to create resident:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('db:update-resident', (_, data) => {
    try {
      const stmt = getDb().prepare(`
        UPDATE residents 
        SET firstName = @firstName, lastName = @lastName, status = @status, 
            ward = @ward, notes = @notes
        WHERE id = @id
      `)
      stmt.run(data)
      return { success: true }
    } catch (error) {
      console.error('Failed to update resident:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('db:delete-resident', (_, id) => {
    try {
      getDb().prepare('DELETE FROM residents WHERE id = ?').run(id)
      return { success: true }
    } catch (error) {
      console.error('Failed to delete resident:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('app:select-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'CSV Dateien', extensions: ['csv'] }]
    })
    if (canceled) return null
    return filePaths[0]
  })

  ipcMain.handle('app:read-file', (_, filePath: string) => {
    try {
      return fs.readFileSync(filePath, 'utf-8')
    } catch (error) {
      console.error('Failed to read file:', error)
      return null
    }
  })

  ipcMain.handle('db:bulk-sync-residents', (_, residents: any[]) => {
    const db = getDb()
    const insert = db.prepare(`
      INSERT OR REPLACE INTO residents (id, firstName, lastName, status, ward, notes)
      VALUES (@id, @firstName, @lastName, @status, @ward, @notes)
    `)

    const syncTransaction = db.transaction((list) => {
      for (const res of list) {
        insert.run({
          id: res.id || require('crypto').randomUUID(),
          firstName: res.firstName,
          lastName: res.lastName,
          status: res.status || 'active',
          ward: res.ward || '',
          notes: res.notes || ''
        })
      }
    })

    try {
      syncTransaction(residents)
      return { success: true, count: residents.length }
    } catch (error) {
      console.error('Bulk sync failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // --- STAFF ---
  ipcMain.handle('db:get-staff', () => {
    try {
      return getDb().prepare('SELECT * FROM staff ORDER BY name ASC').all()
    } catch (error) {
      console.error('Failed to get staff:', error)
      return []
    }
  })

  ipcMain.handle('db:create-staff', (_, data) => {
    try {
      const id = require('crypto').randomUUID()
      const stmt = getDb().prepare('INSERT INTO staff (id, name, role) VALUES (@id, @name, @role)')
      stmt.run({ id, ...data })
      return { success: true, id }
    } catch (error) {
      console.error('Failed to create staff:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('db:update-staff', (_, data) => {
    try {
      const stmt = getDb().prepare('UPDATE staff SET name = @name, role = @role WHERE id = @id')
      stmt.run(data)
      return { success: true }
    } catch (error) {
      console.error('Failed to update staff:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('db:delete-staff', (_, id) => {
    try {
      getDb().prepare('DELETE FROM staff WHERE id = ?').run(id)
      return { success: true }
    } catch (error) {
      console.error('Failed to delete staff:', error)
      return { success: false, error: String(error) }
    }
  })

  // --- ACTIVITIES ---
  ipcMain.handle('db:get-activities', () => {
    try {
      return getDb().prepare('SELECT * FROM activities ORDER BY name ASC').all()
    } catch (error) {
      console.error('Failed to get activities:', error)
      return []
    }
  })

  ipcMain.handle('db:create-activity', (_, data) => {
    try {
      const id = require('crypto').randomUUID()
      const stmt = getDb().prepare(`
        INSERT INTO activities (id, name, category, durationMinutes, color) 
        VALUES (@id, @name, @category, @durationMinutes, @color)
      `)
      stmt.run({ id, ...data })
      return { success: true, id }
    } catch (error) {
      console.error('Failed to create activity:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('db:update-activity', (_, data) => {
    try {
      const stmt = getDb().prepare(`
        UPDATE activities SET name = @name, category = @category, 
        durationMinutes = @durationMinutes, color = @color WHERE id = @id
      `)
      stmt.run(data)
      return { success: true }
    } catch (error) {
      console.error('Failed to update activity:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('db:delete-activity', (_, id) => {
    try {
      getDb().prepare('DELETE FROM activities WHERE id = ?').run(id)
      return { success: true }
    } catch (error) {
      console.error('Failed to delete activity:', error)
      return { success: false, error: String(error) }
    }
  })

  // --- APPOINTMENTS ---
  ipcMain.handle('db:get-appointments', (_, dateRange?: { start: string; end: string }) => {
    try {
      if (dateRange) {
        return getDb().prepare('SELECT * FROM appointments WHERE date BETWEEN ? AND ?').all(dateRange.start, dateRange.end)
      }
      return getDb().prepare('SELECT * FROM appointments').all()
    } catch (error) {
      console.error('Failed to get appointments:', error)
      return []
    }
  })

  ipcMain.handle('db:create-appointment', (_, data) => {
    try {
      const id = require('crypto').randomUUID()
      const stmt = getDb().prepare(`
        INSERT INTO appointments (id, activityId, staffId, date, startTime, endTime, room, notes, notesInternal, prepMinutes, isTP, status)
        VALUES (@id, @activityId, @staffId, @date, @startTime, @endTime, @room, @notes, @notesInternal, @prepMinutes, @isTP, @status)
      `)
      stmt.run({ 
        id, 
        ...data, 
        notesInternal: data.notesInternal || '',
        prepMinutes: data.prepMinutes || 0,
        isTP: data.isTP ? 1 : 0,
        status: data.status || 'scheduled' 
      })
      return { success: true, id }
    } catch (error) {
      console.error('Failed to create appointment:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('db:update-appointment', (_, data) => {
    try {
      const stmt = getDb().prepare(`
        UPDATE appointments 
        SET activityId = @activityId, staffId = @staffId, date = @date, 
            startTime = @startTime, endTime = @endTime, room = @room, 
            notes = @notes, notesInternal = @notesInternal, prepMinutes = @prepMinutes, 
            isTP = @isTP, status = @status
        WHERE id = @id
      `)
      stmt.run({
        ...data,
        isTP: data.isTP ? 1 : 0
      })
      return { success: true }
    } catch (error) {
      console.error('Failed to update appointment:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('db:delete-appointment', (_, id) => {
    try {
      getDb().prepare('DELETE FROM appointments WHERE id = ?').run(id)
      return { success: true }
    } catch (error) {
      console.error('Failed to delete appointment:', error)
      return { success: false, error: String(error) }
    }
  })

  // --- LOCATIONS ---
  ipcMain.handle('db:get-locations', () => {
    try { return getDb().prepare('SELECT * FROM locations ORDER BY name').all() }
    catch { return [] }
  })
  ipcMain.handle('db:create-location', (_, data) => {
    try {
      const id = require('crypto').randomUUID()
      getDb().prepare('INSERT INTO locations (id, name, description) VALUES (@id, @name, @description)').run({ id, ...data, description: data.description || '' })
      return { success: true, id }
    } catch (e) { return { success: false, error: String(e) } }
  })
  ipcMain.handle('db:update-location', (_, data) => {
    try {
      getDb().prepare('UPDATE locations SET name = @name, description = @description WHERE id = @id').run(data)
      return { success: true }
    } catch (e) { return { success: false, error: String(e) } }
  })
  ipcMain.handle('db:delete-location', (_, id) => {
    try { getDb().prepare('DELETE FROM locations WHERE id = ?').run(id); return { success: true } }
    catch (e) { return { success: false, error: String(e) } }
  })

  // --- CATEGORIES ---
  ipcMain.handle('db:get-categories', () => {
    try { return getDb().prepare('SELECT * FROM categories ORDER BY name').all() }
    catch { return [] }
  })
  ipcMain.handle('db:create-category', (_, data) => {
    try {
      const id = require('crypto').randomUUID()
      getDb().prepare('INSERT INTO categories (id, name, color) VALUES (@id, @name, @color)').run({ id, name: data.name, color: data.color || '#6b7280' })
      return { success: true, id }
    } catch (e) { return { success: false, error: String(e) } }
  })
  ipcMain.handle('db:update-category', (_, data) => {
    try {
      getDb().prepare('UPDATE categories SET name = @name, color = @color WHERE id = @id').run(data)
      return { success: true }
    } catch (e) { return { success: false, error: String(e) } }
  })
  ipcMain.handle('db:delete-category', (_, id) => {
    try { getDb().prepare('DELETE FROM categories WHERE id = ?').run(id); return { success: true } }
    catch (e) { return { success: false, error: String(e) } }
  })

  // --- TEMPLATES ---
  ipcMain.handle('db:get-templates', () => {
    try {
      return getDb().prepare('SELECT * FROM templates ORDER BY name').all()
    } catch (error) {
      console.error('Failed to get templates:', error)
      return []
    }
  })

  ipcMain.handle('db:create-template', (_, data) => {
    try {
      const id = require('crypto').randomUUID()
      const stmt = getDb().prepare(`
        INSERT INTO templates (id, name, activityId, startTime, endTime, room, notes, isTP)
        VALUES (@id, @name, @activityId, @startTime, @endTime, @room, @notes, @isTP)
      `)
      stmt.run({ id, ...data, isTP: data.isTP ? 1 : 0 })
      return { success: true, id }
    } catch (error) {
      console.error('Failed to create template:', error)
      return { success: false, error: String(error) }
    }
  })

  // --- ATTENDANCE ---
  ipcMain.handle('db:get-attendance', (_, appointmentId: string) => {
    try {
      return getDb().prepare(`
        SELECT a.*, r.firstName, r.lastName 
        FROM attendance a
        JOIN residents r ON a.residentId = r.id
        WHERE a.appointmentId = ?
      `).all(appointmentId)
    } catch (error) {
      console.error('Failed to get attendance:', error)
      return []
    }
  })

  ipcMain.handle('db:update-attendance', (_, appointmentId: string, residents: { residentId: string; status: string; notes?: string; isP?: boolean }[]) => {
    const db = getDb()
    const deleteStmt = db.prepare('DELETE FROM attendance WHERE appointmentId = ?')
    const insertStmt = db.prepare(`
      INSERT INTO attendance (appointmentId, residentId, status, notes, isP)
      VALUES (?, ?, ?, ?, ?)
    `)

    const syncTx = db.transaction((id, list) => {
      deleteStmt.run(id)
      for (const item of list) {
        insertStmt.run(id, item.residentId, item.status || 'planned', item.notes || '', item.isP ? 1 : 0)
      }
    })

    try {
      syncTx(appointmentId, residents)
      return { success: true }
    } catch (error) {
      console.error('Failed to sync attendance:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('app:save-pdf', async (_, fileName: string) => {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: fileName,
      filters: [{ name: 'PDF Dateien', extensions: ['pdf'] }]
    })

    if (!filePath) return { success: false }

    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { success: false }

    const data = await win.webContents.printToPDF({
      printBackground: true,
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    })

    try {
      fs.writeFileSync(filePath, data)
      shell.openPath(filePath)
      return { success: true }
    } catch (error) {
      console.error('Failed to save PDF:', error)
      return { success: false, error: String(error) }
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
