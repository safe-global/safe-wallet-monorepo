/* eslint-disable */

import { CURRENT_COOKIE_TERMS_VERSION, defaultOwnerAddress } from './constants.js'
import { aliasedStorage, storageFixture } from './fixture.js'

const cookieState = {
  necessary: true,
  updates: true,
  analytics: true,
  terms: true,
  termsVersion: CURRENT_COOKIE_TERMS_VERSION,
}

export const batchData = {
  entry0: aliasedStorage({
    11155111: {
      '0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415': [
        {
          id: 'vn8dwe0amz',
          timestamp: 1701091870022,
          txDetails: {
            safeAddress: '0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415',
            txId: 'multisig_0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415_0xcb83bc36cf4a2998e7fe222e36c458c59c3778f65b4e5bb361c29a73c2de62cc',
            executedAt: null,
            txStatus: 'AWAITING_CONFIRMATIONS',
            txInfo: {
              type: 'Transfer',
              humanDescription: null,
              richDecodedInfo: null,
              sender: {
                value: '0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415',
                name: null,
                logoUri: null,
              },
              recipient: {
                value: '0x03042B890b99552b60A073F808100517fb148F60',
                name: null,
                logoUri: null,
              },
              direction: 'OUTGOING',
              transferInfo: { type: 'NATIVE_COIN', value: '1000000000000000' },
            },
            txData: {
              hexData: null,
              dataDecoded: null,
              to: {
                value: '0x03042B890b99552b60A073F808100517fb148F60',
                name: null,
                logoUri: null,
              },
              value: '1000000000000000',
              operation: 0,
              trustedDelegateCallTarget: null,
              addressInfoIndex: null,
            },
            txHash: null,
            detailedExecutionInfo: {
              type: 'MULTISIG',
              submittedAt: 1698650125722,
              nonce: 15,
              safeTxGas: '0',
              baseGas: '0',
              gasPrice: '0',
              gasToken: '0x0000000000000000000000000000000000000000',
              refundReceiver: {
                value: '0x0000000000000000000000000000000000000000',
                name: null,
                logoUri: null,
              },
              safeTxHash: '0xcb83bc36cf4a2998e7fe222e36c458c59c3778f65b4e5bb361c29a73c2de62cc',
              executor: null,
              signers: [
                {
                  value: '0x61a0c717d18232711bC788F19C9Cd56a43cc8872',
                  name: null,
                  logoUri: null,
                },
                {
                  value: '0x0D65139Da4B36a8A39BF1b63e950038D42231b2e',
                  name: null,
                  logoUri: null,
                },
                {
                  value: '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED',
                  name: null,
                  logoUri: null,
                },
                {
                  value: '0x8aEf2f5c3F17261F6F1C4dA058D022BE92776af8',
                  name: null,
                  logoUri: null,
                },
              ],
              confirmationsRequired: 1,
              confirmations: [],
              rejectors: [],
              gasTokenInfo: null,
              trusted: false,
            },
            safeAppInfo: null,
          },
        },
        {
          id: 'g30cj4yatap',
          timestamp: 1701099937261,
          txDetails: {
            safeAddress: '0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415',
            txId: 'multisig_0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415_0xcb83bc36cf4a2998e7fe222e36c458c59c3778f65b4e5bb361c29a73c2de62cc',
            executedAt: null,
            txStatus: 'AWAITING_CONFIRMATIONS',
            txInfo: {
              type: 'Transfer',
              humanDescription: null,
              richDecodedInfo: null,
              sender: {
                value: '0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415',
                name: null,
                logoUri: null,
              },
              recipient: {
                value: '0x03042B890b99552b60A073F808100517fb148F60',
                name: null,
                logoUri: null,
              },
              direction: 'OUTGOING',
              transferInfo: { type: 'NATIVE_COIN', value: '2000000000000000' },
            },
            txData: {
              hexData: null,
              dataDecoded: null,
              to: {
                value: '0x03042B890b99552b60A073F808100517fb148F60',
                name: null,
                logoUri: null,
              },
              value: '2000000000000000',
              operation: 0,
              trustedDelegateCallTarget: null,
              addressInfoIndex: null,
            },
            txHash: null,
            detailedExecutionInfo: {
              type: 'MULTISIG',
              submittedAt: 1698650125722,
              nonce: 15,
              safeTxGas: '0',
              baseGas: '0',
              gasPrice: '0',
              gasToken: '0x0000000000000000000000000000000000000000',
              refundReceiver: {
                value: '0x0000000000000000000000000000000000000000',
                name: null,
                logoUri: null,
              },
              safeTxHash: '0xcb83bc36cf4a2998e7fe222e36c458c59c3778f65b4e5bb361c29a73c2de62cc',
              executor: null,
              signers: [
                {
                  value: '0x61a0c717d18232711bC788F19C9Cd56a43cc8872',
                  name: null,
                  logoUri: null,
                },
                {
                  value: '0x0D65139Da4B36a8A39BF1b63e950038D42231b2e',
                  name: null,
                  logoUri: null,
                },
                {
                  value: '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED',
                  name: null,
                  logoUri: null,
                },
                {
                  value: '0x8aEf2f5c3F17261F6F1C4dA058D022BE92776af8',
                  name: null,
                  logoUri: null,
                },
              ],
              confirmationsRequired: 1,
              confirmations: [],
              rejectors: [],
              gasTokenInfo: null,
              trusted: false,
            },
            safeAppInfo: null,
          },
        },
      ],
    },
  }),
  entry1: aliasedStorage({
    11155111: {
      '0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415': [
        {
          id: 'vn8dwe0amz',
          timestamp: 1701091870022,
          txDetails: {
            safeAddress: '0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415',
            txId: 'multisig_0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415_0xcb83bc36cf4a2998e7fe222e36c458c59c3778f65b4e5bb361c29a73c2de62cc',
            executedAt: null,
            txStatus: 'AWAITING_CONFIRMATIONS',
            txInfo: {
              type: 'Transfer',
              humanDescription: null,
              richDecodedInfo: null,
              sender: {
                value: '0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415',
                name: null,
                logoUri: null,
              },
              recipient: {
                value: '0x03042B890b99552b60A073F808100517fb148F60',
                name: null,
                logoUri: null,
              },
              direction: 'OUTGOING',
              transferInfo: { type: 'NATIVE_COIN', value: '1000000000000000' },
            },
            txData: {
              hexData: null,
              dataDecoded: null,
              to: {
                value: '0x03042B890b99552b60A073F808100517fb148F60',
                name: null,
                logoUri: null,
              },
              value: '1000000000000000',
              operation: 0,
              trustedDelegateCallTarget: null,
              addressInfoIndex: null,
            },
            txHash: null,
            detailedExecutionInfo: {
              type: 'MULTISIG',
              submittedAt: 1698650125722,
              nonce: 15,
              safeTxGas: '0',
              baseGas: '0',
              gasPrice: '0',
              gasToken: '0x0000000000000000000000000000000000000000',
              refundReceiver: {
                value: '0x0000000000000000000000000000000000000000',
                name: null,
                logoUri: null,
              },
              safeTxHash: '0xcb83bc36cf4a2998e7fe222e36c458c59c3778f65b4e5bb361c29a73c2de62cc',
              executor: null,
              signers: [
                {
                  value: '0x61a0c717d18232711bC788F19C9Cd56a43cc8872',
                  name: null,
                  logoUri: null,
                },
                {
                  value: '0x0D65139Da4B36a8A39BF1b63e950038D42231b2e',
                  name: null,
                  logoUri: null,
                },
                {
                  value: '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED',
                  name: null,
                  logoUri: null,
                },
                {
                  value: '0x8aEf2f5c3F17261F6F1C4dA058D022BE92776af8',
                  name: null,
                  logoUri: null,
                },
              ],
              confirmationsRequired: 1,
              confirmations: [],
              rejectors: [],
              gasTokenInfo: null,
              trusted: false,
            },
            safeAppInfo: null,
          },
        },
      ],
    },
  }),
}
export const visitedSafes = {
  set1: {
    11155111: {
      '0x905934aA8758c06B2422F0C90D97d2fbb6677811': {
        lastVisited: 1732794651004,
      },
    },
  },
}
export const addressBookData = {
  proposers: storageFixture('proposers.addressBook', {
    11155111: {
      '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED': 'AD Proposer1',
      '0x8eeC30d6FB6eC104B7308a8847db5FF487152a3b': 'AD Proposer2',
    },
  }),
  sepoliaAddress1: {
    11155111: { '0x6a5602335a878ADDCa4BF63a050E34946B56B5bC': 'Owner1' },
  },
  // Getters, because isolated runs set the default owner after this module loads.
  get sepoliaAddress2() {
    return { 11155111: { [defaultOwnerAddress()]: 'Automation owner' } }
  },
  importedSafe: {
    5: {
      '0x61a0c717d18232711bC788F19C9Cd56a43cc8872': 'test1',
      '0x7724b234c9099C205F03b458944942bcEBA13408': 'test2',
      '0x6E45d69a383CECa3d54688e833Bd0e1388747e6B': 'test3',
      '0x10f999F150a2E7fd356Aa471bCBf0b75aA7b0e2A': 'safe 1 goerli',
    },
    100: {
      '0x17b34aEf1428A358bA2eA360a098b8A3BEb698C8': 'safe 1 GNO',
      '0x11A6B41322C57Bd0e56cEe06abB11A1E5c1FF1BB': 'Safe 2 GNO',
      '0xB8d760a90a5ed54D3c2b3EFC231277e99188642A': 'main xdai safe',
      '0x11B1D54B66e5e226D6f89069c21A569A22D98cfd': 'trez',
      '0x61a0c717d18232711bC788F19C9Cd56a43cc8872': 'test1',
      '0x8aEf2f5c3F17261F6F1C4dA058D022BE92776af8': 'ow1',
      '0x0D65139Da4B36a8A39BF1b63e950038D42231b2e': 'ow 2',
    },
    137: {
      '0xC680d44F526f4372693CAc21dcab255b77bc58F4': 'Safe 1 Poly',
      '0x61a0c717d18232711bC788F19C9Cd56a43cc8872': 'Test1 Poly',
    },
    11155111: {
      '0x6E834E9D04ad6b26e1525dE1a37BFd9b215f40B7': 'test-sepolia-3',
    },
  },
  addedSafes: {
    1: {
      '0x8675B754342754A30A2AeF474D114d8460bca19b': 'Added safe 900',
    },
    11155111: {
      '0x0A0EEb6fBCc7c82259E548Fc4617175A357b3e71': 'Added safe 200',
      '0xF21445699e91aC6F2EeeAF1a19510AC4197e59aB': 'Added owner',
      '0x9E6DAfe829431e1892EcF8461FDAd02665170c31': 'Added non-owner',
    },
  },
  undeployedSet: {
    100: {
      '0xC96ee38f5A73C8A70b565CB8EA938D2aF913ee3B': 'Safe A',
    },
    1: {
      '0xC96ee38f5A73C8A70b565CB8EA938D2aF913ee3B': 'Safe B',
    },
  },
  undeployedEth: {
    1: {
      '0x926186108f74dB20BFeb2b6c888E523C78cb7E00': 'Undeployed Sepolia',
    },
  },
  autofillData: {
    11155111: {
      '0x01A9F68e339da12565cfBc47fe7D6EdEcB11C46f': 'David',
    },
  },
  safeSchiledAddressBook: {
    137: {
      '0x773B97f0b2D38Dbf5C8CbE04C2C622453500F3e0': 'Test Recipient',
      '0xb412684F4F0B5d27cC4A4D287F42595aB3ae124D': 'Test Safe Address',
      '0x9445deb174C1eCbbfce8d31D33F438B8e7a0F1BA': 'Test Signer (Owner 4)',
    },
  },
  cookies: cookieState,
}

