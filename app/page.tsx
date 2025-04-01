"use client"
import Header from "@/components/header"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

// Dynamically import the StarScene component with no SSR
const StarScene = dynamic(() => import("@/components/star-scene"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />
})

export default function Home() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simuluje načítání stránky
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="min-h-screen bg-[#f5f6fa] flex flex-col">
      {loading && (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
          <div className="w-20 h-20 mb-6 animate-pulse">
            <img src="/black-star-vision.svg" alt="Vision Star" className="w-full h-full" />
          </div>
          
          <div className="w-40 mb-8">
            <img src="/vision.svg" alt="Vision" className="w-full" />
          </div>
          
          <div className="w-48 bg-gray-800 h-1 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full" 
              style={{
                width: '100%',
                animation: 'progress 2s ease-in-out'
              }}
            />
          </div>
          
          <style jsx>{`
            @keyframes progress {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
        </div>
      )}

      <Header />
      <div className="flex-1 flex flex-col items-center px-6 md:px-20 py-6">
        <div className="w-full h-[350px] sm:h-[450px] md:h-[550px] lg:h-[70vh] max-h-[700px] rounded-3xl overflow-hidden bg-black">
          <StarScene />
        </div>
      </div>
    </main>
  )
}

