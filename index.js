const bedrock = require('bedrock-protocol')
const express = require('express')
const app = express()
const WEB_PORT = 3000

// Your Bedrock server config
const SERVER_HOST = 'lildanlid2.progamer.me'
const SERVER_PORT = 40280
const BOT_USERNAME = () => `BizarreConnect_${Math.floor(Math.random() * 10000)}`

let client = null
let movementInterval = null
let restartInterval = null

// Start bot
function startBot() {
  console.log('Starting bot...')

  client = bedrock.createClient({
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: BOT_USERNAME(),
    offline: true
  })

  client.on('join', () => console.log('Bot joined server'))

  client.on('spawn', () => {
    console.log('Bot spawned')

    // Anti-idle loop
    movementInterval = setInterval(() => {
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
    console.log('Disconnected:', reason)
    cleanup()
    reconnect()
  })

  client.on('error', (err) => {
    console.log('Error:', err.message)
    if (err.message.includes('Ping timed out')) {
      console.log('Ping timed out, reconnecting...')
      cleanup()
      reconnect()
    }
  })
}

// Cleanup
function cleanup() {
  if (movementInterval) clearInterval(movementInterval)
  movementInterval = null

  if (client) {
    try { client.close() } catch {}
  }

  client = null
}

// Reconnect
function reconnect() {
  console.log('Reconnecting in 5 seconds...')
  setTimeout(startBot, 5000)
}

// Force restart every 20 minutes
function setupAutoRestart() {
  if (restartInterval) clearInterval(restartInterval)

  restartInterval = setInterval(() => {
    console.log('20 minutes reached. Restarting bot...')
    cleanup()
    startBot()
  }, 20 * 60 * 1000) // 20 minutes
}

// Web interface
app.get('/', (req, res) => {
  res.send(`
    <h1>Bedrock Offline Bot</h1>
    <p>Status: ${client ? '<span style="color:green">Running</span>' : '<span style="color:red">Disconnected/Reconnecting</span>'}</p>
    <p><a href="/restart">Restart Bot</a></p>
  `)
})

// --- HEALTH CHECK ENDPOINT ---
app.get('/healthz', (req, res) => {
  // Returns 200 OK to indicate the Node process and Express are running
  // Optionally includes bot connection status in JSON
  res.status(200).json({
    status: 'ok',
    bot_connected: !!client,
    uptime: process.uptime()
  })
})
// -----------------------------

app.get('/restart', (req, res) => {
  console.log('Restart requested via web interface')
  cleanup()
  startBot()
  res.send('<p>Bot restarting...</p><a href="/">Back</a>')
})

app.listen(WEB_PORT, () => {
  console.log(`Web interface running on http://localhost:${WEB_PORT}`)
})

// Start bot + auto restart timer
startBot()
setupAutoRestart()
