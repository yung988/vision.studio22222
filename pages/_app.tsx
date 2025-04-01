import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect } from 'react'

// Typové deklarace pro globální proměnné
declare global {
  interface Window {
    THREE: any;
    ReactThreeFiber: any;
    ReactThreeDrei: any;
    ReactThreeRapier: any;
  }
}

export default function App({ Component, pageProps }: AppProps) {
  // Zajistíme, že se React komponenty správně napojí na CDN verze Three.js a React
  useEffect(() => {
    // Kontrola, že byly načteny všechny externí CDN knihovny
    if (
      typeof window !== 'undefined' && 
      window.THREE && 
      window.ReactThreeFiber && 
      window.ReactThreeDrei && 
      window.ReactThreeRapier
    ) {
      console.log('Všechny knihovny byly úspěšně načteny z CDN')
    } else {
      console.error('Některé knihovny se nepodařilo načíst z CDN!')
    }
  }, [])

  return (
    <>
      <Head>
        <title>Vision Stars 3D</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  )
} 