/**
 * Applies the Storybook preview's global decorators to composed stories, so a `*.stories.test.tsx`
 * snapshot renders through the same ShadcnProvider + theme wrapper as the Storybook canvas.
 *
 * Much smaller than the app's equivalent: nothing in this package reads chains, wallets or the
 * Redux store, so there is nothing to mock. If a story needs mocking, it belongs in apps/web.
 */
import { setProjectAnnotations } from '@storybook/react'
import * as previewAnnotations from '../../.storybook/preview'

setProjectAnnotations(previewAnnotations)
