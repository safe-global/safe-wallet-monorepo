import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

export const calculatePositionsFiatTotal = (protocols: Protocol[] | undefined): number => {
  if (!protocols || protocols.length === 0) {
    return 0
  }

  return protocols.reduce((acc, protocol) => acc + Number(protocol.fiatTotal), 0)
}
