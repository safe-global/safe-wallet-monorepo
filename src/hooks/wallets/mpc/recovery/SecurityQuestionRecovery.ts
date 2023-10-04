import { TssSecurityQuestion, TssShareType, type Web3AuthMPCCoreKit } from '@web3auth/mpc-core-kit'

const DEFAULT_SECURITY_QUESTION = 'ENTER PASSWORD'

export class SecurityQuestionRecovery {
  private mpcCoreKit: Web3AuthMPCCoreKit
  private securityQuestions = new TssSecurityQuestion()

  constructor(mpcCoreKit: Web3AuthMPCCoreKit) {
    this.mpcCoreKit = mpcCoreKit
  }

  isEnabled(): boolean {
    try {
      const question = this.securityQuestions.getQuestion(this.mpcCoreKit)
      return !!question
    } catch (error) {
      console.error(error)
      // It errors out if recovery is not setup currently
      return false
    }
  }

  async upsertPassword(newPassword: string, oldPassword?: string) {
    if (this.isEnabled()) {
      if (!oldPassword) {
        throw Error('To change the password you need to provide the old password')
      }
      await this.securityQuestions.changeSecurityQuestion({
        answer: oldPassword,
        mpcCoreKit: this.mpcCoreKit,
        newAnswer: newPassword,
        newQuestion: DEFAULT_SECURITY_QUESTION,
      })
    } else {
      await this.securityQuestions.setSecurityQuestion({
        question: DEFAULT_SECURITY_QUESTION,
        answer: newPassword,
        mpcCoreKit: this.mpcCoreKit,
        shareType: TssShareType.DEVICE,
      })
    }
  }

  async recoverWithPassword(password: string) {
    return this.securityQuestions.recoverFactor(this.mpcCoreKit, password)
  }
}
