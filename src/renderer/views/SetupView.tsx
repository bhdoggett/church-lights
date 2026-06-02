import { useState, useCallback } from 'react'
import { ChannelList } from '../components/ChannelList'
import { ChannelEditor } from '../components/ChannelEditor'
import { useIpc } from '../hooks/useIpc'
import type { Fixture } from '../../shared/types'

interface Props {
  fixtures: Fixture[]
  onFixturesChange: (fixtures: Fixture[]) => void
  onBack: () => void
}

export function SetupView({ fixtures, onFixturesChange, onBack }: Props) {
  const ipc = useIpc()
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null)

  const fixtureOnChannel = fixtures.find((f) => f.channel === selectedChannel) ?? null

  const handleSave = useCallback(async (fixture: Fixture) => {
    const saved = await ipc.updateFixture(fixture)
    const existing = fixtures.findIndex((f) => f.id === saved.id)
    if (existing >= 0) {
      const next = [...fixtures]
      next[existing] = saved
      onFixturesChange(next)
    } else {
      onFixturesChange([...fixtures, saved])
    }
  }, [fixtures, ipc, onFixturesChange])

  const handleDelete = useCallback(async (id: string) => {
    await ipc.deleteFixture(id)
    onFixturesChange(fixtures.filter((f) => f.id !== id))
    setSelectedChannel(null)
  }, [fixtures, ipc, onFixturesChange])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#13131f', borderBottom: '1px solid #2a2a3e' }}>
        <button
          onClick={onBack}
          style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #374151', background: 'transparent', color: '#9ca3af', cursor: 'pointer' }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0, color: '#e5e7eb', fontSize: 16 }}>Setup & Channels</h2>
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <ChannelList
          fixtures={fixtures}
          channelValues={{}}
          selectedChannel={selectedChannel}
          onSelect={setSelectedChannel}
        />
        <div style={{ width: 1, background: '#2a2a3e' }} />
        <ChannelEditor
          channel={selectedChannel}
          fixture={fixtureOnChannel}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}
