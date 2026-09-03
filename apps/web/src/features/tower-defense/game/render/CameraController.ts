import * as THREE from 'three'

export interface CameraBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

const MIN_DISTANCE = 9
const MAX_DISTANCE = 42
const MIN_PITCH = 0.5
const MAX_PITCH = 1.4
const PAN_SPEED = 14
const ROTATE_SPEED = 1.8

/** Warcraft-style RTS camera: orbit with right drag, pan with WASD/arrows/middle drag, zoom with wheel. */
export class CameraController {
  readonly camera: THREE.PerspectiveCamera
  readonly target = new THREE.Vector3(0, 0, 0)
  yaw = -0.35
  pitch = 0.98
  distance = 24
  readonly keys = new Set<string>()
  private drag: { button: number; x: number; y: number; moved: number } | null = null
  private readonly bounds: CameraBounds
  private readonly forward = new THREE.Vector3()
  private readonly right = new THREE.Vector3()

  constructor(aspect: number, bounds: CameraBounds) {
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.5, 200)
    this.bounds = bounds
    this.apply()
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }

  /** Returns true when the pointer moved enough during a drag to count as camera movement, not a click. */
  wasDragging(): boolean {
    return (this.drag?.moved ?? 0) > 6
  }

  pointerDown(button: number, x: number, y: number): void {
    if (button === 1 || button === 2) this.drag = { button, x, y, moved: 0 }
  }

  pointerMove(x: number, y: number, shift: boolean): void {
    if (!this.drag) return
    const dx = x - this.drag.x
    const dy = y - this.drag.y
    this.drag.x = x
    this.drag.y = y
    this.drag.moved += Math.abs(dx) + Math.abs(dy)
    if (this.drag.button === 2 && !shift) {
      this.yaw -= dx * 0.006
      this.pitch = THREE.MathUtils.clamp(this.pitch + dy * 0.005, MIN_PITCH, MAX_PITCH)
    } else {
      const scale = this.distance * 0.0016
      this.pan(-dx * scale, dy * scale)
    }
    this.apply()
  }

  pointerUp(): boolean {
    const dragged = this.wasDragging()
    this.drag = null
    return dragged
  }

  wheel(deltaY: number): void {
    this.distance = THREE.MathUtils.clamp(this.distance * (1 + deltaY * 0.0011), MIN_DISTANCE, MAX_DISTANCE)
    this.apply()
  }

  private pan(dxRight: number, dzForward: number): void {
    this.forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
    this.right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw))
    this.target.addScaledVector(this.right, dxRight)
    this.target.addScaledVector(this.forward, dzForward)
    this.target.x = THREE.MathUtils.clamp(this.target.x, this.bounds.minX, this.bounds.maxX)
    this.target.z = THREE.MathUtils.clamp(this.target.z, this.bounds.minZ, this.bounds.maxZ)
  }

  update(dt: number): void {
    const speed = PAN_SPEED * dt * (this.distance / 24)
    let dx = 0
    let dz = 0
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dz += speed
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dz -= speed
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dx -= speed
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx += speed
    if (dx !== 0 || dz !== 0) this.pan(dx, dz)
    if (this.keys.has('KeyQ')) this.yaw += ROTATE_SPEED * dt
    if (this.keys.has('KeyE')) this.yaw -= ROTATE_SPEED * dt
    this.apply()
  }

  focus(x: number, z: number): void {
    this.target.set(x, 0, z)
    this.apply()
  }

  apply(): void {
    const horizontal = Math.cos(this.pitch) * this.distance
    this.camera.position.set(
      this.target.x + Math.sin(this.yaw) * horizontal,
      this.target.y + Math.sin(this.pitch) * this.distance,
      this.target.z + Math.cos(this.yaw) * horizontal,
    )
    this.camera.lookAt(this.target)
  }
}
