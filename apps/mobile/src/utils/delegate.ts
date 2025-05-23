export const getDelegateKeyId = (ownerAddress: string, delegateAddress: string): string => {
  return `delegate_${ownerAddress}_${delegateAddress}`
}
