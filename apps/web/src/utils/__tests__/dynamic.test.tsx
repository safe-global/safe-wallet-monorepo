import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import dynamic from '../dynamic'

const Greeting = ({ name }: { name: string }) => <p>Hello {name}</p>

describe('dynamic', () => {
  it('should, when the module has loaded, render the loaded component with its props', async () => {
    const LazyGreeting = dynamic(() => Promise.resolve({ default: Greeting }))

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
})
