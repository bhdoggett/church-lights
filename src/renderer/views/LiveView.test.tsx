import { render, screen, fireEvent } from '@testing-library/react'
import { LiveView } from './LiveView'

const mockSetChannel = vi.fn()

// Mock useIpc — window.electronAPI doesn't exist in jsdom
vi.mock('../hooks/useIpc', () => ({
  useIpc: () => ({
    setChannel: mockSetChannel,
  }),
}))

describe('LiveView', () => {
  beforeEach(() => {
    mockSetChannel.mockClear()
  })

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
    render(<LiveView universe={0} />)
    fireEvent.change(screen.getAllByRole('slider')[0], { target: { value: '100' } })
    expect(mockSetChannel).toHaveBeenCalledWith({ universe: 0, channel: 1, value: 100 })
  })
})
