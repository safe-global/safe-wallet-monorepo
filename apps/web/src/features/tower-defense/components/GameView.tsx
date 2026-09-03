import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactElement } from 'react'
import type { Difficulty } from '../game/config/types'
import type { GameController } from '../game/controller'
import type { FloatingTextClasses } from '../game/render/effects'
import { recordScore } from './highScores'
import BuildBar from './hud/BuildBar'
import EndScreen from './hud/EndScreen'
import HelpOverlay from './hud/HelpOverlay'
import Toast from './hud/Toast'
import TopBar from './hud/TopBar'
import TowerPanel from './hud/TowerPanel'
import WavePanel from './hud/WavePanel'
import css from './styles.module.css'

export type CreateController = (
  container: HTMLElement,
  difficulty: Difficulty,
  floatingTextClasses: FloatingTextClasses,
) => Promise<GameController>

/** Default factory: loads three.js and the WebGL renderer only once a game actually starts. */
export const createWebGlController: CreateController = async (container, difficulty, classes) => {
  const { createGameApp } = await import('../game/createGameApp')
  return createGameApp(container, difficulty, classes)
}

interface GameViewProps {
  difficulty: Difficulty
  createController: CreateController
  onExit: () => void
  onRestart: () => void
}

const FLOATING_CLASSES: FloatingTextClasses = {
  base: css.floatingText,
  gold: css.floatGold,
  danger: css.floatDanger,
  info: css.floatInfo,
  bonus: css.floatBonus,
}

const Hud = ({
  controller,
  onExit,
  onRestart,
}: {
  controller: GameController
  onExit: () => void
  onRestart: () => void
}): ReactElement => {
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
  const [helpOpen, setHelpOpen] = useState(false)
  const [isNewBest, setIsNewBest] = useState(false)
  const recorded = useRef(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.code === 'KeyH') setHelpOpen((open) => !open)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const isOver = snapshot.phase === 'won' || snapshot.phase === 'lost'
  useEffect(() => {
    if (!isOver) {
      recorded.current = false
      return
    }
    if (recorded.current) return
    recorded.current = true
    const result = recordScore(snapshot.difficulty, {
      score: snapshot.score,
      wave: snapshot.phase === 'won' ? snapshot.totalWaves : snapshot.wave,
      won: snapshot.phase === 'won',
    })
    setIsNewBest(result.isNewBest)
  }, [isOver, snapshot.difficulty, snapshot.score, snapshot.wave, snapshot.totalWaves, snapshot.phase])

  return (
    <div className={css.hud}>
      <TopBar
        snapshot={snapshot}
        onSpeed={(speed) => controller.setSpeed(speed)}
        onPause={() => controller.togglePause()}
        onMute={() => controller.toggleMute()}
        onBloom={() => controller.toggleBloom()}
        onHelp={() => setHelpOpen((open) => !open)}
        onExit={onExit}
      />
      <WavePanel snapshot={snapshot} onCallWave={() => controller.callNextWave()} />
      {snapshot.selected && (
        <TowerPanel
          selected={snapshot.selected}
          gold={snapshot.gold}
          onUpgrade={() => controller.upgradeSelected()}
          onSell={() => controller.sellSelected()}
          onClose={() => controller.selectTower(null)}
          onTargeting={(mode) => controller.setTargeting(mode)}
        />
      )}
      <BuildBar snapshot={snapshot} onSelect={(id) => controller.setBuildTower(id)} />
      <Toast toast={snapshot.toast} />
      {snapshot.paused && !isOver && <div className={css.pausedBanner}>Paused</div>}
      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
      {isOver && (
        <EndScreen
          snapshot={snapshot}
          isNewBest={isNewBest}
          onRestart={onRestart}
          onMenu={onExit}
          onContinueEndless={snapshot.endless ? undefined : () => controller.continueEndless()}
        />
      )}
    </div>
  )
}

const GameView = ({ difficulty, createController, onExit, onRestart }: GameViewProps): ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [controller, setController] = useState<GameController | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let disposed = false
    let created: GameController | null = null
    createController(container, difficulty, FLOATING_CLASSES)
      .then((instance) => {
        if (disposed) instance.dispose()
        else {
          created = instance
          setController(instance)
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not start the game')
      })
    return () => {
      disposed = true
      created?.dispose()
    }
  }, [createController, difficulty])

  const handleExit = useCallback(() => onExit(), [onExit])

  return (
    <>
      <div ref={containerRef} className={css.canvasHost} data-testid="td-canvas" />
      {error && (
        <div className={css.overlay}>
          <div className={`${css.panel} ${css.overlayCard}`}>
            <div className={css.panelTitle}>WebGL is required to play</div>
            <p className={css.lore}>{error}</p>
            <button type="button" className={css.secondaryButton} onClick={handleExit}>
              Back to menu
            </button>
          </div>
        </div>
      )}
      {controller && <Hud controller={controller} onExit={handleExit} onRestart={onRestart} />}
    </>
  )
}

export default GameView
