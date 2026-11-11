import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './lib/auth'
import { FavoritesProvider } from './lib/favorites'
import { ListingsProvider } from './lib/listings'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ListingsProvider>
          <FavoritesProvider>
            <App />
          </FavoritesProvider>
        </ListingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
