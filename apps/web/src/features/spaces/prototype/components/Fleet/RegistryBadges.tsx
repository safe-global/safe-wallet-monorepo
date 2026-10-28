import { CircleAlert, CircleCheck, Users, type LucideIcon } from 'lucide-react'
import { POLICY_ICONS } from '@safe-global/views/features/spaces/components/Policies/utils/policyIcon'
import PolicyStatusChip from '@safe-global/views/features/spaces/components/Policies/components/PolicyStatusChip'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import {
  ATTESTATION_LABELS,
  POLICY_LABELS,
  type Attestation,
  type SafePolicy,
  type SafePolicyType,
} from '../../services/registry'
import type { RequirementCheck } from '../../services/requirements'
import { HINT_CLASS } from '../shared'

const ATTESTATION_VARIANTS = { attested: 'positive', pending: 'warning', missing: 'negative' } as const
export function AttestationBadge({ status }: { status: Attestation }) {
  return <Badge variant={ATTESTATION_VARIANTS[status]}>{ATTESTATION_LABELS[status]}</Badge>
}

export function RequirementsBadge({ issues }: { issues: RequirementCheck[] }) {
  if (!issues.length) return <Badge variant="positive">Meets requirements</Badge>
  return (
    <Tooltip delay={300}>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <Badge variant="warning">{issues.length} missing</Badge>
      </TooltipTrigger>
      <TooltipContent className={HINT_CLASS}>
        <ul className="flex flex-col gap-1">
          {issues.map((issue) => (
            <li key={issue.id}>{issue.label}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}

// Failed checks first.
export function RequirementChecklist({ checks }: { checks: RequirementCheck[] }) {
  return (
    <ul className="flex flex-col">
      {[...checks.filter((check) => !check.pass), ...checks.filter((check) => check.pass)].map((check) => {
        const Icon = check.pass ? CircleCheck : CircleAlert
        return (
          <li key={check.id} className="flex items-start gap-3 px-2 py-2">
            <Icon
              className={`mt-0.5 size-4 shrink-0 ${check.pass ? 'text-success-strong' : 'text-warning-strong'}`}
              strokeWidth={ICON_STROKE}
              aria-label={check.pass ? 'Passed' : 'Failed'}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm">{check.label}</span>
              {check.detail && <span className="block text-xs text-muted-foreground">{check.detail}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

// Same icons as the Policies page. Allowlist is M2, so it isn't in POLICY_ICONS yet.
export const SAFE_POLICY_ICONS: Record<SafePolicyType, LucideIcon> = { ...POLICY_ICONS, allowlist: Users }

export function PolicyList({ policies }: { policies: SafePolicy[] }) {
  if (!policies.length) return <p className="px-2 text-sm text-muted-foreground">Not protected by any policy.</p>
  return (
    <ul className="flex flex-col">
      {policies.map(({ type, status }) => {
        const Icon = SAFE_POLICY_ICONS[type]
        return (
          <li key={type} className="flex items-center gap-3 px-2 py-2">
            <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={ICON_STROKE} aria-hidden />
            <span className="min-w-0 flex-1 text-sm">{POLICY_LABELS[type]}</span>
            <PolicyStatusChip status={status} />
          </li>
        )
      })}
    </ul>
  )
}

export function PolicyIcons({ policies }: { policies: SafePolicy[] }) {
  if (!policies.length) return <span className="text-sm text-muted-foreground">—</span>
  return (
    <span className="flex items-center gap-1.5">
      {policies.map(({ type }) => {
        const Icon = SAFE_POLICY_ICONS[type]
        return (
          <Tooltip key={type} delay={300}>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Icon
                className="size-4 text-muted-foreground"
                strokeWidth={ICON_STROKE}
                aria-label={POLICY_LABELS[type]}
              />
            </TooltipTrigger>
            <TooltipContent>{POLICY_LABELS[type]}</TooltipContent>
          </Tooltip>
        )
      })}
    </span>
  )
}
