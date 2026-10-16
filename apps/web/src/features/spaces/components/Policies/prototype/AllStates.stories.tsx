import type { ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { ShadcnProvider } from '@/components/ui/ShadcnProvider'
import { Typography } from '@/components/ui/typography'
import fullFlow, { CANVAS_PARAM, CANVAS_ROWS, MARK_NEW_PARAM } from './GuardSetupFlow.stories'

const FRAME_WIDTH = 1440
const FRAME_HEIGHT = 900
const FRAME_SCALE = 0.5

/** Same as the meta's `id`, so the canvas can address the frame story by URL. */
const META_ID = 'prototype-policies-m2-all-states'
const FRAME_STORY_ID = `${META_ID}--single-frame`

const getFrameUrl = (frameId: string): string => {
  const url = new URL('iframe.html', window.location.href)
  const params = new URLSearchParams({ id: FRAME_STORY_ID, viewMode: 'story', [CANVAS_PARAM]: frameId })
  if (new URLSearchParams(window.location.search).get(MARK_NEW_PARAM) === '1') params.set(MARK_NEW_PARAM, '1')
  url.search = params.toString()
  return url.toString()
}

/** Its own page, so the state's drawers, dialogs and full-screen flow stay inside the frame. */
const Frame = ({ id, label }: { id: string; label: string }): ReactElement => (
  <figure className="flex shrink-0 flex-col gap-2">
    <figcaption>
      <Typography variant="paragraph-small-medium" color="muted">
        {label}
      </Typography>
    </figcaption>

    <div
      className="overflow-hidden rounded-lg border border-border bg-background"
      style={{ width: FRAME_WIDTH * FRAME_SCALE, height: FRAME_HEIGHT * FRAME_SCALE }}
    >
      <iframe
        title={label}
        src={getFrameUrl(id)}
        loading="lazy"
        className="origin-top-left border-0"
        style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT, transform: `scale(${FRAME_SCALE})` }}
      />
    </div>
  </figure>
)

const AllStatesCanvas = ({ isDark }: { isDark: boolean }): ReactElement => (
  <ShadcnProvider dark={isDark}>
    <div className="min-h-screen w-max bg-muted p-10">
      <div className="flex flex-col gap-12">
        <Typography variant="h2">Policies M2 – All states</Typography>

        {CANVAS_ROWS.map(({ title, frames }) => (
          <section key={title} className="flex flex-col gap-4">
            <Typography variant="h4">{title}</Typography>

            <div className="flex gap-8">
              {frames.map(({ id, label }) => (
                <Frame key={id} id={id} label={label} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  </ShadcnProvider>
)

const meta = {
  title: 'Prototype/Policies M2 – All states',
  // Must match META_ID; Storybook reads this without running the file, so it has to be a literal.
  id: 'prototype-policies-m2-all-states',
  parameters: { layout: 'fullscreen' },
  // Dozens of live iframes: not a stable visual snapshot.
  tags: ['skip-visual-test'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Every screen and state of the prototype on one canvas: 1440×900 frames at 50%, grouped in rows. */
export const AllStates: Story = {
  name: 'All states',
  render: (_args, context) => <AllStatesCanvas isDark={context.globals?.theme === 'dark'} />,
}

/** The full-flow prototype, opened by each canvas frame at its state (`?m2state=`). */
export const SingleFrame: Story = {
  name: 'Single frame',
  render: () => <fullFlow.component />,
  decorators: fullFlow.decorators,
  parameters: fullFlow.parameters,
}
