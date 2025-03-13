import dynamic from 'next/dynamic'

const SafenetReview = dynamic(import('./SafenetReview'), { ssr: false })

export default SafenetReview
