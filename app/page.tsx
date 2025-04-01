"use client"
import Header from "@/components/header"
import dynamic from "next/dynamic"
import { Plus } from "lucide-react"

// Dynamically import the StarScene component with no SSR
const StarScene = dynamic(() => import("@/components/star-scene"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />,
})

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f6fa] flex flex-col">
      <div className="flex-1 flex flex-col">
        {/* Header na mobilním zařízení bude jako LUSION */}
        <div className="pt-6 px-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Vision</h1>
            <button className="rounded-full bg-gray-200 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-horizontal"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-medium leading-tight">
              Pomáháme značkám vytvářet digitální zážitky, které propojují s jejich publikem
            </h2>
          </div>
        </div>
        
        {/* 3D scéna */}
        <div className="w-full px-0 flex-1 flex flex-col">
          <div className="w-full aspect-[4/5] sm:aspect-[4/3] md:aspect-[16/9] rounded-none md:rounded-3xl overflow-hidden bg-black">
            <StarScene />
          </div>
          
          {/* Scroll indicator jako na LUSION */}
          <div className="w-full flex justify-center items-center py-5">
            <Plus size={20} className="opacity-50" />
            <div className="text-sm mx-8 tracking-widest opacity-70">SCROLL TO EXPLORE</div>
            <Plus size={20} className="opacity-50" />
          </div>
        </div>
      </div>
    </main>
  )
}

