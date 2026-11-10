import type { Mode, StoryEntry } from './sweep-options'

export interface Finding {
  id: string
  title: string
  name: string
  mode: Mode
  issues: string[]
  textSample?: string
}

/** What the story left in the page once it finished rendering */
export interface RenderState {
  sbError: boolean
  errorMessage: string
  empty: boolean
  textLength: number
  textSample: string
  visibleHeight: number
}

/** What happened while the story loaded */
export interface LoadSignals {
  pageErrors: string[]
  consoleErrors: string[]
  externalCalls: string[]
}

// A root that paints no text and nothing taller than this has rendered nothing visible
export const MIN_VISIBLE_HEIGHT = 8
export const MESSAGE_LENGTH = 300

export const truncate = (message: string): string => message.slice(0, MESSAGE_LENGTH)

export const emptyFinding = (story: StoryEntry, mode: Mode): Finding => ({
  id: story.id,
  title: story.title,
  name: story.name,
  mode,
  issues: [],
})

/** The issues a rendered story shows; see the list in render-sweep.ts */
export function renderIssues(state: RenderState, signals: LoadSignals): string[] {
  const issues: string[] = []
  if (state.sbError) issues.push(`SB_ERROR: ${state.errorMessage}`)
  if (state.empty) issues.push('EMPTY_ROOT')
  else if (state.textLength === 0 && state.visibleHeight < MIN_VISIBLE_HEIGHT) issues.push('BLANK_RENDER')
  if (signals.pageErrors.length) issues.push(`PAGE_ERROR: ${signals.pageErrors[0]}`)
  if (signals.consoleErrors.length) issues.push(`CONSOLE: ${signals.consoleErrors.slice(0, 2).join(' | ')}`)
  if (signals.externalCalls.length) issues.push(`EXTERNAL_REQUEST: ${signals.externalCalls.join(' | ')}`)
  return issues
}

/** A failed load of a resource outside the swept Storybook is expected: the sweep blocks every other host */
export const isReportableConsoleError = (text: string, sourceUrl: string, base: string): boolean =>
  !(text.startsWith('Failed to load resource') && !sourceUrl.startsWith(base))

/** An API call to another origin that failed means the story had no MSW mock for it */
export function externalCallOf(requestUrl: string, resourceType: string, baseOrigin: string): string | undefined {
  const url = new URL(requestUrl)
  const isApiCall = resourceType === 'fetch' || resourceType === 'xhr'
  return isApiCall && url.origin !== baseOrigin ? `${url.host}${url.pathname}` : undefined
}

export const hasBrokenStory = (findings: Finding[]): boolean =>
  findings.some((finding) => finding.issues.some((issue) => issue.startsWith('SB_ERROR')))
