/**
 * Storybook test setup - applies global decorators from preview.ts
 */
import { setProjectAnnotations } from '@storybook/react'
import * as previewAnnotations from '../../.storybook/preview'
import { faker } from '@faker-js/faker'

// Seed faker for deterministic test data
faker.seed(123)

// Apply the global decorators (ThemeProvider, etc.) to all composed stories
setProjectAnnotations(previewAnnotations)
