/* eslint-disable */
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { buildQueryUrl } from '../../support/utils/txquery.js'
import * as constants from '../../support/constants.js'

let staticSafes = []
let safeAddress

const txType_incoming = 'incoming'

describe('API Tx history decimals filter tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    safeAddress = staticSafes.SEP_STATIC_SAFE_38.substring(4)
  })

  const chainId = constants.networkKeys.sepolia

  // incoming tx
  it('Verify incoming USDC can be filtered with decimals', () => {
    const params = {
      transactionType: txType_incoming,
      value: '12.087258546746105003',
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })
    console.log('*****. Generated URL:', url)

    cy.request({
      url: url,
      failOnStatusCode: false,
    }).then((response) => {
      console.log(JSON.stringify(response.body))
      expect(response.body).to.have.property('results').and.to.be.an('array')
      expect(response.body.results).to.not.be.empty
    })
  })

  it('Verify incoming ETH can be filtered with decimals', () => {
    const params = {
      transactionType: txType_incoming,
      value: '0.05',
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })
    console.log('*****. Generated URL:', url)

    cy.request({
      url: url,
      failOnStatusCode: false,
    }).then((response) => {
      console.log(JSON.stringify(response.body))
      expect(response.body).to.have.property('results').and.to.be.an('array')
      expect(response.body.results).to.not.be.empty
    })
  })
})
