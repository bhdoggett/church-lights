import type { DmxStatus } from '../../shared/types'

const labels: Record<DmxStatus, string> = {
  connected: 'DMX Connected',
  disconnected: 'DMX Disconnected',
  error: 'DMX Error',
}

const colors: Record<DmxStatus, string> = {
  connected: '#22c55e',
  disconnected: '#6b7280',
  error: '#ef4444',
}

interface Props {
  status: DmxStatus
}

export function ConnectionBadge({ status }: Props) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 12,
      background: '#1e1e2e', border: `1px solid ${colors[status]}`,
      color: colors[status], fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[status] }} />
      {labels[status]}
    </span>
  )
}
