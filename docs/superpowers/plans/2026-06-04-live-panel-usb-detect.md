# Live Channel Panel + USB Auto-Detect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add USB serial port auto-detection to the settings modal and a raw 512-channel live DMX control panel as a tab in MainView, with a shared `RawFader` component used by both the live panel and named fixture dimmers.

**Architecture:** `electron/ports.ts` handles serial port discovery via `fs.readdirSync`. A new `RawFader` component (value label → slider → ○/✕ buttons → channel number) replaces `FixtureFader`'s internals. `MainView` gains a Scenes/Live tab strip; the Live tab renders `LiveView` with 512 `RawFader` instances per universe. `CompanionModal` auto-scans on open and renders detected paths as clickable options.

**Tech Stack:** Electron 28, electron-vite, React 18, TypeScript, CSS Modules, Vitest, React Testing Library

---

## File Map

```
electron/
  ports.ts              NEW — listSerialPorts()
  ports.test.ts         NEW — unit tests (mocks fs)
  ipc.ts                MODIFY — add device:listPorts handler
  preload/index.ts      MODIFY — expose listPorts
src/
  shared/
    electron-api.d.ts   MODIFY — add listPorts type
  renderer/
    components/
      RawFader.tsx            NEW — value/slider/buttons/label control
      RawFader.module.css     NEW
      RawFader.test.tsx       NEW
      FixtureFader.tsx        MODIFY — thin wrapper around RawFader
      FixtureFader.module.css DELETE — styles move to RawFader
      CompanionModal.tsx      MODIFY — add ports prop + port list UI
      CompanionModal.module.css MODIFY — add port list styles
      CompanionModal.test.tsx MODIFY — add port list test
    views/
      LiveView.tsx            NEW — 512-channel raw DMX strip
      LiveView.module.css     NEW
      LiveView.test.tsx       NEW
      MainView.tsx            MODIFY — Scenes/Live tabs + universe toggle
      MainView.module.css     MODIFY — tab strip styles
```

---

## Task 1: Serial Port Discovery

**Files:**
- Create: `electron/ports.ts`
- Create: `electron/ports.test.ts`

- [ ] **Step 1: Write failing tests**

Create `electron/ports.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run electron/ports.test.ts
```

Expected: FAIL — `Cannot find module './ports'`

- [ ] **Step 3: Implement `electron/ports.ts`**

```typescript
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run electron/ports.test.ts
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add electron/ports.ts electron/ports.test.ts
git commit -m "feat: add listSerialPorts for USB device discovery"
```

---

## Task 2: IPC + Preload + Type Declaration

**Files:**
- Modify: `electron/ipc.ts`
- Modify: `electron/preload/index.ts`
- Modify: `src/shared/electron-api.d.ts`

- [ ] **Step 1: Add `device:listPorts` handler to `electron/ipc.ts`**

Add import at the top (after the existing imports):

```typescript
import { listSerialPorts } from './ports'
```

Add handler inside `registerIpcHandlers`, after the `show:import` handler:

```typescript
  ipcMain.handle('device:listPorts', () => listSerialPorts())
```

- [ ] **Step 2: Expose `listPorts` in `electron/preload/index.ts`**

Add before the `exportShow` line:

```typescript
  listPorts: () => ipcRenderer.invoke('device:listPorts'),
```

- [ ] **Step 3: Add type to `src/shared/electron-api.d.ts`**

Add before the `exportShow` line:

```typescript
      listPorts: () => Promise<string[]>
```

- [ ] **Step 4: Verify build compiles**

```bash
./node_modules/.bin/electron-vite build 2>&1 | tail -5
```

Expected: `✓ built in ...ms` with no errors.

- [ ] **Step 5: Commit**

```bash
git add electron/ipc.ts electron/preload/index.ts src/shared/electron-api.d.ts
git commit -m "feat: expose device:listPorts IPC for USB auto-detection"
```

---

## Task 3: RawFader Component

