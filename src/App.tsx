import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DetailPage } from './pages/DetailPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { HomePage } from './pages/HomePage'
import { MyListingsPage } from './pages/MyListingsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { TermsPage } from './pages/TermsPage'
import { AddListingPage } from './pages/AddListingPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="properti/:id" element={<DetailPage />} />
        <Route path="favorit" element={<FavoritesPage />} />
        <Route path="tambah-iklan" element={<AddListingPage />} />
        <Route path="tambah-iklan/:id" element={<AddListingPage />} />
        <Route path="iklan-saya" element={<MyListingsPage />} />
        <Route path="syarat-ketentuan" element={<TermsPage />} />
        <Route path="kebijakan-privasi" element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
