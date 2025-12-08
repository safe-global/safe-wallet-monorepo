import type { ThreatAnalysisResponseDto } from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'
import type { ThreatAnalysisResults, ThreatAnalysisResult, ThreatIssue } from '../types'

/**
 * Transforms a threat analysis API response to ThreatAnalysisResults format.
 * Extracts addresses from issue objects and adds them to the addresses array.
 * Handles both the issues property and ensures addresses are properly aggregated.
 */
export const transformThreatAnalysisResponse = (
  response: ThreatAnalysisResponseDto | undefined,
): ThreatAnalysisResults | undefined => {
  if (!response) {
    return undefined
  }

  const transformedThreats: ThreatAnalysisResult[] | undefined = response.THREAT?.map((threat) => {
    // Create base result
    const baseResult = threat as ThreatAnalysisResult

    // Extract addresses from issues if they exist
    const extractedAddresses: { address: string }[] = []

    if ('issues' in threat && threat.issues) {
      // Iterate through all severity levels in issues
      Object.values(threat.issues).forEach((issueArray) => {
        if (Array.isArray(issueArray)) {
          issueArray.forEach((issue) => {
            // Check if issue is an object with an address field
            if (typeof issue === 'object' && issue !== null && 'address' in issue && issue.address) {
              const address = (issue as ThreatIssue).address
              // Only add unique addresses
              if (address && !extractedAddresses.some((addr) => addr.address === address)) {
                extractedAddresses.push({ address })
              }
            }
          })
        }
      })
    }

    // If we extracted addresses, add them to the addresses array
    if (extractedAddresses.length > 0) {
      const existingAddresses = baseResult.addresses || []
      const existingAddressesSet = new Set(existingAddresses.map((addr) => addr.address))

      // Only add addresses that don't already exist
      const newAddresses = extractedAddresses.filter((addr) => !existingAddressesSet.has(addr.address))

      if (newAddresses.length > 0) {
        return {
          ...baseResult,
          addresses: [...existingAddresses, ...newAddresses],
        } as ThreatAnalysisResult
      }
    }

    return baseResult
  })

  // Preserve all metadata fields (like request_id) and only transform THREAT
  const { THREAT: _THREAT, BALANCE_CHANGE: _BALANCE_CHANGE, ...metadataFields } = response

  const result: ThreatAnalysisResults = {
    ...(transformedThreats && transformedThreats.length > 0 ? { THREAT: transformedThreats } : {}),
    ...(response.BALANCE_CHANGE && response.BALANCE_CHANGE.length > 0
      ? { BALANCE_CHANGE: response.BALANCE_CHANGE }
      : {}),
    ...metadataFields,
  }

  return result
}
