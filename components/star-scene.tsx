"use client"

import * as THREE from "three"
import { useRef, useMemo, Suspense } from "react"
import { Canvas, useFrame, extend } from "@react-three/fiber"
import { Physics, RigidBody, BallCollider, CuboidCollider } from "@react-three/rapier"
import type { RapierRigidBody } from '@react-three/rapier'
import { 
  useGLTF, 
  Environment,
  MeshTransmissionMaterial,
  AccumulativeShadows,
  RandomizedLight,
  Sparkles,
  shaderMaterial
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
  CRUCIFIX: "/models/star.glb",
  ATREYU: "/models/star.glb",
  DAVID: "/models/star.glb",
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

// Preload modelů - pozor na velikost, přednahráváme jen menší modely
useGLTF.preload("/models/star.glb")
useGLTF.preload("/models/glass_star.glb")
// Velké modely načítáme až když jsou potřeba, ne předem

// Model komponenta
function Model({ color, scale, children, modelType, materialType }: ModelProps) {
  const ref = useRef<THREE.Mesh>(null)
  const { scene } = useGLTF(MODELS[modelType])
  const model = useMemo(() => scene.clone(), [scene])
  
  // Upravené měřítko pro různé modely
  const modelScale = useMemo(() => {
    switch(modelType) {
      case "CRUCIFIX": return scale * 0.9
      case "GLASS_STAR": return scale * 1.2
      case "ATREYU": return scale * 0.9
      case "DAVID": return scale * 0.9
      case "STUDIO": return scale * 0.9
      default: return scale * 1.0
    }
  }, [modelType, scale])

  // Materiál podle typu
  const material = useMemo(() => {
    switch(materialType) {
      case "GLASS":
        return <MeshTransmissionMaterial
          samples={1} // Sníženo pro výkon
          thickness={0.2}
          chromaticAberration={0.02}
          transmission={0.95}
          clearcoat={1}
          clearcoatRoughness={0.0}
          envMapIntensity={1}
          color={color}
          distortion={0.05}
          temporalDistortion={0.05}
          metalness={0.2}
          roughness={0.05}
        />
      case "CHROME":
        return <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.1}
          envMapIntensity={1}
        />
      case "NEON":
        return <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          toneMapped={false}
        />
      case "MARBLE":
        return <meshStandardMaterial
          color={color}
          metalness={0}
          roughness={0.2}
          envMapIntensity={1}
        />
      case "HOLOGRAM":
        return <MeshTransmissionMaterial
          samples={1} // Sníženo pro výkon
          thickness={0.2}
          chromaticAberration={0.03}
          transmission={0.95}
          color={color}
          distortion={0.2}
          temporalDistortion={0.1}
          roughness={0.1}
        />
      case "STUDIO":
        return <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.2}
          envMapIntensity={1}
        />
    }
  }, [color, materialType])

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
      randFloatSpread(10),
      randFloatSpread(10),
      randFloatSpread(10)
    ] as [number, number, number]
  }, [position, randFloatSpread])
  
  useFrame((state, delta) => {
    if (api.current) {
      const currentPosition = api.current.translation()
      api.current.applyImpulse(
        new THREE.Vector3()
          .copy(currentPosition)
          .negate()
          .multiplyScalar(0.2),
        true
      )
    }
  })
  
  return (
    <RigidBody linearDamping={4} angularDamping={1} friction={0.1} position={pos} ref={api} colliders={false}>
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
      {accent && materialType === "NEON" && (
        <pointLight intensity={4} distance={3} color={color} />
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
      <BallCollider args={[1]} />
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
    // Hvězdy s neonovým materiálem - pouze jedna
    connectorsRef.current.push({
      id: "neon-star-1",
      color: MATERIALS.NEON.colors[0],
      accent: true,
      scale: 0.9,
      modelType: "STAR" as ModelType,
      materialType: "NEON" as MaterialType
    })

    // Skleněná hvězda - pouze jedna
    connectorsRef.current.push({
      id: "glass-star-1",
      color: MATERIALS.GLASS.colors[0],
      accent: false,
      scale: 0.9,
      modelType: "GLASS_STAR" as ModelType,
      materialType: "GLASS" as MaterialType
    })

    // Kříž s chromovým materiálem - pouze jeden
    connectorsRef.current.push({
      id: "crucifix-1",
      color: MATERIALS.CHROME.colors[0],
      accent: false,
      scale: 0.8,
      modelType: "CRUCIFIX" as ModelType,
      materialType: "CHROME" as MaterialType
    })

    // Atreyu s hologramovým materiálem
    connectorsRef.current.push({
      id: "atreyu-1",
      color: MATERIALS.HOLOGRAM.colors[0],
      accent: true,
      scale: 0.8,
      modelType: "ATREYU" as ModelType,
      materialType: "HOLOGRAM" as MaterialType
    })

    // David s mramorovým materiálem
    connectorsRef.current.push({
      id: 'david',
      color: MATERIALS.MARBLE.colors[0],
      accent: false,
      scale: 1,
      modelType: "DAVID" as ModelType,
      materialType: "MARBLE" as MaterialType
    })

    // Studio Vision - pouze jeden, je velký
    connectorsRef.current.push({
      id: 'studio',
      color: MATERIALS.STUDIO.colors[0],
      accent: true,
      scale: 1.5,
      modelType: "STUDIO" as ModelType,
      materialType: "STUDIO" as MaterialType
    })
  }

  return (
    <Canvas
      shadows
      dpr={[0.8, 1.2]}
      gl={{ 
        antialias: false,
        alpha: true,
        powerPreference: 'default',
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: true
      }}
      camera={{ position: [0, 0, 15], fov: 25, near: 1, far: 40 }}
    >
      <color attach="background" args={['#050510']} />
      
      {/* Ray Marching efekt v pozadí */}
      <RayMarchingBackground />

      {/* Dramatické osvětlení */}
      <ambientLight intensity={0.3} />
      
      {/* Modré světlo */}
      <spotLight
        position={[-10, 5, 5]}
        angle={0.3}
        penumbra={1}
        intensity={3}
        color="#0055ff"
        castShadow
      />
      
      {/* Růžové světlo */}
      <spotLight
        position={[10, -5, -5]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        color="#ff0066"
        castShadow={false}
      />
      
      {/* Dešťové částice */}
      <Sparkles 
        count={100} // Sníženo pro lepší výkon
        scale={20}
        size={1.5}
        speed={0.3}
        opacity={0.2}
        color="#ffffff"
      />
      
      <Suspense fallback={null}>
        <Physics gravity={[0, 0, 0]}>
          <Pointer />
          {connectorsRef.current.map((props) => (
            <Connector key={props.id} {...props} />
          ))}
        </Physics>
        
        <Environment preset="night" />
        
        {/* Stíny */}
        <AccumulativeShadows
          temporal
          frames={30}
          color="#000000"
          colorBlend={0.7}
          toneMapped={true}
          alphaTest={0.7}
          opacity={0.7}
          scale={14}
          position={[0, -5, 0]}
        >
          <RandomizedLight
            amount={4}
            radius={5}
            ambient={0.7}
            intensity={1.5}
            position={[5, 5, -10]}
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
