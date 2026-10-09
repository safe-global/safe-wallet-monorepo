import { LockKeyhole, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'

const HIGHLIGHTS = [
  { icon: ShieldCheck, text: 'Your keys and Safe accounts stay yours' },
  { icon: RefreshCw, text: 'Change seats or cancel anytime' },
  { icon: LockKeyhole, text: 'Secure checkout with Stripe' },
]

export const PlansHero = () => (
  <div className="mb-8 flex flex-col items-start gap-4 rounded-4xl bg-gradient-to-br from-muted via-card to-muted-secondary px-8 py-10">
    <Badge variant="brand" size="status" shape="status" className="gap-1.5">
      <Sparkles className="size-3.5" strokeWidth={2} />
      Safe Pro
    </Badge>
    <div className="flex max-w-2xl flex-col gap-3">
      <Typography variant="h1" className="leading-[1.05] tracking-tight">
        A plan for every treasury
      </Typography>
      <Typography variant="paragraph-large" color="muted">
        Run your Workspace with sponsored transactions, shared tooling and security reviews built in. Start small and
        grow when your team does.
      </Typography>
    </div>
    <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
      {HIGHLIGHTS.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-2">
          <Icon className="size-4 text-badge-dot-success" strokeWidth={2} />
          <Typography variant="paragraph-small-medium">{text}</Typography>
        </li>
      ))}
    </ul>
  </div>
)
