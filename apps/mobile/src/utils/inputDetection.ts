import { ethers } from 'ethers'

export type InputType = 'private-key' | 'seed-phrase' | 'unknown'

/**
 * Detects whether the input is a private key or seed phrase
 * @param input The user input to analyze
 * @returns The detected input type
 */
export const detectInputType = (input: string): InputType => {
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return 'unknown'
  }

  const trimmedInput = input.trim()

  // Check if it's a private key (64 hex characters, optionally with 0x prefix)
  if (isPrivateKey(trimmedInput)) {
    return 'private-key'
  }

  // Check if it's a seed phrase (12, 15, 18, 21, or 24 words)
  if (isSeedPhrase(trimmedInput)) {
    return 'seed-phrase'
  }

  return 'unknown'
}

/**
 * Validates if the input is a valid private key
 */
const isPrivateKey = (input: string): boolean => {
  try {
    // Remove 0x prefix if present
    const cleanInput = input.startsWith('0x') ? input.slice(2) : input

    // Check if it's exactly 64 hex characters
    if (cleanInput.length !== 64) {
      return false
    }

    // Check if it's valid hex
    if (!/^[0-9a-fA-F]+$/.test(cleanInput)) {
      return false
    }

    // Try to create a wallet with it to validate
    new ethers.Wallet(cleanInput)
    return true
  } catch {
    return false
  }
}

/**
 * Validates if the input is a valid seed phrase
 */
const isSeedPhrase = (input: string): boolean => {
  try {
    // Split by whitespace and filter out empty strings
    const words = input.split(/\s+/).filter((word) => word.length > 0)

    // Check if it has the right number of words (12, 15, 18, 21, or 24)
    if (![12, 15, 18, 21, 24].includes(words.length)) {
      return false
    }

    // Try to create a wallet from the phrase to validate
    // Use the trimmed input to handle leading/trailing whitespace
    ethers.Wallet.fromPhrase(input.trim())
    return true
  } catch {
    return false
  }
}
