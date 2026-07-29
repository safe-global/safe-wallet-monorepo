import { useCallback, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'

const OTP_LENGTH = 6

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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="reset-authenticator-dialog">
        <DialogHeader>
          <DialogTitle>Set up your new authenticator</DialogTitle>
          <DialogDescription>
            Scan the QR code with your authenticator app, then enter the 6-digit code it shows. Your current
            authenticator keeps working until the new one is confirmed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {barcodeUri ? (
            <div className="rounded-lg bg-white p-3">
              <QRCodeSVG value={barcodeUri} size={180} data-testid="reset-authenticator-qr" />
            </div>
          ) : error ? null : (
            <Skeleton className="h-[204px] w-[204px] rounded-lg" />
          )}

          {barcodeUri && (
            <InputOTP maxLength={OTP_LENGTH} value={otp} onChange={setOtp} disabled={isConfirming}>
              <InputOTPGroup>
                {Array.from({ length: OTP_LENGTH }, (_, index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          )}

          {error && (
            <Typography variant="paragraph-small" className="block text-destructive">
              {error}
            </Typography>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!barcodeUri || otp.length !== OTP_LENGTH || isConfirming}
            data-testid="reset-authenticator-confirm"
          >
            {isConfirming ? 'Confirming…' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ResetAuthenticatorDialog
