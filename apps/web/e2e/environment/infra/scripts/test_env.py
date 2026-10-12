import argparse
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
# Fork-block state that Anvil fetched from the archive RPCs, committed so that runs start with it.
FORK_CACHE = ROOT / "fork-cache"
# Redis databases match REDIS_URL of each chain's services in docker-compose.test.yml.
CHAINS = {
    "mainnet": {"chainId": 1, "redisDb": "4"},
    "polygon": {"chainId": 137, "redisDb": "5"},
}
# One-shot jobs run with `run --no-deps`: a plain `up` would also re-run the Sepolia init jobs.
CHAIN_STEPS = (
    ("wait", ("fork-upstream-{}",)),
    ("wait", ("anvil-{}",)),
    ("run", ("anvil-init-{}",)),
    ("wait", ("fork-rpc-{}",)),
    ("run", ("txs-init-{}",)),
    ("wait", ("txs-worker-{}",)),
    ("start", ("txs-scheduler-{}", "txs-web-{}")),
    ("run", ("cfg-chain-{}", "decoder-chain-{}")),
)
INIT_JOBS = ("anvil-init", "txs-init", "cfg-init", "decoder-init")
TXS_CHECKS = {
    "test": ["manage.py", "test", "/fork-tests", "--noinput"],
    "smoke": ["/fork-tests/smoke.py"],
    "indexing": ["manage.py", "setup_fork_indexing", "--check"],
}
PROVIDER_VARIABLE = re.compile(r"SEPOLIA_FORK_RPC_URL|FORK_RPC_URL_\w+")
REDACTED = "<fork-provider>"
STDERR_LINES = 20
# Compose interpolates the whole file, so commands that start no fork still need a provider URL.
UNUSED_PROVIDER = {"SEPOLIA_FORK_RPC_URL": "https://unused.invalid"}
RETRYABLE = (
    urllib.error.URLError, TimeoutError, socket.timeout, KeyError, TypeError, json.JSONDecodeError,
)


def chain_services(name):
    return [service.format(name) for _, services in CHAIN_STEPS for service in services]


def compose_command(project, env_file, profiles=()):
    if not re.fullmatch(r"safe-e2e-[a-z0-9-]+", project):
        raise ValueError("Project must match safe-e2e-[a-z0-9-]+")
    command = [
        "docker", "compose", "--project-name", project,
        "--env-file", str(ROOT / "test-images.env"),
    ]
    if env_file.exists():
        command.extend(["--env-file", str(env_file)])
    for profile in profiles:
        command.extend(["--profile", profile])
    return command + ["-f", str(ROOT / "docker-compose.test.yml")]


def provider_urls(env_file=ROOT / ".env.test"):
    values = [value for name, value in os.environ.items() if PROVIDER_VARIABLE.fullmatch(name)]
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            name, _, value = line.partition("=")
            if PROVIDER_VARIABLE.fullmatch(name.strip()):
                values.append(value.strip().strip("'\""))
    return [value for value in values if value]


def redact(text, secrets):
    for secret in sorted(secrets, key=len, reverse=True):
        text = text.replace(secret, REDACTED)
    return text


def describe_command(command):
    if "-f" in command:
        return " ".join(["docker compose", *command[command.index("-f") + 2:][:1]])
    return " ".join(command[:2])


def run(command, env=None):
    result = subprocess.run(
        command, cwd=ROOT, text=True, capture_output=True, timeout=600, env=env,
    )
    if result.returncode:
        output = "\n".join(result.stderr.strip().splitlines()[-STDERR_LINES:])
        raise RuntimeError(
            f"`{describe_command(command)}` failed; check Docker is running. "
            f"Last Docker output:\n{redact(output, provider_urls())}"
        )
    return result.stdout


def read_json(url, payload=None):
    request = urllib.request.Request(
        url, data=json.dumps(payload).encode() if payload is not None else None,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=5) as response:
        return json.load(response)


def public_config(config):
    services = config["services"]
    rpc = services["fork-rpc"]["environment"]
    block = int(rpc["FORK_BLOCK_NUMBER"])
    if block <= 0:
        raise ValueError("FORK_BLOCK_NUMBER must be positive")
    rpc_port = services["anvil"]["ports"][0]["published"]
    api_port = services["nginx"]["ports"][0]["published"]
    init = services["txs-init"]["environment"]
    return {
        "forkBlock": block,
        "chainId": int(init["FORK_CHAIN_ID"]),
        "forkBlockHash": init.get("FORK_BLOCK_HASH", ""),
        "rpcUrl": f"http://localhost:{rpc_port}",
        "gatewayUrl": f"http://localhost:{api_port}/cgw",
        "transactionServiceUrl": f"http://localhost:{api_port}/txs/api",
        "decoderUrl": f"http://localhost:{api_port}/decoder",
        "images": {name: service["image"] for name, service in services.items()},
    }


