import { useState, useCallback } from 'react'

type ChannelKey = string

export function useDmxState() {
  const [channels, setChannels] = useState<Record<ChannelKey, number>>({})

  const setChannel = useCallback((universe: 0 | 1, channel: number, value: number) => {
    setChannels((prev) => ({ ...prev, [`${universe}-${channel}`]: value }))
  }, [])

  const getChannel = useCallback(
    (universe: 0 | 1, channel: number): number => {
      return channels[`${universe}-${channel}`] ?? 0
    },
    [channels]
  )

  const applyScene = useCallback(
    (values: Record<string, number>, fixtures: Array<{ id: string; channel: number; universe: 0 | 1 }>) => {
      const next: Record<ChannelKey, number> = {}
      for (const [fixtureId, value] of Object.entries(values)) {
        const fixture = fixtures.find((f) => f.id === fixtureId)
        if (!fixture) continue
        next[`${fixture.universe}-${fixture.channel}`] = value
      }
      setChannels((prev) => ({ ...prev, ...next }))
    },
    []
  )

  return { channels, setChannel, getChannel, applyScene }
}
