import type { ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from '@safe-global/views/components/ui/typography'
import { SPEC_STATUS_TAGS, StatusTagChip } from './m2OverviewPage'

/** Every tag from spec 5.7, grouped by the change it describes. */
const StatusTags = (): ReactElement => (
  <div className="flex min-h-screen flex-col gap-8 bg-background p-10 text-foreground">
    <Typography variant="h3">Allowlist status tags</Typography>
    {SPEC_STATUS_TAGS.map(({ group, tags }) => (
      <section key={group} className="flex flex-col gap-3">
        <Typography variant="paragraph-mini-medium" color="muted" className="uppercase">
          {group}
        </Typography>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <StatusTagChip key={tag.label} tag={tag} />
          ))}
        </div>
      </section>
    ))}
  </div>
)

const meta = {
  title: 'Prototype/Policy engine/Allowlist MVP · final design 2026/Status tags',
  id: 'prototype-allowlist-mvp-status-tags',
  component: StatusTags,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StatusTags>

export default meta

export const AllTags: StoryObj<typeof meta> = { name: 'All tags' }
