import chains from '@safe-global/utils/config/chains'
import { secondsInDay, secondsInHour, secondsInMinute } from 'date-fns/constants'
import { useCurrentChain } from '@/hooks/useChains'

export const DAY_IN_SECONDS = secondsInDay

type Periods = Array<{ label: string; value: string | number }>

const ExpirationPeriods: Periods = [
  {
    label: '2 days',
    value: `${DAY_IN_SECONDS * 2}`,
  },
  {
    label: '7 days',
    value: `${DAY_IN_SECONDS * 7}`,
  },
  {
    label: '14 days',
    value: `${DAY_IN_SECONDS * 14}`,
  },
  {
    label: '28 days',
    value: `${DAY_IN_SECONDS * 28}`,
  },
  {
    label: '56 days',
    value: `${DAY_IN_SECONDS * 56}`,
  },
]

const TestPeriods: Periods = [
  {
    label: '1 minute',
    value: `${secondsInMinute}`,
  },
  {
    label: '5 minutes',
    value: `${secondsInMinute * 5}`,
  },
  {
    label: '1 hour',
    value: `${secondsInHour}`,
  },
]

const DefaultRecoveryDelayPeriods: Periods = [
  {
    label: 'Custom period',
    value: '0',
  },
  ...ExpirationPeriods,
]

const DefaultRecoveryExpirationPeriods: Periods = [
  {
    label: 'Never',
    value: '0',
  },
  ...ExpirationPeriods,
]

const TestRecoveryDelayPeriods: Periods = [
  {
    label: 'Custom period',
    value: '0',
  },
  ...TestPeriods,
  ...ExpirationPeriods,
]

const TestRecoveryExpirationPeriods: Periods = [
  {
    label: 'Never',
    value: '0',
  },
  ...TestPeriods,
  ...ExpirationPeriods,
]

export function useRecoveryPeriods(): { delay: Periods; expiration: Periods } {
  const chain = useCurrentChain()
  const isTestChain = chain && [chains.gor, chains.sep].includes(chain.chainId)

  // TODO: Remove constant before release

  if (isTestChain) {
    return {
      delay: TestRecoveryDelayPeriods,
      expiration: TestRecoveryExpirationPeriods,
    }
  }

  return {
    delay: DefaultRecoveryDelayPeriods,
    expiration: DefaultRecoveryExpirationPeriods,
  }
}
