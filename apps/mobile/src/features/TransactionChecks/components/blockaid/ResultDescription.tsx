import { CLASSIFICATION_MAPPING, REASON_MAPPING } from '@safe-global/utils/components/tx/security/blockaid/utils'
import { AlertTitleStyled } from '@/src/components/Alert'
import React from 'react'

export const ResultDescription = ({
  description,
  reason,
  classification,
}: {
  description: string | undefined
  reason: string | undefined
  classification: string | undefined
}) => {
  let text: string | undefined = ''
  if (reason && classification && REASON_MAPPING[reason] && CLASSIFICATION_MAPPING[classification]) {
    text = `The transaction ${REASON_MAPPING[reason]} ${CLASSIFICATION_MAPPING[classification]}.`
  } else {
    text = description
  }

  return <AlertTitleStyled message={text ?? 'The transaction is malicious.'} />
}
