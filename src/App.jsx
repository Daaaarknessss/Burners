import { useState } from 'react'
import Onboarding from './Onboarding'
import Dashboard from './Dashboard'

const STORAGE_CHOICE = 'burners.choice.v1'

export default function App() {
  const [chosen, setChosen] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_CHOICE)) || null } catch { return null }
  })
  const [transitioning, setTransitioning] = useState(false)

  const handleComplete = (ids) => {
    setChosen(ids)
    try { localStorage.setItem(STORAGE_CHOICE, JSON.stringify(ids)) } catch {}
  }

  const handleReset = () => {
    setTransitioning(true)
    setTimeout(() => {
      try {
        localStorage.removeItem(STORAGE_CHOICE)
        localStorage.removeItem('burners.v1')
      } catch {}
      setChosen(null)
      setTransitioning(false)
    }, 380)
  }

  return (
    <div className="stage" data-screen-label={chosen ? 'Dashboard' : 'Onboarding'}>
      {chosen && chosen.length > 0
        ? <Dashboard chosen={chosen} onReset={handleReset} />
        : <Onboarding onComplete={handleComplete} />}
      <div className={'wipe ' + (transitioning ? 'run' : '')} />
    </div>
  )
}
