import dynamic from 'next/dynamic'
import styles from '../styles/Home.module.css'

// Dynamicky importujeme Three.js scénu s vypnutým SSR
const DynamicStarScene = dynamic(
  () => import('../components/star-scene'),
  { ssr: false }
)

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.scene}>
        <DynamicStarScene />
      </div>
    </main>
  )
} 