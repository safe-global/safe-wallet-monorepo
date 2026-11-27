import { sameAddress } from '@safe-global/utils/utils/addresses'

export const FEE_COLLECTORS: ReadonlyArray<string> = [
  // Rhinestone refund receiver (same address on every chain)
  '0x53b3BDD8dB8352D9aB7bF39A527F9C24fC404DcD',
]

export const isFeeCollector = (address: string): boolean => FEE_COLLECTORS.some((addr) => sameAddress(addr, address))

/** The account Rhinestone relays from today. It may change; `RHINESTONE_INTENT_EXECUTOR` is the stable signal. */
export const RHINESTONE_RELAYER = '0x46565eeDB0bb948aE787dD105cCE300f736dA28e'

/** Rhinestone's executor contract (same address on every chain): it emits `IntentExecuted` in every relayed tx. */
export const RHINESTONE_INTENT_EXECUTOR = '0x781388759EacB9892f60D77D9A99c9BE2F7F4ada'
