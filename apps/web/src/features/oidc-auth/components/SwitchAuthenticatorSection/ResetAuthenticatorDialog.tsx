import { useCallback, useEffect, useState } from 'react'
import { ResetAuthenticatorDialogView } from '@views/features/oidc-auth/components/SwitchAuthenticatorSection/ResetAuthenticatorDialogView'

/**
 * Enrollment step of the authenticator reset: renders the provider-generated
 * QR code and confirms the new authenticator with its first code. The old
 * authenticator stays active until the new one is confirmed.
 */
const ResetAuthenticatorDialog = ({
  onClose,
  associate,
  confirm,
}: {
  onClose: () => void
  associate: () => Promise<string>
  confirm: (otp: string) => Promise<void>
}) => {
  const [barcodeUri, setBarcodeUri] = useState<string>()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string>()
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    let cancelled = false

    associate()
      .then((uri) => {
        if (!cancelled) setBarcodeUri(uri)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong')
      })

    return () => {
      cancelled = true
    }
  }, [associate])

  const handleConfirm = useCallback(async () => {
    setIsConfirming(true)
    setError(undefined)
    try {
      await confirm(otp)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setOtp('')
    } finally {
      setIsConfirming(false)
    }
  }, [confirm, otp, onClose])

  return (
    <ResetAuthenticatorDialogView
      barcodeUri={barcodeUri}
      otp={otp}
      onOtpChange={setOtp}
      error={error}
      isConfirming={isConfirming}
      onClose={onClose}
      onConfirm={handleConfirm}
    />
  )
}

export default ResetAuthenticatorDialog
