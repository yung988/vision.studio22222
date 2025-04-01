import dynamic from 'next/dynamic'
import WebGLErrorBoundary from '../components/WebGLErrorBoundary'

// Import 3D scény bez SSR
const StarScene = dynamic(
  () => import('../components/star-scene'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        Načítání 3D scény...
      </div>
    )
  }
)

export default function Home() {
  return (
    <main style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      background: 'black'
    }}>
      <div style={{ width: '100%', height: '100%' }}>
        <WebGLErrorBoundary>
          <StarScene />
        </WebGLErrorBoundary>
      </div>
    </main>
  )
} 