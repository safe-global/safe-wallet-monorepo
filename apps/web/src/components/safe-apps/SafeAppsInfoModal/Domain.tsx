import React from 'react'
import { Check } from 'lucide-react'
import { Typography } from '@safe-global/design-system/components/typography'
import { cn } from '@safe-global/design-system/utils/cn'

import styles from './styles.module.css'

type DomainProps = {
  url: string
  showInOneLine?: boolean
}

const Domain: React.FC<DomainProps> = ({ url, showInOneLine }): React.ReactElement => {
  return (
    <Typography className={cn(styles.domainText, { 'overflow-y-hidden whitespace-nowrap': showInOneLine })}>
      <Check className={cn(styles.domainIcon, 'text-[var(--color-success-main)]')} /> {url}
    </Typography>
  )
}

export default Domain
