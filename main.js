const INV_ROWS = 10
const INV_COLS = 4
let inventory = Array.from({ length: INV_ROWS }, () =>
  Array.from({ length: INV_COLS }, () => ({ id: 0, count: 0 }))
)

let crafting = Array.from({ length: 3 }, () =>
  Array.from({ length: 3 }, () => ({ id: 0, count: 0 }))
)

let craftingResult = { id: 0, count: 0 }
let selectedHotbarSlot = 0

function renderHotbar() {
  const hotbar = document.getElementById('hotbar')
  hotbar.innerHTML = ''
  for (let x = 0; x < 10; x++) {
    const item = inventory[0][x]
    const div = document.createElement('div')
    div.className = 'slot' + (x === selectedHotbarSlot ? ' selected' : '')
    div.innerText = item.id ? `${blockInfo[item.id].name} (${item.count})` : ''
    hotbar.appendChild(div)
  }
}

function renderInventory() {
  const invGrid = document.getElementById('inventory-grid')
  invGrid.innerHTML = ''
  for (let y = 0; y < INV_ROWS; y++) {
    for (let x = 0; x < INV_COLS; x++) {
      const item = inventory[y][x]
      const div = document.createElement('div')
      div.className = 'slot'
      div.innerText = item.id ? `${blockInfo[item.id].name} (${item.count})` : ''
      invGrid.appendChild(div)
    }
  }
}

function renderCrafting() {
  const grid = document.getElementById('crafting-grid')
  grid.innerHTML = ''
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      const item = crafting[y][x]
      const div = document.createElement('div')
      div.className = 'slot'
      div.innerText = item.id ? `${blockInfo[item.id].name} (${item.count})` : ''
      grid.appendChild(div)
    }
  }

  const resultDiv = document.getElementById('crafting-result')
  resultDiv.innerText = craftingResult.id ? `${blockInfo[craftingResult.id].name} (${craftingResult.count})` : ''
}

function toggleInventory() {
  const invUI = document.getElementById('inventory-container')
  const isHidden = invUI.style.display === 'none'
  invUI.style.display = isHidden ? 'flex' : 'none'
}

window.addEventListener('keydown', e => {
  if (e.code === 'Tab') {
    e.preventDefault()
    toggleInventory()
  }
  if (e.key >= '1' && e.key <= '9') {
    selectedHotbarSlot = parseInt(e.key) - 1
    renderHotbar()
  }
})

renderHotbar()
renderInventory()
renderCrafting()