export const safeSettings = {
  settings1: {
    currency: 'eur',
    tokenList: 'TRUSTED',
    hiddenTokens: {},
    shortName: {
      show: false,
      qr: false,
    },
    theme: {
      darkMode: true,
    },
    env: {
      rpc: {},
      tenderly: {
        url: '',
        accessToken: '',
      },
    },
    signing: {
      onChainSigning: false,
    },
    transactionExecution: true,
  },
  slimitSettings: {
    currency: 'usd',
    tokenList: 'ALL',
    hiddenTokens: {},
    hideDust: false,
    shortName: {
      show: true,
      qr: true,
    },
    theme: {},
    env: {
      rpc: {},
      tenderly: {
        url: '',
        accessToken: '',
      },
    },
    signing: {
      onChainSigning: false,
    },
    transactionExecution: true,
  },
}

export const addedSafes = {
  set1: aliasedStorage({
    5: {
      '0x10f999F150a2E7fd356Aa471bCBf0b75aA7b0e2A': {
        owners: [
          { value: '0x8aEf2f5c3F17261F6F1C4dA058D022BE92776af8' },
          { value: '0x61a0c717d18232711bC788F19C9Cd56a43cc8872' },
        ],
        threshold: 2,
        ethBalance: '0',
      },
    },
    100: {
      '0x17b34aEf1428A358bA2eA360a098b8A3BEb698C8': {
        owners: [{ value: '0x11B1D54B66e5e226D6f89069c21A569A22D98cfd' }],
        threshold: 1,
        ethBalance: '0.001000002',
      },
      '0x11A6B41322C57Bd0e56cEe06abB11A1E5c1FF1BB': {
        owners: [
          { value: '0x7724b234c9099C205F03b458944942bcEBA13408' },
          { value: '0x8aEf2f5c3F17261F6F1C4dA058D022BE92776af8' },
          { value: '0x0D65139Da4B36a8A39BF1b63e950038D42231b2e' },
        ],
        threshold: 1,
        ethBalance: '0',
      },
      '0xB8d760a90a5ed54D3c2b3EFC231277e99188642A': {
        owners: [
          { value: '0x11B1D54B66e5e226D6f89069c21A569A22D98cfd' },
          { value: '0x457D3Fcb58401F9b98d83BC2fe7BF57FF57603AB' },
          { value: '0x61a0c717d18232711bC788F19C9Cd56a43cc8872' },
          { value: '0xFD71c1ABadBD37F60E4C8F208386dDFC4d2Bf01f' },
          { value: '0x5aC255889882aCd3da2aA939679E3f3d4cea221e' },
          { value: '0x474e5Ded6b5D078163BFB8F6dBa355C3aA5478C8' },
          { value: '0x86a9F6704280Ac2b99aBD60ed74bF9cF899bd925' },
          { value: '0x8aEf2f5c3F17261F6F1C4dA058D022BE92776af8' },
          { value: '0x0D65139Da4B36a8A39BF1b63e950038D42231b2e' },
        ],
        threshold: 1,
        ethBalance: '0.92132507668989',
      },
    },
    137: {
      '0xC680d44F526f4372693CAc21dcab255b77bc58F4': {
        owners: [
          { value: '0x0D65139Da4B36a8A39BF1b63e950038D42231b2e' },
          { value: '0x8aEf2f5c3F17261F6F1C4dA058D022BE92776af8' },
        ],
        threshold: 1,
        ethBalance: '0',
      },
    },
    11155111: {
      '0x027bBe128174F0e5e5d22ECe9623698E01cd3970': {
        owners: [
          {
            value: '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED',
            name: null,
            logoUri: null,
          },
          {
            value: '0x96D4c6fFC338912322813a77655fCC926b9A5aC5',
            name: null,
            logoUri: null,
          },
        ],
        threshold: 1,
        ethBalance: '0',
      },
      '0x6E834E9D04ad6b26e1525dE1a37BFd9b215f40B7': {
        owners: [
          {
            value: '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED',
            name: null,
            logoUri: null,
          },
          {
            value: '0x96D4c6fFC338912322813a77655fCC926b9A5aC5',
            name: null,
            logoUri: null,
          },
        ],
        threshold: 1,
        ethBalance: '0',
      },
    },
  }),
  set2: {
    11155111: {
      '0x6d0b6F96f665Bb4490f9ddb2e450Da2f7e546dC1': {
        owners: [
          {
            value: '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED',
            name: null,
            logoUri: null,
          },
        ],
        threshold: 1,
        ethBalance: '0',
      },
      '0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb': {
        owners: [
          {
            value: '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED',
            name: null,
            logoUri: null,
          },
          {
            value: '0x96D4c6fFC338912322813a77655fCC926b9A5aC5',
            name: null,
            logoUri: null,
          },
        ],
        threshold: 2,
        ethBalance: '0.442500000005',
      },
      '0x06373d5e45AD31BD354CeBfA8dB4eD2c75B8708e': {
        owners: [
          {
            value: '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED',
            name: null,
            logoUri: null,
          },
          {
            value: '0x96D4c6fFC338912322813a77655fCC926b9A5aC5',
            name: null,
            logoUri: null,
          },
        ],
        threshold: 1,
        ethBalance: '0.058000000005',
      },
      '0xD1571E8Cc4438aFef2836DD9a0E5D09fb63EDE9a': {
        owners: [
          {
            value: '0x96D4c6fFC338912322813a77655fCC926b9A5aC5',
            name: null,
            logoUri: null,
          },
          {
            value: '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED',
            name: null,
            logoUri: null,
          },
        ],
        threshold: 1,
        ethBalance: '0',
      },
      '0x0A0EEb6fBCc7c82259E548Fc4617175A357b3e71': {
        owners: [
          {
            value: '0x8aEf2f5c3F17261F6F1C4dA058D022BE92776af8',
            name: null,
            logoUri: null,
          },
          {
            value: '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED',
            name: null,
            logoUri: null,
          },
        ],
        threshold: 2,
        ethBalance: '0',
      },
    },
    1: {
      '0x8675B754342754A30A2AeF474D114d8460bca19b': {
        owners: [{ value: '0x11B1D54B66e5e226D6f89069c21A569A22D98cfd' }],
        threshold: 1,
        ethBalance: '0.001000002',
      },
    },
  },
  /** Sidebar tests: safe1 + safe2 + safe3 on Sepolia. Includes chain 1 (Ethereum) visited safe for tests that visit MATIC_STATIC_SAFE_28 on eth. */
  sidebarTrustedSafe1Safe2Safe3: {
    11155111: {
      '0xBb26E3717172d5000F87DeFd391994f789D80aEB': {
        owners: [],
        threshold: 1,
        ethBalance: '0',
      },
      '0x905934aA8758c06B2422F0C90D97d2fbb6677811': {
        owners: [],
        threshold: 1,
        ethBalance: '0',
      },
      '0xC96ee38f5A73C8A70b565CB8EA938D2aF913ee3B': {
        owners: [],
        threshold: 1,
        ethBalance: '0',
      },
    },
    1: {
      '0xC96ee38f5A73C8A70b565CB8EA938D2aF913ee3B': {
        owners: [],
        threshold: 1,
        ethBalance: '0',
      },
    },
  },
}

