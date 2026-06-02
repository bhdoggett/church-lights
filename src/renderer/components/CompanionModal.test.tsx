import { render, screen } from '@testing-library/react'
import { CompanionModal } from './CompanionModal'
import type { Scene } from '../../shared/types'

const scenes: Scene[] = [
  { id: 'worship-mode', name: 'Worship Mode', fadeDuration: 1000, values: {} },
]

describe('CompanionModal', () => {
  it('shows the companion port', () => {
    render(<CompanionModal scenes={scenes} port={3000} onPortChange={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('3000')).toBeInTheDocument()
  })

  it('shows scene endpoint for each scene', () => {
    render(<CompanionModal scenes={scenes} port={3000} onPortChange={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText(/worship-mode/)).toBeInTheDocument()
  })

  it('shows setup instructions', () => {
    render(<CompanionModal scenes={scenes} port={3000} onPortChange={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getAllByText(/companion/i).length).toBeGreaterThan(0)
  })
})
