import { useEffect, useState } from 'react'
import { ChevronsUp } from 'lucide-react'
import classnames from 'classnames'
import CodeIcon from '@/public/images/apps/code-icon.svg'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { SAFE_APPS_SDK_DOCS_URL } from '@/config/constants'
import css from './styles.module.css'
import ExternalLink from '@/components/common/ExternalLink'

const SafeAppsSDKLink = () => {
  const [isMini, setMini] = useState(false)

  // Minimize the widget when the user scrolls down
  useEffect(() => {
    const MAX_SCROLL = 130

    const onScroll = () => {
      const isScrolled = document.documentElement.scrollTop > MAX_SCROLL
      setMini(isScrolled)
    }

    document.addEventListener('scroll', onScroll)

    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={classnames(css.container, { [css.mini]: isMini })} tabIndex={0}>
      <CodeIcon />

      <Typography variant="h4" className={css.title}>
        How to build on <i>Safe</i>?
      </Typography>

      <ExternalLink href={SAFE_APPS_SDK_DOCS_URL} className={`${css.link} text-sm`} noIcon>
        <span>Learn more about Safe Apps SDK</span>
      </ExternalLink>

      <Button variant="secondary" size="sm" className={css.openButton} tabIndex={-1}>
        <ChevronsUp className="size-4" />
      </Button>
    </div>
  )
}

export default SafeAppsSDKLink
