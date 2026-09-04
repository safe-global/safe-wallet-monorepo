import { act, fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import type { GameController } from '../../game/controller'
import type { GameSnapshot } from '../../game/GameApp'
import { makeSnapshot } from '../__fixtures__/snapshot'
import TowerDefensePage from '../TowerDefensePage'

class FakeController implements GameController {
  snapshot: GameSnapshot
  listeners = new Set<() => void>()
  calls: string[] = []
  disposed = false

  constructor(snapshot: GameSnapshot) {
    this.snapshot = snapshot
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = (): GameSnapshot => this.snapshot

  update(patch: Partial<GameSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch }
    this.listeners.forEach((l) => l())
  }

  setBuildTower = (id: string | null): void => {
    this.calls.push(`build:${id}`)
  }
  selectTower = (uid: number | null): void => {
    this.calls.push(`select:${uid}`)
  }
  upgradeSelected = (): void => {
    this.calls.push('upgrade')
  }
  sellSelected = (): void => {
    this.calls.push('sell')
  }
  callNextWave = (): void => {
    this.calls.push('wave')
  }
  setSpeed = (speed: number): void => {
    this.calls.push(`speed:${speed}`)
  }
  togglePause = (): void => {
    this.calls.push('pause')
  }
  toggleMute = (): void => {
    this.calls.push('mute')
  }
  setVolume = (volume: number): void => {
    this.calls.push(`volume:${volume}`)
  }
  toggleBloom = (): void => {
    this.calls.push('bloom')
  }
  setTargeting = (mode: string): void => {
    this.calls.push(`targeting:${mode}`)
  }
  continueEndless = (): void => {
    this.calls.push('endless')
  }
  cancel = (): void => {
    this.calls.push('cancel')
  }
  dispose = (): void => {
    this.disposed = true
  }
}

const setup = (snapshot = makeSnapshot()) => {
  const controller = new FakeController(snapshot)
  const createController = jest.fn(async () => controller)
  const utils = render(<TowerDefensePage createController={createController} />)
  return { ...utils, controller, createController }
}

describe('TowerDefensePage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows the start screen with difficulties and controls', () => {
    setup()
    expect(screen.getByTestId('td-start-screen')).toBeInTheDocument()
    expect(screen.getByTestId('td-difficulty-mainnet')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Deploy on Mainnet/)).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('td-difficulty-darkForest'))
    expect(screen.getByText(/Deploy on Dark forest/)).toBeInTheDocument()
  })

  it('starts a game with the chosen difficulty and renders the HUD from the controller snapshot', async () => {
    const { controller, createController } = setup()
    fireEvent.click(screen.getByTestId('td-difficulty-testnet'))
    fireEvent.click(screen.getByTestId('td-start'))
    await waitFor(() => expect(screen.getByTestId('td-topbar')).toBeInTheDocument())
    expect(createController).toHaveBeenCalledWith(expect.any(HTMLElement), 'testnet', expect.any(Object))
    expect(screen.getByTestId('td-gold')).toHaveTextContent('245')
    expect(screen.getByTestId('td-treasury')).toHaveTextContent('18 ETH')
    expect(screen.getByTestId('td-wave')).toHaveTextContent('3/30')
    expect(screen.getByTestId('td-wave-panel')).toHaveTextContent('Poisoned history')

    fireEvent.click(screen.getByTestId('td-build-shield'))
    fireEvent.click(screen.getByTestId('td-call-wave'))
    fireEvent.click(screen.getByText('2x'))
    fireEvent.change(screen.getByTestId('td-volume'), { target: { value: '40' } })
    expect(controller.calls).toEqual(['build:shield', 'wave', 'speed:2', 'volume:0.4'])
  })

  it('reflects live snapshot updates and shows the tower panel for a selection', async () => {
    const { controller } = setup()
    fireEvent.click(screen.getByTestId('td-start'))
    await waitFor(() => expect(screen.getByTestId('td-topbar')).toBeInTheDocument())
    act(() => {
      controller.update({
        gold: 999,
        selected: {
          uid: 7,
          towerId: 'multisig',
          level: 2,
          kills: 12,
          damageDealt: 3400,
          upgradeCost: 200,
          sellValue: 182,
          auraBonus: 1.15,
          targeting: 'first',
        },
      })
    })
    expect(screen.getByTestId('td-gold')).toHaveTextContent('999')
    expect(screen.queryByTestId('td-wave-progress')).not.toBeInTheDocument()
    act(() => {
      controller.update({ waveProgress: { index: 3, total: 12, queued: 2, alive: 4, done: 6 } })
    })
    expect(screen.getByTestId('td-wave-progress')).toHaveTextContent('6/12 down · 4 active · 2 incoming')
    const panel = screen.getByTestId('td-tower-panel')
    expect(panel).toHaveTextContent('Multisig Cannon')
    expect(panel).toHaveTextContent('Level 2')
    expect(panel).toHaveTextContent('+15% aura')
    fireEvent.click(screen.getByTestId('td-upgrade'))
    fireEvent.click(screen.getByTestId('td-sell'))
    fireEvent.click(screen.getByTestId('td-targeting-strongest'))
    expect(controller.calls).toEqual(['upgrade', 'sell', 'targeting:strongest'])
  })

  it('shows the end screen, records the best score and can return to the menu', async () => {
    const { controller } = setup()
    fireEvent.click(screen.getByTestId('td-start'))
    await waitFor(() => expect(screen.getByTestId('td-topbar')).toBeInTheDocument())
    act(() => {
      controller.update({ phase: 'lost', wave: 12, score: 4321 })
    })
    const end = screen.getByTestId('td-end-screen')
    expect(end).toHaveTextContent('Safe drained')
    expect(end).toHaveTextContent('4,321')
    expect(end).toHaveTextContent('New personal best')
    expect(JSON.parse(localStorage.getItem('safe-td-best-scores') ?? '{}')).toEqual({
      mainnet: { score: 4321, wave: 12, won: false },
    })
    fireEvent.click(screen.getByText('Back to menu'))
    await waitFor(() => expect(screen.getByTestId('td-start-screen')).toBeInTheDocument())
    expect(controller.disposed).toBe(true)
    expect(screen.getByTestId('td-difficulty-mainnet')).toHaveTextContent('Best: 4,321 · wave 12')
  })

  it('offers endless mode after a victory', async () => {
    const { controller } = setup()
    fireEvent.click(screen.getByTestId('td-start'))
    await waitFor(() => expect(screen.getByTestId('td-topbar')).toBeInTheDocument())
    act(() => {
      controller.update({ phase: 'won', wave: 30, score: 9999 })
    })
    expect(screen.getByTestId('td-end-screen')).toHaveTextContent('Treasury secured')
    fireEvent.click(screen.getByTestId('td-endless'))
    expect(controller.calls).toEqual(['endless'])
    act(() => {
      controller.update({ phase: 'building', endless: true, totalWaves: Infinity, wave: 30 })
    })
    expect(screen.queryByTestId('td-end-screen')).not.toBeInTheDocument()
    expect(screen.getByTestId('td-wave')).toHaveTextContent('30/∞')
  })

  it('toggles the help overlay with the H key', async () => {
    setup()
    fireEvent.click(screen.getByTestId('td-start'))
    await waitFor(() => expect(screen.getByTestId('td-topbar')).toBeInTheDocument())
    expect(screen.queryByTestId('td-help')).not.toBeInTheDocument()
    fireEvent.keyDown(window, { code: 'KeyH' })
    expect(screen.getByTestId('td-help')).toHaveTextContent('How to defend a Safe')
    fireEvent.click(screen.getByLabelText('Close help'))
    expect(screen.queryByTestId('td-help')).not.toBeInTheDocument()
  })
})
