# Test Safes Documentation

This document describes the purpose and usage of test safes defined in `static.json`.

## Polygon (Matic) Safes

| Safe ID | Address | Purpose | Used In Tests |
|---------|---------|---------|---------------|
| **MATIC_STATIC_SAFE_17** | `0x6D04edC44F7C88faa670683036edC2F6FC10b86e` | Recovery module testing | recovery.cy.js, prodhealthcheck/recovery.cy.js |
| **MATIC_STATIC_SAFE_28** | `0xC96ee38f5A73C8A70b565CB8EA938D2aF913ee3B` | Multichain testing (primary CF safe) | multichain_*.cy.js, sidebar_*.cy.js, create_tx.cy.js |
| **MATIC_STATIC_SAFE_29** | `0x5E9242FD52c4c4A60d874E8ff4Ba25657dd6e551` | Available for general testing | Currently unused |
| **MATIC_STATIC_SAFE_30** | `0x65e1Ff7e0901055B3bea7D8b3AF457a659714013` | **Safe Shield tests** | safe_shield.cy.js |

## Sepolia Safes

| Safe ID | Address | Purpose | Used In Tests |
|---------|---------|---------|---------------|
| **SEP_STATIC_SAFE_27** | `0xC97FCf0B8890a5a7b1a1490d44Dc9EbE3cE04884` | TWAP and swap testing | twaps_combined.cy.js, twaps_history.cy.js, limit_order.cy.js |
| **SEP_STATIC_SAFE_34** | `0xD8b85a669413b25a8BE7D7698f88b7bFA20889d2` | Queue transaction testing | tx_queue*.cy.js |
| **SEP_STATIC_SAFE_7** | `0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb` | Queue delete/reject testing | tx_queue_delete_btn.cy.js, tx_queue_reject_btn.cy.js |

## Ethereum Safes

| Safe ID | Address | Purpose | Used In Tests |
|---------|---------|---------|---------------|
| **ETH_STATIC_SAFE_15** | `0xfF501B324DC6d78dC9F983f140B9211c3EdB4dc7` | Ethereum mainnet testing | Various |

## Other Networks

| Safe ID | Network | Address | Purpose |
|---------|---------|---------|---------|
| **GNO_STATIC_SAFE_16** | Gnosis | `0xB8d760a90a5ed54D3c2b3EFC231277e99188642A` | Gnosis Chain testing |
| **BNB_STATIC_SAFE_18** | BSC | `0x1D28a316431bAFf410Fe53398c6C5BD566032Eec` | BNB Chain testing |
| **AVAX_STATIC_SAFE_20** | Avalanche | `0x480e5A3E90a3fF4a16AECCB5d638fAba96a15c28` | Avalanche testing |
| **ZKSYNC_STATIC_SAFE_22** | zkSync | `0x49136c0270c5682FFbb38Cb29Ecf0563b2E1F9f6` | zkSync testing |
| **ZKSYNC_STATIC_SAFE_29** | zkSync | `0x950e07c80d7Bb754CcD84afE2b7751dc7Fd65D1f` | zkSync testing |
| **LINEA_STATIC_SAFE_21** | Linea | `0x95934e67299E0B3DD277907acABB512802f3536E` | Linea testing |
| **AURORA_STATIC_SAFE_19** | Aurora | `0xCEA454dD3d76Da856E72C3CBaDa8ee6A789aD167` | Aurora testing |

## Notes

- Safes are organized by network prefix (SEP, MATIC, ETH, GNO, etc.)
- Numbers are assigned sequentially across all networks
- Some safes are dedicated to specific features (e.g., Safe Shield, TWAP, Queue)
- MATIC_STATIC_SAFE_28 is heavily used for multichain testing - avoid modifying its state
- MATIC_STATIC_SAFE_30 is dedicated for Safe Shield transaction monitoring and risk detection tests

## Adding New Safes

When adding a new safe to `static.json`:

1. Use the next available number in the sequence
2. Follow the naming convention: `{NETWORK}_STATIC_SAFE_{NUMBER}`
3. Update this README with the safe's purpose
4. Document which test files will use it
