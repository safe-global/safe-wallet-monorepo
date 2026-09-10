import { validateName } from '@safe-global/utils/validation/names'
import { SPACE_NAME_MAX_LENGTH } from '@/features/spaces/constants'
import { randomWorkspaceName } from '../randomWorkspaceName'

describe('randomWorkspaceName', () => {
  it('pairs a mnemonic adjective with "Workspace" and passes the Workspace name rules', () => {
    for (let i = 0; i < 20; i++) {
      const name = randomWorkspaceName()
      expect(name).toMatch(/^[A-Z][a-z]+ Workspace$/)
      expect(validateName(name, { maxLength: SPACE_NAME_MAX_LENGTH })).toBeUndefined()
    }
  })
})
