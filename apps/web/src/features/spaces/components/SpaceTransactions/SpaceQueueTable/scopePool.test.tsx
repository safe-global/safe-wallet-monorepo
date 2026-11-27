import { faker } from '@faker-js/faker'
import { render } from '@/tests/test-utils'
import { hasActiveScope } from '@safe-global/views/components/tx-flow/safe-scope/activeScope'
import { buildSafeScopeKey } from '@safe-global/views/components/tx-flow/safe-scope/utils'
import { createScopeStore, ScopePool } from './scopePool'

describe('ScopePool', () => {
  it('does not arm the URL-Safe SDK guard, so flows opened on the URL Safe still work', () => {
    const chainId = faker.string.numeric(5)
    const safeAddress = faker.finance.ethereumAddress()
    const targets = [{ scopeKey: buildSafeScopeKey(chainId, safeAddress), chainId, safeAddress }]

    render(<ScopePool targets={targets} store={createScopeStore()} />)

    expect(hasActiveScope()).toBe(false)
  })
})
