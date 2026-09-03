import type { GridCell, Vec2 } from './types'

export interface MapDef {
  cols: number
  rows: number
  waypoints: GridCell[]
  decor: GridCell[]
}

export const MAP: MapDef = {
  cols: 24,
  rows: 16,
  waypoints: [
    { c: 0, r: 2 },
    { c: 6, r: 2 },
    { c: 6, r: 7 },
    { c: 2, r: 7 },
    { c: 2, r: 12 },
    { c: 10, r: 12 },
    { c: 10, r: 4 },
    { c: 15, r: 4 },
    { c: 15, r: 10 },
    { c: 19, r: 10 },
    { c: 19, r: 3 },
    { c: 22, r: 3 },
    { c: 22, r: 13 },
  ],
  decor: [
    { c: 12, r: 8 },
    { c: 13, r: 8 },
    { c: 4, r: 0 },
    { c: 20, r: 15 },
    { c: 8, r: 14 },
    { c: 17, r: 0 },
    { c: 0, r: 15 },
    { c: 23, r: 8 },
    { c: 5, r: 14 },
  ],
}

export const cellKey = (c: number, r: number): string => `${c}:${r}`

/** Converts a grid cell to the world-space centre of that cell (1 world unit per cell). */
export const cellToWorld = (map: MapDef, cell: GridCell): Vec2 => ({
  x: cell.c - map.cols / 2 + 0.5,
  z: cell.r - map.rows / 2 + 0.5,
})

export const worldToCell = (map: MapDef, pos: Vec2): GridCell => ({
  c: Math.floor(pos.x + map.cols / 2),
  r: Math.floor(pos.z + map.rows / 2),
})

export const isInsideMap = (map: MapDef, cell: GridCell): boolean =>
  cell.c >= 0 && cell.r >= 0 && cell.c < map.cols && cell.r < map.rows

/** Expands corner waypoints into the ordered list of every cell the path crosses. */
export const expandPath = (waypoints: GridCell[]): GridCell[] => {
  const cells: GridCell[] = []
  waypoints.forEach((wp, i) => {
    if (i === 0) {
      cells.push({ ...wp })
      return
    }
    const prev = waypoints[i - 1]
    const dc = Math.sign(wp.c - prev.c)
    const dr = Math.sign(wp.r - prev.r)
    const steps = Math.max(Math.abs(wp.c - prev.c), Math.abs(wp.r - prev.r))
    for (let s = 1; s <= steps; s++) {
      cells.push({ c: prev.c + dc * s, r: prev.r + dr * s })
    }
  })
  return cells
}

export interface PathModel {
  points: Vec2[]
  cumulative: number[]
  length: number
  cells: Set<string>
}

export const buildPathModel = (map: MapDef): PathModel => {
  const points = map.waypoints.map((wp) => cellToWorld(map, wp))
  const cumulative = [0]
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    cumulative.push(cumulative[i - 1] + Math.hypot(b.x - a.x, b.z - a.z))
  }
  const cells = new Set(expandPath(map.waypoints).map((cell) => cellKey(cell.c, cell.r)))
  return { points, cumulative, length: cumulative[cumulative.length - 1], cells }
}

/** Position along the path at a given distance from the spawn, clamped to the endpoints. */
export const pointAlongPath = (path: PathModel, distance: number): Vec2 => {
  const d = Math.max(0, Math.min(distance, path.length))
  let i = 1
  while (i < path.cumulative.length - 1 && path.cumulative[i] < d) i++
  const segStart = path.cumulative[i - 1]
  const segLen = path.cumulative[i] - segStart
  const t = segLen === 0 ? 0 : (d - segStart) / segLen
  const a = path.points[i - 1]
  const b = path.points[i]
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }
}

export const directionAlongPath = (path: PathModel, distance: number): Vec2 => {
  const ahead = pointAlongPath(path, Math.min(distance + 0.05, path.length))
  const here = pointAlongPath(path, Math.max(distance - 0.05, 0))
  const len = Math.hypot(ahead.x - here.x, ahead.z - here.z) || 1
  return { x: (ahead.x - here.x) / len, z: (ahead.z - here.z) / len }
}

export const spawnCell = (map: MapDef): GridCell => map.waypoints[0]
export const vaultCell = (map: MapDef): GridCell => map.waypoints[map.waypoints.length - 1]
