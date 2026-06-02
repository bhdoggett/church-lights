import { useEffect, useState } from 'react'
import { MainView } from './views/MainView'
import { SetupView } from './views/SetupView'
import { ConnectionBadge } from './components/ConnectionBadge'
import { CompanionModal } from './components/CompanionModal'
import type { Config, DmxStatus, Fixture, Scene } from '../shared/types'

type View = 'main' | 'setup'

export function App() {
  const [config, setConfig] = useState<Config | null>(null)
  const [view, setView] = useState<View>('main')
  const [dmxStatus, setDmxStatus] = useState<DmxStatus>('disconnected')
  const [companionOpen, setCompanionOpen] = useState(false)

  useEffect(() => {
    window.electronAPI.getConfig().then(setConfig)
    window.electronAPI.onDmxStatus(setDmxStatus)
  }, [])

  if (!config) {
    return <div style={{ color: '#fff', padding: 24 }}>Loading...</div>
  }

  const handleFixturesChange = (fixtures: Fixture[]) =>
    setConfig((c) => c ? { ...c, fixtures } : c)

  const handleScenesChange = (scenes: Scene[]) =>
    setConfig((c) => c ? { ...c, scenes } : c)

  const handlePortChange = async (port: number) => {
    await window.electronAPI.setPort(port)
    setConfig((c) => c ? { ...c, companionPort: port } : c)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#13131f', color: '#e5e7eb', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#0d0d1a', borderBottom: '1px solid #2a2a3e' }}>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>Church Lights</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ConnectionBadge status={dmxStatus} />
          {view === 'main' && (
            <button
              onClick={() => setView('setup')}
              title="Setup"
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 18 }}
            >
              ⚙
            </button>
          )}
          <button
            onClick={() => setCompanionOpen(true)}
            title="Companion / About"
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 18 }}
          >
            ℹ
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {view === 'main' ? (
          <MainView
            fixtures={config.fixtures}
            scenes={config.scenes}
            onScenesChange={handleScenesChange}
          />
        ) : (
          <SetupView
            fixtures={config.fixtures}
            onFixturesChange={handleFixturesChange}
            onBack={() => setView('main')}
          />
        )}
      </div>

      {companionOpen && (
        <CompanionModal
          scenes={config.scenes}
          port={config.companionPort}
          onPortChange={handlePortChange}
          onClose={() => setCompanionOpen(false)}
        />
      )}
    </div>
  )
}
