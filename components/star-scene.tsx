"use client"

import * as THREE from "three"
import { useRef, useMemo, Suspense, useState, useEffect } from "react"
import { Canvas, useFrame, extend, useLoader } from "@react-three/fiber"
import { Physics, RigidBody, BallCollider, CuboidCollider } from "@react-three/rapier"
import type { RapierRigidBody } from '@react-three/rapier'
import { 
  useGLTF, 
  Environment,
  MeshTransmissionMaterial,
  AccumulativeShadows,
  RandomizedLight,
  Sparkles,
  shaderMaterial,
  Html,
  useProgress,
  PerspectiveCamera
} from "@react-three/drei"

// Ray Marching Shader pro pozadí
const RayMarchingMaterial = shaderMaterial(
  {
    uTime: 0,
    uResolution: new THREE.Vector2(),
    side: THREE.DoubleSide,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec2 uResolution;
    varying vec2 vUv;

    #define MAX_STEPS 50
    #define MAX_DIST 50.0
    #define SURF_DIST 0.01

    // Signed Distance Functions
    float sdSphere(vec3 p, float r) {
      return length(p) - r;
    }

    float sdBox(vec3 p, vec3 b) {
      vec3 q = abs(p) - b;
      return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
    }

    float sdPyramid(vec3 p, float h) {
      float m2 = h * h + 0.25;
      p.xz = abs(p.xz);
      p.xz = (p.z > p.x) ? p.zx : p.xz;
      p.xz -= 0.5;
      vec3 q = vec3(p.z, h * p.y - 0.5 * p.x, h * p.x + 0.5 * p.y);
      float s = max(-q.x, 0.0);
      float t = clamp((q.y - 0.5 * p.z) / (m2 + 0.25), 0.0, 1.0);
      float a = m2 * (q.x + s) * (q.x + s) + q.y * q.y;
      float b = m2 * (q.x + 0.5 * t) * (q.x + 0.5 * t) + (q.y - m2 * t) * (q.y - m2 * t);
      float d2 = min(q.y, -q.x * m2 - q.y * 0.5) > 0.0 ? 0.0 : min(a, b);
      return sqrt((d2 + q.z * q.z) / m2) * sign(max(q.z, -p.y));
    }

    // Smooth min function pro plynulé prolínání
    float smin(float a, float b, float k) {
      float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
      return mix(b, a, h) - k * h * (1.0 - h);
    }

    float scene(vec3 p) {
      float sphere = sdSphere(p - vec3(sin(uTime) * 2.0, cos(uTime * 0.5) * 2.0, 0.0), 0.7);
      float pyramid = sdPyramid(p - vec3(cos(uTime * 1.2) * 2.0, sin(uTime * 0.7) * 2.0, 0.0), 1.0);
      float box = sdBox(p - vec3(sin(uTime * 0.8) * 3.0, cos(uTime * 1.1) * 3.0, sin(uTime) * 3.0), vec3(0.4));
      
      // Smooth blend různých tvarů
      float blend1 = smin(sphere, pyramid, 1.0);
      return smin(blend1, box, 0.5);
    }

    vec3 getNormal(vec3 p) {
      vec2 e = vec2(0.01, 0);
      return normalize(vec3(
        scene(p + e.xyy) - scene(p - e.xyy),
        scene(p + e.yxy) - scene(p - e.yxy),
        scene(p + e.yyx) - scene(p - e.yyx)
      ));
    }

    float rayMarch(vec3 ro, vec3 rd) {
      float dO = 0.0;
      for(int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * dO;
        float dS = scene(p);
        dO += dS;
        if(dO > MAX_DIST || dS < SURF_DIST) break;
      }
      return dO;
    }

    // Barevná paleta
    vec3 palette(float t) {
      vec3 a = vec3(0.5, 0.5, 0.5);
      vec3 b = vec3(0.5, 0.5, 0.5);
      vec3 c = vec3(1.0, 1.0, 1.0);
      vec3 d = vec3(0.00, 0.33, 0.67);
      return a + b * cos(6.28318 * (c * t + d));
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
      vec3 ro = vec3(0, 0, -5);
      vec3 rd = normalize(vec3(uv, 1));

      float d = rayMarch(ro, rd);
      vec3 p = ro + rd * d;
      vec3 normal = getNormal(p);
      vec3 light = normalize(vec3(1, 1, -1));

      float diff = dot(normal, light) * 0.5 + 0.5;
      vec3 color = palette(diff + uTime * 0.1);

      // Edge highlighting
      float edge = 1.0 - max(dot(normal, -rd), 0.0);
      color += vec3(0.2, 0.5, 1.0) * pow(edge, 3.0);

      // Background color
      vec3 bgColor = vec3(0.05, 0.05, 0.1);
      float fadeDepth = smoothstep(MAX_DIST - 5.0, 0.0, d);
      
      // Průhlednost objektů v pozadí
      float alpha = fadeDepth * 0.4;
      color = mix(bgColor, color, fadeDepth);

      gl_FragColor = vec4(color, alpha);
    }
  `
)

extend({ RayMarchingMaterial })

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

// Ray Marching komponenta v pozadí
function RayMarchingBackground() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  useFrame(({ clock, size }) => {
    if (materialRef.current) {
      const material = materialRef.current as THREE.ShaderMaterial & {
        uTime: number;
        uResolution: THREE.Vector2;
      }
      material.uTime = clock.getElapsedTime() * 0.5
      
      if (material.uResolution) {
        material.uResolution.x = size.width
        material.uResolution.y = size.height
      }
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -15]} scale={[30, 30, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      {/* @ts-ignore - vlastní shader materiál */}
      <rayMarchingMaterial ref={materialRef} transparent depthWrite={false} />
    </mesh>
  )
}

// Materiály pro modely
const MATERIALS = {
  GLASS: {
    type: "transmission",
    colors: ['#4060ff', '#20ffa0', '#ff4060', '#ffcc00']
  },
  GLASS_BLUE: {
    type: "transmission",
    colors: ['#0033ff', '#0055ff', '#0077ff', '#0099ff']
  },
  CHROME: {
    type: "chrome",
    colors: ['#ffffff', '#cccccc', '#888888', '#444444']
  },
  NEON: {
    type: "neon",
    colors: ['#ff0066', '#00ffff', '#ff00ff', '#ffff00']
  },
  MARBLE: {
    type: "marble",
    colors: ['#f5f5f5', '#e0e0e0', '#d5d5d5', '#cccccc']
  },
  HOLOGRAM: {
    type: "hologram",
    colors: ['#00ffff', '#ff00ff', '#00ff00', '#ffff00']
  },
  STUDIO: {
    type: "studio",
    colors: ['#ff4400', '#0088ff', '#44ff00', '#ffcc00']
  }
} as const

// Typy modelů - všechny dostupné modely
const MODELS = {
  STAR: "/models/star.glb",
  GLASS_STAR: "/models/glass_star.glb",
  CRUCIFIX: "/models/jesus.glb", // Vráceno na původní soubor
  ATREYU: "/models/atreyu.glb", // Vráceno na původní soubor
  DAVID: "/models/david.glb", // Vráceno na původní soubor
  STUDIO: "/models/star.glb"
} as const

// Typy
type MaterialType = keyof typeof MATERIALS
type ModelType = keyof typeof MODELS

type ModelProps = {
  color: string;
  scale: number;
  children?: React.ReactNode;
  modelType: ModelType;
  materialType: MaterialType;
}

type ConnectorProps = {
  position?: [number, number, number];
  children?: React.ReactNode;
  color: string;
  scale: number;
  accent?: boolean;
  modelType: ModelType;
  materialType: MaterialType;
}

// Preload modelů
useGLTF.preload("/models/star.glb")
useGLTF.preload("/models/glass_star.glb")
// Přidáváme preload dostupných modelů
try {
  useGLTF.preload("/models/jesus.glb")
  useGLTF.preload("/models/atreyu.glb")
  useGLTF.preload("/models/david.glb")
} catch (error) {
  console.warn("Některé modely se nepodařilo načíst", error)
}

// Model komponenta
function Model({ color, scale, children, modelType, materialType }: ModelProps) {
  const ref = useRef<THREE.Mesh>(null)
  const [model, setModel] = useState<THREE.Object3D | null>(null)
  
  useEffect(() => {
    try {
      const { scene } = useGLTF(MODELS[modelType])
      setModel(scene.clone())
    } catch (error) {
      console.warn(`Model ${modelType} se nepodařilo načíst, používám záložní`, error)
      const { scene } = useGLTF(MODELS["STAR"])
      setModel(scene.clone())
    }
  }, [modelType])
  
  // Upravené měřítko pro různé modely
  const modelScale = useMemo(() => {
    switch(modelType) {
      case "CRUCIFIX": return scale * 0.5
      case "GLASS_STAR": return scale * 1.2
      case "ATREYU": return scale * 0.4
      case "DAVID": return scale * 0.3
      case "STUDIO": return scale * 0.05
      default: return scale * 1.5
    }
  }, [modelType, scale])

  // Materiál podle typu
  const material = useMemo(() => {
    switch(materialType) {
      case "GLASS":
        return <MeshTransmissionMaterial
          samples={2}
          thickness={0.3}
          chromaticAberration={0.05}
          transmission={0.95}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={3}
          color={color}
          distortion={0.2}
          temporalDistortion={0.2}
          metalness={0.1}
          roughness={0.05}
          anisotropy={1}
          anisotropicBlur={0.5}
          ior={1.5}
        />
      case "GLASS_BLUE":
        return <MeshTransmissionMaterial
          samples={3}
          thickness={0.3}
          chromaticAberration={0.03}
          transmission={0.95}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={5}
          color={color}
          distortion={0.1}
          temporalDistortion={0.1}
          metalness={0.05}
          roughness={0.05}
          anisotropy={1}
          anisotropicBlur={0.1}
          ior={1.4}
        />
      case "CHROME":
        return <meshStandardMaterial
          color={color}
          metalness={1}
          roughness={0.05}
          envMapIntensity={3}
        />
      case "NEON":
        return <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={3}
          toneMapped={false}
        />
      case "MARBLE":
        return <meshStandardMaterial
          color={color}
          metalness={0.05}
          roughness={0.2}
          envMapIntensity={1}
        />
      case "HOLOGRAM":
        return <MeshTransmissionMaterial
          samples={2}
          thickness={0.1}
          chromaticAberration={0.05}
          transmission={0.98}
          color={color}
          distortion={0.3}
          temporalDistortion={0.2}
          roughness={0.05}
          attenuationDistance={0.4}
          attenuationColor="#ffffff"
          emissive={color}
          emissiveIntensity={0.5}
        />
      case "STUDIO":
        return <meshStandardMaterial
          color={color}
          metalness={0.7}
          roughness={0.1}
          envMapIntensity={2}
        />
      default:
        return null
    }
  }, [color, materialType])

  if (!model) return null

  return (
    <group scale={[modelScale, modelScale, modelScale]}>
      <mesh ref={ref} castShadow receiveShadow>
        <primitive object={model} />
        {material}
      </mesh>
      {children}
    </group>
  )
}

// Connector component
function Connector({ position, children, color, scale, accent = false, modelType, materialType }: ConnectorProps) {
  const api = useRef<RapierRigidBody>(null)
  const randFloatSpread = THREE.MathUtils.randFloatSpread
  const pos = useMemo(() => {
    if (position) return position
    return [
      randFloatSpread(5), // Menší rozptyl pro užší seskupení
      randFloatSpread(5),
      randFloatSpread(5)
    ] as [number, number, number]
  }, [position, randFloatSpread])
  
  useFrame(({ clock, delta }) => {
    if (api.current) {
      const currentPosition = api.current.translation()
      
      // Menší přitažlivost ke středu
      const attractionMultiplier = 0.05
      
      // Pomalejší pohyb
      api.current.applyImpulse(
        new THREE.Vector3()
          .copy(currentPosition)
          .negate()
          .multiplyScalar(attractionMultiplier),
        true
      )
      
      // Omezení maximální rychlosti
      const velocity = api.current.linvel()
      const maxSpeed = 2.0
      const speedSq = velocity.lengthSq()
      
      if (speedSq > maxSpeed * maxSpeed) {
        const slowDown = maxSpeed / Math.sqrt(speedSq)
        api.current.setLinvel(velocity.multiplyScalar(slowDown))
      }
    }
  })
  
  return (
    <RigidBody 
      linearDamping={4} 
      angularDamping={2} 
      friction={0.2} 
      position={pos} 
      ref={api} 
      colliders={false}
    >
      <CuboidCollider args={[0.38, 1.27, 0.38]} />
      <CuboidCollider args={[1.27, 0.38, 0.38]} />
      <CuboidCollider args={[0.38, 0.38, 1.27]} />
      <Model 
        color={color} 
        scale={scale} 
        modelType={modelType}
        materialType={materialType}
      >
        {children}
      </Model>
      {accent && (
        <pointLight intensity={3} distance={4} color={color} castShadow />
      )}
    </RigidBody>
  )
}

// Pointer component
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
      <BallCollider args={[2]} /> {/* Větší kolizní těleso pro lepší interakci */}
    </RigidBody>
  )
}

// Scene component
function Scene() {
  // Typování pro connectorsRef
  type ConnectorItem = {
    id: string;
    color: string;
    accent: boolean;
    scale: number;
    modelType: ModelType;
    materialType: MaterialType;
  }
  
  // Použití useRef místo useMemo pro prevenci rekurzivní aktualizace
  const connectorsRef = useRef<Array<ConnectorItem>>([])
  
  // Inicializace modelů pouze jednou při prvním vykreslení
  if (connectorsRef.current.length === 0) {
    // SKLENĚNÉ HVĚZDY - MODRÁ SÉRIE
    connectorsRef.current.push({
      id: "glass-star-blue-1",
      color: MATERIALS.GLASS_BLUE.colors[0],
      accent: true,
      scale: 1.1,
      modelType: "GLASS_STAR" as ModelType,
      materialType: "GLASS_BLUE" as MaterialType
    })
    
    connectorsRef.current.push({
      id: "glass-star-blue-2",
      color: MATERIALS.GLASS_BLUE.colors[1],
      accent: false,
      scale: 0.9,
      modelType: "GLASS_STAR" as ModelType,
      materialType: "GLASS_BLUE" as MaterialType
    })
    
    // NORMÁLNÍ HVĚZDY - RŮZNÉ MATERIÁLY
    connectorsRef.current.push({
      id: "neon-star-1",
      color: MATERIALS.NEON.colors[0],
      accent: true,
      scale: 0.8,
      modelType: "STAR" as ModelType,
      materialType: "NEON" as MaterialType
    })

    // DAVID - MRAMOROVÝ
    connectorsRef.current.push({
      id: "david-marble-1",
      color: MATERIALS.MARBLE.colors[0],
      accent: false,
      scale: 1.0,
      modelType: "DAVID" as ModelType,
      materialType: "MARBLE" as MaterialType
    })

    // SKLENĚNÁ HVĚZDA - KLASICKÁ
    connectorsRef.current.push({
      id: "glass-star-1",
      color: MATERIALS.GLASS.colors[0],
      accent: false,
      scale: 1.2,
      modelType: "GLASS_STAR" as ModelType,
      materialType: "GLASS" as MaterialType
    })

    // JEŽÍŠ - CHROMOVÝ
    connectorsRef.current.push({
      id: "jesus-chrome-1",
      color: MATERIALS.CHROME.colors[0],
      accent: true,
      scale: 0.8,
      modelType: "CRUCIFIX" as ModelType,
      materialType: "CHROME" as MaterialType
    })

    // SKLENĚNÁ HVĚZDA - ZELENÁ
    connectorsRef.current.push({
      id: "glass-star-2",
      color: MATERIALS.GLASS.colors[1],
      accent: false,
      scale: 1.0,
      modelType: "GLASS_STAR" as ModelType,
      materialType: "GLASS" as MaterialType
    })

    // ATREYU - HOLOGRAMOVÝ
    connectorsRef.current.push({
      id: "atreyu-hologram-1",
      color: MATERIALS.HOLOGRAM.colors[0],
      accent: true,
      scale: 0.8,
      modelType: "ATREYU" as ModelType,
      materialType: "HOLOGRAM" as MaterialType
    })

    // SKLENĚNÁ HVĚZDA - ČERVENÁ
    connectorsRef.current.push({
      id: 'glass-star-3',
      color: MATERIALS.GLASS.colors[2],
      accent: false,
      scale: 1.1,
      modelType: "GLASS_STAR" as ModelType,
      materialType: "GLASS" as MaterialType
    })

    // JEŽÍŠ - HOLOGRAM
    connectorsRef.current.push({
      id: 'jesus-hologram-1',
      color: MATERIALS.HOLOGRAM.colors[1],
      accent: true,
      scale: 0.7,
      modelType: "CRUCIFIX" as ModelType,
      materialType: "HOLOGRAM" as MaterialType
    })

    // SKLENĚNÁ HVĚZDA - ŽLUTÁ
    connectorsRef.current.push({
      id: 'glass-star-4',
      color: MATERIALS.GLASS.colors[3],
      accent: false,
      scale: 1.3,
      modelType: "GLASS_STAR" as ModelType,
      materialType: "GLASS" as MaterialType
    })

    // DAVID - SKLENĚNÝ
    connectorsRef.current.push({
      id: 'david-glass-1',
      color: MATERIALS.GLASS_BLUE.colors[2],
      accent: true,
      scale: 0.9,
      modelType: "DAVID" as ModelType,
      materialType: "GLASS_BLUE" as MaterialType
    })
    
    // NEONOVÁ SKLENĚNÁ HVĚZDA
    connectorsRef.current.push({
      id: 'glass-star-neon',
      color: MATERIALS.NEON.colors[1],
      accent: true,
      scale: 1.2,
      modelType: "GLASS_STAR" as ModelType,
      materialType: "NEON" as MaterialType
    })
  }

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]} // Vyšší kvalita
      gl={{ 
        antialias: true, // Zapnuto pro kvalitnější vykreslování
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2
      }}
    >
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 15]}
        fov={25}
        near={0.1}
        far={100}
      />
      
      <color attach="background" args={['#020210']} />
      
      {/* Dramatické osvětlení */}
      <ambientLight intensity={0.2} />
      
      {/* Hlavní modré světlo */}
      <spotLight
        position={[-10, 5, 10]}
        angle={0.4}
        penumbra={1}
        intensity={5}
        color="#1155ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      
      {/* Doplňkové světlo */}
      <pointLight
        position={[8, -5, 8]}
        intensity={3}
        color="#ffffff"
      />
      
      {/* Protisvětlo */}
      <spotLight
        position={[8, 2, -10]}
        angle={0.5}
        penumbra={1}
        intensity={2}
        color="#ffffff"
        castShadow={false}
      />
      
      {/* Odleskové světlo */}
      <pointLight
        position={[-5, -2, 8]}
        intensity={2}
        color="#80b0ff"
      />
      
      {/* Částicové efekty */}
      <Sparkles 
        count={80}
        scale={15}
        size={1}
        speed={0.2}
        opacity={0.3}
        color="#80b0ff"
      />
      
      <Suspense fallback={<LoadingScreen />}>
        <RayMarchingBackground />
        
        <Physics gravity={[0, 0, 0]}>
          <Pointer />
          {connectorsRef.current.map((props) => (
            <Connector key={props.id} {...props} />
          ))}
        </Physics>
        
        <Environment preset="warehouse" background={false} blur={0.5} />
        
        {/* Stíny */}
        <AccumulativeShadows
          temporal
          frames={30}
          color="#000030"
          colorBlend={0.7}
          toneMapped={true}
          alphaTest={0.75}
          opacity={0.8}
          scale={14}
          position={[0, -5, 0]}
        >
          <RandomizedLight
            amount={4}
            radius={10}
            ambient={0.5}
            intensity={2}
            position={[5, 8, -10]}
            bias={0.001}
          />
        </AccumulativeShadows>

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
