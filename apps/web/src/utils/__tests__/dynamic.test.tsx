import { render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { Errors, logError } from '@/services/exceptions'
import dynamic from '../dynamic'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const Greeting = ({ name }: { name: string }) => <p>Hello {name}</p>

describe('dynamic', () => {
  it('should, when the module has loaded, render the loaded component with its props', async () => {
    const LazyGreeting = dynamic(() => Promise.resolve({ default: Greeting }))

    render(<LazyGreeting name="Safe" />)

    expect(await screen.findByText('Hello Safe')).toBeInTheDocument()
  })

  it('should, when the loader resolves to the component itself, render it with its props', async () => {
    const LazyGreeting = dynamic(() => Promise.resolve(Greeting))

    render(<LazyGreeting name="Safe" />)

    expect(await screen.findByText('Hello Safe')).toBeInTheDocument()
  })

  it('should, when ssr is false, render nothing on the server', () => {
    const LazyGreeting = dynamic(() => Promise.resolve({ default: Greeting }), { ssr: false })

    const html = renderToString(<LazyGreeting name="Safe" />)

    expect(html).toBe('')
  })

  it('should, when ssr is false, render the loaded component after mounting in the browser', async () => {
    const LazyGreeting = dynamic(() => Promise.resolve({ default: Greeting }), { ssr: false })

    render(<LazyGreeting name="Safe" />)

    expect(await screen.findByText('Hello Safe')).toBeInTheDocument()
  })

  it('should, when the chunk fails to load, log the error and render nothing next to the rest of the page', async () => {
    const chunkError = new Error('Loading chunk 123 failed.')
    const LazyGreeting = dynamic<{ name: string }>(() => Promise.reject(chunkError))

    render(
      <>
        <p>Rest of the page</p>
        <LazyGreeting name="Safe" />
      </>,
    )

    await waitFor(() => expect(logError).toHaveBeenCalledWith(Errors._906, chunkError))
    expect(screen.getByText('Rest of the page')).toBeInTheDocument()
    expect(screen.queryByText('Hello Safe')).not.toBeInTheDocument()
  })
})
