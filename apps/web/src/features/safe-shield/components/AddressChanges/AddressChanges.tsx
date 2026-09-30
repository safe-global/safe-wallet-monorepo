import { Typography } from '@/components/ui/typography'
import type { MasterCopyChangeThreatAnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import React from 'react'

interface AddressChangesProps {
  result: MasterCopyChangeThreatAnalysisResult
}

export const AddressChanges = ({ result }: AddressChangesProps) => {
  if (!result.before || !result.after) {
    return null
  }

  const items = [
    {
      label: 'CURRENT MASTERCOPY:',
      value: result.before,
    },
    {
      label: 'NEW MASTERCOPY:',
      value: result.after,
    },
  ]

  return items.map((item, index) => (
    <div
      key={`${item.value}-${index}`}
      className="flex flex-col gap-2 overflow-hidden rounded-[4px] bg-[var(--color-background-paper)] p-2"
    >
      <Typography variant="paragraph-mini" className="text-[var(--color-text-secondary)]">
        {item.label}
      </Typography>

      <Typography variant="paragraph-small" className="break-all whitespace-pre-wrap">
        {item.value}
      </Typography>
    </div>
  ))
}
