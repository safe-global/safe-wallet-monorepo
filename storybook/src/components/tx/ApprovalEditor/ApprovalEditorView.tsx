import type { ReactNode } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'

const Title = ({ isErc721 }: { isErc721: boolean }) => {
  const title = 'Allow access to tokens?'
  const subtitle = isErc721
    ? 'This allows the spender to transfer the specified token.'
    : 'This allows the spender to spend the specified amount of your tokens.'

  return (
    <div>
      <Typography className="font-bold">{title}</Typography>
      <Typography variant="paragraph-small">{subtitle}</Typography>
    </div>
  )
}

export type ApprovalEditorViewProps = {
  isErc721: boolean
  hasError: boolean
  isLoading: boolean
  content: ReactNode
}

export const ApprovalEditorView = ({ isErc721, hasError, isLoading, content }: ApprovalEditorViewProps) => {
  return (
    <div className={`${css.container} mb-2 flex flex-col gap-4`}>
      <Title isErc721={isErc721} />
      {hasError ? (
        <Alert variant="destructive">
          <AlertSeverityIcon variant="destructive" />
          <AlertDescription>Error while decoding approval transactions.</AlertDescription>
        </Alert>
      ) : isLoading ? (
        <Skeleton className="h-[100px] w-full" data-testid="approval-editor-loading" />
      ) : (
        content
      )}
    </div>
  )
}
