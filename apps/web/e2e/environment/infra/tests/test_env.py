import io
import json
import os
import socket
import tempfile
import unittest
import urllib.error
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import Mock, patch

from scripts.test_env import (
    chain_public_config, chain_step_commands, chain_storage_reset_commands, check_ports,
    compose_command, fork_urls, parse_args, provider_urls, public_config, reset, run,
    seed_fork_cache, show_logs, wait_ready,
)

GATEWAY = "http://localhost:8000/cgw"
DECODER = "http://localhost:8000/decoder"
TXS = "http://localhost:8000/txs/api"
SEPOLIA_PROVIDER = "https://sepolia.example/key"
MAINNET_PROVIDER = "https://mainnet.example/key"


def manifest():
    return {
        "rpcUrl": "http://localhost:8545", "chainId": 170, "forkBlock": 100,
        "forkBlockHash": "0xabc", "gatewayUrl": GATEWAY, "decoderUrl": DECODER,
        "transactionServiceUrl": TXS,
    }


def fake_backend(failures=None):
    """Answers readiness reads by RPC method or URL; `failures` lists errors to raise first."""
    responses = {
        "eth_chainId": {"result": "0xaa"},
        "eth_getBlockByNumber": {"result": {"hash": "0xabc"}},
        f"{GATEWAY}/health/ready": {},
        f"{DECODER}/health/ready": {"ready": True},
        f"{GATEWAY}/v1/chains/170": {"chainId": 170},
        f"{GATEWAY}/v2/chains?serviceKey=WALLET_WEB": {
            "results": [{"chainId": "170", "features": ["DELETE_TX"]}],
        },
        f"{TXS}/v1/about/indexing/": {},
    }
    pending = {key: list(errors) for key, errors in (failures or {}).items()}

    def read(url, payload=None):
        key = payload["method"] if payload else url
        if pending.get(key):
            raise pending[key].pop(0)
        return responses[key]

    return Mock(side_effect=read)


class FakeClock:
    def __init__(self):
        self.now = 0.0

    def monotonic(self):
        return self.now

    def sleep(self, seconds):
        self.now += seconds


