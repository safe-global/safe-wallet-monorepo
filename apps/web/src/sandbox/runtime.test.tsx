import { execFileSync } from 'node:child_process'
import { cloneElement, type ComponentType, type ReactElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import ts from 'typescript'
import { runView } from './runtime'

const loadView = <P,>(source: string, dependencies: Record<string, unknown> = {}): ComponentType<P> => {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  })
  return runView(outputText, dependencies, 'test-view.tsx').View as ComponentType<P>
}

describe('runView', () => {
  it('renders a view with props and children from trusted code', () => {
    const View = loadView<{ title: string; children: string }>(
      `export const View = ({ title, children }) => <section><h1>{title}</h1>{children}</section>`,
    )
    render(<View title="Owners">two of three</View>)

    expect(screen.getByRole('heading', { name: 'Owners' })).toBeInTheDocument()
    expect(screen.getByText('two of three')).toBeInTheDocument()
  })

  it('gives view code no window, document, fetch or localStorage', () => {
    const View = loadView(
      `export const View = () => <p>{[typeof window, typeof document, typeof fetch, typeof localStorage].join(',')}</p>`,
    )
    render(<View />)

    expect(screen.getByText('undefined,undefined,undefined,undefined')).toBeInTheDocument()
  })

  it('gives view code Intl for formatting', () => {
    const View = loadView(`export const View = () => <p>{new Intl.NumberFormat('en-US').format(1234.5)}</p>`)
    render(<View />)

    expect(screen.getByText('1,234.5')).toBeInTheDocument()
  })

  it('passes the real event to a trusted handler that the view forwards unchanged', () => {
    const targets: unknown[] = []
    const onClick = (e: { currentTarget: unknown }) => targets.push(e.currentTarget)
    const View = loadView<{ onClick: typeof onClick }>(
      `export const View = ({ onClick }) => <button onClick={onClick}>go</button>`,
    )
    render(<View onClick={onClick} />)
    fireEvent.click(screen.getByText('go'))

    expect(targets[0]).toBeInstanceOf(HTMLButtonElement)
  })

  it('renders a view that calls React methods on the React namespace', () => {
    const View = loadView(
      `import * as React from 'react'\nexport const View = React.memo(React.forwardRef((props, ref) => <p ref={ref}>memo</p>))`,
    )
    render(<View />)

    expect(screen.getByText('memo')).toBeInTheDocument()
  })

  it('lets a view use a module allowed by the policy', () => {
    const View = loadView(
      `import { cn } from '@safe-global/views/utils/cn'\nexport const View = () => <p className={cn('a', false && 'b', 'c')}>x</p>`,
      {
        '@safe-global/views/utils/cn': {
          __esModule: true,
          cn: (...names: unknown[]) => names.filter(Boolean).join(' '),
        },
      },
    )
    render(<View />)

    expect(screen.getByText('x')).toHaveClass('a c')
  })

  it('gives a library the real props of an element that trusted code passed through a view', () => {
    const onTrustedClick = jest.fn()
    const onLibraryClick = jest.fn()
    const Trigger = ({ render }: { render: ReactElement<{ onClick: () => void }> }) =>
      cloneElement(render, {
        onClick: () => {
          render.props.onClick()
          onLibraryClick()
        },
      })
    const View = loadView<{ button: ReactElement }>(
      `import { Trigger } from '@base-ui/react/trigger'\nexport const View = ({ button }) => <Trigger render={button} />`,
      { '@base-ui/react/trigger': { __esModule: true, Trigger } },
    )
    render(<View button={<button onClick={onTrustedClick}>edit</button>} />)
    fireEvent.click(screen.getByText('edit'))

    expect(onTrustedClick).toHaveBeenCalledTimes(1)
    expect(onLibraryClick).toHaveBeenCalledTimes(1)
  })

  it('throws when a view requires a module the loader did not provide', () => {
    expect(() =>
      loadView(`import { getAddress } from 'viem'\nexport const View = () => <p>{getAddress('0x0')}</p>`),
    ).toThrow('View test-view.tsx requires viem, which the loader did not provide')
  })

  it('freezes built-ins for compartment code after lockdown', () => {
    const script = `require('ses')
      lockdown({ overrideTaming: 'severe', errorTaming: 'unsafe' })
      const compartment = new Compartment({ globals: {}, __options__: true })
      let result = 'changed'
      try { compartment.evaluate('Array.prototype.map = () => 1') } catch (e) { result = e.constructor.name }
      process.stdout.write([result, Object.isFrozen(Array.prototype)].join(','))`
    const output = execFileSync(process.execPath, ['-e', script], { cwd: __dirname, encoding: 'utf8' })

    expect(output).toBe('TypeError,true')
  })

  it('keeps an external src written by view code in the DOM', () => {
    const View = loadView(`export const View = () => <img alt="x" src="https://evil.example/x" />`)
    render(<View />)

    expect(screen.getByAltText('x')).toHaveAttribute('src', 'https://evil.example/x')
  })

  it('passes DOM events through unchanged', () => {
    const report = jest.fn()
    const View = loadView<{ report: (value: unknown) => void }>(
      `export const View = ({ report }) => <button onClick={(e) => report(e.target.ownerDocument.defaultView)}>go</button>`,
    )
    render(<View report={report} />)
    fireEvent.click(screen.getByText('go'))

    expect(report.mock.calls[0][0]).toBe(window)
  })

  it('passes refs through unchanged', () => {
    const report = jest.fn()
    const View = loadView<{ report: (value: unknown) => void }>(
      `import { useEffect, useRef } from 'react'
       export const View = ({ report }) => {
         const ref = useRef(null)
         useEffect(() => report(ref.current))
         return <div ref={ref} />
       }`,
    )
    render(<View report={report} />)

    expect(report.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement)
    expect(report.mock.calls[0][0].ownerDocument).toBe(document)
  })
})
