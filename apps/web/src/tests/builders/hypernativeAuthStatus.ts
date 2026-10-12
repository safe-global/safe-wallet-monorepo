import type { HypernativeAuthStatus } from '@/features/hypernative'
import { Builder } from '../Builder'

export const hypernativeAuthStatusBuilder = () =>
  Builder.new<HypernativeAuthStatus>().with({
    isAuthenticated: false,
    isTokenExpired: false,
    initiateLogin: jest.fn(),
    logout: jest.fn(),
  })
