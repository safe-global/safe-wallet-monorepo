import type { Difficulty } from './config/types'
import { GameApp } from './GameApp'
import { GameRenderer } from './render/GameRenderer'
import type { FloatingTextClasses } from './render/effects'
import { renderTowerIcons } from './render/icons'

/** Wires the real WebGL renderer, icon renderer and sound engine into a GameApp. */
export const createGameApp = (
  container: HTMLElement,
  difficulty: Difficulty,
  floatingTextClasses: FloatingTextClasses,
): GameApp =>
  new GameApp({
    container,
    difficulty,
    rendererOptions: { floatingTextClasses },
    createRenderer: (el, sim, options) => new GameRenderer(el, sim, options),
    renderIcons: renderTowerIcons,
  })
