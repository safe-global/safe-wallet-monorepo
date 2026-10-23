/** Addresses that make the Blockaid mock (blockaid-api.ts) flag a transaction; the Safe Shield journey sends to them. */

/** A transaction that sends to or calls this address scans as a known drainer */
export const DRAINER_ADDRESS = '0xbad0000000000000000000000000000000000bad'

/** A transaction that sends to or calls this address gets a failed scan */
export const SCAN_ERROR_ADDRESS = '0xe770000000000000000000000000000000000e77'
