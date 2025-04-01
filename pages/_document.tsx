import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="cs">
      <Head>
        {/* Three.js CDN */}
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.159.0/three.min.js" integrity="sha512-OviGQIoFPYKHu1IGcWs0M5XRrX/mGicPurPvV9GATHFYch8MCJg5XlTgGxap9+fEpZkXf7+kIr7+ARMm3jrAcQ==" crossOrigin="anonymous" referrerPolicy="no-referrer"></script>
        
        {/* Základní pluginy pro Three.js */}
        <script src="https://cdn.jsdelivr.net/npm/three-mesh-bvh@0.7.0/build/three-mesh-bvh.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/three-stdlib@2.27.3/build/three-stdlib.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/three-spritetext@1.8.1/dist/three-spritetext.min.js"></script>

        {/* Metadata */}
        <meta name="description" content="Vision Stars 3D interaktivní scéna" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 