def chain_public_config(config, name):
    services = config["services"]
    if not services[f"fork-upstream-{name}"]["environment"]["FORK_UPSTREAM_URL"]:
        raise ValueError(f"Set FORK_RPC_URL_{name.upper()} in .env.test to start the {name} fork")
    init = services[f"txs-init-{name}"]["environment"]
    block = int(init["FORK_BLOCK_NUMBER"])
    if block <= 0:
        raise ValueError(f"FORK_BLOCK_NUMBER_{name.upper()} must be positive")
    api_port = services["nginx"]["ports"][0]["published"]
    return {
        "name": name,
        "chainId": int(init["FORK_CHAIN_ID"]),
        "forkBlock": block,
        "forkBlockHash": init.get("FORK_BLOCK_HASH", ""),
        "rpcUrl": f'http://localhost:{services[f"anvil-{name}"]["ports"][0]["published"]}',
        "transactionServiceUrl": f"http://localhost:{api_port}/txs-{name}/api",
    }


def fork_urls(config):
    return [
        service["environment"]["FORK_UPSTREAM_URL"]
        for name, service in config["services"].items()
        if name.startswith("fork-upstream")
        and service.get("environment", {}).get("FORK_UPSTREAM_URL")
    ]


def seed_fork_cache(cache_dir, source=FORK_CACHE):
    """Copies the committed fork cache into Anvil's writable cache, keeping extended files."""
    writable(cache_dir)
    for committed in source.glob("*/*/storage-*.json"):
        target = cache_dir / committed.relative_to(source)
        if not target.exists():
            writable(target.parent.parent)
            writable(target.parent)
            shutil.copyfile(committed, target)
            target.chmod(0o666)


def writable(directory):
    # Anvil runs as another user in its container and must write its cache here when it stops.
    directory.mkdir(parents=True, exist_ok=True)
    directory.chmod(0o777)


def anvil_cache_dir():
    return ROOT / os.environ.get("ANVIL_CACHE_DIR", ".anvil-cache")


def check_fork(manifest):
    request = {"jsonrpc": "2.0", "id": 1, "method": "eth_chainId", "params": []}
    if int(read_json(manifest["rpcUrl"], request)["result"], 16) != manifest["chainId"]:
        raise RuntimeError("Anvil chain ID does not match configured chain")
    block = read_json(manifest["rpcUrl"], {
        "jsonrpc": "2.0", "id": 2, "method": "eth_getBlockByNumber",
        "params": [hex(manifest["forkBlock"]), False],
    })["result"]
    expected_hash = manifest["forkBlockHash"]
    if expected_hash and block["hash"].lower() != expected_hash.lower():
        raise RuntimeError("Fork block hash mismatch")
    return block["hash"]


def check_ports(manifest):
    for key in ("rpcUrl", "gatewayUrl"):
        if key not in manifest:
            continue
        port = urllib.parse.urlparse(manifest[key]).port
        with socket.socket() as listener:
            try:
                listener.bind(("127.0.0.1", port))
            except OSError as exc:
                raise RuntimeError(
                    f"Local port {port} is already in use; "
                    "choose distinct RPC_PORT and REVERSE_PROXY_PORT"
                ) from exc


def poll(check, timeout, subject):
    deadline = time.monotonic() + timeout
    last_error = None
    while time.monotonic() < deadline:
        try:
            return check()
        except RETRYABLE as exc:
            last_error = exc
            time.sleep(2)
    cause = f"{type(last_error).__name__}: {last_error}" if last_error else "none"
    raise RuntimeError(
        f"{subject} not ready after {timeout}s (last error: {cause}); use the logs command"
    )


def check_init_jobs(compose):
    for init in INIT_JOBS:
        container = run(compose + ["ps", "--all", "--quiet", init]).strip()
        if not container:
            continue
        state = json.loads(run(["docker", "inspect", "--format", "{{json .State}}", container]))
        if state["Status"] == "exited" and state["ExitCode"] != 0:
            raise RuntimeError(f"{init} failed; use the logs command")


