// Jest tests fail if TradeType is imported from widget-lib, so  we duplicate them here
export enum TradeType {
  SWAP = 'swap',
  LIMIT = 'limit',
  /**
   * Currently it means only TWAP orders.
   * But in the future it can be extended to support other order types.
   */
  ADVANCED = 'advanced',
}

export enum UiOrderType {
  SWAP = 'SWAP',
  LIMIT = 'LIMIT',
  TWAP = 'TWAP',
}
