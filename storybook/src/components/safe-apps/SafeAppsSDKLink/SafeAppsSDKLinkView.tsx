import type { ReactElement } from 'react'
import { ChevronsUp } from 'lucide-react'
import classnames from 'classnames'
import CodeIcon from '@/public/images/apps/code-icon.svg'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import ExternalLink from '@/components/common/ExternalLink'
import css from './styles.module.css'

export type SafeAppsSDKLinkViewProps = {
  isMini: boolean
  docsUrl: string
}

export function SafeAppsSDKLinkView({ isMini, docsUrl }: SafeAppsSDKLinkViewProps): ReactElement {
  return (
    <div className={classnames(css.container, { [css.mini]: isMini })} tabIndex={0}>
      <CodeIcon />

      <Typography variant="h4" className={css.title}>
        How to build on <i>Safe</i>?
      </Typography>

      <ExternalLink href={docsUrl} className={`${css.link} text-sm`} noIcon>
        <span>Learn more about Safe Apps SDK</span>
      </ExternalLink>

      <Button
        variant="secondary"
        size="sm"
        // eslint-disable-next-line no-restricted-syntax -- faithful css-module port, pixel-identical; bespoke value has no variant
        className={classnames(css.openButton, 'h-[20px] rounded-[0_0_8px_8px] bg-[var(--color-secondary-main)]')}
        tabIndex={-1}
      >
        <ChevronsUp className="size-4" />
      </Button>
    </div>
  )
}
