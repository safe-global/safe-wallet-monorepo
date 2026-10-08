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

export type ResetAuthenticatorDialogViewProps = {
  barcodeUri?: string
  otp: string
  onOtpChange: (otp: string) => void
  error?: string
  isConfirming: boolean
  onClose: () => void
  onConfirm: () => void
}

export const ResetAuthenticatorDialogView = ({
  barcodeUri,
  otp,
  onOtpChange,
  error,
  isConfirming,
  onClose,
  onConfirm,
}: ResetAuthenticatorDialogViewProps) => {
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
            <InputOTP maxLength={OTP_LENGTH} value={otp} onChange={onOtpChange} disabled={isConfirming}>
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
            onClick={onConfirm}
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
