import dynamic from '@/utils/dynamic'

export type { AnalysisGroupCardProps } from '../../components/AnalysisGroupCard/AnalysisGroupCard'

// Not gated: Safe Shield runs on every chain, and its checks use their own flags
const AnalysisGroupCard = dynamic(() =>
  import('../../components/AnalysisGroupCard/AnalysisGroupCard').then((mod) => ({ default: mod.AnalysisGroupCard })),
)

export default AnalysisGroupCard
