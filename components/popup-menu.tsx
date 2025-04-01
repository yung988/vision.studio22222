"use client"

import Link from "next/link"
import React, { useState, useRef, useEffect } from "react"
import { cn } from "@/utils/cn"

interface PopupMenuProps {
  isMobile?: boolean;
}

export function PopupMenu({ isMobile = false }: PopupMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={`relative z-50 ${isMobile ? "" : "ml-4"}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "text-sm uppercase tracking-wider flex items-center gap-2 font-medium z-50",
          isOpen ? "text-black" : "text-black/80 hover:text-black"
        )}
      >
        <span className={`${isMobile ? "text-xs" : "text-sm"}`}>Menu</span>
        <div className="w-6 h-6 relative">
          <span
            className={cn(
              "absolute h-0.5 bg-black left-0 transition-all duration-300",
              isOpen
                ? "top-[11px] w-6 -rotate-45"
                : "top-2 w-6"
            )}
          />
          <span
            className={cn(
              "absolute top-3 h-0.5 bg-black left-0 transition-all duration-300",
              isOpen ? "w-0 opacity-0" : "w-4 opacity-100"
            )}
          />
          <span
            className={cn(
              "absolute h-0.5 bg-black left-0 transition-all duration-300",
              isOpen
                ? "top-[11px] w-6 rotate-45"
                : "top-4 w-6"
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full right-0 mt-2 p-6 bg-white shadow-lg rounded-xl w-60 z-40",
            "transition-opacity duration-200 ease-in-out",
            isOpen ? "opacity-100" : "opacity-0"
          )}
        >
          <nav className="grid gap-3">
            <div className="transition-all duration-200 ease-in-out transform translate-y-0">
              <Link
                href="#"
                onClick={() => setIsOpen(false)}
                className="block text-black hover:text-black/70 py-2"
              >
                Hlavní stránka
              </Link>
            </div>
            <div className="transition-all duration-200 ease-in-out transform translate-y-0">
              <Link
                href="#"
                onClick={() => setIsOpen(false)}
                className="block text-black hover:text-black/70 py-2"
              >
                O nás
              </Link>
            </div>
            <div className="transition-all duration-200 ease-in-out transform translate-y-0">
              <Link
                href="#"
                onClick={() => setIsOpen(false)}
                className="block text-black hover:text-black/70 py-2"
              >
                Portfolio
              </Link>
            </div>
            <div className="transition-all duration-200 ease-in-out transform translate-y-0">
              <Link
                href="#"
                onClick={() => setIsOpen(false)}
                className="block text-black hover:text-black/70 py-2"
              >
                Služby
              </Link>
            </div>
            <div className="transition-all duration-200 ease-in-out transform translate-y-0">
              <Link
                href="#"
                onClick={() => setIsOpen(false)}
                className="block text-black hover:text-black/70 py-2"
              >
                Kontakt
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  )
} 