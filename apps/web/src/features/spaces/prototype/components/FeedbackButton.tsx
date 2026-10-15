import { MessageSquarePlus } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'

type FeedbackTarget = {
  ticket: string
  team: string
  project: string
}

export const PENDING_QUEUE_FEEDBACK: FeedbackTarget = {
  ticket: 'DES-143',
  team: 'DES',
  project: 'DES / Private notes & pending queue',
}

type FeedbackContext = FeedbackTarget & {
  pageUrl: string
  viewport: string
  context?: string
}

export const buildFeedbackUrl = ({ ticket, team, project, pageUrl, viewport, context }: FeedbackContext) => {
  const description = [
    `**Prototype:** ${ticket}`,
    `**Page:** ${pageUrl}`,
    `**Viewport:** ${viewport}`,
    ...(context ? [`**Open in drawer:** ${context}`] : []),
    '',
    '**Feedback:**',
    '',
  ].join('\n')
  const params = new URLSearchParams({
    title: `[Feedback] ${ticket}: `,
    description,
    project,
    links: `${pageUrl}|Prototype preview`,
  })
  return `https://linear.app/team/${team}/new?${params.toString()}`
}

export function FeedbackButton({
  context,
  compact = false,
  ...target
}: FeedbackTarget & { context?: string; compact?: boolean }) {
  const openFeedback = () => {
    const url = buildFeedbackUrl({
      ...target,
      pageUrl: window.location.href,
      viewport: `${window.innerWidth}×${window.innerHeight}`,
      context,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (compact)
    return (
      <Tooltip delay={150}>
        <TooltipTrigger
          render={<Button variant="surface" size="icon" onClick={openFeedback} aria-label="Leave feedback in Linear" />}
        >
          <MessageSquarePlus />
        </TooltipTrigger>
        <TooltipContent>Leave feedback</TooltipContent>
      </Tooltip>
    )

  return (
    <Button variant="ghost" size="sm" onClick={openFeedback} aria-label="Leave feedback in Linear">
      <MessageSquarePlus />
      Feedback
    </Button>
  )
}
