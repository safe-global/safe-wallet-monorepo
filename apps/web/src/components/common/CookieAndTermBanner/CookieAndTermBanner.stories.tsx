import type { Meta, StoryObj } from '@storybook/react'
import { CookieAndTermBanner, POPUP_SURFACE } from './index'
import { CookieAndTermType } from '@/store/cookiesAndTermsSlice'
import { StoreDecorator } from '@/stories/storeDecorator'

const meta = {
  title: 'Components/Common/CookieAndTermBanner',
  component: CookieAndTermBanner,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story, context) => (
      <StoreDecorator initialState={{}} context={context}>
        {/* Matches the 400px popup width — the layout only reads correctly at that size. */}
        <div className="max-w-[400px]">
          <Story />
        </div>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof CookieAndTermBanner>

export default meta
type Story = StoryObj<typeof meta>

/** Bare banner, as rendered inline on Settings → Cookies, where the page supplies the surface. */
export const Default: Story = {
  args: {},
}

/** The first-visit popup, with the same chrome `CookieBannerPopup` applies. */
export const Popup: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className={POPUP_SURFACE}>
        <Story />
      </div>
    ),
  ],
}

export const WithWarning: Story = {
  args: {
    warningKey: CookieAndTermType.UPDATES,
  },
  decorators: [
    (Story) => (
      <div className={POPUP_SURFACE}>
        <Story />
      </div>
    ),
  ],
}
