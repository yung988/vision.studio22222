"use client"

import * as THREE from "three"
import { useRef, useMemo, Suspense, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Physics, RigidBody, BallCollider } from "@react-three/rapier"
import type { RapierRigidBody } from '@react-three/rapier'
import { 
  useGLTF, 
  Environment, 
  PerspectiveCamera,
  Html,
  useProgress,
  MeshTransmissionMaterial
} from "@react-three/drei"

// Komponenta pro loading screen
function LoadingScreen() {
  const { progress } = useProgress()
  
  return (
    <Html center>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        padding: '20px',
        borderRadius: '10px',
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ marginBottom: '10px' }}>Načítání modelů...</div>
        <div style={{ 
          width: '200px', 
          height: '6px', 
          background: '#333', 
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${progress}%`, 
            height: '100%', 
            background: 'white', 
            borderRadius: '3px'
          }} />
        </div>
        <div style={{ marginTop: '5px' }}>{progress.toFixed(0)}%</div>
      </div>
    </Html>
  )
}

// Zjednodušený model - konektor
function Connector({ position, radius = 0.3, color = "#1155ff", accent = false }) {
  const ref = useRef<THREE.Mesh>(null)
  
  return (
    <mesh position={position} ref={ref} castShadow receiveShadow>
      <boxGeometry args={[radius, radius, radius]} />
      <meshStandardMaterial 
        color={color} 
        metalness={0.7} 
        roughness={0.1} 
        emissive={accent ? color : undefined}
        emissiveIntensity={accent ? 0.5 : 0}
      />
    </mesh>
  )
}

// Trubka spojující konektory
function Tube({ start, end, radius = 0.1, color = "#1155ff" }) {
  const ref = useRef<THREE.Mesh>(null)
  
  // Výpočet středu, délky a rotace
  const position = useMemo(() => {
    return new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
  }, [start, end])
  
  const length = useMemo(() => {
    return start.distanceTo(end)
  }, [start, end])
  
  const rotation = useMemo(() => {
    const direction = new THREE.Vector3().subVectors(end, start).normalize()
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
    const euler = new THREE.Euler().setFromQuaternion(quaternion)
    return [euler.x, euler.y, euler.z]
  }, [start, end])
  
  return (
    <mesh position={position} rotation={rotation} ref={ref} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, length, 8, 1]} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.1} />
    </mesh>
  )
}

// Skleněná hvězda
function GlassStar({ position, scale = 0.6, color = "#4060ff" }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <MeshTransmissionMaterial
          samples={2}
          thickness={0.5}
          chromaticAberration={0.02}
          transmission={0.95}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={2}
          color={color}
          distortion={0.1}
          temporalDistortion={0.1}
          metalness={0.1}
          roughness={0.1}
          ior={1.5}
        />
      </mesh>
    </group>
  )
}

// Přízková hvězda - podobná obrázku
function ConnectorStar({ position, size = 1, color = "#0055ff" }) {
  const positions = useMemo(() => {
    // Generování pozic pro konektory
    const center = new THREE.Vector3(0, 0, 0)
    const connectorPositions = []
    
    // Přidání centrálního konektoru
    connectorPositions.push(center)
    
    // Přidání 6 konektorů kolem (jako na obrázku)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const x = Math.cos(angle) * size
      const y = Math.sin(angle) * size * 0.3
      const z = Math.sin(angle + Math.PI/2) * size * 0.5
      
      connectorPositions.push(new THREE.Vector3(x, y, z))
    }
    
    return connectorPositions
  }, [size])
  
  const tubes = useMemo(() => {
    const tubeConnections = []
    
    // Spojení středu s okraji
    for (let i = 1; i < positions.length; i++) {
      tubeConnections.push({
        start: positions[0],
        end: positions[i],
        key: `tube-${i}`
      })
    }
    
    // Spojení některých okrajů mezi sebou (jako na obrázku)
    for (let i = 1; i < positions.length - 1; i += 2) {
      tubeConnections.push({
        start: positions[i],
        end: positions[i + 1],
        key: `tube-outer-${i}`
      })
    }
    
    return tubeConnections
  }, [positions])
  
  return (
    <group position={position}>
      {/* Vykreslit konektory */}
      {positions.map((pos, index) => (
        <Connector 
          key={`connector-${index}`} 
          position={pos} 
          color={color} 
          accent={index === 0}
          radius={index === 0 ? 0.4 : 0.3}
        />
      ))}
      
      {/* Vykreslit trubky */}
      {tubes.map((tube) => (
        <Tube 
          key={tube.key} 
          start={tube.start} 
          end={tube.end} 
          color={color} 
        />
      ))}
    </group>
  )
}

// Pointer component - zjednodušená
function Pointer() {
  const ref = useRef<RapierRigidBody>(null)
  const vec = new THREE.Vector3()
  
  useFrame(({ mouse, viewport }) => {
    if (ref.current) {
      ref.current.setNextKinematicTranslation(
        vec.set(
          (mouse.x * viewport.width) / 2,
          (mouse.y * viewport.height) / 2,
          0
        )
      )
    }
  })
  
  return (
    <RigidBody position={[0, 0, 0]} type="kinematicPosition" colliders={false} ref={ref}>
      <BallCollider args={[2]} />
    </RigidBody>
  )
}

// Scene component
function Scene() {
  // Generování pozic konektorových hvězd
  const connectorStars = useMemo(() => {
    const stars = []
    const colors = ["#0055ff", "#0077ff", "#0033ff"]
    
    for (let i = 0; i < 4; i++) {
      stars.push({
        position: [
          THREE.MathUtils.randFloatSpread(10),
          THREE.MathUtils.randFloatSpread(6),
          THREE.MathUtils.randFloatSpread(6)
        ],
        size: THREE.MathUtils.randFloat(0.8, 1.5),
        color: colors[Math.floor(Math.random() * colors.length)],
        id: `connector-star-${i}`
      })
    }
    
    return stars
  }, [])
  
  // Generování pozic skleněných hvězd
  const glassStars = useMemo(() => {
    const stars = []
    const colors = ["#4060ff", "#3050ff", "#2040ff", "#1030ff"]
    
    for (let i = 0; i < 6; i++) {
      stars.push({
        position: [
          THREE.MathUtils.randFloatSpread(12),
          THREE.MathUtils.randFloatSpread(8),
          THREE.MathUtils.randFloatSpread(8)
        ],
        scale: THREE.MathUtils.randFloat(0.4, 0.7),
        color: colors[Math.floor(Math.random() * colors.length)],
        id: `glass-star-${i}`
      })
    }
    
    return stars
  }, [])
  
  return (
    <Canvas 
      shadows 
      dpr={[1, 1.5]}
      gl={{ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1
      }}
    >
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 15]}
        fov={30}
        near={0.1}
        far={100}
      />
      
      <color attach="background" args={['#010108']} />
      
      {/* Tlumené osvětlení */}
      <ambientLight intensity={0.2} />
      
      {/* Hlavní modré světlo */}
      <spotLight
        position={[-10, 5, 10]}
        angle={0.4}
        penumbra={1}
        intensity={4}
        color="#1155ff"
        castShadow
      />
      
      {/* Doplňkové světlo */}
      <pointLight
        position={[8, -5, 8]}
        intensity={2}
        color="#ffffff"
      />
      
      <Suspense fallback={<LoadingScreen />}>
        <Physics gravity={[0, 0, 0]}>
          <Pointer />
          
          {/* Statické konektorové hvězdy */}
          {connectorStars.map((star) => (
            <ConnectorStar 
              key={star.id}
              position={star.position as [number, number, number]}
              size={star.size}
              color={star.color}
            />
          ))}
          
          {/* Statické skleněné hvězdy */}
          {glassStars.map((star) => (
            <GlassStar 
              key={star.id}
              position={star.position as [number, number, number]}
              scale={star.scale}
              color={star.color}
            />
          ))}
        </Physics>
        
        <Environment preset="warehouse" background={false} blur={0.5} />
      </Suspense>
    </Canvas>
  )
}

// Export hlavní komponenty
export default function StarScene() {
  return (
    <div style={{ 
      width: "100%", 
      height: "100%", 
      position: "relative",
      borderRadius: "20px",
      overflow: "hidden"
    }}>
      <Scene />
    </div>
  )
}
