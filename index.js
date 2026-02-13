const bedrock = require('bedrock-protocol')
const express = require('express')
const app = express()
const WEB_PORT = 3000

// ---- SERVERS ----
const SERVERS = [
  {
    name: 'BizarrePvP',
    host: 'lildanlid4.progamer.me',
    port: 48962
  },
  {
    name: 'BizarreConnect',
    host: 'lildanlid2.progamer.me',
    port: 40280
  }
]

const bots = {}

// Create random username per bot
function generateUsername(prefix) {
  return `${prefix}_${Math.floor(Math.random() * 10000)}`
}

// Start a bot
function startBot(server) {
  console.log(`[${server.name}] Starting bot...`)

  const client = bedrock.createClient({
    host: server.host,
    port: server.port,
    username: generateUsername(server.name),
    offline: true
  })

  bots[server.name] = {
    client,
    movementInterval: null
  }

  client.on('join', () => {
    console.log(`[${server.name}] Joined server`)
  })

  client.on('spawn', () => {
    console.log(`[${server.name}] Spawned`)

    // Anti-idle loop
    bots[server.name].movementInterval = setInterval(() => {
      if (!client?.entity) return

      client.queue('player_auth_input', {
        pitch: 0,
        yaw: 0,
        position: client.entity.position,
        move_vector: { x: 0, z: 0 },
        head_yaw: 0,
        input_data: 0,
        input_mode: 1,
        play_mode: 0,
        tick: 0,
        delta: { x: 0, y: 0, z: 0 }
      })
    }, 3000)
  })

  client.on('disconnect', (reason) => {
    console.log(`[${server.name}] Disconnected:`, reason)
    cleanupBot(server.name)
    reconnectBot(server)
  })

  client.on('error', (err) => {
    console.log(`[${server.name}] Error:`, err.message)
    cleanupBot(server.name)
    reconnectBot(server)
  })
}

// Cleanup one bot
function cleanupBot(name) {
  const bot = bots[name]
  if (!bot) return

  if (bot.movementInterval)
    clearInterval(bot.movementInterval)

  try {
    bot.client?.close()
  } catch {}

  bots[name] = null
}

// Reconnect one bot
function reconnectBot(server) {
  console.log(`[${server.name}] Reconnecting in 5 seconds...`)
  setTimeout(() => startBot(server), 5000)
}

// Restart all bots
function restartAllBots() {
  console.log('Restarting all bots...')
  SERVERS.forEach(server => {
    cleanupBot(server.name)
    startBot(server)
  })
}

// Auto restart every 20 minutes
setInterval(() => {
  console.log('20 minutes reached. Restarting all bots...')
  restartAllBots()
}, 20 * 60 * 1000)


// ---------------- WEB PANEL ----------------

app.get('/', (req, res) => {
  let statusHtml = ''

  SERVERS.forEach(server => {
    const connected = bots[server.name]?.client
    statusHtml += `
      <p>${server.name}: 
      ${connected 
        ? '<span style="color:green">Running</span>' 
        : '<span style="color:red">Disconnected</span>'}
      </p>`
  })

  res.send(`
    <h1>Bedrock Multi Bot</h1>
    ${statusHtml}
    <p><a href="/restart">Restart All Bots</a></p>
  `)
})

app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    bots: Object.keys(bots),
    uptime: process.uptime()
  })
})

app.get('/restart', (req, res) => {
  restartAllBots()
  res.send('<p>All bots restarting...</p><a href="/">Back</a>')
})

app.listen(WEB_PORT, () => {
  console.log(`Web interface running on http://localhost:${WEB_PORT}`)
})

// ---- START BOTH BOTS ----
SERVERS.forEach(server => startBot(server))
