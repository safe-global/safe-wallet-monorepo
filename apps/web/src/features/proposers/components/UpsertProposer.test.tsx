import * as proposerUtils from '@/features/proposers/utils/utils'

describe('UpsertProposer signing logic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signProposerTypedDataForSafe', () => {
    it('should be exported and callable', () => {
      expect(proposerUtils.signProposerTypedDataForSafe).toBeDefined()
      expect(typeof proposerUtils.signProposerTypedDataForSafe).toBe('function')
    })
  })

  describe('encodeEIP1271Signature', () => {
    it('should be exported and callable', () => {
      expect(proposerUtils.encodeEIP1271Signature).toBeDefined()
      expect(typeof proposerUtils.encodeEIP1271Signature).toBe('function')
    })
  })

  describe('signProposerTypedData', () => {
    it('should be exported and callable', () => {
      expect(proposerUtils.signProposerTypedData).toBeDefined()
      expect(typeof proposerUtils.signProposerTypedData).toBe('function')
    })
  })
})
