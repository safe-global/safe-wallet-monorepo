import {
  buildPathModel,
  cellKey,
  cellToWorld,
  directionAlongPath,
  expandPath,
  isInsideMap,
  MAP,
  pointAlongPath,
  spawnCell,
  vaultCell,
  worldToCell,
} from '../map'

describe('map', () => {
  it('expands waypoints into a contiguous list of cells', () => {
    const cells = expandPath(MAP.waypoints)
    expect(cells[0]).toEqual(spawnCell(MAP))
    expect(cells[cells.length - 1]).toEqual(vaultCell(MAP))
    for (let i = 1; i < cells.length; i++) {
      const manhattan = Math.abs(cells[i].c - cells[i - 1].c) + Math.abs(cells[i].r - cells[i - 1].r)
      expect(manhattan).toBe(1)
    }
    expect(new Set(cells.map((c) => cellKey(c.c, c.r))).size).toBe(cells.length)
  })

  it('keeps every waypoint and decor cell inside the grid', () => {
    MAP.waypoints.forEach((wp) => expect(isInsideMap(MAP, wp)).toBe(true))
    MAP.decor.forEach((cell) => expect(isInsideMap(MAP, cell)).toBe(true))
    const path = buildPathModel(MAP)
    MAP.decor.forEach((cell) => expect(path.cells.has(cellKey(cell.c, cell.r))).toBe(false))
    expect(isInsideMap(MAP, { c: -1, r: 0 })).toBe(false)
    expect(isInsideMap(MAP, { c: MAP.cols, r: 0 })).toBe(false)
  })

  it('round-trips between cells and world coordinates', () => {
    const cell = { c: 5, r: 9 }
    expect(worldToCell(MAP, cellToWorld(MAP, cell))).toEqual(cell)
    const centre = cellToWorld(MAP, { c: MAP.cols / 2, r: MAP.rows / 2 })
    expect(centre).toEqual({ x: 0.5, z: 0.5 })
  })

  it('interpolates points and directions along the path', () => {
    const path = buildPathModel(MAP)
    expect(path.length).toBeGreaterThan(50)
    expect(pointAlongPath(path, 0)).toEqual(cellToWorld(MAP, spawnCell(MAP)))
    expect(pointAlongPath(path, path.length)).toEqual(cellToWorld(MAP, vaultCell(MAP)))
    expect(pointAlongPath(path, path.length + 10)).toEqual(cellToWorld(MAP, vaultCell(MAP)))
    const start = cellToWorld(MAP, MAP.waypoints[0])
    expect(pointAlongPath(path, 3)).toEqual({ x: start.x + 3, z: start.z })
    expect(directionAlongPath(path, 1)).toEqual({ x: 1, z: 0 })
    const down = directionAlongPath(path, path.cumulative[1] + 1)
    expect(down.x).toBeCloseTo(0)
    expect(down.z).toBeCloseTo(1)
  })
})
