import json
from pathlib import Path
from web3 import Web3

def verify(results_dir):
    manifest_path = Path(results_dir) / "manifest.json"
    with open(manifest_path, 'r') as f:
        manifest = json.load(f)
    tx_snapshot_path = Path(results_dir) / manifest["tx_snapshot"]
    with open(tx_snapshot_path, 'r') as f:
        tx_snapshot = json.load(f)
    tx_hash = tx_snapshot[0]['writeTxResult']

    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))

    receipt = w3.eth.get_transaction_receipt(tx_hash)

    if receipt is None or receipt.status != 1:
        raise Exception('Transaction failed or not found')

    event_sig = w3.keccak(text='ProxyCreation(address,address)').hex()
    logs = [log for log in receipt.logs if log.topics[0].hex() == event_sig]
    if not logs:
        raise Exception('No Safe proxy deployed')

    proxy = '0x' + logs[0].data.hex()[26:66]
    singleton = '0x' + logs[0].data.hex()[90:130]
    print(f'Safe proxy deployed at {proxy} with singleton {singleton}')

    return True