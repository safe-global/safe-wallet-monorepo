// Hand-written from the cosigner service OpenAPI schema (`GET /v1/transactions/{safeTxHash}`)

export type CosignerName = 'SAFE' | 'HYPERNATIVE' | 'BLOCKAID'

export type CosignatureStatus = 'PENDING' | 'SIGNED' | 'REJECTED' | 'FAILED'

export type CosignatureDto = {
  cosignerName: CosignerName
  status: CosignatureStatus
  ruleId: string | null
  reason: string | null
  signature: { signer: string; data: string } | null
  decidedAt: string | null
}

export type CosignerTransactionDto = {
  chainId: string
  safeAddress: string
  safeTxHash: string
  signatures: CosignatureDto[]
}

/** The service has not (yet) seen the transaction: it learns of it once it is proposed */
export type CosignerTransactionResult = CosignerTransactionDto | { notFound: true }

export type GetCosignaturesArgs = { serviceUrl: string; safeTxHash: string }
