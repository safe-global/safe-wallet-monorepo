import type { FormEventHandler, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import SettingsCard from '@/components/settings/SettingsCard'

export type EnvironmentVariablesViewProps = {
  onSubmit: FormEventHandler<HTMLFormElement>
  rpcSection: ReactNode
  tenderlySection: ReactNode
}

export const EnvironmentVariablesView = ({ onSubmit, rpcSection, tenderlySection }: EnvironmentVariablesViewProps) => {
  return (
    <SettingsCard title="Environment variables" contentClassName="mb-4">
      <Typography className="mb-6">
        You can override some of our default APIs here in case you need to. Proceed at your own risk.
      </Typography>

      <form onSubmit={onSubmit}>
        {rpcSection}

        {tenderlySection}

        <Button type="submit" className="mt-4">
          Save
        </Button>
      </form>
    </SettingsCard>
  )
}
