const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const TILE_SIZE = 48
const colors = {
  0: null,
  1: '#6db84b',
  2: '#8b5a2b'
  3: '#808080'
}

fetch('world.json')
  .then(res => res.json())
  .then(world => {
    drawWorld(world)
  })

function drawWorld(world) {
  ctx.clearRect(0,0,canvas.width,canvas.height)
  for (let y=0; y<world.length; y++) {
    for (let x=0; x<world[y].length; x++) {
      const tile = world[y][x]
      if (tile !== 0) {
        ctx.fillStyle = colors[tile]
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        ctx.strokeStyle = '#000'
        ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      }
    }
  }
}
