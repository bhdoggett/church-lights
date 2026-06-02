import { useCallback } from 'react'
import type { Fixture, SaveSceneArgs, SetChannelArgs } from '../../shared/types'

export function useIpc() {
  const getConfig = useCallback(() => window.electronAPI.getConfig(), [])
  const setChannel = useCallback((args: SetChannelArgs) => window.electronAPI.setChannel(args), [])
  const saveScene = useCallback((args: SaveSceneArgs) => window.electronAPI.saveScene(args), [])
  const loadScene = useCallback((id: string) => window.electronAPI.loadScene(id), [])
  const deleteScene = useCallback((id: string) => window.electronAPI.deleteScene(id), [])
  const updateFixture = useCallback((f: Fixture) => window.electronAPI.updateFixture(f), [])
  const deleteFixture = useCallback((id: string) => window.electronAPI.deleteFixture(id), [])
  const setPort = useCallback((port: number) => window.electronAPI.setPort(port), [])

  return { getConfig, setChannel, saveScene, loadScene, deleteScene, updateFixture, deleteFixture, setPort }
}
