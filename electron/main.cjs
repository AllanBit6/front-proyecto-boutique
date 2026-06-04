const fs = require("node:fs")
const http = require("node:http")
const https = require("node:https")
const path = require("node:path")
const { app, BrowserWindow, shell } = require("electron")

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)
const distPath = path.join(__dirname, "..", "dist")
const envPath = path.join(__dirname, "..", ".env")
const apiTarget = readEnvValue("VITE_API_TARGET") || "http://localhost:3000"

let staticServer

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
])

function readEnvValue(key) {
  if (process.env[key]) {
    return process.env[key]
  }

  if (!fs.existsSync(envPath)) {
    return ""
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/)
  const prefix = `${key}=`
  const line = lines.find((item) => item.trim().startsWith(prefix))

  if (!line) {
    return ""
  }

  return line.trim().slice(prefix.length).replace(/^["']|["']$/g, "")
}

function createWindow(startUrl) {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    title: "POS Boutique",
    backgroundColor: "#ffffff",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.loadURL(startUrl)

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })

  if (isDev) {
    win.webContents.openDevTools({ mode: "detach" })
  }
}

function isApiRequest(requestUrl) {
  const url = new URL(requestUrl, "http://localhost")

  return url.pathname === "/api" || url.pathname.startsWith("/api/")
}

function proxyApiRequest(request, response) {
  const target = new URL(request.url || "/", apiTarget)
  const transport = target.protocol === "https:" ? https : http
  const headers = {
    ...request.headers,
    host: target.host,
  }

  const proxyRequest = transport.request(
    target,
    {
      method: request.method,
      headers,
    },
    (proxyResponse) => {
      response.writeHead(
        proxyResponse.statusCode || 500,
        proxyResponse.statusMessage,
        proxyResponse.headers
      )
      proxyResponse.pipe(response)
    }
  )

  proxyRequest.on("error", () => {
    response.statusCode = 502
    response.end("No se pudo conectar con la API.")
  })

  request.pipe(proxyRequest)
}

function resolveStaticPath(requestUrl) {
  const url = new URL(requestUrl, "http://localhost")
  const decodedPath = decodeURIComponent(url.pathname)
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1)
  const requestedPath = path.normalize(path.join(distPath, relativePath))

  if (!requestedPath.startsWith(distPath)) {
    return path.join(distPath, "index.html")
  }

  if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
    return requestedPath
  }

  return path.join(distPath, "index.html")
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    staticServer = http.createServer((request, response) => {
      if (isApiRequest(request.url || "/")) {
        proxyApiRequest(request, response)
        return
      }

      const filePath = resolveStaticPath(request.url || "/")
      const extension = path.extname(filePath)

      response.setHeader(
        "Content-Type",
        mimeTypes.get(extension) || "application/octet-stream"
      )

      fs.createReadStream(filePath)
        .on("error", () => {
          response.statusCode = 500
          response.end("No se pudo cargar la aplicacion.")
        })
        .pipe(response)
    })

    staticServer.once("error", reject)
    staticServer.listen(0, "localhost", () => {
      const address = staticServer.address()

      if (!address || typeof address === "string") {
        reject(new Error("No se pudo iniciar el servidor local."))
        return
      }

      resolve(`http://localhost:${address.port}`)
    })
  })
}

app.whenReady().then(async () => {
  const startUrl = isDev
    ? process.env.VITE_DEV_SERVER_URL
    : await startStaticServer()

  createWindow(startUrl)

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(startUrl)
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("before-quit", () => {
  staticServer?.close()
})
