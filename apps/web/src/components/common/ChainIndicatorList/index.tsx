import useChains from '@/hooks/useChains'
import ChainIndicator from '@/components/common/ChainIndicator'
import { Typography } from '@safe-global/views/components/ui/typography'

const ChainIndicatorList = ({ chainIds }: { chainIds: string[] }) => {
  const { configs } = useChains()

  return (
    <>
      {chainIds.map((chainId, index) => {
        const chain = configs.find((chain) => chain.chainId === chainId)
        return (
          <div key={chainId} className="relative top-[5px] inline-flex flex-wrap">
            <ChainIndicator responsive key={chainId} chainId={chainId} showUnknown={false} onlyLogo={true} />
            <Typography className="relative top-[2px] mx-1">
              {chain && chain.chainName}
              {index === chainIds.length - 1 ? '.' : ','}
            </Typography>
          </div>
        )
      })}
    </>
  )
}

export default ChainIndicatorList
