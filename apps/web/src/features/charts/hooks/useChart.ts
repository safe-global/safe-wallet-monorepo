import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { useChartsGetChartV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/charts'
import type { ChartsGetChartV1ApiArg } from '@safe-global/store/gateway/AUTO_GENERATED/charts'

const POLLING_INTERVAL = 300_000 // 5 minutes

type UseChartParams = {
  fungibleId: string
  period?: ChartsGetChartV1ApiArg['period']
  enabled?: boolean
}

const useChart = ({ fungibleId, period = 'week', enabled = true }: UseChartParams) => {
  const currency = useAppSelector(selectCurrency)

  const { currentData, error, isLoading } = useChartsGetChartV1Query(
    { fungibleId, period, currency },
    {
      skip: !enabled || !fungibleId || !currency,
      pollingInterval: POLLING_INTERVAL,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
    },
  )

  return {
    data: currentData,
    error,
    isLoading,
  }
}

export default useChart
