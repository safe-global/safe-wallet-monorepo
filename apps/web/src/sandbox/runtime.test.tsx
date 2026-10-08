import { cloneElement, createRef, type ComponentType, type ReactElement } from 'react'
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

  it('gives view code no window, document or fetch', () => {
    const View = loadView(`export const View = () => <p>{[typeof window, typeof document, typeof fetch].join(',')}</p>`)
    render(<View />)

    expect(screen.getByText('undefined,undefined,undefined')).toBeInTheDocument()
  })

  it('gives view code Intl for formatting', () => {
    const View = loadView(`export const View = () => <p>{new Intl.NumberFormat('en-US').format(1234.5)}</p>`)
    render(<View />)

    expect(screen.getByText('1,234.5')).toBeInTheDocument()
  })

  it('does not render iframe or script elements from view code', () => {
    const View = loadView(
      `export const View = () => <div data-testid="root"><iframe src="/x" /><script>1</script></div>`,
    )
    render(<View />)

    expect(screen.getByTestId('root')).toBeEmptyDOMElement()
  })

  it('drops an external href written by view code but keeps one passed in by trusted code', () => {
    const View = loadView<{ href: string }>(
      `export const View = ({ href }) => <><a href="https://example.com/?leak=1">own</a><a href={href}>given</a></>`,
    )
    render(<View href="https://help.safe.global" />)

    expect(screen.getByText('own')).not.toHaveAttribute('href')
    expect(screen.getByText('given')).toHaveAttribute('href', 'https://help.safe.global')
  })

  it('keeps links and images to hosts in the policy and drops others', () => {
    const View = loadView(
      `export const View = () => <>
        <a href="https://help.safe.global/articles/1">help</a>
        <img alt="logo" src="https://safe-transaction-assets.safe.global/chains/1/chain_logo.png" />
        <img alt="identicon" src="data:image/svg+xml;base64,PHN2Zy8+" />
        <img alt="tracker" src="https://example.com/pixel.png" />
      </>`,
    )
    render(<View />)

    expect(screen.getByText('help')).toHaveAttribute('href', 'https://help.safe.global/articles/1')
    expect(screen.getByAltText('logo')).toHaveAttribute(
      'src',
      'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
    )
    expect(screen.getByAltText('identicon')).toHaveAttribute('src', 'data:image/svg+xml;base64,PHN2Zy8+')
    expect(screen.getByAltText('tracker')).not.toHaveAttribute('src')
  })

  it('keeps mail links to hosts in the policy and drops others', () => {
    const View = loadView(
      `export const View = () => <>
        <a href="mailto:info@safe.global">info</a>
        <a href="mailto:x@example.com">other</a>
        <img alt="mail" src="mailto:info@safe.global" />
      </>`,
    )
    render(<View />)

    expect(screen.getByText('info')).toHaveAttribute('href', 'mailto:info@safe.global')
    expect(screen.getByText('other')).not.toHaveAttribute('href')
    expect(screen.getByAltText('mail')).not.toHaveAttribute('src')
  })

  it('keeps a same-origin path written by view code', () => {
    const View = loadView(`export const View = () => <a href="/settings">settings</a>`)
    render(<View />)

    expect(screen.getByText('settings')).toHaveAttribute('href', '/settings')
  })

  it('keeps a same-origin URL object written by view code and drops one with a host', () => {
    const Link = ({ href, children }: { href?: { pathname?: string; host?: string }; children: string }) => (
      <span data-href={href ? `${href.host ?? ''}${href.pathname}` : 'none'}>{children}</span>
    )
    const View = loadView(
      `import Link from 'next/link'\nexport const View = () => <><Link href={{ pathname: '/home', query: { safe: 'eth:0x1' } }}>own</Link><Link href={{ host: 'example.com', pathname: '/' }}>external</Link></>`,
      { 'next/link': { __esModule: true, default: Link } },
    )
    render(<View />)

    expect(screen.getByText('own')).toHaveAttribute('data-href', '/home')
    expect(screen.getByText('external')).toHaveAttribute('data-href', 'none')
  })

  it('keeps a URL object whose pathname the view got from trusted props', () => {
    const Link = ({ href, children }: { href?: { pathname?: string }; children: string }) => (
      <span data-href={href?.pathname ?? 'none'}>{children}</span>
    )
    const View = loadView<{ href: string }>(
      `import Link from 'next/link'\nexport const View = ({ href }) => <Link href={{ pathname: href, query: { tab: 'all' } }}>go</Link>`,
      { 'next/link': { __esModule: true, default: Link } },
    )
    render(<View href="/transactions/messages" />)

    expect(screen.getByText('go')).toHaveAttribute('data-href', '/transactions/messages')
  })

  it('drops dangerouslySetInnerHTML and url() styles from view code', () => {
    const View = loadView(
      `export const View = () => <div data-testid="root" style={{ color: 'red', backgroundImage: 'url(https://example.com/x.png)' }} dangerouslySetInnerHTML={{ __html: '<b>x</b>' }} />`,
    )
    render(<View />)

    const root = screen.getByTestId('root')
    expect(root).toBeEmptyDOMElement()
    expect(root.style.color).toBe('red')
    expect(root.style.backgroundImage).toBe('')
  })

  it('passes a view event handler an event without DOM nodes', () => {
    const report = jest.fn()
    const View = loadView<{ report: (value: unknown) => void }>(
      `export const View = ({ report }) => <button onClick={(e) => report([typeof e.currentTarget.ownerDocument, typeof e.nativeEvent, e.type].join(','))}>go</button>`,
    )
    render(<View report={report} />)
    fireEvent.click(screen.getByText('go'))

    expect(report).toHaveBeenCalledWith('undefined,undefined,click')
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

  it('attaches a trusted ref to the DOM node without letting the view read the node', () => {
    const report = jest.fn()
    const innerRef = createRef<HTMLDivElement>()
    const View = loadView<{ innerRef: typeof innerRef; report: (value: unknown) => void }>(
      `import { useEffect } from 'react'
       export const View = ({ innerRef, report }) => {
         useEffect(() => report(typeof innerRef.current.ownerDocument))
         return <div ref={innerRef} />
       }`,
    )
    render(<View innerRef={innerRef} report={report} />)

    expect(innerRef.current).toBeInstanceOf(HTMLDivElement)
    expect(report).toHaveBeenCalledWith('undefined')
  })

  it('does not render an element object forged by view code', () => {
    const View = loadView(
      `export const View = () => <div data-testid="root">{{ $$typeof: Symbol.for('react.transitional.element'), type: 'iframe', key: null, props: { src: 'https://example.com' } }}</div>`,
    )
    render(<View />)

    expect(screen.getByTestId('root')).toBeEmptyDOMElement()
  })

  it('does not let view code read the props of an element passed in by trusted code', () => {
    const onSign = jest.fn()
    const View = loadView<{ children: ReactElement }>(
      `export const View = ({ children }) => { children.props.onSign?.(); return <div>{children}</div> }`,
    )
    render(
      <View>
        <button onClick={onSign}>sign</button>
      </View>,
    )
    fireEvent.click(screen.getByText('sign'))

    expect(onSign).toHaveBeenCalledTimes(1)
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
      `import { cn } from '@/utils/cn'\nexport const View = () => <p className={cn('a', false && 'b', 'c')}>x</p>`,
      {
        '@/utils/cn': { __esModule: true, cn: (...names: unknown[]) => names.filter(Boolean).join(' ') },
      },
    )
    render(<View />)

    expect(screen.getByText('x')).toHaveClass('a c')
  })

  it('keeps unkeyed trusted elements unique across re-renders', () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
    const View = loadView<{ a: ReactElement; b: ReactElement | null }>(
      `export const View = ({ a, b }) => <header>{a}{b}</header>`,
    )
    const { rerender } = render(<View a={<span>bell</span>} b={null} />)
    rerender(<View a={<span>bell</span>} b={<span>account</span>} />)
    rerender(<View a={<span>bell</span>} b={<span>account</span>} />)

    expect(screen.getAllByText('bell')).toHaveLength(1)
    expect(screen.getAllByText('account')).toHaveLength(1)
    expect(errors).not.toHaveBeenCalledWith(expect.stringContaining('same key'), expect.anything(), expect.anything())
    errors.mockRestore()
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
})
