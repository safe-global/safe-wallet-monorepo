import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import css from './styles.module.css'

type Star = {
  id: string
  size: number
  positionX: number
  positionY: number
  duration: number
}
const StarAnimation = () => {
  const [stars, setStars] = useState<Star[]>([])

  useEffect(() => {
    const newStars = Array.from({ length: 80 }, () => {
      const id = Math.random().toString(36).substr(2, 9)
      const size = Math.random() * 50 + 30
      const positionX = Math.random() * window.innerWidth * (Math.floor(Math.random() * 3) * -1 || 1)
      const positionY = Math.random() * 2 * -700
      const duration = ((window.innerHeight - positionY) / window.innerHeight) * 2.5
      return { id, size, positionX, positionY, duration }
    })

    setStars(newStars)
  }, [])
  return (
    // <div className={css['animation-container']}>
    <>
      {stars.map((star) => (
        <motion.svg
          key={star.id}
          className={css.star}
          initial={{ y: star.positionY, opacity: 1 }}
          animate={{ y: window.innerHeight + 100, rotate: 360 }}
          transition={{ duration: star.duration, ease: 'linear' }}
          style={{ width: star.size, left: star.positionX }}
          viewBox="0 0 37 42"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15.6524 0.336315C15.8462 0.148798 16.1538 0.148798 16.3476 0.336315L19.7798 3.65654C19.8906 3.76377 20.0447 3.81385 20.1974 3.79225L24.9256 3.12347C25.1927 3.0857 25.4415 3.26652 25.4881 3.53215L26.3132 8.23561C26.3398 8.38751 26.4351 8.51862 26.5713 8.5909L30.7896 10.829C31.0279 10.9554 31.1229 11.248 31.0045 11.4903L28.9073 15.7804C28.8396 15.919 28.8396 16.081 28.9073 16.2196L31.0045 20.5097C31.1229 20.752 31.0279 21.0446 30.7896 21.171L26.5713 23.4091C26.4351 23.4814 26.3398 23.6125 26.3132 23.7644L25.4881 28.4678C25.4415 28.7335 25.1927 28.9143 24.9256 28.8765L20.1974 28.2078C20.0447 28.1862 19.8906 28.2362 19.7798 28.3435L16.3476 31.6637C16.1538 31.8512 15.8462 31.8512 15.6524 31.6637L12.2202 28.3435C12.1094 28.2362 11.9553 28.1862 11.8026 28.2078L7.07437 28.8765C6.80733 28.9143 6.55846 28.7335 6.51186 28.4678L5.68681 23.7644C5.66017 23.6125 5.56491 23.4814 5.42868 23.4091L1.21038 21.171C0.972141 21.0446 0.87708 20.752 0.99552 20.5097L3.09266 16.2196C3.16039 16.081 3.16039 15.919 3.09266 15.7804L0.99552 11.4903C0.87708 11.248 0.972141 10.9554 1.21038 10.829L5.42868 8.5909C5.56491 8.51862 5.66017 8.38751 5.68681 8.23561L6.51186 3.53215C6.55846 3.26652 6.80733 3.0857 7.07437 3.12347L11.8026 3.79225C11.9553 3.81385 12.1094 3.76377 12.2202 3.65654L15.6524 0.336315Z"
            fill="#FF0420"
          />
        </motion.svg>
      ))}
    </>
  )
}

export default StarAnimation
