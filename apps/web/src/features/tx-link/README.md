# Transaction links

A transaction link opens the review step of a new transaction with every call already filled in. The signer only reviews, signs or executes.

```
https://app.safe.global/home?safe=<chainPrefix>:<safeAddress>&txs=<url-encoded JSON>[&nonce=<n>]
```

`txs` is one call or an array of calls. Two or more calls are sent as one `MultiSendCallOnly` transaction. Each call has:

| Field    | Required | Meaning                                                                                          |
| -------- | -------- | ------------------------------------------------------------------------------------------------ |
| `to`     | yes      | Target address                                                                                   |
| `value`  | no       | Native amount in wei, decimal or `0x` hex string. Default `0`                                    |
| `data`   | no       | Raw calldata as hex. Default `0x`                                                                |
| `method` | no       | Function signature, for example `transfer(address to, uint256 amount)`. Not together with `data` |
| `args`   | no       | Arguments for `method`, in order. Pass large integers as strings                                 |

`nonce` sets the Safe nonce, for example to replace a queued transaction. Without it, the recommended nonce is used.

Only `CALL` operations are possible. A link cannot create a `DELEGATECALL`.

## Examples

Send 0.02 ETH:

```json
[{ "to": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "value": "20000000000000000" }]
```

Approve and deposit in one transaction:

```json
[
  { "to": "<token>", "method": "approve(address spender, uint256 amount)", "args": ["<vault>", "1000000"] },
  { "to": "<vault>", "method": "deposit(uint256 assets, address receiver)", "args": ["1000000", "<safe>"] }
]
```

Build the link with `encodeURIComponent(JSON.stringify(txs))`.