class EnvironmentTests(unittest.TestCase):
    @patch("scripts.test_env.run", return_value="")
    def test_readiness_retries_socket_timeouts_on_python39(self, _docker):
        backend = fake_backend({"eth_chainId": [socket.timeout("timed out")]})
        clock = FakeClock()
        ready = manifest()
        with patch("scripts.test_env.read_json", backend), patch("scripts.test_env.time", clock):
            wait_ready([], ready, 10)
        backend.assert_any_call(f"{DECODER}/health/ready")
        self.assertEqual(clock.now, 2)
        self.assertEqual(ready["forkBlockHash"], "0xabc")

    @patch("scripts.test_env.run", return_value="")
    def test_readiness_timeout_reports_the_last_error(self, _docker):
        refused = [urllib.error.URLError("connection refused")] * 10
        backend = fake_backend({f"{GATEWAY}/health/ready": refused})
        with patch("scripts.test_env.read_json", backend), patch("scripts.test_env.time", FakeClock()):
            with self.assertRaisesRegex(RuntimeError, "after 6s.*URLError.*connection refused"):
                wait_ready([], manifest(), 6)

    def test_occupied_port_fails_before_starting_services(self):
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            port = listener.getsockname()[1]
            with self.assertRaisesRegex(RuntimeError, "already in use"):
                check_ports({"rpcUrl": f"http://localhost:{port}"})

    def test_cleanup_cannot_target_normal_infrastructure_project(self):
        for project in ("safe-infrastructure", "default", "../safe-e2e-a", "safe-e2e-a;rm"):
            with self.subTest(project=project), self.assertRaises(ValueError):
                compose_command(project, Path("missing.env"))

    def test_local_env_overrides_image_defaults_without_shell_sourcing(self):
        path = Path(__file__)
        command = compose_command("safe-e2e-test", path)
        self.assertEqual(command.count("--env-file"), 2)
        self.assertLess(command.index(str(path)), command.index("-f"))
        self.assertIn("safe-e2e-test", command)

    def test_public_manifest_omits_upstream_provider_credentials(self):
        services = {
            "fork-rpc": {"environment": {"FORK_BLOCK_NUMBER": "100"}},
            "anvil": {
                "ports": [{"published": "8545"}],
                "command": ["--fork-url", "https://secret.example/key"],
            },
            "nginx": {"ports": [{"published": "8000"}]},
            "txs-init": {"environment": {"FORK_CHAIN_ID": "11155111"}},
        }
        for service in services.values():
            service["image"] = "pinned-image"
        result = public_config({"services": services})
        self.assertNotIn("secret", str(result))
        self.assertEqual(result["gatewayUrl"], GATEWAY)
        self.assertEqual(result["forkBlock"], 100)

    @patch("scripts.test_env.subprocess.run")
    def test_docker_failures_name_the_subcommand_and_redact_providers(self, process):
        lines = ["first-line"] + [f"progress {index}" for index in range(25)]
        lines.append(f"error from {SEPOLIA_PROVIDER}")
        process.return_value = Mock(returncode=1, stderr="\n".join(lines))
        command = compose_command("safe-e2e-test", Path("missing.env")) + ["up", "--detach"]
        with patch.dict(os.environ, {"SEPOLIA_FORK_RPC_URL": SEPOLIA_PROVIDER}):
            with self.assertRaises(RuntimeError) as error:
                run(command)
        message = str(error.exception)
        self.assertIn("docker compose up", message)
        self.assertIn("error from <fork-provider>", message)
        self.assertIn("progress 24", message)
        self.assertNotIn("first-line", message)
        self.assertNotIn(SEPOLIA_PROVIDER, message)

    def test_provider_urls_include_the_local_env_file(self):
        with tempfile.TemporaryDirectory() as directory:
            env_file = Path(directory) / ".env.test"
            env_file.write_text(f"FORK_RPC_URL_POLYGON='{MAINNET_PROVIDER}'\nRPC_PORT=8545\n")
            with patch.dict(os.environ, {}, clear=True):
                self.assertEqual(provider_urls(env_file), [MAINNET_PROVIDER])

    def chain_config(self, fork_url):
        return {"services": {
            "anvil-mainnet": {
                "ports": [{"published": "8547"}],
                "command": ["--fork-url", "http://fork-upstream-mainnet:8546"],
            },
            "fork-upstream-mainnet": {"environment": {"FORK_UPSTREAM_URL": fork_url}},
            "txs-init-mainnet": {"environment": {
                "FORK_CHAIN_ID": "1", "FORK_BLOCK_NUMBER": "26083334", "FORK_BLOCK_HASH": "0xc33d",
            }},
            "nginx": {"ports": [{"published": "8000"}]},
        }}

    def test_chain_manifest_omits_provider_credentials(self):
        chain = chain_public_config(self.chain_config("https://secret.example/key"), "mainnet")
        self.assertNotIn("secret", str(chain))
        self.assertEqual(chain["rpcUrl"], "http://localhost:8547")
        self.assertEqual(chain["transactionServiceUrl"], "http://localhost:8000/txs-mainnet/api")
        self.assertEqual((chain["chainId"], chain["forkBlock"]), (1, 26083334))

    def test_chain_without_provider_url_fails_before_starting(self):
        with self.assertRaisesRegex(ValueError, "FORK_RPC_URL_MAINNET"):
            chain_public_config(self.chain_config(""), "mainnet")

    def test_chain_start_never_reruns_sepolia_jobs(self):
        commands = chain_step_commands(["compose"], "polygon")
        services = [command[-1] for command in commands]
        self.assertTrue(all("polygon" in " ".join(command[1:]) for command in commands))
        for command in commands:
            self.assertIn("--no-deps", command)
        one_shot = [command[-1] for command in commands if command[1] == "run"]
        self.assertEqual(
            one_shot,
            ["anvil-init-polygon", "txs-init-polygon", "cfg-chain-polygon", "decoder-chain-polygon"],
        )
        self.assertLess(services.index("anvil-init-polygon"), services.index("txs-init-polygon"))

    def test_logs_redact_every_fork_provider(self):
        config = {"services": {
            "anvil": {"command": ["--fork-url", "http://fork-upstream:8546"]},
            "fork-upstream": {"environment": {"FORK_UPSTREAM_URL": SEPOLIA_PROVIDER}},
            "fork-upstream-mainnet": {"environment": {"FORK_UPSTREAM_URL": MAINNET_PROVIDER}},
            "fork-upstream-polygon": {"environment": {"FORK_UPSTREAM_URL": ""}},
            "anvil-init-mainnet": {"environment": {}},
        }}
        self.assertEqual(fork_urls(config), [SEPOLIA_PROVIDER, MAINNET_PROVIDER])

    def test_logs_of_selected_services_are_redacted(self):
        config = {"services": {
            "fork-upstream": {"environment": {"FORK_UPSTREAM_URL": SEPOLIA_PROVIDER}},
            "fork-upstream-mainnet": {"environment": {"FORK_UPSTREAM_URL": MAINNET_PROVIDER}},
        }}
        requested = []

        def docker(command, env=None):
            if "config" in command:
                return json.dumps(config)
            requested.append(command[command.index("logs"):])
            return f"cgw-web | {SEPOLIA_PROVIDER} failed\ntxs-web | {MAINNET_PROVIDER} ok\n"

        args = parse_args(["logs", "cgw-web", "txs-web", "--tail", "all", "--project", "safe-e2e-t"])
        output = io.StringIO()
        with patch("scripts.test_env.run", side_effect=docker), redirect_stdout(output):
            show_logs(args)
        self.assertEqual(requested, [["logs", "--no-color", "--tail", "all", "cgw-web", "txs-web"]])
        self.assertEqual(output.getvalue().count("<fork-provider>"), 2)
        self.assertNotIn("example", output.getvalue())

    def test_reset_works_without_a_fork_provider(self):
        calls = []

        def docker(command, env=None):
            calls.append((command, env))
            return ""

        args = parse_args(["reset", "--project", "safe-e2e-unit-test"])
        with patch.dict(os.environ, {}, clear=True), redirect_stdout(io.StringIO()):
            with patch("scripts.test_env.run", side_effect=docker):
                reset(args)
        [(command, env)] = calls
        self.assertEqual(command[-2:], ["down", "--volumes"])
        self.assertTrue(env["SEPOLIA_FORK_RPC_URL"])

    def test_seeds_the_committed_fork_cache_without_replacing_extended_files(self):
        with tempfile.TemporaryDirectory() as committed, tempfile.TemporaryDirectory() as cache:
            committed, cache = Path(committed), Path(cache)
            for chain, content in (("sepolia", b"committed sepolia"), ("mainnet", b"committed mainnet")):
                (committed / chain / "100").mkdir(parents=True)
                (committed / chain / "100" / "storage-ab.json").write_bytes(content)
            (cache / "mainnet" / "100").mkdir(parents=True)
            (cache / "mainnet" / "100" / "storage-ab.json").write_bytes(b"extended by a run")
            seed_fork_cache(cache, committed)
            sepolia = cache / "sepolia" / "100" / "storage-ab.json"
            self.assertEqual(sepolia.read_bytes(), b"committed sepolia")
            mainnet = cache / "mainnet" / "100" / "storage-ab.json"
            self.assertEqual(mainnet.read_bytes(), b"extended by a run")
            for path in (cache, cache / "sepolia", cache / "sepolia" / "100"):
                self.assertEqual(path.stat().st_mode & 0o777, 0o777)
            self.assertEqual(sepolia.stat().st_mode & 0o666, 0o666)

    def test_seeding_without_a_committed_cache_does_nothing(self):
        with tempfile.TemporaryDirectory() as empty, tempfile.TemporaryDirectory() as cache:
            seed_fork_cache(Path(cache), Path(empty) / "missing")
            self.assertEqual(list(Path(cache).iterdir()), [])

    def test_chain_reset_preserves_other_databases_caches_and_event_broker(self):
        commands = chain_storage_reset_commands(["compose"], "polygon")
        self.assertEqual(commands[0][-1], "txs_polygon")
        self.assertEqual(commands[1][-1], "txs_polygon")
        self.assertEqual(commands[2][-3:], ["-n", "5", "FLUSHDB"])
        self.assertTrue(all("txs-polygon" in command for command in commands[3:]))
        self.assertFalse(any("FLUSHALL" in command or "down" in command for command in commands))
        with self.assertRaises(ValueError):
            chain_storage_reset_commands(["compose"], "sepolia")


if __name__ == "__main__":
    unittest.main()
