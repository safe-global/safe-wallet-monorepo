/**
 * Safe{Defense} – a Warcraft-style 3D tower defense game where Safe security primitives
 * defend the treasury against everyone who ever tried to drain a Safe.
 *
 * The whole feature (three.js included) is code-split behind this dynamic import, so it only
 * ever loads on the /tower-defense route.
 */
import dynamic from 'next/dynamic'

const TowerDefense = dynamic(() => import('./components/TowerDefensePage'), { ssr: false })

export default TowerDefense
