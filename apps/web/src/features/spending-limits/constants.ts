import chains from '@/config/chains'

const RESET_TIME_OPTIONS = [
  { label: 'One time', value: '0' },
  { label: '1 day', value: '1440' },
  { label: '1 week', value: '10080' },
  { label: '1 month', value: '43200' },
]

const TEST_RESET_TIME_OPTIONS = [
  { label: 'One time', value: '0' },
  { label: '5 minutes', value: '5' },
  { label: '30 minutes', value: '30' },
  { label: '1 hour', value: '60' },
]

export const getResetTimeOptions = (chainId = ''): { label: string; value: string }[] => {
  return chainId === chains.gor || chainId === chains.sep ? TEST_RESET_TIME_OPTIONS : RESET_TIME_OPTIONS
}
