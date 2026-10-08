import { Badge, BadgeDot } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'

export const WalletTwoFactorSectionView = () => {
  return (
    <section className="bg-card rounded-2xl p-6 mb-3" data-testid="settings-wallet-2fa">
      <div className="flex items-center gap-3 mb-2">
        <Typography variant="paragraph-bold" className="block tracking-tight">
          Two-factor authentication
        </Typography>
        <Badge variant="warning" size="status" shape="status">
          <BadgeDot />
          Not available for wallet sign-in
        </Badge>
      </div>

      <Typography variant="paragraph-small" color="muted" className="block max-w-[560px]">
        You&apos;re signed in with your wallet — your signature is your key. 2FA currently protects email and Google
        sign-ins. If you want 2FA today, create a new email or Google account instead.
      </Typography>
    </section>
  )
}
