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
