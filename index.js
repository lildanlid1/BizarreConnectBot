const bedrock = require('bedrock-protocol')

const HOST = 'lildanlid2.progamer.me'
const PORT = 40280
const USERNAME = 'BizarreConnect'

function startBot() {
  console.log('Starting bot...')

  const client = bedrock.createClient({
    host: HOST,
    port: PORT,
    username: USERNAME,
    offline: true
  })

  let movementInterval = null

  client.on('join', () => {
    console.log('Bot joined server')
  })

  client.on('spawn', () => {
    console.log('Bot spawned')

    // Anti-idle movement loop
    movementInterval = setInterval(() => {
      if (!client.entity) return

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

  function cleanup() {
    if (movementInterval) {
      clearInterval(movementInterval)
      movementInterval = null
    }
  }

  client.on('disconnect', (reason) => {
    console.log('Disconnected:', reason)
    cleanup()
    reconnect()
  })

  client.on('error', (err) => {
    console.log('Error:', err.message)
  })

  function reconnect() {
    console.log('Reconnecting in 5 seconds...')
    setTimeout(startBot, 5000)
  }
}

startBot()
