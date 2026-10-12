import json
import os
import time
import urllib.request

# EIP-4788 beacon roots and EIP-2935 block hashes. Each mined block writes new slots of both contracts, which a fork
# fetches from the archive RPC first. Without code the system calls do nothing; BLOCKHASH does not use the contract.
SYSTEM_CONTRACTS = ("0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02", "0x0000F90827F1C53a10cb7A02335B175320002935")


def align_fork_clock(rpc, chain_id, fork_block, fork_hash, now):
    if "anvil" not in rpc("web3_clientVersion", []).lower():
        raise RuntimeError("Clock alignment requires Anvil")
    if int(rpc("eth_chainId", []), 16) != chain_id:
        raise RuntimeError("Anvil chain ID does not match the fork")
    anchor = rpc("eth_getBlockByNumber", [hex(fork_block), False])
    if fork_hash and anchor["hash"].lower() != fork_hash.lower():
        raise RuntimeError("Fork block hash mismatch")
    latest = rpc("eth_getBlockByNumber", ["latest", False])
    if int(latest["timestamp"], 16) >= now:
        return
    rpc("evm_setNextBlockTimestamp", [now])
    rpc("evm_mine", [])
    latest = rpc("eth_getBlockByNumber", ["latest", False])
    if int(latest["timestamp"], 16) < now:
        raise RuntimeError("Anvil clock did not advance")
    if rpc("eth_getBlockByNumber", [hex(fork_block), False])["hash"] != anchor["hash"]:
        raise RuntimeError("Clock alignment changed the fork anchor")


def disable_system_contracts(rpc):
    for address in SYSTEM_CONTRACTS:
        rpc("anvil_setCode", [address, "0x"])


def main():
    def rpc(method, params):
        request = urllib.request.Request(
            os.environ["ANVIL_RPC_URL"],
            data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode(),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = json.load(response)
        if "error" in payload:
            raise RuntimeError(f"Anvil clock RPC failed: {method}")
        return payload["result"]

    align_fork_clock(
        rpc, int(os.environ["FORK_CHAIN_ID"]), int(os.environ["FORK_BLOCK_NUMBER"]),
        os.environ.get("FORK_BLOCK_HASH", ""), int(time.time()),
    )
    disable_system_contracts(rpc)
    print("Anvil post-fork clock is current; fork anchor preserved; system contracts disabled", flush=True)


if __name__ == "__main__":
    main()
