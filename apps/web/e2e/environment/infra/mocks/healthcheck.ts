/** Compose healthcheck: `healthcheck.ts <port> [TLS server name]` exits 0 when GET /health answers 200. */
import { localRequest } from './http.ts'

const [port, servername] = process.argv.slice(2)
try {
  const reply = await localRequest(Number(port), '/health', { servername })
  process.exitCode = reply.status === 200 ? 0 : 1
} catch (error) {
  console.error(`Health check of port ${port} failed: ${error}`)
  process.exitCode = 1
}
