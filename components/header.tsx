"use client"

import Image from "next/image"
import { PopupMenu } from "@/components/popup-menu"
import { useState, useEffect } from "react"

export default function Header() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Detekce mobilního zařízení
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Počáteční kontrola
    checkMobile()
    
    // Aktualizace při změně velikosti okna
    window.addEventListener('resize', checkMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <header className={`w-full py-6 px-6 md:px-10 lg:px-20 ${isMobile ? "flex-col" : "flex justify-between items-center"}`}>
      {/* Mobile layout */}
      {isMobile ? (
        <div className="flex flex-col w-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Image src="/vision.svg" alt="Vision" width={140} height={30} className="h-8 w-auto" />
            </div>
            
            <PopupMenu isMobile={true} />
          </div>
          
          <div className="mb-4">
            <h1 className="text-xl font-medium leading-tight">
              Pomáháme značkám vytvářet digitální zážitky, které propojují s jejich publikem
            </h1>
          </div>
        </div>
      ) : (
        // Desktop layout
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center">
            <Image src="/vision.svg" alt="Vision" width={140} height={30} className="h-8 w-auto" />
          </div>

          <div className="mx-6 max-w-2xl">
            <h1 className="text-xl md:text-2xl font-medium">
              Pomáháme značkám vytvářet digitální zážitky, které propojují s jejich publikem
            </h1>
          </div>

          <PopupMenu />
        </div>
      )}
    </header>
  )
}

