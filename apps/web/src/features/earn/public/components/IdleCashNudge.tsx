import type { ComponentProps, ReactElement } from 'react'
import { IdleCashNudge as DefiV1IdleCashNudge } from '../../defiV1/components/IdleCashNudge'

const IdleCashNudge = (props: ComponentProps<typeof DefiV1IdleCashNudge>): ReactElement => (
  <DefiV1IdleCashNudge {...props} />
)

export default IdleCashNudge
