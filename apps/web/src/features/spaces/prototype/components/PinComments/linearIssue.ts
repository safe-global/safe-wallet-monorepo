export type FeedbackTarget = {
  workspace: string
  ticket: string
  team: string
  project: string
}

export const PENDING_QUEUE_FEEDBACK: FeedbackTarget = {
  workspace: 'safe-global',
  ticket: 'DES-143',
  team: 'DES',
  project: 'DES / Private notes & pending queue',
}

export type PinnedComment = FeedbackTarget & {
  comment: string
  where: string
  pinLink: string
  viewport: string
  transaction?: string
  theme?: string
}

const titleFrom = (comment: string) => {
  const firstLine = comment.trim().split('\n')[0]
  return firstLine.length > 60 ? `${firstLine.slice(0, 59)}…` : firstLine
}

export const feedbackTitle = ({ ticket, comment }: Pick<PinnedComment, 'ticket' | 'comment'>) =>
  `[Feedback] ${ticket}: ${titleFrom(comment)}`

export const feedbackDescription = ({
  ticket,
  comment,
  where,
  pinLink,
  viewport,
  transaction,
  theme,
}: Omit<PinnedComment, 'workspace' | 'team' | 'project'>) =>
  [
    comment.trim(),
    '',
    '---',
    `**Where:** ${where}`,
    ...(transaction ? [`**Transaction:** ${transaction}`] : []),
    `**Pin link:** [Open pinned spot](${pinLink})`,
    `**Viewport:** ${viewport}${theme ? ` · **Theme:** ${theme}` : ''}`,
    `**Prototype:** ${ticket}`,
  ].join('\n')

export const buildFeedbackUrl = (details: PinnedComment) => {
  const params = new URLSearchParams({
    title: feedbackTitle(details),
    description: feedbackDescription(details),
    project: details.project,
    links: `${details.pinLink}|Open pinned spot`,
  })
  return `https://linear.app/team/${details.team}/new?${params.toString()}`
}

export const linearIssueUrl = (workspace: string, issue: string) => `https://linear.app/${workspace}/issue/${issue}`

// A real link click opens a new tab; some embedded browsers turn window.open into a same-tab navigation.
export const openLinearIssue = (url: string) => {
  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.click()
}
