import React from 'react'
import { CarouselFeedback } from './CarouselFeedback'
import { render } from '@/src/tests/test-utils'
import darkPalette from '@/src/theme/palettes/darkPalette'

describe('CarouselFeedback', () => {
  it('renders with active state', () => {
    const { getByTestId } = render(<CarouselFeedback isActive={true} />)

    const carouselFeedback = getByTestId('carousel-feedback')

    expect(carouselFeedback.props.style.backgroundColor).toBe(darkPalette.text.contrast)
  })

  it('renders with inactive state', () => {
    const { getByTestId } = render(<CarouselFeedback isActive={false} />)
    const carouselFeedback = getByTestId('carousel-feedback')

    expect(carouselFeedback.props.style.backgroundColor).toBe(darkPalette.primary.light)
  })
})
