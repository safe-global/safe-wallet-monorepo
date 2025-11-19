import type {
  IncomingTransferPage,
  MultisigTransactionPage,
  ModuleTransactionPage,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useMemo } from 'react'
import { useRouter } from 'next/router'
import type { ParsedUrlQuery } from 'querystring'
import { startOfDay, endOfDay } from 'date-fns'

import type { TxFilterFormState } from '@/components/transactions/TxFilterForm'
import { getModuleTransactions, getIncomingTransfers, getMultisigTransactions } from '@/utils/transactions'

// Filter types using snake_case for backward compatibility with forms
// These correspond to the query parameters (excluding chainId/safeAddress) from the RTK Query API
type IncomingTxFilter = {
  trusted?: boolean
  execution_date__gte?: string
  execution_date__lte?: string
  to?: string
  value?: string
  token_address?: string
}

type MultisigTxFilter = {
  execution_date__gte?: string
  execution_date__lte?: string
  to?: string
  value?: string
  nonce?: string
  executed?: string
}

type ModuleTxFilter = {
  to?: string
  module?: string
  transaction_hash?: string
}

export enum TxFilterType {
  INCOMING = 'Incoming',
  MULTISIG = 'Outgoing',
  MODULE = 'Module-based',
}

export type TxFilter = {
  type: TxFilterType
  filter: IncomingTxFilter | MultisigTxFilter | ModuleTxFilter // CGW filter
}

export const _omitNullish = (data: { [key: string]: any }) => {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => {
      return value !== '' && value != null
    }),
  )
}

export const _isValidTxFilterType = (type: unknown) => {
  return !!type && Object.values(TxFilterType).includes(type as TxFilterType)
}

export const _isModuleFilter = (filter: TxFilter['filter']): filter is ModuleTxFilter => {
  return 'module' in filter
}

// Spread TxFilter basically
type TxFilterUrlQuery = {
  type: TxFilter['type']
} & TxFilter['filter']

export const txFilter = {
  parseUrlQuery: ({ type, ...filter }: ParsedUrlQuery): TxFilter | null => {
    if (!_isValidTxFilterType(type)) return null

    return {
      type: type as TxFilterType,
      filter: filter as TxFilter['filter'],
    }
  },

  parseFormData: ({ type, ...formData }: TxFilterFormState): TxFilter => {
    const filter: TxFilter['filter'] = _omitNullish({
      ...formData,
      execution_date__gte: formData.execution_date__gte
        ? startOfDay(formData.execution_date__gte).toISOString()
        : undefined,
      execution_date__lte: formData.execution_date__lte
        ? endOfDay(formData.execution_date__lte).toISOString()
        : undefined,
      value: formData.value,
    })

    return {
      type,
      filter,
    }
  },

  formatUrlQuery: ({ type, filter }: TxFilter): TxFilterUrlQuery => {
    return {
      type,
      ...filter,
    }
  },

  formatFormData: ({ type, filter }: TxFilter): Partial<TxFilterFormState> => {
    const isModule = _isModuleFilter(filter)

    return {
      type,
      ...filter,
      execution_date__gte: !isModule && filter.execution_date__gte ? new Date(filter.execution_date__gte) : null,
      execution_date__lte: !isModule && filter.execution_date__lte ? new Date(filter.execution_date__lte) : null,
      value: isModule ? '' : filter.value,
    }
  },
}

export const useTxFilter = (): [TxFilter | null, (filter: TxFilter | null) => void] => {
  const router = useRouter()
  const filter = useMemo(() => txFilter.parseUrlQuery(router.query), [router.query])

  const setQuery = (filter: TxFilter | null) => {
    router.push({
      pathname: router.pathname,
      query: {
        safe: router.query.safe,
        ...(filter && txFilter.formatUrlQuery(filter)),
      },
    })
  }

  return [filter, setQuery]
}

export const fetchFilteredTxHistory = async (
  chainId: string,
  safeAddress: string,
  filterData: TxFilter,
  hideUntrustedTxs: boolean,
  hideImitationTxs: boolean,
  pageUrl?: string,
): Promise<IncomingTransferPage | MultisigTransactionPage | ModuleTransactionPage> => {
  const fetchPage = () => {
    const filter = filterData.filter

    switch (filterData.type) {
      case TxFilterType.INCOMING: {
        return getIncomingTransfers(
          chainId,
          safeAddress,
          {
            trusted: !hideUntrustedTxs,
            execution_date__gte: 'execution_date__gte' in filter ? filter.execution_date__gte : undefined,
            execution_date__lte: 'execution_date__lte' in filter ? filter.execution_date__lte : undefined,
            to: filter.to,
            value: 'value' in filter ? filter.value : undefined,
            token_address: 'token_address' in filter ? filter.token_address : undefined,
          },
          pageUrl,
        )
      }
      case TxFilterType.MULTISIG: {
        return getMultisigTransactions(
          chainId,
          safeAddress,
          {
            execution_date__gte: 'execution_date__gte' in filter ? filter.execution_date__gte : undefined,
            execution_date__lte: 'execution_date__lte' in filter ? filter.execution_date__lte : undefined,
            to: filter.to,
            value: 'value' in filter ? filter.value : undefined,
            nonce: 'nonce' in filter ? filter.nonce : undefined,
            executed: 'executed' in filter ? filter.executed : 'true',
          },
          pageUrl,
        )
      }
      case TxFilterType.MODULE: {
        return getModuleTransactions(
          chainId,
          safeAddress,
          {
            to: filter.to,
            module: 'module' in filter ? filter.module : undefined,
            transaction_hash: 'transaction_hash' in filter ? filter.transaction_hash : undefined,
          },
          pageUrl,
        )
      }
      default: {
        return { results: [] }
      }
    }
  }

  return await fetchPage()
}
