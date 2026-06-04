// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('fs', () => ({
  readdirSync: vi.fn(),
}))

import { readdirSync } from 'fs'
import { listSerialPorts } from './ports'

describe('listSerialPorts', () => {
  beforeEach(() => {
    vi.mocked(readdirSync).mockReset()
  })

  it('returns full paths for tty.usb* devices', () => {
    vi.mocked(readdirSync).mockReturnValue(['tty.usbserial-ABC', 'tty.Bluetooth-Incoming-Port'] as any)
    expect(listSerialPorts()).toEqual(['/dev/tty.usbserial-ABC'])
  })

  it('returns full paths for cu.usb* devices', () => {
    vi.mocked(readdirSync).mockReturnValue(['cu.usbserial-XYZ', 'cu.Bluetooth-Modem'] as any)
    expect(listSerialPorts()).toEqual(['/dev/cu.usbserial-XYZ'])
  })

  it('returns full paths for tty.usbmodem* devices', () => {
    vi.mocked(readdirSync).mockReturnValue(['tty.usbmodem1HP0035381', 'tty.debug-console'] as any)
    expect(listSerialPorts()).toEqual(['/dev/tty.usbmodem1HP0035381'])
  })

  it('returns multiple matching devices', () => {
    vi.mocked(readdirSync).mockReturnValue(['tty.usbserial-A', 'cu.usbserial-B', 'tty.usbmodem-C'] as any)
    expect(listSerialPorts()).toEqual([
      '/dev/tty.usbserial-A',
      '/dev/cu.usbserial-B',
      '/dev/tty.usbmodem-C',
    ])
  })

  it('returns empty array when no USB serial devices present', () => {
    vi.mocked(readdirSync).mockReturnValue(['tty.Bluetooth-Incoming-Port', 'tty.debug-console'] as any)
    expect(listSerialPorts()).toEqual([])
  })

  it('returns empty array when /dev is unreadable', () => {
    vi.mocked(readdirSync).mockImplementation(() => { throw new Error('EACCES') })
    expect(listSerialPorts()).toEqual([])
  })
})