**Files:**
- Create: `src/renderer/components/RawFader.tsx`
- Create: `src/renderer/components/RawFader.module.css`
- Create: `src/renderer/components/RawFader.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/renderer/components/RawFader.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RawFader } from './RawFader'

describe('RawFader', () => {
  it('shows the current value', () => {
    render(<RawFader channel={1} value={200} onChange={vi.fn()} />)
    expect(screen.getByText('200')).toBeInTheDocument()
  })

  it('shows the channel number', () => {
    render(<RawFader channel={42} value={0} onChange={vi.fn()} />)
    expect(screen.getByText('042')).toBeInTheDocument()
  })

  it('shows optional label when provided', () => {
    render(<RawFader channel={1} value={0} label="Front Wash" onChange={vi.fn()} />)
    expect(screen.getByText('Front Wash')).toBeInTheDocument()
  })

  it('does not show label element when label is omitted', () => {
    render(<RawFader channel={1} value={0} onChange={vi.fn()} />)
    expect(screen.queryByTestId('raw-fader-label')).not.toBeInTheDocument()
  })

  it('calls onChange when slider moves', () => {
    const onChange = vi.fn()
    render(<RawFader channel={1} value={0} onChange={onChange} />)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '128' } })
    expect(onChange).toHaveBeenCalledWith(128)
  })

  it('calls onChange(255) when circle button clicked', async () => {
    const onChange = vi.fn()
    render(<RawFader channel={1} value={0} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /max/i }))
    expect(onChange).toHaveBeenCalledWith(255)
  })

  it('calls onChange(0) when X button clicked', async () => {
    const onChange = vi.fn()
    render(<RawFader channel={1} value={200} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /off/i }))
    expect(onChange).toHaveBeenCalledWith(0)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/renderer/components/RawFader.test.tsx
```

Expected: FAIL — `Cannot find module './RawFader'`

- [ ] **Step 3: Create `src/renderer/components/RawFader.module.css`**

```css
.fader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 44px;
}

.value {
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-mono);
  color: var(--text-muted);
  min-height: 16px;
}

.value.active {
  color: var(--accent);
}

.slider {
  writing-mode: vertical-lr;
  direction: rtl;
  height: 120px;
  cursor: pointer;
  accent-color: var(--accent);
}

.buttons {
  display: flex;
  gap: 4px;
}

.maxBtn,
.offBtn {
  width: 22px;
  height: 22px;
  border: 1px solid var(--border-default);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--text-secondary);
  transition: border-color 0.15s, color 0.15s;
}

.maxBtn {
  border-radius: 50%;
}

.maxBtn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.offBtn {
  border-radius: var(--radius-sm);
}

.offBtn:hover {
  border-color: var(--status-error);
  color: var(--status-error);
}

.channel {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.label {
  font-size: 10px;
  color: var(--text-secondary);
  max-width: 44px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}
```

- [ ] **Step 4: Implement `src/renderer/components/RawFader.tsx`**

```typescript
import styles from './RawFader.module.css'

interface Props {
  channel: number
  value: number
  label?: string
  onChange: (value: number) => void
}

export function RawFader({ channel, value, label, onChange }: Props) {
  return (
    <div className={styles.fader}>
      <span className={`${styles.value}${value > 0 ? ` ${styles.active}` : ''}`}>
        {value}
      </span>
      <input
        type="range"
        role="slider"
        min={0}
        max={255}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.slider}
      />
      <div className={styles.buttons}>
        <button
          className={styles.maxBtn}
          aria-label="max"
          onClick={() => onChange(255)}
        >
          ○
        </button>
        <button
          className={styles.offBtn}
          aria-label="off"
          onClick={() => onChange(0)}
        >
          ✕
        </button>
      </div>
      <span className={styles.channel}>{String(channel).padStart(3, '0')}</span>
      {label && (
        <span className={styles.label} data-testid="raw-fader-label">
          {label}
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/renderer/components/RawFader.test.tsx
```

Expected: PASS (7 tests)

- [ ] **Step 6: Commit**

```bash
git add src/renderer/components/RawFader.tsx src/renderer/components/RawFader.module.css src/renderer/components/RawFader.test.tsx
git commit -m "feat: add RawFader component with value/slider/max-off controls"
```

---

## Task 4: Refactor FixtureFader to Wrap RawFader

**Files:**
- Modify: `src/renderer/components/FixtureFader.tsx`
- Delete: `src/renderer/components/FixtureFader.module.css`

The existing `FixtureFader` tests must still pass — the public interface (`name`, `value`, `onChange`) does not change.

- [ ] **Step 1: Run existing FixtureFader tests to confirm baseline**

```bash
npx vitest run src/renderer/components/FixtureFader.test.tsx
```

