import React from 'react'
import { CarouselFeedback } from './CarouselFeedback'
import { render } from '@/src/tests/test-utils'
import { getTokenValue } from 'tamagui'

describe('CarouselFeedback', () => {
  it('renders with active state', () => {
    const { getByTestId } = render(<CarouselFeedback isActive={true} />)
    const carouselFeedback = getByTestId('carousel-feedback')

    expect(carouselFeedback.props.style[0]).toHaveProperty('backgroundColor', getTokenValue('$color.textContrastDark'))
  })

  it('renders with inactive state', () => {
    const { getByTestId } = render(<CarouselFeedback isActive={false} />)
    const carouselFeedback = getByTestId('carousel-feedback')

    expect(carouselFeedback.props.style[0]).toHaveProperty('backgroundColor', getTokenValue('$color.primaryLightDark'))
  })
})
