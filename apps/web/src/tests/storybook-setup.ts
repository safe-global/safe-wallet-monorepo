/**
 * Storybook test setup - applies global decorators from preview.ts
 */
import { setProjectAnnotations } from '@storybook/react'
import * as previewAnnotations from '../../.storybook/preview'

// Apply the global decorators (ThemeProvider, etc.) to all composed stories
setProjectAnnotations(previewAnnotations)
