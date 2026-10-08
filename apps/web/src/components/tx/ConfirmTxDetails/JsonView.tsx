import { useMemo } from 'react'
import CopyButton from '@/components/common/CopyButton'
import { JsonViewView } from '@views/components/tx/ConfirmTxDetails/JsonViewView'

export const JsonView = ({ data }: { data: unknown }) => {
  const json = useMemo(() => JSON.stringify(data, null, 2), [data])

  return <JsonViewView json={json} copyButton={<CopyButton text={json} />} />
}
