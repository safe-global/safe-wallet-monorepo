// Defense-in-depth: a compromised CGW could swap in an attacker `refundReceiver` and drain
// Safes via `handlePayment()`. Validate against this list before signing or relaying. Extend as needed.
// Shared by web and mobile so a collector rotation can never land on one client only.
export const FEE_COLLECTORS: ReadonlyArray<string> = ['0x0C51b4d70492D81f9f96B1EB1a826FBfb3fd27d8']
