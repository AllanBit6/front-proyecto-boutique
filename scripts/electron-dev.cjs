const http = require("node:http")
const { spawn } = require("node:child_process")
const electronPath = require("electron")

const devServerUrl = "http://localhost:5173"
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm"

function spawnProcess(command, args, options = {}) {
  return spawn(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  })
}

function waitForServer(url, timeoutMs = 30_000) {
  const startedAt = Date.now()

  return new Promise((resolve, reject) => {
    function attempt() {
      const request = http.get(url, (response) => {
        response.resume()
        resolve()
      })

      request.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Vite no respondio en ${url}.`))
          return
        }

        setTimeout(attempt, 300)
      })
    }

    attempt()
  })
}

async function main() {
  const vite = spawnProcess(npmCommand, [
    "run",
    "dev",
    "--",
    "--host",
    "localhost",
    "--strictPort",
  ])

  try {
    await waitForServer(devServerUrl)
  } catch (error) {
    vite.kill()
    throw error
  }

  const electronEnv = {
    ...process.env,
    VITE_DEV_SERVER_URL: devServerUrl,
  }

  delete electronEnv.ELECTRON_RUN_AS_NODE

  const electron = spawnProcess(electronPath, ["."], {
    env: electronEnv,
  })

  electron.on("exit", (code) => {
    vite.kill()
    process.exit(code ?? 0)
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
