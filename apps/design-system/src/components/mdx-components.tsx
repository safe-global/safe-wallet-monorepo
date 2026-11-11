import defaultMdxComponents from 'fumadocs-ui/mdx'
import { Step, Steps } from 'fumadocs-ui/components/steps'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import { TypeTable } from 'fumadocs-ui/components/type-table'
import type { MDXComponents } from 'mdx/types'
import { Kbd } from '@safe-global/ui/kbd'
import { BaseUiReference } from './docs/base-ui-reference'
import { ColorSwatches } from './docs/color-swatches'
import { ComponentExamples } from './docs/component-examples'
import { ComponentInstall } from './docs/component-install'
import { ComponentPreview } from './docs/component-preview'
import { ComponentProps } from './docs/component-props'
import { ComponentRules } from './docs/component-rules'
import { ComponentUsage } from './docs/component-usage'
import { IconGrid } from './docs/icon-grid'
import { RadiusScale } from './docs/radius-scale'
import { RegistrySnippet } from './docs/registry-snippet'
import { SpacingScale } from './docs/spacing-scale'
import { StoryFrame } from './docs/story-frame'
import { TokenTable } from './docs/token-table'

export const getMDXComponents = (components?: MDXComponents): MDXComponents => ({
  ...defaultMdxComponents,
  Step,
  Steps,
  Tab,
  Tabs,
  TypeTable,
  BaseUiReference,
  ColorSwatches,
  ComponentExamples,
  ComponentInstall,
  ComponentPreview,
  ComponentProps,
  ComponentRules,
  ComponentUsage,
  IconGrid,
  Kbd,
  RadiusScale,
  RegistrySnippet,
  SpacingScale,
  StoryFrame,
  TokenTable,
  ...components,
})
