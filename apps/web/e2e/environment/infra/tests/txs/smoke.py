import json
import os
import time

import requests
from eth_account import Account
from safe_eth.eth import EthereumClient
from safe_eth.eth.ethereum_network import EthereumNetwork
from safe_eth.safe import Safe
from safe_eth.safe.api.transaction_service_api import TransactionServiceApi
from safe_eth.safe.multi_send import MultiSend, MultiSendOperation, MultiSendTx


RPC = f"http://anvil:{os.environ.get('RPC_PORT', '8545')}"
CGW = "http://nginx:8000/cgw"
CHAIN_ID = int(os.environ.get("FORK_CHAIN_ID", "11155111"))
FORK_BLOCK = int(os.environ["FORK_BLOCK_NUMBER"])


def wait_json(path, check, timeout=90):
    deadline = time.monotonic() + timeout
    last_status = None
    while time.monotonic() < deadline:
        response = requests.get(CGW + path, timeout=10)
        last_status = response.status_code
        if response.ok:
            value = response.json()
            if check(value):
                return value
        time.sleep(2)
    raise AssertionError(f"CGW did not expose expected state: {path} (last HTTP {last_status})")


def verify_decoder(client, recipient):
    multi_send = MultiSend(client)
    calls = [MultiSendTx(MultiSendOperation.CALL, recipient.address, value, b"") for value in (1, 2)]
    decoded = requests.post("http://decoder-web:8888/api/v1/data-decoder", json={
        "chainId": str(CHAIN_ID), "to": multi_send.address,
        "data": "0x" + multi_send.build_tx_data(calls).hex().removeprefix("0x"),
    }, timeout=10)
    decoded.raise_for_status()
    data = decoded.json()
    assert data["method"] == "multiSend"
    decoded_calls = [(call["to"], call["value"]) for call in data["parameters"][0]["valueDecoded"]]
    assert decoded_calls == [(recipient.address, "1"), (recipient.address, "2")]
    print("Local MultiSend decoder verified", flush=True)


def create_safe(client, owner):
    response = requests.post(RPC, json={
        "jsonrpc": "2.0", "id": 1, "method": "anvil_setBalance",
        "params": [owner.address, hex(10**20)],
    }, timeout=10)
    assert "error" not in response.json()
    deployed = Safe.create(
        client, owner,
        master_copy_address="0x29fcB43b46531BcA003ddC8FCB67FFE91900C762",
        owners=[owner.address], threshold=1,
        fallback_handler="0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99",
        proxy_factory_address="0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67",
    )
    receipt = client.w3.eth.wait_for_transaction_receipt(deployed.tx_hash)
    assert receipt["status"] == 1 and receipt["blockNumber"] > FORK_BLOCK
    assert deployed.contract_address
    print(f"Created Safe {deployed.contract_address} at block {receipt['blockNumber']}", flush=True)
    return deployed.contract_address, receipt["blockNumber"]


def fund_safe(client, owner, safe_address):
    funding_tx = {
        "from": owner.address, "to": safe_address, "value": 10**18,
        "gasPrice": client.w3.eth.gas_price, "chainId": CHAIN_ID,
    }
    funding_tx["gas"] = client.w3.eth.estimate_gas(funding_tx)
    funding = client.send_unsigned_transaction(funding_tx, private_key=owner.key.hex())
    assert client.w3.eth.wait_for_transaction_receipt(funding)["status"] == 1


def delete_proposal(owner, safe_address, safe_tx_hash):
    deletion = owner.sign_typed_data(
        domain_data={
            "name": "Safe Transaction Service", "version": "1.0",
            "chainId": CHAIN_ID, "verifyingContract": safe_address,
        },
        message_types={"DeleteRequest": [
            {"name": "safeTxHash", "type": "bytes32"},
            {"name": "totp", "type": "uint256"},
        ]},
        message_data={"safeTxHash": safe_tx_hash, "totp": int(time.time() // 3600)},
    )
    deleted = requests.delete(
        f"{CGW}/v1/chains/{CHAIN_ID}/transactions/{safe_tx_hash}",
        json={"signature": "0x" + deletion.signature.hex().removeprefix("0x")}, timeout=10,
    )
    assert deleted.status_code in (200, 204), (
        f"CGW deletion failed: HTTP {deleted.status_code}: {deleted.text}"
    )


def verify_proposal_lifecycle(client, owner, recipient, safe_address):
    path = f"/v1/chains/{CHAIN_ID}/safes/{safe_address}"
    queued = path + "/transactions/queued"
    tx = Safe(safe_address, client).build_multisig_tx(recipient.address, 10**16, b"", safe_nonce=0)
    tx.sign(owner.key.hex())
    api = TransactionServiceApi(EthereumNetwork(CHAIN_ID), client, base_url="http://nginx:8000/txs")
    api.post_transaction(tx)
    safe_tx_hash = "0x" + tx.safe_tx_hash.hex().removeprefix("0x")
    wait_json(queued, lambda data: safe_tx_hash in json.dumps(data))
    delete_proposal(owner, safe_address, safe_tx_hash)
    wait_json(queued, lambda data: safe_tx_hash not in json.dumps(data))
    print("Signed proposal deletion verified through CGW", flush=True)
    api.post_transaction(tx)
    wait_json(queued, lambda data: safe_tx_hash in json.dumps(data))
    execution, _ = tx.execute(owner.key.hex())
    assert client.w3.eth.wait_for_transaction_receipt(execution)["status"] == 1
    wait_json(path, lambda data: data["nonce"] == 1)
    executed = execution.hex().removeprefix("0x")
    wait_json(path + "/transactions/history", lambda data: executed in json.dumps(data))
    assert client.w3.eth.get_balance(recipient.address) == 10**16


def verify_indexing_floor():
    indexing = requests.get("http://fork-rpc:8546/status", timeout=10).json()
    assert indexing["logRequests"] > 0
    assert indexing["minimumFromBlock"] >= FORK_BLOCK
    assert indexing["rejectedRequests"] == 0, indexing
    return indexing


def main():
    client = EthereumClient(RPC)
    assert client.get_chain_id() == CHAIN_ID
    owner = Account.create()
    recipient = Account.create()
    verify_decoder(client, recipient)
    safe_address, creation_block = create_safe(client, owner)
    path = f"/v1/chains/{CHAIN_ID}/safes/{safe_address}"
    wait_json(path, lambda data: data["threshold"] == 1 and data["nonce"] == 0)
    print("Safe indexed through CGW", flush=True)
    fund_safe(client, owner, safe_address)
    verify_proposal_lifecycle(client, owner, recipient, safe_address)
    print(json.dumps({
        "safe": safe_address, "chainId": CHAIN_ID, "creationBlock": creation_block, "nonce": 1,
        "indexing": verify_indexing_floor(), "result": "passed",
    }))


if __name__ == "__main__":
    main()
