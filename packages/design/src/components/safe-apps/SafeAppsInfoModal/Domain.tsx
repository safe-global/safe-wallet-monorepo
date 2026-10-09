import React from 'react'
import { Check } from 'lucide-react'
import { Typography } from '@safe-global/design/components/ui/typography'
import { cn } from '@safe-global/design/utils/cn'

import styles from '@safe-global/design/components/safe-apps/SafeAppsInfoModal/styles.module.css'

type DomainProps = {
  url: string
  showInOneLine?: boolean
}

const Domain: React.FC<DomainProps> = ({ url, showInOneLine }): React.ReactElement => {
  return (
    <Typography className={cn(styles.domainText, { 'overflow-y-hidden whitespace-nowrap': showInOneLine })}>
      <Check className={cn(styles.domainIcon, 'shrink-0 text-[var(--color-success-main)]')} /> {url}
    </Typography>
  )
}

export default Domain
