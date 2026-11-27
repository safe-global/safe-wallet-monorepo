import json
import os
import time
import urllib.parse
import uuid

import requests
import urllib3
from eth_account import Account
from safe_eth.eth import EthereumClient
from safe_eth.safe import Safe
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


def propose(owner, safe_address, tx, safe_tx_hash):
    proposed = requests.post(f"{CGW}/v1/chains/{CHAIN_ID}/transactions/{safe_address}/propose", json={
        "to": tx.to, "value": str(tx.value), "data": "0x" + tx.data.hex() if tx.data else None,
        "operation": tx.operation, "nonce": str(tx.safe_nonce), "safeTxGas": str(tx.safe_tx_gas),
        "baseGas": str(tx.base_gas), "gasPrice": str(tx.gas_price), "gasToken": tx.gas_token,
        "refundReceiver": tx.refund_receiver, "safeTxHash": safe_tx_hash, "sender": owner.address,
        "signature": "0x" + tx.signatures.hex().removeprefix("0x"),
    }, timeout=10)
    assert proposed.ok, f"CGW proposal failed: HTTP {proposed.status_code}: {proposed.text}"


def delete_proposal(owner, safe_address, safe_tx_hash):
    deletion = owner.sign_typed_data(
        domain_data={
            "name": "Safe Queue Service", "version": "1.0",
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
    safe_tx_hash = "0x" + tx.safe_tx_hash.hex().removeprefix("0x")
    propose(owner, safe_address, tx, safe_tx_hash)
    wait_json(queued, lambda data: safe_tx_hash in json.dumps(data))
    delete_proposal(owner, safe_address, safe_tx_hash)
    wait_json(queued, lambda data: safe_tx_hash not in json.dumps(data))
    print("Signed proposal deletion verified through CGW and the Queue Service", flush=True)
    propose(owner, safe_address, tx, safe_tx_hash)
    wait_json(queued, lambda data: safe_tx_hash in json.dumps(data))
    execution, _ = tx.execute(owner.key.hex())
    assert client.w3.eth.wait_for_transaction_receipt(execution)["status"] == 1
    wait_json(path, lambda data: data["nonce"] == 1)
    executed = execution.hex().removeprefix("0x")
    wait_json(path + "/transactions/history", lambda data: executed in json.dumps(data))
    assert client.w3.eth.get_balance(recipient.address) == 10**16


AUTH0 = "https://auth.safe-e2e.test"
# Any loopback URL passes the gateway's redirect check; nothing listens on it.
WALLET = "http://localhost:3080/"


def gateway(session, method, path, **kwargs):
    response = session.request(method, f"{CGW}{path}", allow_redirects=False, timeout=10, **kwargs)
    # The gateway's cookies are Secure; browsers send them to http://localhost, but not this client to http://nginx.
    for cookie in session.cookies:
        cookie.secure = False
    return response


def oidc_round_trip(session, query, form):
    """Runs the browser's authorize → Auth0 form → callback steps and returns the gateway's final redirect."""
    response = gateway(session, "GET", "/v1/auth/oidc/authorize", params=query)
    assert response.status_code == 302, response.text
    authorize = urllib.parse.urlsplit(response.headers["Location"])
    assert f"{authorize.scheme}://{authorize.netloc}" == AUTH0, authorize
    params = dict(urllib.parse.parse_qsl(authorize.query))
    response = session.post(
        f"{AUTH0}/authorize", data={**params, **form, "action": "verify"}, allow_redirects=False, verify=False,
        timeout=10,
    )
    assert response.status_code == 302, response.text
    callback = urllib.parse.urlsplit(response.headers["Location"])
    response = gateway(session, "GET", "/v1/auth/oidc/callback", params=dict(urllib.parse.parse_qsl(callback.query)))
    assert response.status_code == 302, response.text
    return response.headers["Location"]


def verify_email_sign_in_and_step_up():
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    session = requests.Session()
    email = f"smoke-{uuid.uuid4().hex[:12]}@safe-e2e.test"
    form = {"email": email, "code": "123456", "skip_mfa": "on"}
    landed = oidc_round_trip(session, {"redirect_url": WALLET, "connection": "email"}, form)
    assert landed == WALLET, landed
    space = gateway(session, "POST", "/v1/spaces", json={"name": "Smoke step-up"})
    assert space.status_code in (200, 201), space.text
    rename = f"/v1/spaces/{space.json()['uuid']}"
    refused = gateway(session, "PATCH", rename, json={"name": "Smoke renamed"})
    assert refused.status_code == 403 and "elevation_required" in refused.text, refused.text
    landed = oidc_round_trip(session, {"redirect_url": WALLET, "elevate": "true"}, {"code": "123456"})
    assert "error" not in urllib.parse.urlsplit(landed).query, landed
    renamed = gateway(session, "PATCH", rename, json={"name": "Smoke renamed"})
    assert renamed.ok, renamed.text
    print("Email sign-in and step-up verified through CGW and the local Auth0", flush=True)


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
    verify_email_sign_in_and_step_up()
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
