"use client"

import Image from "next/image"
import { PopupMenu } from "@/components/popup-menu"

export default function Header() {
  return (
    <header className="w-full py-6 px-6 md:px-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
      <div className="flex items-center">
        <Image src="/images/vision.svg" alt="Vision" width={140} height={30} className="h-8 w-auto" />
      </div>

      <div className="max-w-xl">
        <h1 className="text-xl md:text-2xl font-medium">
          Pomáháme značkám vytvářet digitální zážitky, které propojují s jejich publikem
        </h1>
      </div>

      <PopupMenu />
    </header>
  )
}

