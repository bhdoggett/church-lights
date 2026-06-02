import { useState } from 'react'
import type { Scene } from '../../shared/types'

interface Props {
  scenes: Scene[]
  port: number
  onPortChange: (port: number) => void
  onClose: () => void
}

export function CompanionModal({ scenes, port, onPortChange, onClose }: Props) {
  const [draftPort, setDraftPort] = useState(String(port))
  const base = `http://localhost:${port}`

  const copyToClipboard = (text: string) => navigator.clipboard?.writeText(text)

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#1e1e2e', borderRadius: 12, padding: 28, minWidth: 520, maxWidth: 640, maxHeight: '80vh', overflowY: 'auto', border: '1px solid #2a2a3e' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#e5e7eb' }}>Bitfocus Companion Setup</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        <section style={{ marginBottom: 20 }}>
          <h3 style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 8px' }}>HTTP PORT</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number"
              value={draftPort}
              onChange={(e) => setDraftPort(e.target.value)}
              style={{ width: 100, padding: '6px 10px', borderRadius: 6, border: '1px solid #374151', background: '#13131f', color: '#fff' }}
            />
            <button
              onClick={() => onPortChange(Number(draftPort))}
              style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer' }}
            >
              Save
            </button>
          </div>
          <p style={{ color: '#6b7280', fontSize: 12, margin: '6px 0 0' }}>Restart the app after changing the port.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h3 style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 8px' }}>SCENE ENDPOINTS</h3>
          {scenes.length === 0 && <p style={{ color: '#6b7280', fontSize: 13 }}>No scenes saved yet.</p>}
          {scenes.map((scene) => {
            const url = `POST ${base}/scenes/${scene.id}/activate`
            return (
              <div key={scene.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#13131f', borderRadius: 6, marginBottom: 6 }}>
                <div>
                  <span style={{ color: '#e5e7eb', fontSize: 13 }}>{scene.name}</span>
                  <br />
                  <code style={{ color: '#6366f1', fontSize: 11 }}>{url}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(`${base}/scenes/${scene.id}/activate`)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #374151', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: 12 }}
                >
                  Copy
                </button>
              </div>
            )
          })}
        </section>

        <section>
          <h3 style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 8px' }}>HOW TO CONFIGURE COMPANION</h3>
          <ol style={{ color: '#9ca3af', fontSize: 13, margin: 0, paddingLeft: 20, lineHeight: 2 }}>
            <li>In Companion, add a button and choose <strong style={{ color: '#e5e7eb' }}>Generic HTTP</strong></li>
            <li>Set method to <strong style={{ color: '#e5e7eb' }}>POST</strong></li>
            <li>Paste the scene URL from above into the URL field</li>
            <li>Save — pressing the button will now fire that scene</li>
          </ol>
        </section>
      </div>
    </div>
  )
}
