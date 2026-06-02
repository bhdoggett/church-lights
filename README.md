# Church Lights

A macOS desktop app for controlling DMX church lighting via an **Enttec USB DMX Pro Mk2**. Named scenes, live fixture controls, per-scene fades, and [Bitfocus Companion](https://bitfocus.io/companion) HTTP integration.

## Features

- **Named scenes** — save and recall lighting presets with one click
- **Per-scene fade** — configurable fade duration (instant to seconds)
- **Dimmer faders** — vertical sliders for smooth intensity control
- **On/off toggles** — snap-switch fixtures
- **Channel browser** — label any of the 512 DMX channels across two universes
- **Show files** — export/import your full fixture + scene setup as JSON (for sharing or backup)
- **Companion HTTP API** — trigger scenes from Bitfocus Companion buttons
- **Connection badge** — live DMX device status indicator

## Hardware

- Enttec USB DMX Pro Mk2 (dual-universe)
- macOS 12+ (Apple Silicon and Intel)

## Development

### Prerequisites

- Node.js 20+
- Xcode Command Line Tools (`xcode-select --install`) — required for native serialport module

### Setup

```bash
npm install
```

`electron-rebuild` runs automatically via `postinstall` to compile the `dmx` package's native serialport bindings against Electron's Node ABI.

### Run

```bash
npm run dev
```

The app opens with DMX status showing **Disconnected** until a device is configured (see [Device path](#device-path)).

### Test

```bash
npm test          # run once
npm run test:ui   # interactive Vitest UI
```

### Build .dmg

```bash
npm run build:mac
```

Output: `dist-electron/Church Lights-<version>.dmg`

> **Icon:** Replace `resources/icon.icns` with a real icon before distributing. Generate from a 512×512 PNG via `iconutil`.

## Device Path

The Enttec device path defaults to `/dev/tty.usbserial-0`. Find the real path with:

```bash
ls /dev/tty.usb*
```

Then update `electron/main/index.ts`:

```ts
dmxManager.connect('/dev/tty.usbserial-YOURDEVICE', ...)
```

A device path field in the UI is planned for a future release.

## Show Files

Use **Save Show** / **Open Show** in the header to export and import your full configuration (fixtures, scenes, Companion port) as a `.json` file. Share this file with other operators to transfer a complete rig setup.

## Companion HTTP API

Start the app and open the **ℹ** menu to see endpoints and copy URLs.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/status` | Health check — returns `{ status: "ok" }` |
| `GET` | `/scenes` | List all scenes as `[{ id, name }]` |
| `POST` | `/scenes/:id/activate` | Fire a scene by its slug ID |

Default port: **3000** (configurable in the ℹ modal).

### Companion setup

1. Add a button in Companion → choose **Generic HTTP**
2. Set method to `POST`
3. URL: `http://localhost:3000/scenes/<scene-id>/activate`
4. Save — the button now fires that scene

## Project Structure

```
electron/
  main/index.ts       Electron entry — BrowserWindow, IPC wiring
  preload/index.ts    contextBridge — typed window.electronAPI
  dmx.ts              DmxManager — hardware control + fade interpolation
  server.ts           Express — Companion HTTP server
  store.ts            electron-store — config persistence
  ipc.ts              ipcMain handlers
  show.ts             Show file export / import via dialog
  slug.ts             Scene ID slug generation + deduplication
src/
  shared/
    types.ts           Domain types — Fixture, Scene, Config, DmxStatus
    electron-api.d.ts  Window.electronAPI type declarations
  renderer/
    App.tsx / App.module.css
    views/             MainView, SetupView
    components/        ConnectionBadge, ScenesStrip, FixtureFader,
                       FixtureToggle, ChannelList, ChannelEditor,
                       CompanionModal
    hooks/             useIpc, useDmxState
    globals.css        CSS custom properties (design tokens)
```

## Tech Stack

- [Electron](https://electronjs.org/) 28 + [electron-vite](https://electron-vite.org/) 2
- [React](https://react.dev/) 18 + TypeScript
- CSS Modules with global design tokens
- [node-dmx](https://github.com/node-dmx/node-dmx) (`dmx` package) for hardware
- [electron-store](https://github.com/sindresorhus/electron-store) for persistence
- [Express](https://expressjs.com/) for Companion HTTP server
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) for tests
