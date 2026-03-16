import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider } from 'convex/react'
import './index.css'
import App from './App.jsx'
import { convexClient } from './lib/convexClient'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {convexClient ? (
      <ConvexProvider client={convexClient}>
        <App />
      </ConvexProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
)
