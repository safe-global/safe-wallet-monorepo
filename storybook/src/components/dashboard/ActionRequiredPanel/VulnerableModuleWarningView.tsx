import type { ReactElement, ReactNode } from 'react'
import type { ActionCardProps } from '@views/components/common/ActionCard/ActionCardView'
import { ATTENTION_PANEL_EVENTS } from '@/services/analytics/events/attention-panel'

const VULNERABLE_MODULE_HELP_ARTICLE =
  'https://help.safe.global/articles/3569845223-zodiac-module-vulnerability?lang=en'

export type VulnerableModuleWarningViewProps = {
  /** Renders the ActionCard container */
  renderActionCard: (props: ActionCardProps) => ReactNode
}

// Critical dashboard card shown when the Safe is flagged by the Zodiac security-check.
export function VulnerableModuleWarningView({ renderActionCard }: VulnerableModuleWarningViewProps): ReactElement {
  return (
    <>
      {renderActionCard({
        severity: 'critical',
        title: 'This Safe is affected by a vulnerable third-party module.',
        content:
          'A Zodiac Delay v1.1.0 or Roles v2.1.0 module associated with it has a known critical vulnerability. We advise you to take immediate action.',
        action: {
          label: 'Read more',
          href: VULNERABLE_MODULE_HELP_ARTICLE,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        trackingEvent: ATTENTION_PANEL_EVENTS.READ_MORE_VULNERABLE_MODULE,
        testId: 'vulnerable-module-warning',
        actionTestId: 'read-more-vulnerable-module-btn',
      })}
    </>
  )
}
