import { fixtureGetters } from '../support/fixture.js'

export default fixtureGetters('swaps', {
  limitOrderSafe: 'sep:0x8f4A19C85b39032A37f7a6dCc65234f966F72551',
  partiallyFilledLimitOrder:
    '&id=multisig_0x8f4A19C85b39032A37f7a6dCc65234f966F72551_0x3faf510142c9ade7ac2a701fb697b95f321fd51f5eb9b17e7e534a8abe472b07',
  wrapSwapSafe: 'sep:0xF184a243925Bf7fb1D64487339FF4F177Fb75644',
  cancelledOrderSafe: '0x2a73e61bd15b25B6958b4DA3bfc759ca4db249b9',
  threeActionsSafe: '0x140663Cb76e4c4e97621395fc118912fa674150B',
  twapPartiallyFilled:
    'sep:0x8f4A19C85b39032A37f7a6dCc65234f966F72551&id=multisig_0x8f4A19C85b39032A37f7a6dCc65234f966F72551_0x2fdf5e5d94306de5f7285fd74ca014067b090338b3ff15e3f66d6c02ef81e4a4',
  twapFilled:
    'sep:0x8f4A19C85b39032A37f7a6dCc65234f966F72551&id=multisig_0x8f4A19C85b39032A37f7a6dCc65234f966F72551_0xc8a9399afbba45e82a0645770db38386cbe10bec77dd8b6395f7d24e19a45c9a',
})
