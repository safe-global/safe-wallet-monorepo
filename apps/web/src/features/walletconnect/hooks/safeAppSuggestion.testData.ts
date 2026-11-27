import { Builder, type IBuilder } from '@/tests/Builder'
import type { SafeAppSuggestion } from './useSafeAppSuggestion'

export const safeAppSuggestionBuilder = (): IBuilder<SafeAppSuggestion> =>
  Builder.new<SafeAppSuggestion>().with({
    status: 'off',
    safeApp: undefined,
    isShown: false,
    blocksAutoApprove: false,
    remember: false,
    setRemember: jest.fn(),
    rememberChoice: jest.fn(),
  })
