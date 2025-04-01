let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['three'],
  webpack: (config) => {
    config.externals.push({
      three: 'THREE',
      'three-stdlib': 'threeStdlib',
      'three-mesh-bvh': 'threeMeshBVH',
      'three-spritetext': 'threeSpriteText'
    });
    
    // Zvýšení limitů pro velké soubory
    config.performance = {
      ...config.performance,
      maxAssetSize: 8 * 1024 * 1024, // 8MB
      maxEntrypointSize: 8 * 1024 * 1024 // 8MB
    };
    
    return config;
  },
  experimental: {
    optimizePackageImports: ['@react-three/fiber', '@react-three/drei', '@react-three/rapier'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; worker-src 'self' blob:;"
          }
        ]
      }
    ];
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // 1 hodina
    pagesBufferLength: 5,
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
