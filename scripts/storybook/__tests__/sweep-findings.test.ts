import {
  externalCallOf,
  hasBrokenStory,
  isReportableConsoleError,
  renderIssues,
  type Finding,
  type LoadSignals,
  type RenderState,
} from '../sweep-findings'

const rendered: RenderState = {
  sbError: false,
  errorMessage: '',
  empty: false,
  textLength: 12,
  textSample: 'Hello world!',
  visibleHeight: 40,
  srcdocFrames: 0,
}
const quiet: LoadSignals = { pageErrors: [], consoleErrors: [], externalCalls: [] }

describe('renderIssues', () => {
  it('has no issues for a story that rendered quietly', () => {
    expect(renderIssues(rendered, quiet)).toEqual([])
  })

  it('reports the Storybook error display with its message', () => {
    expect(renderIssues({ ...rendered, sbError: true, errorMessage: 'No provider' }, quiet)).toEqual([
      'SB_ERROR: No provider',
    ])
  })

  it('reports an empty root, and not also a blank render', () => {
    expect(renderIssues({ ...rendered, empty: true, textLength: 0, visibleHeight: 0 }, quiet)).toEqual(['EMPTY_ROOT'])
  })

  it('reports a root without text and without a visible box as blank', () => {
    expect(renderIssues({ ...rendered, textLength: 0, visibleHeight: 0 }, quiet)).toEqual(['BLANK_RENDER'])
  })

  it('does not report a root without text that paints a box, or a line of text', () => {
    expect(renderIssues({ ...rendered, textLength: 0, visibleHeight: 9 }, quiet)).toEqual([])
    expect(renderIssues({ ...rendered, textLength: 1, visibleHeight: 0 }, quiet)).toEqual([])
  })

  it('reports srcdoc iframes, whose images can paint after the screenshot', () => {
    expect(renderIssues({ ...rendered, srcdocFrames: 3 }, quiet)).toEqual(['SRCDOC_IFRAME: 3 frame(s)'])
  })

  it('reports the first page error, two console errors and every external call', () => {
    const signals: LoadSignals = {
      pageErrors: ['TypeError: a', 'TypeError: b'],
      consoleErrors: ['one', 'two', 'three'],
      externalCalls: ['api.example/v1/a', 'api.example/v1/b'],
    }
    expect(renderIssues(rendered, signals)).toEqual([
      'PAGE_ERROR: TypeError: a',
      'CONSOLE: one | two',
      'EXTERNAL_REQUEST: api.example/v1/a | api.example/v1/b',
    ])
  })
})

describe('isReportableConsoleError', () => {
  const storybook = 'http://localhost:4000'

  it('ignores a failed load from outside the Storybook, which the sweep blocks on purpose', () => {
    expect(
      isReportableConsoleError(
        'Failed to load resource: net::ERR_NAME_NOT_RESOLVED',
        'https://cdn.example/a.png',
        storybook,
      ),
    ).toBe(false)
  })

  it('reports a failed load from the Storybook itself', () => {
    expect(isReportableConsoleError('Failed to load resource: 404', `${storybook}/missing.js`, storybook)).toBe(true)
  })

  it('reports any other console error', () => {
    expect(isReportableConsoleError('Warning: Each child needs a key', 'https://cdn.example/a.js', storybook)).toBe(
      true,
    )
  })
})

describe('externalCallOf', () => {
  const origin = 'http://localhost:4000'

  it('returns host and path for an API call to another origin', () => {
    expect(externalCallOf('https://safe-client.example/v1/chains/1?x=1', 'fetch', origin)).toBe(
      'safe-client.example/v1/chains/1',
    )
    expect(externalCallOf('https://safe-client.example/v1/chains', 'xhr', origin)).toBe('safe-client.example/v1/chains')
  })

  it('ignores calls to the Storybook and requests that are not API calls', () => {
    expect(externalCallOf(`${origin}/index.json`, 'fetch', origin)).toBeUndefined()
    expect(externalCallOf('https://cdn.example/logo.png', 'image', origin)).toBeUndefined()
  })
})

describe('hasBrokenStory', () => {
  const finding = (issues: string[]): Finding => ({ id: 'a--b', title: 'A', name: 'B', mode: 'light', issues })

  it('is true only when a story shows the Storybook error display', () => {
    expect(hasBrokenStory([finding(['CONSOLE: x']), finding(['SB_ERROR: boom'])])).toBe(true)
    expect(hasBrokenStory([finding(['CONSOLE: x', 'UNSTABLE_SCREENSHOT'])])).toBe(false)
    expect(hasBrokenStory([])).toBe(false)
  })
})
