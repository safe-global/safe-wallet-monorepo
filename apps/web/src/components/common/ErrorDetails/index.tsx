import type { ReactElement } from 'react'
import CopyButton from '@/components/common/CopyButton'
import type { DecodedCustomError } from '@/utils/customErrorRegistry'
import { ErrorDetailsView } from '@views/components/common/ErrorDetails/ErrorDetailsView'

const ErrorDetails = ({ code, customError }: { code: string; customError?: DecodedCustomError }): ReactElement => {
  return (
    <ErrorDetailsView
      code={code}
      customError={customError}
      renderCopyButton={({ copyText, initialToolTipText, children }) => (
        <CopyButton text={copyText} initialToolTipText={initialToolTipText}>
          {children}
        </CopyButton>
      )}
    />
  )
}

export default ErrorDetails
