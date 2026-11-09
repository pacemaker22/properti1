import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DetailPage } from './pages/DetailPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="properti/:id" element={<DetailPage />} />
        <Route path="favorit" element={<FavoritesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
