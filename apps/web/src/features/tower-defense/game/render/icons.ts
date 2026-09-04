import * as THREE from 'three'
import type { TowerId } from '../config/types'
import { TOWER_ORDER, TOWERS } from '../config/towers'
import { buildTowerModel } from './towerMeshes'

const ICON_SIZE = 128

/** Renders every tower model once into a small offscreen canvas and returns data URLs for the build bar. */
export const renderTowerIcons = (): Record<TowerId, string> => {
  const icons = Object.fromEntries(TOWER_ORDER.map((id) => [id, ''])) as Record<TowerId, string>
  let renderer: THREE.WebGLRenderer | null = null
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setSize(ICON_SIZE, ICON_SIZE, false)
    renderer.setPixelRatio(1)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    const scene = new THREE.Scene()
    scene.add(new THREE.HemisphereLight(0xbfe8d6, 0x101412, 1.2))
    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(2, 4, 3)
    scene.add(key)
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20)
    camera.position.set(1.9, 2.1, 2.4)
    camera.lookAt(0, 0.75, 0)
    for (const id of TOWER_ORDER) {
      const model = buildTowerModel(TOWERS[id], 1)
      model.head.rotation.y = -0.6
      scene.add(model.group)
      renderer.render(scene, camera)
      icons[id] = renderer.domElement.toDataURL('image/png')
      scene.remove(model.group)
    }
  } catch {
    // WebGL unavailable (e.g. tests) – icons stay empty and the HUD falls back to text.
  } finally {
    renderer?.dispose()
  }
  return icons
}