export const customApps = (url) => ({
  safeTestApp: [{ url: url }],
  grantedPermissions: {
    [url]: [
      { feature: 'camera', status: 'granted' },
      { feature: 'microphone', status: 'granted' },
    ],
  },
})

const infoModalAccepted = {
  11155111: {
    consentsAccepted: true,
    warningCheckedCustomApps: [],
  },
}

export const appPermissions = (url) => ({
  grantedPermissions: {
    [url]: [
      { feature: 'camera', status: 'granted' },
      { feature: 'microphone', status: 'granted' },
    ],
  },
  infoModalAccepted: JSON.stringify(infoModalAccepted),
})

// Safe (SDK) permissions payload for SAFE_PERMISSIONS_KEY, as stored after accepting the prompt
export const safeAppSafePermissions = (appUrl) => ({
  [appUrl]: [{ invoker: appUrl, parentCapability: 'requestAddressBook', date: 1111111111111, caveats: [] }],
})

export const cookies = {
  acceptedCookies: JSON.stringify(cookieState),
}

export const safeLabsTerms = {
  acceptedTerms: 'true',
}

export const safeProAnnouncement = {
  seen: 'true',
}

export const undeployedSafe = {
  safe1: storageFixture('undeployedSafes', {
    11155111: {
      '0x926186108f74dB20BFeb2b6c888E523C78cb7E00': {
        props: {
          safeAccountConfig: {
            threshold: 1,
            owners: ['0x9445deb174C1eCbbfce8d31D33F438B8e7a0F1BA'],
            fallbackHandler: '0x017062a1dE2FE6b99BE3d9d37841FeD19F573804',
          },
          safeDeploymentConfig: {
            saltNonce: '21',
            safeVersion: '1.3.0',
          },
        },
        status: {
          status: 'AWAITING_EXECUTION',
          type: 'PayLater',
        },
      },
    },
  }),
  safes2: {
    1: {
      '0xC96ee38f5A73C8A70b565CB8EA938D2aF913ee3B': {
        props: {
          safeAccountConfig: {
            threshold: 1,
            owners: ['0x3ba5d9a6d6169429Adb278768D9681A125C01Af6'],
            fallbackHandler: '0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99',
          },
          safeDeploymentConfig: {
            saltNonce: '0',
            safeVersion: '1.4.1',
          },
        },
        status: {
          status: 'AWAITING_EXECUTION',
          type: 'PayLater',
        },
      },
    },
    100: {
      '0xC96ee38f5A73C8A70b565CB8EA938D2aF913ee3B': {
        props: {
          safeAccountConfig: {
            threshold: 1,
            owners: ['0x3ba5d9a6d6169429Adb278768D9681A125C01Af6'],
            fallbackHandler: '0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99',
          },
          safeDeploymentConfig: {
            saltNonce: '0',
            safeVersion: '1.4.1',
          },
        },
        status: {
          status: 'AWAITING_EXECUTION',
          type: 'PayLater',
        },
      },
    },
  },
}
