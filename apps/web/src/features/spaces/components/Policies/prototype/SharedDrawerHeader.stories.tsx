import { useEffect, useState, type ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import Notifications from '@/components/common/Notifications'
import { createMockStory } from '@/stories/mocks'
import { FrameStyleProvider, type FrameStyle } from './sharedDrawer/PanelBody'
import { VariantPanel, type PanelDesign, type PanelType } from './sharedDrawer/VariantPanel'
import { SECURITY_HUB } from './sharedDrawer/variants/securityHub'
import { POLICIES } from './sharedDrawer/variants/policies'
import { QUEUE } from './sharedDrawer/variants/queue'
import {
  CONTROLS_BAR_HEIGHT,
  ControlsBar,
  useBarMode,
  type ChoiceControl,
  type SwitchControl,
} from './sharedDrawer/ControlsBar'

const TYPES = { security: SECURITY_HUB, policies: POLICIES, queue: QUEUE } satisfies Record<string, PanelType>
type TypeId = keyof typeof TYPES

type CanvasSettings = PanelDesign & {
  frameStyle: FrameStyle
  /** Three panels side by side, or every variant of one panel type in a row. */
  view: 'side-by-side' | TypeId
} & Record<TypeId, string>

const variantIndex = (type: PanelType, id: string): number =>
  Math.max(
    type.variants.findIndex((variant) => variant.id === id),
    0,
  )

/** Each panel type with its picked variant; the chevrons step through that type's variants. */
const SideBySidePanels = ({
  settings,
  onChange,
}: {
  settings: CanvasSettings
  onChange: (settings: CanvasSettings) => void
}): ReactElement => (
  <>
    {(Object.keys(TYPES) as TypeId[]).map((typeId) => {
      const type = TYPES[typeId]
      const index = variantIndex(type, settings[typeId])
      return (
        <VariantPanel
          key={typeId}
          variant={type.variants[index]}
          design={settings}
          caption={`${type.label} · ${type.variants[index].group ? `${type.variants[index].group} · ` : ''}${type.variants[index].label}`}
          onStep={(by) => {
            const next = type.variants[Math.min(Math.max(index + by, 0), type.variants.length - 1)]
            onChange({ ...settings, [typeId]: next.id })
          }}
          hasPrevious={index > 0}
          hasNext={index < type.variants.length - 1}
        />
      )
    })}
  </>
)

/** Every variant of one panel type, side by side, each with its name above it. */
const AllVariants = ({ type, design }: { type: PanelType; design: PanelDesign }): ReactElement => (
  <>
    {type.variants.map((variant) => (
      <VariantPanel
        key={variant.id}
        variant={variant}
        design={design}
        caption={variant.group ? `${variant.group} · ${variant.label}` : variant.label}
      />
    ))}
  </>
)

const variantChoice = (key: TypeId): ChoiceControl<CanvasSettings> => ({
  key,
  label: TYPES[key].label,
  options: TYPES[key].variants.map(({ id, label, group }) => ({ value: id, label, group })),
})

const CHOICES: ChoiceControl<CanvasSettings>[] = [
  {
    key: 'view',
    label: 'View',
    options: [
      { value: 'side-by-side', label: 'Side by side' },
      { value: 'security', label: 'All Security Hub variants' },
      { value: 'policies', label: 'All Policies variants' },
      { value: 'queue', label: 'All pending queue variants' },
    ],
  },
  variantChoice('security'),
  variantChoice('policies'),
  variantChoice('queue'),
  {
    key: 'panelWidth',
    label: 'Width',
    options: [360, 400, 440, 520, 600, 700].map((value) => ({ value, label: `${value}px` })),
  },
  {
    key: 'nameLength',
    label: 'Names',
    options: [
      { value: 'short', label: 'Short' },
      { value: 'long', label: 'Long' },
    ],
  },
  {
    key: 'nameEnding',
    label: 'Long name ends in',
    options: [
      { value: 'fade', label: 'Fade' },
      { value: 'dots', label: 'Dots' },
      { value: 'fade-dots', label: 'Fade and dots' },
    ],
  },
  {
    key: 'frameStyle',
    label: 'Frames',
    options: [
      { value: 'white', label: 'White' },
      { value: 'white-border', label: 'White + border' },
      { value: 'white-shadow', label: 'White + shadow' },
      { value: 'grey', label: 'Grey' },
    ],
  },
  {
    key: 'buttonLayout',
    label: 'Buttons',
    options: [
      { value: 'group', label: 'Grouped' },
      { value: 'separate', label: 'Separate' },
    ],
  },
  {
    key: 'buttonSize',
    label: 'Button size',
    options: [
      { value: 'icon-sm', label: '32px' },
      { value: 'icon', label: '36px' },
    ],
  },
  {
    key: 'padding',
    label: 'Padding',
    options: [
      { value: 16, label: '16px' },
      { value: 24, label: '24px' },
    ],
  },
]

const SWITCHES: SwitchControl<CanvasSettings>[] = [
  { key: 'showChevrons', label: 'Chevrons' },
  { key: 'showExpand', label: 'Expand' },
]

/** Like the real drawer, each panel sits 12px from the top and bottom of the viewport (below the bar while it's open). */
const SidePanelCanvas = (args: CanvasSettings): ReactElement => {
  const [settings, setSettings] = useState(args)
  const [barMode, setBarMode] = useBarMode()

  // Storybook's own Controls (and switching stories) still win, so both ways of changing a setting work.
  useEffect(() => setSettings(args), [args])

  // The variant pickers only steer the side-by-side view.
  const choices = settings.view === 'side-by-side' ? CHOICES : CHOICES.filter(({ key }) => !(key in TYPES))

  return (
    <FrameStyleProvider value={settings.frameStyle}>
      <ControlsBar
        mode={barMode}
        onModeChange={setBarMode}
        settings={settings}
        onChange={setSettings}
        choices={choices}
        switches={SWITCHES}
      />
      <div
        className="flex h-screen items-stretch gap-3 overflow-x-auto bg-background p-3 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]"
        style={barMode === 'expanded' ? { paddingTop: CONTROLS_BAR_HEIGHT + 12 } : undefined}
      >
        {settings.view === 'side-by-side' ? (
          <SideBySidePanels settings={settings} onChange={setSettings} />
        ) : (
          <AllVariants type={TYPES[settings.view]} design={settings} />
        )}
        <Notifications />
      </div>
    </FrameStyleProvider>
  )
}

const setup = createMockStory({ wallet: 'connected', shadcn: true })

const meta = {
  title: 'Prototype/Shared side panel',
  component: SidePanelCanvas,
  decorators: [setup.decorator],
  // The prototype carries its own controls bar, so Storybook's Controls panel starts hidden.
  parameters: { ...setup.parameters, layout: 'fullscreen', options: { showPanel: false } },
  argTypes: {
    view: { control: 'select', options: ['side-by-side', ...Object.keys(TYPES)] },
    security: { control: 'select', options: SECURITY_HUB.variants.map(({ id }) => id) },
    policies: { control: 'select', options: POLICIES.variants.map(({ id }) => id) },
    queue: { control: 'select', options: QUEUE.variants.map(({ id }) => id) },
    panelWidth: { control: { type: 'range', min: 360, max: 700, step: 20 } },
    nameLength: { control: 'inline-radio', options: ['short', 'long'] },
    nameEnding: { control: 'inline-radio', options: ['fade', 'dots', 'fade-dots'] },
    padding: { control: 'inline-radio', options: [16, 24] },
    buttonSize: { control: 'inline-radio', options: ['icon-sm', 'icon'] },
    buttonLayout: { control: 'inline-radio', options: ['group', 'separate'] },
    frameStyle: { control: 'inline-radio', options: ['white', 'white-border', 'white-shadow', 'grey'] },
  },
  args: {
    view: 'side-by-side',
    security: 'issues',
    policies: 'allowlist-pending-you',
    queue: 'queue-final-signature',
    panelWidth: 440,
    nameLength: 'short',
    nameEnding: 'fade',
    showChevrons: true,
    showExpand: true,
    padding: 16,
    buttonSize: 'icon-sm',
    buttonLayout: 'group',
    frameStyle: 'white',
  },
} satisfies Meta<typeof SidePanelCanvas>

export default meta
type Story = StoryObj<typeof meta>

/** One panel of each type; pick a variant per type in the bar, or step through them with the chevrons. */
export const SideBySide: Story = {}

/** Every Security Hub state from production: loading, healthy, issues, critical, update, protection, multichain, no results. */
export const SecurityHubVariants: Story = {
  args: { view: 'security' },
}

/** Every Policies state from the M2 prototype: recipient allowlist, spending limit, proposer and account panel. */
export const PoliciesVariants: Story = {
  args: { view: 'policies' },
}

/** Every pending queue state from the queue preview: signing states, then one panel per transaction type. */
export const PendingQueueVariants: Story = {
  args: { view: 'queue' },
}

/** Long names on every panel, to compare how the title ends when it doesn't fit. */
export const LongNames: Story = {
  args: { nameLength: 'long' },
}

/** Today's grey frames (DrawerList's bg-muted), for comparison with the white ones. */
export const GreyFrames: Story = {
  args: { frameStyle: 'grey' },
}

/** The previous layout: four separate 36px buttons, for comparison with the grouped control. */
export const SeparateButtons: Story = {
  args: { nameLength: 'long', buttonSize: 'icon', buttonLayout: 'separate' },
}