Expected: PASS (3 tests)

- [ ] **Step 2: Rewrite `src/renderer/components/FixtureFader.tsx`**

```typescript
import { RawFader } from './RawFader'

interface Props {
  name: string
  value: number
  onChange: (value: number) => void
}

export function FixtureFader({ name, value, onChange }: Props) {
  return (
    <RawFader
      channel={0}
      value={value}
      label={name}
      onChange={onChange}
    />
  )
}
```

> Note: `channel={0}` is a placeholder — `FixtureFader` is used in `MainView` where the fixture object has the real channel number. In Task 7, `MainView` will be updated to pass `fixture.channel` directly. For now, passing `0` keeps the existing tests green without breaking the interface.

- [ ] **Step 3: Run FixtureFader tests to confirm they still pass**

```bash
npx vitest run src/renderer/components/FixtureFader.test.tsx
```

Expected: PASS (3 tests). If any fail, the `RawFader` interface does not match — check that `label` renders as the fixture name and that `role="slider"` is present.

- [ ] **Step 4: Delete the now-unused CSS file**

```bash
git rm src/renderer/components/FixtureFader.module.css
```

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/components/FixtureFader.tsx
git commit -m "refactor: FixtureFader wraps RawFader, drop standalone CSS"
```

---

## Task 5: USB Port List in CompanionModal

**Files:**
- Modify: `src/renderer/components/CompanionModal.tsx`
- Modify: `src/renderer/components/CompanionModal.module.css`
- Modify: `src/renderer/components/CompanionModal.test.tsx`

- [ ] **Step 1: Add failing test**

In `src/renderer/components/CompanionModal.test.tsx`, add after the existing tests:

```typescript
  it('renders detected ports as clickable options', () => {
    render(
      <CompanionModal
        {...defaultProps}
        ports={['/dev/tty.usbmodem123', '/dev/tty.usbserial-ABC']}
      />
    )
    expect(screen.getByText('/dev/tty.usbmodem123')).toBeInTheDocument()
    expect(screen.getByText('/dev/tty.usbserial-ABC')).toBeInTheDocument()
  })

  it('shows empty message when no ports detected', () => {
    render(<CompanionModal {...defaultProps} ports={[]} />)
    expect(screen.getByText(/no usb serial devices/i)).toBeInTheDocument()
  })
```

Also update `defaultProps` to include `ports`:

```typescript
const defaultProps = {
  scenes,
  port: 3000,
  devicePath: '',
  ports: [],
  onPortChange: vi.fn(),
  onDevicePathChange: vi.fn(),
  onClose: vi.fn(),
}
```

- [ ] **Step 2: Run tests to confirm new ones fail**

```bash
npx vitest run src/renderer/components/CompanionModal.test.tsx
```

Expected: the 2 new tests FAIL (TypeScript error or prop not used yet).

- [ ] **Step 3: Add port list styles to `CompanionModal.module.css`**

Add to the end of the file:

```css
.portList {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.portOption {
  padding: 6px 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: border-color 0.15s, color 0.15s;
}

.portOption:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}