def check_gateway_chain(gateway_url, chain_id):
    chain_config = read_json(f"{gateway_url}/v1/chains/{chain_id}")
    if str(chain_config["chainId"]) != str(chain_id):
        raise RuntimeError("CGW returned a different chain")


def check_stack(manifest):
    block_hash = check_fork(manifest)
    read_json(f'{manifest["gatewayUrl"]}/health/ready')
    read_json(f'{manifest["decoderUrl"]}/health/ready')
    check_gateway_chain(manifest["gatewayUrl"], manifest["chainId"])
    chain_id = str(manifest["chainId"])
    url = f'{manifest["gatewayUrl"]}/v2/chains?serviceKey=WALLET_WEB'
    if not any(
        str(chain["chainId"]) == chain_id and "DELETE_TX" in chain["features"]
        for chain in read_json(url)["results"]
    ):
        raise RuntimeError("Wallet v2 chain config is missing the fork or DELETE_TX feature")
    read_json(f'{manifest["transactionServiceUrl"]}/v1/about/indexing/')
    return block_hash


def wait_ready(compose, manifest, timeout):
    def check():
        check_init_jobs(compose)
        return check_stack(manifest)

    manifest["forkBlockHash"] = poll(check, timeout, "Environment")


def wait_chain_ready(manifest, chain, timeout):
    def check():
        block_hash = check_fork(chain)
        check_gateway_chain(manifest["gatewayUrl"], chain["chainId"])
        read_json(f'{chain["transactionServiceUrl"]}/v1/about/indexing/')
        return block_hash

    chain["forkBlockHash"] = poll(check, timeout, f'{chain["name"]} fork')


def write_state(state_file, manifest):
    state_file.parent.mkdir(exist_ok=True)
    state_file.write_text(json.dumps(manifest, indent=2) + "\n")


def chain_step_commands(compose, name):
    commands = []
    for mode, services in CHAIN_STEPS:
        names = [service.format(name) for service in services]
        if mode == "run":
            commands.extend(compose + ["run", "--rm", "--no-deps", service] for service in names)
        else:
            wait = ["--wait"] if mode == "wait" else []
            commands.append(compose + ["up", "--detach", "--no-deps"] + wait + names)
    return commands


def chain_up(compose, config, name, state_file, timeout):
    if not state_file.exists():
        raise RuntimeError("Start the Sepolia stack with up before adding a chain")
    if run(compose + ["ps", "--all", "--quiet"] + chain_services(name)).strip():
        raise RuntimeError(f"{name} fork already has state; use reset --chain {name} first")
    seed_fork_cache(anvil_cache_dir())
    manifest = json.loads(state_file.read_text())
    chain = chain_public_config(config, name)
    check_ports({"rpcUrl": chain["rpcUrl"]})
    print(f'Starting {name} fork at block {chain["forkBlock"]}', flush=True)
    for command in chain_step_commands(compose, name):
        run(command)
    wait_chain_ready(manifest, chain, timeout)
    manifest.setdefault("chains", {})[str(chain["chainId"])] = chain
    write_state(state_file, manifest)
    print(f'Ready: {chain["transactionServiceUrl"]}; public manifest: {state_file}')


def chain_reset(compose, name, state_file):
    run(compose + ["rm", "--stop", "--force", "--volumes"] + chain_services(name))
    for command in chain_storage_reset_commands(compose, name):
        run(command)
    if state_file.exists():
        chain_id = CHAINS[name]["chainId"]
        unregister = (
            f"from chains.models import Chain; Chain.objects.filter(id={chain_id}).delete()"
        )
        manage = compose + ["exec", "-T", "cfg-web", "python", "src/manage.py"]
        run(manage + ["shell", "-c", unregister])
        manifest = json.loads(state_file.read_text())
        manifest.get("chains", {}).pop(str(chain_id), None)
        write_state(state_file, manifest)
    print(f"{name} fork removed")


def chain_storage_reset_commands(compose, name):
    if name not in CHAINS:
        raise ValueError("Unknown optional chain")
    database = f"txs_{name}"
    vhost = f"txs-{name}"
    postgres = compose + ["exec", "-T", "postgres"]
    rabbitmq = compose + ["exec", "-T", "general-rabbitmq", "rabbitmqctl"]
    return [
        postgres + ["dropdb", "-U", "postgres", "--if-exists", "--force", database],
        postgres + ["createdb", "-U", "postgres", database],
        compose + ["exec", "-T", "redis", "redis-cli", "-n", CHAINS[name]["redisDb"], "FLUSHDB"],
        rabbitmq + ["delete_vhost", vhost],
        rabbitmq + ["add_vhost", vhost],
        rabbitmq + ["set_permissions", "-p", vhost, "guest", ".*", ".*", ".*"],
    ]


