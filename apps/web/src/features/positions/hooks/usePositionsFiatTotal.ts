import usePositions from '@/features/positions/hooks/usePositions'

const usePositionsFiatTotal = () => {
  const { data: protocols } = usePositions()

  if (!protocols) return 0

  return protocols.reduce((acc, protocol) => acc + Number(protocol.fiatTotal), 0)
}

export default usePositionsFiatTotal
