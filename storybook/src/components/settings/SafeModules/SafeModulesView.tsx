import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

import ExternalLink from '@/components/common/ExternalLink'
import DeleteIcon from '@/public/images/common/delete.svg'
import SettingsCard from '@/components/settings/SettingsCard'

import css from '@/components/settings/TransactionGuards/styles.module.css'

const NoModules = () => {
  return <Typography className="mt-4 text-muted-foreground">No modules enabled</Typography>
}

export type ModuleDisplayViewProps = {
  addressInfo: ReactNode
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  isReady: boolean
  onRemove: () => void
}

export const ModuleDisplayView = ({ addressInfo, renderCheckWallet, isReady, onRemove }: ModuleDisplayViewProps) => {
  return (
    <div className={css.guardDisplay}>
      {addressInfo}
      {renderCheckWallet((isOk) => (
        <Button
          data-testid="module-remove-btn"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          disabled={!isOk || !isReady}
          title="Remove module"
        >
          <DeleteIcon className="size-4 text-destructive" />
        </Button>
      ))}
    </div>
  )
}

export type SafeModulesViewProps = {
  hasModules: boolean
  modules: ReactNode
}

export const SafeModulesView = ({ hasModules, modules }: SafeModulesViewProps) => {
  return (
    <SettingsCard title="Safe modules">
      <div>
        <Typography>
          Modules allow you to customize the access-control logic of your Safe account. Modules are potentially risky,
          so make sure to only use modules from trusted sources. Learn more about modules{' '}
          <ExternalLink
            className="font-bold hover:text-muted-foreground"
            href="https://help.safe.global/articles/5490514177-What-is-a-module?"
          >
            here
          </ExternalLink>
        </Typography>
        {!hasModules ? <NoModules /> : modules}
      </div>
    </SettingsCard>
  )
}
