export {}
// import NextLink from 'next/link'
// import { useRouter } from 'next/router'
// import type { ReactElement } from 'react'
// import { useMemo } from 'react'
// import ChevronRight from '@mui/icons-material/ChevronRight'
// import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
// import { Box, SvgIcon, Typography } from '@mui/material'
// import { isExecutable, isMultisigExecutionInfo, isSignableBy } from '@/utils/transaction-guards'
// import TxInfo from '@/components/transactions/TxInfo'
// import TxType from '@/components/transactions/TxType'
// import css from './styles.module.css'
// import OwnersIcon from '@/public/images/common/owners.svg'
// import { AppRoutes } from '@/config/routes'
// import useSafeInfo from '@/hooks/useSafeInfo'
// import useWallet from '@/hooks/wallets/useWallet'
// import SignTxButton from '@/components/transactions/SignTxButton'
// import ExecuteTxButton from '@/components/transactions/ExecuteTxButton'

// type PendingTxType = {
//   transaction: TransactionSummary
// }

// const PendingTx = ({ transaction }: PendingTxType): ReactElement => {
//   const router = useRouter()
//   const { id } = transaction
//   const { safe } = useSafeInfo()
//   const wallet = useWallet()
//   const canSign = wallet ? isSignableBy(transaction, wallet.address) : false
//   const canExecute = wallet ? isExecutable(transaction, wallet?.address, safe) : false

//   const url = useMemo(
//     () => ({
//       pathname: AppRoutes.transactions.tx,
//       query: {
//         id,
//         safe: router.query.safe,
//       },
//     }),
//     [router, id],
//   )

//   return (
//     <NextLink href={url} passHref>
//       <Box className={css.container}>
//         {isMultisigExecutionInfo(transaction.executionInfo) && transaction.executionInfo.nonce}

//         <Box flex={1}>
//           <TxType tx={transaction} />
//         </Box>

//         <Box flex={1} className={css.txInfo}>
//           <TxInfo info={transaction.txInfo} />
//         </Box>

//         {isMultisigExecutionInfo(transaction.executionInfo) ? (
//           <Box className={css.confirmationsCount}>
//             <SvgIcon component={OwnersIcon} inheritViewBox fontSize="small" />
//             <Typography variant="caption" fontWeight="bold">
//               {`${transaction.executionInfo.confirmationsSubmitted}/${transaction.executionInfo.confirmationsRequired}`}
//             </Typography>
//           </Box>
//         ) : (
//           <Box flexGrow={1} />
//         )}

//         {canExecute ? (
//           <ExecuteTxButton txSummary={transaction} compact />
//         ) : canSign ? (
//           <SignTxButton txSummary={transaction} compact />
//         ) : (
//           <ChevronRight color="border" />
//         )}
//       </Box>
//     </NextLink>
//   )
// }

// export default PendingTx
