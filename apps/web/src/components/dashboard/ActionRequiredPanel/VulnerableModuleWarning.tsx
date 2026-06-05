import { type ReactElement } from 'react'
import { ActionCard } from '@/components/common/ActionCard'
import { ATTENTION_PANEL_EVENTS } from '@/services/analytics/events/attention-panel'

const VULNERABLE_MODULE_HELP_ARTICLE =
  'https://help.safe.global/articles/3569845223-zodiac-module-vulnerability?lang=en'

// Critical dashboard card shown when the Safe is flagged by the Zodiac security-check.
export const VulnerableModuleWarning = ({ isVulnerable }: { isVulnerable: boolean }): ReactElement | null => {
  if (!isVulnerable) return null

  return (
    <ActionCard
      severity="critical"
      title="This Safe is affected by a vulnerable third-party module."
      content="A Zodiac Delay v1.1.0 or Roles v2.1.0 module associated with it has a known critical vulnerability. We advise you to take immediate action."
      action={{
        label: 'Read more',
        href: VULNERABLE_MODULE_HELP_ARTICLE,
        target: '_blank',
        rel: 'noopener noreferrer',
      }}
      trackingEvent={ATTENTION_PANEL_EVENTS.READ_MORE_VULNERABLE_MODULE}
      testId="vulnerable-module-warning"
      actionTestId="read-more-vulnerable-module-btn"
    />
  )
}

export default VulnerableModuleWarning
