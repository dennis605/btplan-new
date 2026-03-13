import type { ReactElement } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { ResidentsPage } from './pages/Residents'
import { ActivitiesPage } from './pages/Activities'
import { StaffPage } from './pages/Staff'
import { CalendarPage } from './pages/Calendar'
import { DayViewPage } from './pages/DayView'
import { ReportsPage } from './pages/Reports'
import { SearchPage } from './pages/Search'
import { DayListPage } from './pages/DayList'

function App(): ReactElement {
  return (
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          {/* Weitere Routen folgen später */}
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="daylist" element={<DayListPage />} />
          <Route path="dayview" element={<DayViewPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="residents" element={<ResidentsPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="staff" element={<StaffPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

export default App
