import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js'
import { PointerLockControls } from 'https://unpkg.com/three@0.152.2/examples/jsm/controls/PointerLockControls.js'
const canvas = document.getElementById('bg')
const renderer = new THREE.WebGLRenderer({canvas, antialias:true})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(0x87ceeb, 0.0007)
const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.1, 2000)
camera.position.set(0, 40, 80)
const light = new THREE.DirectionalLight(0xffffff, 0.95)
light.position.set(100, 200, 100)
scene.add(light)
const amb = new THREE.AmbientLight(0xffffff, 0.45)
scene.add(amb)
renderer.setClearColor(0x87ceeb)
onWindowResize()
addCrosshair()
window.addEventListener('resize', onWindowResize)
const textures = createBlockTextures()
const BLOCK = { Air:0, Grass:1, Dirt:2, Stone:3, Wood:4 }
const blockInfo = {
  1: {name:'Grass', u:0},
  2: {name:'Dirt', u:1},
  3: {name:'Stone', u:2},
  4: {name:'Wood', u:3}
}
const CHUNK = { sx:32, sy:16, sz:32 }
const world = {}
generateTerrain()
const instanced = createInstancedMeshes()
for (const m of Object.values(instanced)) scene.add(m)
const controls = new PointerLockControls(camera, renderer.domElement)
document.addEventListener('click', ()=>controls.lock())
const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()
const keys = {}
addMovementListeners()
let prevTime = performance.now()
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
renderer.domElement.addEventListener('pointerdown', onPointerDown)
const hotbar = document.querySelectorAll('.slot')
hotbar.forEach(s=>s.addEventListener('click', ()=>{hotbar.forEach(h=>h.classList.remove('selected'));s.classList.add('selected')}))
let selectedBlock = 1
document.addEventListener('keydown', e=>{
  if (e.key>='1' && e.key<='5') {
    const idx = parseInt(e.key) - 0
    document.querySelectorAll('.slot')[idx-1]?.click()
  }
})
setInterval(()=>{selectedBlock = parseInt(document.querySelector('.slot.selected').dataset.id)}, 100)
animate()
function onWindowResize() {
  renderer.setSize(innerWidth, innerHeight)
  camera.aspect = innerWidth/innerHeight
  camera.updateProjectionMatrix()
}
function addCrosshair() {
  const c = document.createElement('div')
  c.className = 'crosshair'
  document.body.appendChild(c)
}
function createBlockTextures() {
  const atlas = document.createElement('canvas')
  atlas.width = 256
  atlas.height = 64
  const ctx = atlas.getContext('2d')
  function p(x,y,w,h,fill) {
    ctx.fillStyle = fill
    ctx.fillRect(x,y,w,h)
  }
  p(0,0,64,64,'#6db84b')
  p(64,0,64,64,'#8b5a2b')
  p(128,0,64,64,'#8a8a8a')
  p(192,0,64,64,'#b97a3c')
  ctx.fillStyle = 'rgba(0,0,0,0.08)'
  for (let i=0;i<12;i++) ctx.fillRect(Math.random()*256,Math.random()*64,2,2)
  const tex = new THREE.CanvasTexture(atlas)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  return tex
}
function generateTerrain() {
  const sx = CHUNK.sx, sz = CHUNK.sz, sy = CHUNK.sy
  for (let x= -sx/2; x<sx/2; x++) {
    for (let z= -sz/2; z<sz/2; z++) {
      const height = Math.floor(6 + 6 * Math.sin((x/6)) + 4 * Math.cos((z/7))) + Math.floor(Math.random()*2)
      for (let y=0; y<sy; y++) {
        const key = `${x},${y},${z}`
        if (y>height) world[key] = BLOCK.Air
        else if (y===height) world[key] = BLOCK.Grass
        else if (y>=height-3) world[key] = BLOCK.Dirt
        else world[key] = BLOCK.Stone
      }
    }
  }
  for (let i=0;i<60;i++) {
    const rx = Math.floor(Math.random()*CHUNK.sx)-CHUNK.sx/2
    const rz = Math.floor(Math.random()*CHUNK.sz)-CHUNK.sz/2
    const ry = Math.floor(Math.random()*6)+8
    for (let h=0;h<4;h++) world[`${rx},${ry+h},${rz}`] = BLOCK.Wood
  }
}
function createInstancedMeshes() {
  const box = new THREE.BoxGeometry(1,1,1)
  const mats = {}
  const meshes = {}
  for (const id of [1,2,3,4]) {
    const mat = new THREE.MeshStandardMaterial({map:textures})
    mat.onBeforeCompile = shader=>{
      shader.uniforms.uAtlas = {value:0}
    }
    mat.transparent = false
    mat.alphaTest = 0.5
    mats[id] = mat
    const inst = new THREE.InstancedMesh(box, mat, CHUNK.sx*CHUNK.sy*CHUNK.sz)
    inst.count = 0
    meshes[id] = inst
  }
  rebuildInstanced(meshes)
  return meshes
}
function rebuildInstanced(meshes) {
  for (const id of Object.keys(meshes)) {
    const inst = meshes[id]
    let idx = 0
    const dummy = new THREE.Object3D()
    for (const key in world) {
      const v = world[key]
      if (v === parseInt(id)) {
        const [x,y,z] = key.split(',').map(Number)
        dummy.position.set(x, y, z)
        dummy.updateMatrix()
        inst.setMatrixAt(idx++, dummy.matrix)
      }
    }
    inst.count = idx
    inst.instanceMatrix.needsUpdate = true
  }
}
function onPointerDown(e) {
  if (document.pointerLockElement !== renderer.domElement) return
  pointer.x = 0
  pointer.y = 0
  raycaster.setFromCamera(pointer, camera)
  const intersects = []
  for (const m of Object.values(instanced)) intersects.push(...raycaster.intersectObject(m))
  intersects.sort((a,b)=>a.distance-b.distance)
  const hit = intersects[0]
  if (!hit) return
  const pos = hit.instanceId != null ? hit.point.clone() : hit.point.clone()
  const normal = hit.face.normal
  const target = new THREE.Vector3().copy(pos).addScaledVector(normal, e.button === 2 ? 0.5 : -0.5).floor().addScalar(0.5)
  const key = `${Math.round(target.x)},${Math.round(target.y)},${Math.round(target.z)}`
  if (e.button === 2) {
    if (selectedBlock !== 0) {
      world[key] = selectedBlock
      rebuildInstanced(instanced)
      showMsg('Placed ' + (blockInfo[selectedBlock]?.name || 'Block'))
    }
  } else {
    if (world[key] && world[key] !== BLOCK.Air) {
      world[key] = BLOCK.Air
      rebuildInstanced(instanced)
      showMsg('Removed block')
    }
  }
}
function addMovementListeners() {
  addEventListener('keydown', e=>keys[e.code]=true)
  addEventListener('keyup', e=>keys[e.code]=false)
  controls.addEventListener('lock', ()=>{})
  controls.addEventListener('unlock', ()=>{})
}
function animate() {
  requestAnimationFrame(animate)
  const time = performance.now()
  const delta = (time - prevTime) / 1000
  velocity.x -= velocity.x * 10.0 * delta
  velocity.z -= velocity.z * 10.0 * delta
  if (keys['KeyW']) velocity.z -= 80.0 * delta
  if (keys['KeyS']) velocity.z += 80.0 * delta
  if (keys['KeyA']) velocity.x -= 80.0 * delta
  if (keys['KeyD']) velocity.x += 80.0 * delta
  controls.moveRight(velocity.x * delta)
  controls.moveForward(velocity.z * delta)
  renderer.render(scene, camera)
  prevTime = time
}
function showMsg(t) {
  const m = document.createElement('div')
  m.className = 'msg'
  m.textContent = t
  const box = document.getElementById('messages')
  box.appendChild(m)
  setTimeout(()=>{m.remove()}, 2200)
}
