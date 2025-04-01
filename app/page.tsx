"use client"
import Header from "@/components/header"
import dynamic from "next/dynamic"

// Dynamically import the StarScene component with no SSR
const StarScene = dynamic(() => import("@/components/star-scene"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />,
})

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f6fa] flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center px-6 md:px-20 py-6">
        <div className="w-full h-[350px] sm:h-[450px] md:h-[550px] lg:h-[70vh] max-h-[700px] rounded-3xl overflow-hidden bg-black">
          <StarScene />
        </div>
      </div>
    </main>
  )
}

