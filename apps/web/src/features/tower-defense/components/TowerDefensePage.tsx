import { useEffect, useState, type ReactElement } from 'react'
import type { Difficulty } from '../game/config/types'
import GameView, { createWebGlController, type CreateController } from './GameView'
import { loadBestScores, type BestScores } from './highScores'
import StartScreen from './hud/StartScreen'
import css from './styles.module.css'

interface TowerDefensePageProps {
  createController?: CreateController
}

interface Session {
  difficulty: Difficulty
  run: number
}

/** Full-viewport Safe{Defense} game: start screen, then the 3D game with its HUD. */
const TowerDefensePage = ({ createController = createWebGlController }: TowerDefensePageProps): ReactElement => {
  const [session, setSession] = useState<Session | null>(null)
  const [best, setBest] = useState<BestScores>({})

  useEffect(() => {
    setBest(loadBestScores())
  }, [session])

  return (
    <div className={css.root} data-testid="td-root">
      {session ? (
        <GameView
          key={`${session.difficulty}-${session.run}`}
          difficulty={session.difficulty}
          createController={createController}
          onExit={() => setSession(null)}
          onRestart={() => setSession({ difficulty: session.difficulty, run: session.run + 1 })}
        />
      ) : (
        <StartScreen best={best} onStart={(difficulty) => setSession({ difficulty, run: 1 })} />
      )}
    </div>
  )
}

export default TowerDefensePage
