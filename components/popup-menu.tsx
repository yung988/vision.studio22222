"use client"

import Link from "next/link"
import React, { useState, useRef, useEffect } from "react"
import {
  motion,
  AnimatePresence,
} from "framer-motion"
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

  const menuVariants = {
    open: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 24,
      },
    },
    closed: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 24,
      },
    },
  }

  const menuItemVariants = {
    open: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: i * 0.05,
      },
    }),
    closed: {
      opacity: 0,
      y: 10,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
      },
    },
  }

  return (
    <div ref={containerRef} className={`relative z-50 ${isMobile ? "" : "ml-4"}`}>
      <button
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className={cn(
              "absolute top-full right-0 mt-2 p-6 bg-white shadow-lg rounded-xl w-60 z-40"
            )}
          >
            <nav className="grid gap-3">
              <motion.div custom={0} variants={menuItemVariants}>
                <Link
                  href="#"
                  onClick={() => setIsOpen(false)}
                  className="block text-black hover:text-black/70 py-2"
                >
                  Hlavní stránka
                </Link>
              </motion.div>
              <motion.div custom={1} variants={menuItemVariants}>
                <Link
                  href="#"
                  onClick={() => setIsOpen(false)}
                  className="block text-black hover:text-black/70 py-2"
                >
                  O nás
                </Link>
              </motion.div>
              <motion.div custom={2} variants={menuItemVariants}>
                <Link
                  href="#"
                  onClick={() => setIsOpen(false)}
                  className="block text-black hover:text-black/70 py-2"
                >
                  Portfolio
                </Link>
              </motion.div>
              <motion.div custom={3} variants={menuItemVariants}>
                <Link
                  href="#"
                  onClick={() => setIsOpen(false)}
                  className="block text-black hover:text-black/70 py-2"
                >
                  Služby
                </Link>
              </motion.div>
              <motion.div custom={4} variants={menuItemVariants}>
                <Link
                  href="#"
                  onClick={() => setIsOpen(false)}
                  className="block text-black hover:text-black/70 py-2"
                >
                  Kontakt
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 