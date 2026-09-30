import { readFileSync } from 'fs'
import path from 'path'
import { render } from '@/tests/test-utils'
import { setIsProduction } from '@/tests/env'
import { FeatureFlagEditorDialogLoader } from '../FeatureFlagEditorDialogLoader'

const LOADER = path.resolve(__dirname, '../FeatureFlagEditorDialogLoader.tsx')

describe('FeatureFlagEditorDialogLoader', () => {
  const originalIsProduction = process.env.NEXT_PUBLIC_IS_PRODUCTION

  afterEach(() => {
    setIsProduction(originalIsProduction)
  })

  // Only the bundler can tell the inlined process.env check from an imported IS_PRODUCTION
  // constant — the two behave identically at runtime, but only the inlined one folds away, and
  // the whole editor UI ships to production users the moment it stops folding.
  it('keeps the guard in a form the bundler can fold', () => {
    expect(readFileSync(LOADER, 'utf8')).toContain("process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'")
  })

  it('renders the dialog outside production', async () => {
    const { findByRole } = render(<FeatureFlagEditorDialogLoader open onOpenChange={jest.fn()} />)

    expect(await findByRole('heading', { name: 'Feature flags' })).toBeInTheDocument()
  })

  it('renders nothing in production', async () => {
    setIsProduction('true')

    // The guard runs once, when the module is evaluated, so the loader has to be re-imported into
    // a fresh registry to see the production env. next/dynamic is stood in for by a component that
    // renders synchronously, so an empty DOM can only mean the guard replaced the dialog.
    await jest.isolateModulesAsync(async () => {
      jest.doMock('next/dynamic', () => ({
        __esModule: true,
        default: () => () => <span data-testid="dynamic-dialog" />,
      }))

      const { FeatureFlagEditorDialogLoader: ProdLoader } = await import('../FeatureFlagEditorDialogLoader')
      const { container } = render(<ProdLoader open onOpenChange={jest.fn()} />)

      expect(container).toBeEmptyDOMElement()
    })
  })
})
