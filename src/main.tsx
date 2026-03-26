import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const globalScope = globalThis as typeof globalThis & { global?: typeof globalThis }
globalScope.global ??= globalThis

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
