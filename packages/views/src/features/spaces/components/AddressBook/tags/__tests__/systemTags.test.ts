import { allTagsOf, isSystemTag, SIGNER_TAG, systemTagsOf, systemTagTitles, WORKSPACE_SAFE_TAG } from '../systemTags'

describe('systemTags', () => {
  describe('systemTagsOf', () => {
    it('returns no automatic tag for a plain contact', () => {
      expect(systemTagsOf({ signerOf: [] })).toEqual([])
      expect(systemTagsOf({ isWorkspaceSafe: false, signerOf: [] })).toEqual([])
    })

    it('adds Workspace Safe for a workspace Safe and Signer for a signer', () => {
      expect(systemTagsOf({ isWorkspaceSafe: true, signerOf: [] })).toEqual([WORKSPACE_SAFE_TAG])
      expect(systemTagsOf({ signerOf: ['Treasury'] })).toEqual([SIGNER_TAG])
    })

    it('puts Workspace Safe before Signer', () => {
      expect(systemTagsOf({ isWorkspaceSafe: true, signerOf: ['Treasury'] })).toEqual([WORKSPACE_SAFE_TAG, SIGNER_TAG])
    })
  })

  describe('allTagsOf', () => {
    it('lists the automatic tags before the team tags', () => {
      expect(allTagsOf({ isWorkspaceSafe: true, signerOf: ['Treasury'], tags: ['Vendor', 'EU'] })).toEqual([
        WORKSPACE_SAFE_TAG,
        SIGNER_TAG,
        'Vendor',
        'EU',
      ])
    })

    it('returns only the team tags when there is no automatic tag', () => {
      expect(allTagsOf({ signerOf: [], tags: ['Vendor'] })).toEqual(['Vendor'])
    })
  })

  describe('isSystemTag', () => {
    it.each([WORKSPACE_SAFE_TAG, 'workspace safe', SIGNER_TAG, 'SIGNER', '  signer  '])(
      'recognises %s, ignoring case and surrounding spaces',
      (tag) => {
        expect(isSystemTag(tag)).toBe(true)
      },
    )

    it.each(['Vendor', 'Workspace', 'Sign', 'Signers', 'Safe'])('does not treat %s as automatic', (tag) => {
      expect(isSystemTag(tag)).toBe(false)
    })
  })

  describe('systemTagTitles', () => {
    it('names the Safes a signer signs for', () => {
      const titles = systemTagTitles({ signerOf: ['Treasury', 'Payroll'] })

      expect(titles[SIGNER_TAG]).toContain('Treasury, Payroll')
      expect(titles[WORKSPACE_SAFE_TAG]).toEqual(expect.any(String))
    })
  })
})
