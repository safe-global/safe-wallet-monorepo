import type { TxStepperProps } from '@/components/tx/TxStepper/useTxStepper'
import TxModal from '@/components/tx/TxModal'
import ReviewSafeAppsTx from '../../components/safe-apps/SafeAppsTxModal/ReviewSafeAppsTx'
import InvalidTransaction from '../../components/safe-apps/SafeAppsTxModal/InvalidTransaction'
import { isTxValid } from '../../components/safe-apps/utils'
import { Typography } from '@mui/material'
import type { SafeAppsTxParams } from '@/components/safe-apps/SafeAppsTxModal'
import type { BaseTransaction } from '@gnosis.pm/safe-apps-sdk'

interface IMultiSendPageProps {
  txs: BaseTransaction[]
}

const SafeAppsTxSteps: TxStepperProps['steps'] = [
  {
    label: () => {
      return <Typography variant="h3">MultiSend Transactions</Typography>
    },
    render: (data) => {
      if (!isTxValid((data as SafeAppsTxParams).txs)) {
        return <InvalidTransaction />
      }

      return <ReviewSafeAppsTx safeAppsTx={data as SafeAppsTxParams} />
    },
  },
]

const MultiSendPage: React.FunctionComponent<IMultiSendPageProps> = (props) => {
  return (
    <TxModal
      onClose={() => undefined}
      initialData={[
        {
          requestId: 'random',
          txs: props.txs,
        },
      ]}
      steps={SafeAppsTxSteps}
    />
  )
}

export async function getServerSideProps(context: any) {
  let { to, data } = context.query

  to = Array.isArray(to) ? to : [to]
  data = Array.isArray(data) ? data : [data]

  const txs = []
  for (let i = 0; i < Math.max(to.length, data.length); i++) {
    txs.push({
      to: to[i] || null,
      value: '0',
      data: data[i] || null,
    })
  }

  // const txs: BaseTransaction[] = [
  //   {
  //     to: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  //     value: '0',
  //     data: '0x095ea7b30000000000000000000000001c4b64299388a64127a7fd0fefdbb1de4e2dec2600000000000000000000000000000000000000000000000000000000000f4240',
  //   },
  //   {
  //     to: '0x1C4b64299388a64127a7fd0fEFDBb1dE4e2Dec26',
  //     value: '0',
  //     data: '0xb6b55f2500000000000000000000000000000000000000000000000000000000000f4240',
  //   },
  //   {
  //     to: '0xA692FF8Fc672B513f7850C75465415437FE25617',
  //     value: '0',
  //     data: '0xc355f343000000000000000000000000eb8fb2f6d41706759b8544d5ada16fc710211ca200000000000000000000000000000000000000000000000000002316a9e9a22c',
  //   },
  // ]

  return {
    props: {
      txs: txs,
    },
  }
}

export default MultiSendPage