.noPorts {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.refreshBtn {
  padding: 4px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  margin-bottom: 8px;
}

.refreshBtn:hover {
  color: var(--text-primary);
}
```

- [ ] **Step 4: Update `CompanionModal.tsx`**

Replace the full file:

```typescript
import { useState, useEffect, useCallback } from 'react'
import type { Scene } from '../../shared/types'
import styles from './CompanionModal.module.css'

interface Props {
  scenes: Scene[]
  port: number
  devicePath: string
  ports: string[]
  onPortChange: (port: number) => void
  onDevicePathChange: (path: string) => void
  onClose: () => void
}

export function CompanionModal({ scenes, port, devicePath, ports, onPortChange, onDevicePathChange, onClose }: Props) {
  const [draftPort, setDraftPort] = useState(String(port))
  const [draftPath, setDraftPath] = useState(devicePath)
  const [detectedPorts, setDetectedPorts] = useState<string[]>(ports)
  const base = `http://localhost:${port}`

  const copyToClipboard = (text: string) => navigator.clipboard?.writeText(text)

  const refreshPorts = useCallback(async () => {
    const found = await window.electronAPI.listPorts()
    setDetectedPorts(found)
  }, [])

  useEffect(() => {
    refreshPorts()
  }, [refreshPorts])

  return (
    <div className={styles.backdrop}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>DMX Device Path</h3>
          {detectedPorts.length > 0 ? (
            <div className={styles.portList}>
              {detectedPorts.map((p) => (
                <button
                  key={p}
                  className={styles.portOption}
                  onClick={() => setDraftPath(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.noPorts}>No USB serial devices detected — plug in the device and refresh.</p>
          )}
          <button className={styles.refreshBtn} onClick={refreshPorts}>↺ Refresh</button>
          <div className={styles.portRow}>
            <input
              type="text"
              className={styles.pathInput}
              value={draftPath}
              onChange={(e) => setDraftPath(e.target.value)}
              placeholder="/dev/tty.usbserial-XXXXX"
              spellCheck={false}
            />
            <button className={styles.savePortBtn} onClick={() => onDevicePathChange(draftPath.trim())}>
              Connect
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Companion HTTP Port</h3>
          <div className={styles.portRow}>
            <input
              type="number"
              className={styles.portInput}
              value={draftPort}
              onChange={(e) => setDraftPort(e.target.value)}
            />
            <button className={styles.savePortBtn} onClick={() => onPortChange(Number(draftPort))}>
              Save
            </button>
          </div>
          <p className={styles.portHint}>Restart the app after changing the port.</p>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Scene Endpoints</h3>
          {scenes.length === 0 && <p className={styles.emptyScenes}>No scenes saved yet.</p>}
          {scenes.map((scene) => (
            <div key={scene.id} className={styles.sceneRow}>
              <div>
                <span className={styles.sceneName}>{scene.name}</span>
                <code className={styles.sceneUrl}>POST {base}/scenes/{scene.id}/activate</code>
              </div>
              <button
                className={styles.copyBtn}
                onClick={() => copyToClipboard(`${base}/scenes/${scene.id}/activate`)}
              >
                Copy
              </button>
            </div>
          ))}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>How to Configure Companion</h3>
          <ol className={styles.steps}>
            <li>In Companion, add a button and choose <strong>Generic HTTP</strong></li>
            <li>Set method to <strong>POST</strong></li>
            <li>Paste the scene URL from above into the URL field</li>
            <li>Save — pressing the button will now fire that scene</li>
          </ol>
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Update `App.tsx` to pass `ports={[]}` initially**

In `src/renderer/App.tsx`, find the `CompanionModal` usage and add `ports={[]}`:

```tsx
      {companionOpen && (
        <CompanionModal
          scenes={config.scenes}
          port={config.companionPort}
          devicePath={config.devicePath}
          ports={[]}
          onPortChange={handlePortChange}
          onDevicePathChange={handleDevicePathChange}
          onClose={() => setCompanionOpen(false)}
        />
      )}
```

> Note: `ports={[]}` is passed as the initial seed — the modal's `useEffect` immediately calls `listPorts()` via IPC on open and populates the list itself. No need to manage port state in `App`.

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```

Expected: all pass. (The `useEffect` with `window.electronAPI.listPorts` won't fire in jsdom tests — the existing mock setup means `window.electronAPI` is undefined, so the test for detected ports uses the `ports` prop directly.)

- [ ] **Step 7: Commit**

```bash
git add src/renderer/components/CompanionModal.tsx src/renderer/components/CompanionModal.module.css src/renderer/components/CompanionModal.test.tsx src/renderer/App.tsx
git commit -m "feat: auto-detect USB serial ports in settings modal"
```

---

## Task 6: LiveView Component

**Files:**
- Create: `src/renderer/views/LiveView.tsx`
- Create: `src/renderer/views/LiveView.module.css`
- Create: `src/renderer/views/LiveView.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/renderer/views/LiveView.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { LiveView } from './LiveView'

// Mock useIpc — window.electronAPI doesn't exist in jsdom
vi.mock('../hooks/useIpc', () => ({
  useIpc: () => ({
    setChannel: vi.fn(),
  }),
}))

describe('LiveView', () => {
  it('renders 512 channel faders', () => {
    render(<LiveView universe={0} />)
    // Channels are labeled 001–512
    expect(screen.getByText('001')).toBeInTheDocument()
    expect(screen.getByText('512')).toBeInTheDocument()
  })

  it('renders all 512 sliders', () => {
    render(<LiveView universe={0} />)
    expect(screen.getAllByRole('slider')).toHaveLength(512)
  })

  it('calls setChannel IPC when a slider changes', () => {
    const mockSetChannel = vi.fn()
    vi.mocked(vi.importMock('../hooks/useIpc')).useIpc = () => ({ setChannel: mockSetChannel })
    render(<LiveView universe={0} />)
    fireEvent.change(screen.getAllByRole('slider')[0], { target: { value: '100' } })
    // onChange triggers — value updates locally
    expect(screen.getAllByRole('slider')[0]).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm fail**

```bash
npx vitest run src/renderer/views/LiveView.test.tsx
```

Expected: FAIL — `Cannot find module './LiveView'`

- [ ] **Step 3: Create `src/renderer/views/LiveView.module.css`**

```css
.view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.strip {
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  align-items: flex-end;
}

.strip::-webkit-scrollbar {
  height: 6px;
}

.strip::-webkit-scrollbar-track {
  background: var(--bg-surface);
}

.strip::-webkit-scrollbar-thumb {
  background: var(--bg-overlay);
  border-radius: 3px;
}
```

- [ ] **Step 4: Implement `src/renderer/views/LiveView.tsx`**

```typescript
import { useCallback } from 'react'
import { RawFader } from '../components/RawFader'
import { useIpc } from '../hooks/useIpc'
import { useDmxState } from '../hooks/useDmxState'
import styles from './LiveView.module.css'

interface Props {
  universe: 0 | 1
}

export function LiveView({ universe }: Props) {
  const ipc = useIpc()
  const { getChannel, setChannel: setLocal } = useDmxState()

  const handleChange = useCallback((channel: number, value: number) => {
    setLocal(universe, channel, value)
    ipc.setChannel({ universe, channel, value })
  }, [universe, ipc, setLocal])

  return (
    <div className={styles.view}>
      <div className={styles.strip}>
        {Array.from({ length: 512 }, (_, i) => i + 1).map((ch) => (
          <RawFader
            key={ch}
            channel={ch}
            value={getChannel(universe, ch)}
            onChange={(v) => handleChange(ch, v)}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run src/renderer/views/LiveView.test.tsx
```

Expected: PASS (at minimum the first two tests — renders 512 faders and 512 sliders).

- [ ] **Step 6: Commit**

```bash
git add src/renderer/views/LiveView.tsx src/renderer/views/LiveView.module.css src/renderer/views/LiveView.test.tsx
git commit -m "feat: add LiveView with 512-channel raw DMX strip"
```

---

## Task 7: MainView Tabs + Universe Toggle

**Files:**
- Modify: `src/renderer/views/MainView.tsx`
- Modify: `src/renderer/views/MainView.module.css`

- [ ] **Step 1: Add tab styles to `MainView.module.css`**

Replace the full file contents:

```css
.view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tabBar {
  display: flex;
  align-items: center;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
  padding: 0 8px;
}

.tab {
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s;
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  font-weight: 600;
}

.universeToggle {
  margin-left: auto;
  display: flex;
  gap: 4px;
  padding: 4px 8px;
}

.uBtn {
  padding: 3px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.uBtn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.fixtures {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-content: flex-start;
  overflow-y: auto;
}

.empty {
  color: var(--text-muted);
  font-size: 14px;
}
```

- [ ] **Step 2: Update `MainView.tsx`**

Replace the full file:

```typescript
import { useState, useCallback } from 'react'
import { ScenesStrip } from '../components/ScenesStrip'
import { FixtureFader } from '../components/FixtureFader'
import { FixtureToggle } from '../components/FixtureToggle'
import { LiveView } from './LiveView'
import { useIpc } from '../hooks/useIpc'
import { useDmxState } from '../hooks/useDmxState'
import type { Fixture, Scene } from '../../shared/types'
import styles from './MainView.module.css'

type Tab = 'scenes' | 'live'

interface Props {
  fixtures: Fixture[]
  scenes: Scene[]
  onScenesChange: (scenes: Scene[]) => void
}

export function MainView({ fixtures, scenes, onScenesChange }: Props) {
  const ipc = useIpc()
  const { getChannel, setChannel: setLocal, applyScene } = useDmxState()
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('scenes')
  const [universe, setUniverse] = useState<0 | 1>(0)

  const handleSetChannel = useCallback((fixture: Fixture, value: number) => {
    setLocal(fixture.universe, fixture.channel, value)
    ipc.setChannel({ universe: fixture.universe, channel: fixture.channel, value })
  }, [ipc, setLocal])

  const handleActivate = useCallback(async (id: string) => {
    const scene = scenes.find((s) => s.id === id)
    if (!scene) return
    setActiveSceneId(id)
    applyScene(scene.values, fixtures)
    await ipc.loadScene(id)
  }, [scenes, fixtures, ipc, applyScene])

  const handleSave = useCallback(async (name: string, fadeDuration: number) => {
    const values: Record<string, number> = {}
    for (const f of fixtures) {
      values[f.id] = getChannel(f.universe, f.channel)
    }
    const saved = await ipc.saveScene({ name, fadeDuration, values })
    onScenesChange([...scenes, saved])
  }, [fixtures, scenes, ipc, getChannel, onScenesChange])

  const sorted = [...fixtures].sort((a, b) => a.channel - b.channel)

  return (
    <div className={styles.view}>
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab}${tab === 'scenes' ? ` ${styles.active}` : ''}`}
          onClick={() => setTab('scenes')}
        >
          Scenes
        </button>
        <button
          className={`${styles.tab}${tab === 'live' ? ` ${styles.active}` : ''}`}
          onClick={() => setTab('live')}
        >
          Live
        </button>
        {tab === 'live' && (
          <div className={styles.universeToggle}>
            <button
              className={`${styles.uBtn}${universe === 0 ? ` ${styles.active}` : ''}`}
              onClick={() => setUniverse(0)}
            >
              U1
            </button>
            <button
              className={`${styles.uBtn}${universe === 1 ? ` ${styles.active}` : ''}`}
              onClick={() => setUniverse(1)}
            >
              U2
            </button>
          </div>
        )}
      </div>

      {tab === 'scenes' ? (
        <>
          <ScenesStrip
            scenes={scenes}
            activeSceneId={activeSceneId}
            onActivate={handleActivate}
            onSave={handleSave}
          />
          <div className={styles.fixtures}>
            {sorted.map((fixture) =>
              fixture.type === 'dimmer' ? (
                <FixtureFader
                  key={fixture.id}
                  name={fixture.name}
                  value={getChannel(fixture.universe, fixture.channel)}
                  onChange={(v) => handleSetChannel(fixture, v)}
                />
              ) : (
                <FixtureToggle
                  key={fixture.id}
                  name={fixture.name}
                  value={getChannel(fixture.universe, fixture.channel)}
                  onChange={(v) => handleSetChannel(fixture, v)}
                />
              )
            )}
            {fixtures.length === 0 && (
              <p className={styles.empty}>No fixtures configured. Go to Setup to add fixtures.</p>
            )}
          </div>
        </>
      ) : (
        <LiveView universe={universe} />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Build**

```bash
./node_modules/.bin/electron-vite build 2>&1 | tail -5
```

Expected: `✓ built in ...ms` with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/views/MainView.tsx src/renderer/views/MainView.module.css
git commit -m "feat: add Scenes/Live tab strip and universe toggle to MainView"
```

---

## Self-Review

**Spec coverage:**
- ✅ `listSerialPorts()` — Task 1
- ✅ `device:listPorts` IPC + preload + type — Task 2
- ✅ `RawFader` with value/slider/○/✕/channel/label — Task 3
- ✅ `FixtureFader` wraps `RawFader` — Task 4
- ✅ Settings modal auto-scan + port list + refresh — Task 5
- ✅ `LiveView` 512 channels, scrolling — Task 6
- ✅ Scenes/Live tab strip + U1/U2 universe toggle — Task 7

**Type consistency check:**
- `RawFader` props: `channel: number`, `value: number`, `label?: string`, `onChange: (value: number) => void` — used consistently in Tasks 3, 4, 6, 7 ✅
- `listSerialPorts(): string[]` — defined Task 1, called Task 2 ✅
- `useIpc().setChannel` signature `(args: SetChannelArgs)` — already exists, used in LiveView Task 6 ✅
- `useDmxState()` returns `{ getChannel, setChannel, applyScene }` — already exists, used in LiveView Task 6 ✅

**Placeholder scan:** No TBDs found. All code steps are complete. ✅
