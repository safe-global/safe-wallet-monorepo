import { render } from '@/src/tests/test-utils'
import { ExecutingMonitor } from './ExecutingMonitor'
import { usePathname } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'

jest.mock('expo-router', () => ({
  usePathname: jest.fn(),
}))

jest.mock('@tamagui/toast', () => ({
  useToastController: jest.fn(),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>
const mockUseToastController = useToastController as jest.MockedFunction<typeof useToastController>

describe('ExecutingMonitor', () => {
  const mockToast = {
    show: jest.fn(),
    hide: jest.fn(),
    nativeToast: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseToastController.mockReturnValue(mockToast)
  })

  it('shows success toast when execution completes and user is NOT on execution screen', () => {
    mockUsePathname.mockReturnValue('/pending-transactions')

    render(<ExecutingMonitor />, {
      initialStore: {
        executingState: {
          executions: {
            tx123: {
              status: 'success',
              startedAt: Date.now() - 1000,
              completedAt: Date.now(),
              executionMethod: ExecutionMethod.WITH_PK,
            },
          },
        },
      },
    })

    expect(mockToast.show).toHaveBeenCalledWith(
      'Transaction submitted successfully. Waiting for indexer to pick it up.',
      {
        native: false,
        duration: 5000,
      },
    )
  })

  it('shows error toast when execution fails and user is NOT on execution screen', () => {
    mockUsePathname.mockReturnValue('/pending-transactions')

    render(<ExecutingMonitor />, {
      initialStore: {
        executingState: {
          executions: {
            tx456: {
              status: 'error',
              error: 'Transaction reverted',
              startedAt: Date.now() - 1000,
              completedAt: Date.now(),
              executionMethod: ExecutionMethod.WITH_RELAY,
            },
          },
        },
      },
    })

    expect(mockToast.show).toHaveBeenCalledWith('Execution failed: Transaction reverted', {
      native: false,
      duration: 5000,
      variant: 'error',
    })
  })

  it('shows default error message when no error details provided', () => {
    mockUsePathname.mockReturnValue('/pending-transactions')

    render(<ExecutingMonitor />, {
      initialStore: {
        executingState: {
          executions: {
            tx789: {
              status: 'error',
              startedAt: Date.now() - 1000,
              completedAt: Date.now(),
              executionMethod: ExecutionMethod.WITH_PK,
            },
          },
        },
      },
    })

    expect(mockToast.show).toHaveBeenCalledWith('Execution failed: Unknown error', {
      native: false,
      duration: 5000,
      variant: 'error',
    })
  })

  it('does NOT show toast when user is on review-and-execute screen', () => {
    mockUsePathname.mockReturnValue('/review-and-execute?txId=tx123')

    render(<ExecutingMonitor />, {
      initialStore: {
        executingState: {
          executions: {
            tx123: {
              status: 'success',
              startedAt: Date.now() - 1000,
              completedAt: Date.now(),
              executionMethod: ExecutionMethod.WITH_PK,
            },
          },
        },
      },
    })

    expect(mockToast.show).not.toHaveBeenCalled()
  })

  it('does NOT show toast when user is on execution-success screen', () => {
    mockUsePathname.mockReturnValue('/execution-success')

    render(<ExecutingMonitor />, {
      initialStore: {
        executingState: {
          executions: {
            tx123: {
              status: 'success',
              startedAt: Date.now() - 1000,
              completedAt: Date.now(),
              executionMethod: ExecutionMethod.WITH_PK,
            },
          },
        },
      },
    })

    expect(mockToast.show).not.toHaveBeenCalled()
  })

  it('does NOT show toast when user is on execution-error screen', () => {
    mockUsePathname.mockReturnValue('/execution-error')

    render(<ExecutingMonitor />, {
      initialStore: {
        executingState: {
          executions: {
            tx123: {
              status: 'error',
              error: 'Failed',
              startedAt: Date.now() - 1000,
              completedAt: Date.now(),
              executionMethod: ExecutionMethod.WITH_PK,
            },
          },
        },
      },
    })

    expect(mockToast.show).not.toHaveBeenCalled()
  })

  it('does NOT show toast when user is on ledger-connect screen', () => {
    mockUsePathname.mockReturnValue('/ledger-connect')

    render(<ExecutingMonitor />, {
      initialStore: {
        executingState: {
          executions: {
            tx123: {
              status: 'success',
              startedAt: Date.now() - 1000,
              completedAt: Date.now(),
              executionMethod: ExecutionMethod.WITH_LEDGER,
            },
          },
        },
      },
    })

    expect(mockToast.show).not.toHaveBeenCalled()
  })

  it('handles multiple completions at once', () => {
    mockUsePathname.mockReturnValue('/pending-transactions')

    render(<ExecutingMonitor />, {
      initialStore: {
        executingState: {
          executions: {
            tx1: {
              status: 'success',
              startedAt: Date.now() - 1000,
              completedAt: Date.now(),
              executionMethod: ExecutionMethod.WITH_PK,
            },
            tx2: {
              status: 'error',
              error: 'Failed',
              startedAt: Date.now() - 1000,
              completedAt: Date.now(),
              executionMethod: ExecutionMethod.WITH_RELAY,
            },
          },
        },
      },
    })

    expect(mockToast.show).toHaveBeenCalledTimes(2)
    expect(mockToast.show).toHaveBeenCalledWith(
      'Transaction submitted successfully. Waiting for indexer to pick it up.',
      expect.any(Object),
    )
    expect(mockToast.show).toHaveBeenCalledWith('Execution failed: Failed', expect.any(Object))
  })

  it('does nothing when no completions', () => {
    mockUsePathname.mockReturnValue('/pending-transactions')

    render(<ExecutingMonitor />, {
      initialStore: {
        executingState: {
          executions: {},
        },
      },
    })

    expect(mockToast.show).not.toHaveBeenCalled()
  })

  it('ignores executing transactions (not completed)', () => {
    mockUsePathname.mockReturnValue('/pending-transactions')

    render(<ExecutingMonitor />, {
      initialStore: {
        executingState: {
          executions: {
            tx123: {
              status: 'executing',
              startedAt: Date.now(),
              executionMethod: ExecutionMethod.WITH_PK,
            },
          },
        },
      },
    })

    expect(mockToast.show).not.toHaveBeenCalled()
  })
})
