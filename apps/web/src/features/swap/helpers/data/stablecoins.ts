export const stableCoinAddresses: {
  [address: string]: {
    name: string
    symbol: string
    chains: Array<'gnosis' | 'ethereum' | 'arbitrum-one' | 'sepolia' | 'base' | 'linea' | 'plasma'>
  }
} = {
  '0xdd96b45877d0e8361a4ddb732da741e97f3191ff': {
    name: 'BUSD Token from BSC',
    symbol: 'BUSD',
    chains: ['gnosis'],
  },
  '0x44fa8e6f47987339850636f88629646662444217': {
    name: 'Dai Stablecoin on Gnosis',
    symbol: 'DAI',
    chains: ['gnosis'],
  },
  '0x1e37e5b504f7773460d6eb0e24d2e7c223b66ec7': {
    name: 'HUSD on Gnosis',
    symbol: 'HUSD',
    chains: ['gnosis'],
  },
  '0xb714654e905edad1ca1940b7790a8239ece5a9ff': {
    name: 'TrueUSD on Gnosis',
    symbol: 'TUSD',
    chains: ['gnosis'],
  },
  '0xddafbb505ad214d7b80b1f830fccc89b60fb7a83': {
    name: 'USD//C on Gnosis',
    symbol: 'USDC',
    chains: ['gnosis'],
  },
  '0x4ecaba5870353805a9f068101a40e0f32ed605c6': {
    name: 'Tether on Gnosis',
    symbol: 'USDT',
    chains: ['gnosis'],
  },
  '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063': {
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    chains: ['gnosis'],
  },
  '0x104592a158490a9228070E0A8e5343B499e125D0': {
    name: 'Frax',
    symbol: 'FRAX',
    chains: ['gnosis'],
  },
  '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': {
    name: 'USD Coin',
    symbol: 'USDC',
    chains: ['gnosis'],
  },
  '0xc2132D05D31c914a87C6611C10748AEb04B58e8F': {
    name: 'Tether USD',
    symbol: 'USDT',
    chains: ['gnosis'],
  },
  '0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b': {
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    chains: ['gnosis'],
  },
  '0x0faF6df7054946141266420b43783387A78d82A9': {
    name: 'USDC from Ethereum',
    symbol: 'USDC',
    chains: ['gnosis'],
  },
  '0xcB1e72786A6eb3b44C2a2429e317c8a2462CFeb1': {
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    chains: ['gnosis'],
  },
  '0x3813e82e6f7098b9583FC0F33a962D02018B6803': {
    name: 'Tether USD',
    symbol: 'USDT',
    chains: ['gnosis'],
  },

  '0xdac17f958d2ee523a2206206994597c13d831ec7': {
    name: 'Tether',
    symbol: 'usdt',
    chains: ['ethereum'],
  },
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
    name: 'USDC',
    symbol: 'usdc',
    chains: ['ethereum'],
  },
  '0xaf88d065e77c8cc2239327c5edb3a432268e5831': {
    name: 'USDC',
    symbol: 'usdc',
    chains: ['arbitrum-one'],
  },
  '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': {
    name: 'USDT',
    symbol: 'usdt',
    chains: ['arbitrum-one'],
  },
  '0x6b175474e89094c44da98b954eedeac495271d0f': {
    name: 'Dai',
    symbol: 'dai',
    chains: ['ethereum'],
  },
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': {
    name: 'Dai',
    symbol: 'dai',
    chains: ['arbitrum-one'],
  },
  '0x4c9edd5852cd905f086c759e8383e09bff1e68b3': {
    name: 'Ethena USDe',
    symbol: 'usde',
    chains: ['ethereum'],
  },
  '0xc5f0f7b66764f6ec8c8dff7ba683102295e16409': {
    name: 'First Digital USD',
    symbol: 'fdusd',
    chains: ['ethereum'],
  },
  '0x0c10bf8fcb7bf5412187a595ab97a3609160b5c6': {
    name: 'USDD',
    symbol: 'usdd',
    chains: ['ethereum'],
  },
  '0x680447595e8b7b3aa1b43beb9f6098c79ac2ab3f': {
    name: 'USDD',
    symbol: 'usdd',
    chains: ['arbitrum-one'],
  },
  '0x853d955acef822db058eb8505911ed77f175b99e': {
    name: 'Frax',
    symbol: 'frax',
    chains: ['ethereum'],
  },
  '0x17fc002b466eec40dae837fc4be5c67993ddbd6f': {
    name: 'Frax',
    symbol: 'frax',
    chains: ['arbitrum-one'],
  },
  '0x68749665ff8d2d112fa859aa293f07a622782f38': {
    name: 'Tether Gold',
    symbol: 'xaut',
    chains: ['ethereum'],
  },
  '0x0000000000085d4780b73119b644ae5ecd22b376': {
    name: 'TrueUSD',
    symbol: 'tusd',
    chains: ['ethereum'],
  },
  '0x45804880de22913dafe09f4980848ece6ecbaf78': {
    name: 'PAX Gold',
    symbol: 'paxg',
    chains: ['ethereum'],
  },
  '0x6c3ea9036406852006290770bedfcaba0e23a0e8': {
    name: 'PayPal USD',
    symbol: 'pyusd',
    chains: ['ethereum'],
  },
  '0xbc6da0fe9ad5f3b0d58160288917aa56653660e9': {
    name: 'Alchemix USD',
    symbol: 'alusd',
    chains: ['ethereum'],
  },
  '0xdb25f211ab05b1c97d595516f45794528a807ad8': {
    name: 'STASIS EURO',
    symbol: 'eurs',
    chains: ['ethereum'],
  },
  '0x8e870d67f660d95d5be530380d0ec0bd388289e1': {
    name: 'Pax Dollar',
    symbol: 'usdp',
    chains: ['ethereum'],
  },
  '0xf939e0a03fb07f59a73314e73794be0e57ac1b4e': {
    name: 'crvUSD',
    symbol: 'crvusd',
    chains: ['ethereum'],
  },
  '0x498bf2b1e120fed3ad3d42ea2165e9b73f99c1e5': {
    name: 'crvUSD',
    symbol: 'crvusd',
    chains: ['arbitrum-one'],
  },
  '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd': {
    name: 'Gemini Dollar',
    symbol: 'gusd',
    chains: ['ethereum'],
  },
  '0x865377367054516e17014ccded1e7d814edc9ce4': {
    name: 'DOLA',
    symbol: 'dola',
    chains: ['ethereum'],
  },
  '0x6a7661795c374c0bfc635934efaddff3a7ee23b6': {
    name: 'DOLA',
    symbol: 'dola',
    chains: ['arbitrum-one'],
  },
  '0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f': {
    name: 'GHO',
    symbol: 'gho',
    chains: ['ethereum'],
  },
  '0x5f98805a4e8be255a32880fdec7f6728c6568ba0': {
    name: 'Liquity USD',
    symbol: 'lusd',
    chains: ['ethereum'],
  },
  '0x93b346b6bc2548da6a1e7d98e9a421b42541425b': {
    name: 'Liquity USD',
    symbol: 'lusd',
    chains: ['arbitrum-one'],
  },
  '0x4fabb145d64652a948d72533023f6e7a623c7c53': {
    name: 'BUSD',
    symbol: 'busd',
    chains: ['ethereum'],
  },
  '0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3': {
    name: 'Magic Internet Money (Ethereum)',
    symbol: 'mim',
    chains: ['ethereum'],
  },
  '0x59d9356e565ab3a36dd77763fc0d87feaf85508c': {
    name: 'Mountain Protocol USD',
    symbol: 'usdm',
    chains: ['ethereum', 'arbitrum-one'],
  },
  '0xbea0000029ad1c77d3d5d23ba2d8893db9d1efab': {
    name: 'Bean',
    symbol: 'bean',
    chains: ['ethereum'],
  },
  '0x57ab1ec28d129707052df4df418d58a2d46d5f51': {
    name: 'sUSD',
    symbol: 'susd',
    chains: ['ethereum'],
  },
  '0xa970af1a584579b618be4d69ad6f73459d112f95': {
    name: 'sUSD',
    symbol: 'susd',
    chains: ['arbitrum-one'],
  },
  '0xc581b735a1688071a1746c968e0798d642ede491': {
    name: 'Euro Tether',
    symbol: 'eurt',
    chains: ['ethereum'],
  },
  '0xa774ffb4af6b0a91331c084e1aebae6ad535e6f3': {
    name: 'flexUSD',
    symbol: 'flexusd',
    chains: ['ethereum'],
  },
  '0x1a7e4e63778b4f12a199c062f3efdd288afcbce8': {
    name: 'EURA',
    symbol: 'eura',
    chains: ['ethereum'],
  },
  '0xfa5ed56a203466cbbc2430a43c66b9d8723528e7': {
    name: 'EURA',
    symbol: 'eura',
    chains: ['arbitrum-one'],
  },
  '0xe07f9d810a48ab5c3c914ba3ca53af14e4491e8a': {
    name: 'Gyroscope GYD',
    symbol: 'gyd',
    chains: ['ethereum'],
  },
  '0xca5d8f8a8d49439357d3cf46ca2e720702f132b8': {
    name: 'Gyroscope GYD',
    symbol: 'gyd',
    chains: ['arbitrum-one'],
  },
  '0x2c537e5624e4af88a7ae4060c022609376c8d0eb': {
    name: 'BiLira',
    symbol: 'tryb',
    chains: ['ethereum'],
  },
  '0x0e573ce2736dd9637a0b21058352e1667925c7a8': {
    name: 'Verified USD',
    symbol: 'usdv',
    chains: ['ethereum'],
  },
  '0x323665443cef804a3b5206103304bd4872ea4253': {
    name: 'Verified USD',
    symbol: 'usdv',
    chains: ['arbitrum-one'],
  },
  '0x956f47f50a910163d8bf957cf5846d573e7f87ca': {
    name: 'Fei USD',
    symbol: 'fei',
    chains: ['ethereum'],
  },
  '0x0a5e677a6a24b2f1a2bf4f3bffc443231d2fdec8': {
    name: 'dForce USD',
    symbol: 'usx',
    chains: ['ethereum'],
  },
  '0x641441c631e2f909700d2f41fd87f0aa6a6b4edb': {
    name: 'dForce USD',
    symbol: 'usx',
    chains: ['arbitrum-one'],
  },
  '0x4591dbff62656e7859afe5e45f6f47d3669fbb28': {
    name: 'Prisma mkUSD',
    symbol: 'mkusd',
    chains: ['ethereum'],
  },
  '0xc08512927d12348f6620a698105e1baac6ecd911': {
    name: 'GYEN',
    symbol: 'gyen',
    chains: ['ethereum'],
  },
  '0x589d35656641d6ab57a545f08cf473ecd9b6d5f7': {
    name: 'GYEN',
    symbol: 'gyen',
    chains: ['arbitrum-one'],
  },
  '0xdf3ac4f479375802a821f7b7b46cd7eb5e4262cc': {
    name: 'eUSD',
    symbol: 'eusd',
    chains: ['ethereum'],
  },
  '0x2a8e1e676ec238d8a992307b495b45b3feaa5e86': {
    name: 'Origin Dollar',
    symbol: 'ousd',
    chains: ['ethereum'],
  },
  '0x1b3c515f58857e141a966b33182f2f3feecc10e9': {
    name: 'USK',
    symbol: 'usk',
    chains: ['ethereum'],
  },
  '0xdf574c24545e5ffecb9a659c229253d4111d87e1': {
    name: 'HUSD',
    symbol: 'husd',
    chains: ['ethereum'],
  },
  '0xe2f2a5c287993345a840db3b0845fbc70f5935a5': {
    name: 'mStable USD',
    symbol: 'musd',
    chains: ['ethereum'],
  },
  '0x6e109e9dd7fa1a58bc3eff667e8e41fc3cc07aef': {
    name: 'CNH Tether',
    symbol: 'cnht',
    chains: ['ethereum'],
  },
  '0x6ba75d640bebfe5da1197bb5a2aff3327789b5d3': {
    name: 'VNX EURO',
    symbol: 'veur',
    chains: ['ethereum'],
  },
  '0x70e8de73ce538da2beed35d14187f6959a8eca96': {
    name: 'XSGD',
    symbol: 'xsgd',
    chains: ['ethereum'],
  },
  '0x97de57ec338ab5d51557da3434828c5dbfada371': {
    name: 'eUSD (OLD)',
    symbol: 'eusd',
    chains: ['ethereum'],
  },
  '0x68037790a0229e9ce6eaa8a99ea92964106c4703': {
    name: 'Parallel',
    symbol: 'par',
    chains: ['ethereum'],
  },
  '0x1cfa5641c01406ab8ac350ded7d735ec41298372': {
    name: 'Convertible JPY Token',
    symbol: 'cjpy',
    chains: ['ethereum'],
  },
  '0xd74f5255d557944cf7dd0e45ff521520002d5748': {
    name: 'Sperax USD',
    symbol: 'usds',
    chains: ['arbitrum-one'],
  },
  '0xd71ecff9342a5ced620049e616c5035f1db98620': {
    name: 'sEUR',
    symbol: 'seur',
    chains: ['ethereum'],
  },
  '0x38547d918b9645f2d94336b6b61aeb08053e142c': {
    name: 'USC',
    symbol: 'usc',
    chains: ['ethereum'],
  },
  '0x45fdb1b92a649fb6a64ef1511d3ba5bf60044838': {
    name: 'SpiceUSD',
    symbol: 'usds',
    chains: ['ethereum'],
  },
  '0xebf2096e01455108badcbaf86ce30b6e5a72aa52': {
    name: 'XIDR',
    symbol: 'xidr',
    chains: ['ethereum'],
  },
  '0xb0b195aefa3650a6908f15cdac7d92f8a5791b0b': {
    name: 'BOB',
    symbol: 'bob',
    chains: ['ethereum', 'arbitrum-one'],
  },
  '0x86b4dbe5d203e634a12364c0e428fa242a3fba98': {
    name: 'poundtoken',
    symbol: 'gbpt',
    chains: ['ethereum'],
  },
  '0xd90e69f67203ebe02c917b5128629e77b4cd92dc': {
    name: 'One Cash',
    symbol: 'onc',
    chains: ['ethereum'],
  },
  '0x3449fc1cd036255ba1eb19d65ff4ba2b8903a69a': {
    name: 'Basis Cash',
    symbol: 'bac',
    chains: ['ethereum'],
  },
  '0xc285b7e09a4584d027e5bc36571785b515898246': {
    name: 'Coin98 Dollar',
    symbol: 'cusd',
    chains: ['ethereum'],
  },
  '0x64343594ab9b56e99087bfa6f2335db24c2d1f17': {
    name: 'Vesta Stable',
    symbol: 'vst',
    chains: ['arbitrum-one'],
  },
  '0x2370f9d504c7a6e775bf6e14b3f12846b594cd53': {
    name: 'JPY Coin v1',
    symbol: 'jpyc',
    chains: ['ethereum'],
  },
  '0x53dfea0a8cc2a2a2e425e1c174bc162999723ea0': {
    name: 'Jarvis Synthetic Swiss Franc',
    symbol: 'jchf',
    chains: ['ethereum'],
  },
  '0x0f17bc9a994b87b5225cfb6a2cd4d667adb4f20b': {
    name: 'Jarvis Synthetic Euro',
    symbol: 'jeur',
    chains: ['ethereum'],
  },
  '0x3231cb76718cdef2155fc47b5286d82e6eda273f': {
    name: 'Monerium EUR emoney',
    symbol: 'eure',
    chains: ['ethereum'],
  },
  '0x65d72aa8da931f047169112fcf34f52dbaae7d18': {
    name: 'f(x) rUSD',
    symbol: 'rusd',
    chains: ['ethereum'],
  },
  '0x085780639cc2cacd35e474e71f4d000e2405d8f6': {
    name: 'f(x) Protocol fxUSD',
    symbol: 'fxusd',
    chains: ['ethereum'],
  },
  '0xa663b02cf0a4b149d2ad41910cb81e23e1c41c32': {
    name: 'Staked FRAX',
    symbol: 'sfrax',
    chains: ['ethereum'],
  },
  '0xe3b3fe7bca19ca77ad877a5bebab186becfad906': {
    name: 'Staked FRAX',
    symbol: 'sfrax',
    chains: ['arbitrum-one'],
  },
  '0xcfc5bd99915aaa815401c5a41a927ab7a38d29cf': {
    name: 'Threshold USD',
    symbol: 'thusd',
    chains: ['ethereum'],
  },
  '0xa47c8bf37f92abed4a126bda807a7b7498661acd': {
    name: 'Wrapped USTC',
    symbol: 'ustc',
    chains: ['ethereum'],
  },
  '0x3509f19581afedeff07c53592bc0ca84e4855475': {
    name: 'xDollar Stablecoin',
    symbol: 'xusd',
    chains: ['arbitrum-one'],
  },
  '0x431d5dff03120afa4bdf332c61a6e1766ef37bdb': {
    name: 'JPY Coin',
    symbol: 'jpyc',
    chains: ['ethereum'],
  },
  '0xb6667b04cb61aa16b59617f90ffa068722cf21da': {
    name: 'Worldwide USD',
    symbol: 'wusd',
    chains: ['ethereum'],
  },
  '0xB4F1737Af37711e9A5890D9510c9bB60e170CB0D': {
    name: 'COW Dai Stablecoin',
    symbol: 'DAI',
    chains: ['sepolia'],
  },
  '0xbe72E441BF55620febc26715db68d3494213D8Cb': {
    name: 'COW USD Coin',
    symbol: 'USDC',
    chains: ['sepolia'],
  },
  '0x58eb19ef91e8a6327fed391b51ae1887b833cc91': {
    name: 'COW Tether USD',
    symbol: 'USDT',
    chains: ['sepolia'],
  },
  '0xaf204776c7245bf4147c2612bf6e5972ee483701': {
    name: 'Savings xDai',
    symbol: 'SDAI',
    chains: ['gnosis'],
  },
  '0x83f20f44975d03b1b09e64809b757c47f942beea': {
    name: 'Savings xDai',
    symbol: 'SDAI',
    chains: ['ethereum'],
  },
  '0x4c612e3b15b96ff9a6faed838f8d07d479a8dd4c': {
    name: 'Aave v3 sDai',
    symbol: 'ASDAI',
    chains: ['ethereum'],
  },
  '0x7a5c3860a77a8dc1b225bd46d0fb2ac1c6d191bc': {
    name: 'Aave v3 sDai',
    symbol: 'ASDAI',
    chains: ['gnosis'],
  },
  '0x2a22f9c3b484c3629090feed35f17ff8f88f76f0': {
    name: 'Gnosis xDAI Bridged USDC',
    symbol: 'USDC.e',
    chains: ['gnosis'],
  },
  '0xcb444e90d8198415266c6a2724b7900fb12fc56e': {
    name: 'Monerium EUR emoney',
    symbol: 'EURE',
    chains: ['gnosis'],
  },
  '0xdc035d45d973e3ec169d2276ddab16f1e407384f': {
    name: 'Sky dollar',
    symbol: 'USDS',
    chains: ['ethereum'],
  },
  '0x5f7827fdeb7c20b443265fc2f40845b715385ff2': {
    name: 'EURCV',
    symbol: 'EURCV',
    chains: ['ethereum'],
  },
  // Base
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
    name: 'USDC',
    symbol: 'usdc',
    chains: ['base'],
  },
  '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2': {
    name: 'Tether USD',
    symbol: 'usdt',
    chains: ['base'],
  },
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': {
    name: 'Dai Stablecoin',
    symbol: 'dai',
    chains: ['base'],
  },
  '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34': {
    name: 'USDe',
    symbol: 'usde',
    chains: ['base', 'plasma'],
  },
  '0x820c137fa70c8691f0e44dc420a5e53c168921dc': {
    name: 'USDS Stablecoin',
    symbol: 'usds',
    chains: ['base'],
  },
  '0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42': {
    name: 'EURC',
    symbol: 'eurc',
    chains: ['base'],
  },
  // Linea
  '0x176211869cA2b568f2A7D4EE941E073a821EE1ff': {
    name: 'USDC',
    symbol: 'usdc',
    chains: ['linea'],
  },
  '0xA219439258ca9da29E9Cc4cE5596924745e12B93': {
    name: 'Tether USD',
    symbol: 'usdt',
    chains: ['linea'],
  },
  '0x4AF15ec2A0bd43Db75dd04E62FAA3B8EF36b00d5': {
    name: 'Dai Stablecoin',
    symbol: 'dai',
    chains: ['linea'],
  },
  '0x1B64B9025EEbb9A6239575dF9Ea4b9Ac46D4d193': {
    name: 'XAUT0 on plasma',
    symbol: 'XAUT0',
    chains: ['plasma'],
  },
  '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb': {
    name: 'USDT0 on plasma ',
    symbol: 'USDT0',
    chains: ['plasma'],
  },
}
