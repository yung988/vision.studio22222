import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import '../styles/globals.css' // předpokládáme, že existuje

// Dynamicky importujeme jen na klientovi
const DynamicStarScene = dynamic(
  () => import('../components/star-scene'),
  { ssr: false }
)

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Vision Stars</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  )
} 