def project_compose(args, profiles=()):
    return compose_command(args.project, args.env_file.resolve(), profiles)


def state_path(project):
    return ROOT / ".test-runs" / f"{project}.json"


def load_config(compose):
    return json.loads(run(compose + ["config", "--format", "json"]))


def load_manifest(args):
    compose = project_compose(args)
    return compose, public_config(load_config(compose))


def teardown_env():
    return {**UNUSED_PROVIDER, **os.environ}


def start(args):
    compose, manifest = load_manifest(args)
    label = f"label=com.docker.compose.project={args.project}"
    if run(["docker", "volume", "ls", "--quiet", "--filter", label]).strip():
        raise RuntimeError("Project already has state; use status/logs, or reset before a fresh up")
    check_ports(manifest)
    print(f'Starting {args.project} at block {manifest["forkBlock"]}', flush=True)
    seed_fork_cache(anvil_cache_dir())
    run(compose + ["up", "--detach"])
    wait_ready(compose, manifest, args.timeout)
    write_state(state_path(args.project), manifest)
    print(f'Ready: {manifest["gatewayUrl"]}; public manifest: {state_path(args.project)}')


def run_txs_checks(args):
    compose, manifest = load_manifest(args)
    wait_ready(compose, manifest, args.timeout)
    checks = compose + ["run", "--rm", "--no-deps", "txs-checks"] + TXS_CHECKS[args.action]
    sys.exit(subprocess.run(checks, cwd=ROOT).returncode)


def show_config(args):
    print(json.dumps(load_manifest(args)[1], indent=2))


def show_logs(args):
    compose = project_compose(args, CHAINS)
    secrets = fork_urls(load_config(compose))
    logs = run(compose + ["logs", "--no-color", "--tail", args.tail, *args.services])
    print(redact(logs, secrets))


def show_status(args):
    print(run(project_compose(args, CHAINS) + ["ps", "--all"], env=teardown_env()))


def stop(args):
    run(project_compose(args, CHAINS) + ["down"], env=teardown_env())
    print("Environment stopped; reset before starting a new fork")


def reset(args):
    run(project_compose(args, CHAINS) + ["down", "--volumes"], env=teardown_env())
    state_path(args.project).unlink(missing_ok=True)
    print("Environment stopped and owned volumes removed")


def start_chain(args):
    compose = project_compose(args, (args.chain,))
    chain_up(compose, load_config(compose), args.chain, state_path(args.project), args.timeout)


def reset_chain(args):
    chain_reset(project_compose(args, (args.chain,)), args.chain, state_path(args.project))


ACTIONS = {
    "up": start, "down": stop, "reset": reset, "status": show_status, "logs": show_logs,
    "config": show_config, **{action: run_txs_checks for action in TXS_CHECKS},
}
CHAIN_ACTIONS = {"up": start_chain, "reset": reset_chain}


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="Manage the isolated Anvil/Safe backend")
    parser.add_argument("action", nargs="?", default="up", choices=tuple(ACTIONS))
    parser.add_argument("services", nargs="*", help="Services whose logs to print (logs only)")
    parser.add_argument("--project", default=os.environ.get("SAFE_E2E_PROJECT", "safe-e2e-local"))
    parser.add_argument("--env-file", type=Path, default=ROOT / ".env.test")
    parser.add_argument("--timeout", type=int, default=300)
    parser.add_argument("--tail", default="200", help="Log lines per service, or all")
    parser.add_argument("--chain", choices=tuple(CHAINS), help="Add or remove an optional fork")
    args = parser.parse_intermixed_args(argv)
    if args.services and args.action != "logs":
        parser.error("Service names are supported only by logs")
    if args.chain and args.action not in CHAIN_ACTIONS:
        parser.error("--chain supports only up and reset")
    return args


def main():
    args = parse_args()
    (CHAIN_ACTIONS if args.chain else ACTIONS)[args.action](args)


if __name__ == "__main__":
    try:
        main()
    except subprocess.TimeoutExpired:
        print("Error: Docker operation timed out; use status/logs before reset", file=sys.stderr)
        sys.exit(1)
    except (ValueError, RuntimeError, OSError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
