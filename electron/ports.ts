import { readdirSync } from 'fs'

const USB_PREFIXES = ['tty.usb', 'cu.usb', 'tty.usbmodem']

export function listSerialPorts(): string[] {
  try {
    return readdirSync('/dev')
      .filter((name) => USB_PREFIXES.some((p) => name.startsWith(p)))
      .map((name) => `/dev/${name}`)
  } catch {
    return []
  }
}
