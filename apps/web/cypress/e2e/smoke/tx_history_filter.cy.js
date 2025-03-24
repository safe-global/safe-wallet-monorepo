/* eslint-disable */
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import { buildQueryUrl } from '../../support/utils/txquery.js'
import * as constants from '../../support/constants.js'

let staticSafes = []
let safeAddress
const success = constants.transactionStatus.success.toUpperCase()
const txType_outgoing = 'multisig'
const txType_incoming = 'incoming'

describe('[SMOKE] API Tx history filter tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    safeAddress = staticSafes.SEP_STATIC_SAFE_7.substring(4)
  })

  const chainId = constants.networkKeys.sepolia

  // incoming tx
  it('Verify that when date range is set with 1 date, correct data is returned', () => {
    const params = {
      transactionType: txType_incoming,
      startDate: '2023-12-14T23:00:00.000Z',
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })

    cy.request(url).then((response) => {
      const results = response.body.results
      expect(results.length).to.eq(1)
      const txType = results.filter((tx) => tx.transaction.txStatus === success)
      const txdirection = results.filter(
        (tx) => tx.transaction.txInfo.direction === params.transactionType.toUpperCase(),
      )
      expect(txType.length, 'Number of successful transactions').to.eq(1)
      expect(txdirection.length, 'Number of incoming transactions').to.eq(1)
    })
  })

  it('Verify that when a large amount is set in the amount field, error is returned', () => {
    const params = {
      transactionType: txType_incoming,
      startDate: '2023-12-14T23:00:00.000Z',
      value: '893748237489328479823749823748723984728734000000000000000000',
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })

    cy.request({
      url: url,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
    })
  })

  it('Verify that applying a token for which no transaction exist returns no results', () => {
    const params = {
      transactionType: txType_incoming,
      startDate: '2023-12-14T23:00:00.000Z',
      token_address: constants.RECIPIENT_ADDRESS,
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })

    cy.request(url).then((response) => {
      const results = response.body.results
      expect(results.length, 'Number of transactions').to.eq(0)
    })
  })

  it('Verify that when the incoming date range filter is set to only one day with no transactions, it returns no results', () => {
    const params = {
      transactionType: txType_incoming,
      startDate: '2023-12-31T23:00:00.000Z',
      token_address: constants.RECIPIENT_ADDRESS,
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })

    cy.request(url).then((response) => {
      const results = response.body.results
      expect(results.length, 'Number of transactions').to.eq(0)
    })
  })

  it('Verify setting non-existent amount with valid data range returns no results', () => {
    const params = {
      transactionType: txType_incoming,
      startDate: '2023-11-30T23:00:00.000Z',
      endDate: '2023-12-01T22:59:59.999Z',
      value: '20000000000000000000',
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })

    cy.request(url).then((response) => {
      const results = response.body.results
      expect(results.length, 'Number of transactions').to.eq(0)
    })
  })

  it('Verify timestamps are within the expected range for incoming transactions', () => {
    const params = {
      transactionType: txType_incoming,
      startDate: '2023-11-29T23:00:00.000Z',
      endDate: '2023-12-15T22:59:59.999Z',
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })

    cy.request(url).then((response) => {
      const results = response.body.results
      results.forEach((tx) => {
        const timestamp = tx.transaction.timestamp
        expect(timestamp, 'Transaction timestamp').to.be.within(
          new Date(params.startDate).getTime(),
          new Date(params.endDate).getTime(),
        )
      })
    })
  })

  it('Verify sender and recipient addresses for incoming transactions', () => {
    const params = {
      transactionType: txType_incoming,
      startDate: '2023-12-14T23:00:00.000Z',
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })

    cy.request(url).then((response) => {
      const results = response.body.results
      results.forEach((tx) => {
        expect(tx.transaction.txInfo.sender.value, 'Sender address').to.match(/^0x[0-9a-fA-F]{40}$/)
        expect(tx.transaction.txInfo.recipient.value, 'Recipient address').to.eq(safeAddress)
      })
    })
  })

  // outgoing tx
  it('Verify that when date range is set with 1 date, correct data is returned', () => {
    const params = {
      transactionType: txType_outgoing,
      endDate: '2023-11-30T22:59:59.999Z',
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })

    cy.request(url).then((response) => {
      const results = response.body.results
      const txType = results.filter((tx) => tx.transaction.txStatus === success)
      expect(txType.length, 'Number of successful transactions').to.eq(11)
    })
  })

  it('Verify that when a large amount is set in the amount field, error is returned', () => {
    const params = {
      transactionType: txType_outgoing,
      startDate: '2023-12-14T23:00:00.000Z',
      value: '893748237489328479823749823748723984728734000000000000000000',
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })

    cy.request({
      url: url,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
    })
  })

  it('Verify that applying a recipient for which no transaction exist returns no results', () => {
    const params = {
      transactionType: txType_outgoing,
      startDate: '2023-12-14T23:00:00.000Z',
      to: constants.RECIPIENT_ADDRESS,
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })

    cy.request(url).then((response) => {
      const results = response.body.results
      expect(results.length, 'Number of transactions').to.eq(0)
    })
  })

  it('Verify that when the outgoing date range filter is set to only one day with no transactions, it returns no results', () => {
    const params = {
      transactionType: txType_outgoing,
      startDate: '2024-07-16T00:00:00.000Z',
      endDate: '2024-07-16T23:00:00.000Z',
      token_address: constants.RECIPIENT_ADDRESS,
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })

    cy.request(url).then((response) => {
      const results = response.body.results
      expect(results.length, 'Number of transactions').to.eq(0)
    })
  })

  it('Verify setting existent amount with invalid data range returns no results', () => {
    const params = {
      transactionType: txType_outgoing,
      startDate: '2023-12-15T23:00:00.000Z',
      endDate: '2023-12-20T22:59:59.999Z',
      value: '10000000000000000000',
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })

    cy.request(url).then((response) => {
      const results = response.body.results
      expect(results.length, 'Number of transactions').to.eq(0)
    })
  })

  it('Verify setting existent nonce with invalid end date returns no results', () => {
    const params = {
      transactionType: txType_outgoing,
      endDate: '2023-11-28T22:59:59.999Z',
      nonce: 10,
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })

    cy.request(url).then((response) => {
      const results = response.body.results
      expect(results.length, 'Number of transactions').to.eq(0)
    })
  })

  it('Verify timestamps are within the expected range for transactions', () => {
    const params = {
      transactionType: txType_outgoing,
      startDate: '2023-11-29T00:00:00.000Z',
      endDate: '2023-11-30T22:59:59.999Z',
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })

    cy.request(url).then((response) => {
      const results = response.body.results
      results.forEach((tx) => {
        const timestamp = tx.transaction.timestamp
        expect(timestamp, 'Transaction timestamp').to.be.within(
          new Date(params.startDate).getTime(),
          new Date(params.endDate).getTime(),
        )
      })
    })
  })

  it('Verify sender and recipient addresses for transactions', () => {
    const params = {
      transactionType: txType_outgoing,
      startDate: '2023-11-30T22:59:59.999Z',
      endDate: '2023-11-30T22:59:59.999Z',
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })

    cy.request(url).then((response) => {
      const results = response.body.results
      results.forEach((tx) => {
        expect(tx.transaction.txInfo.sender.value, 'Sender address').to.eq(safeAddress)
        expect(tx.transaction.txInfo.recipient.value, 'Recipient address').to.match(/^0x[0-9a-fA-F]{40}$/)
      })
    })
  })

  it('Verify that setting a non-existent token for transactions returns no results', () => {
    const params = {
      transactionType: txType_outgoing,
      startDate: '2023-12-01T00:00:00.000Z',
      endDate: '2023-12-01T23:59:59.999Z',
      to: constants.RECIPIENT_ADDRESS,
    }
    const url = buildQueryUrl({ chainId, safeAddress, ...params })

    cy.request(url).then((response) => {
      const results = response.body.results
      expect(results.length, 'Number of transactions').to.eq(0)
    })
  })
})
