"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

export function PopupMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  // Varianty animací pro menu
  const menuVariants = {
    hidden: { 
      opacity: 0, 
      y: -20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24,
        duration: 0.2,
        staggerChildren: 0.05,
        delayChildren: 0.1
      } 
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      scale: 0.95,
      transition: { 
        duration: 0.15,
        ease: "easeOut"
      } 
    }
  }

  // Varianty pro položky menu
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 5 }
  }

  return (
    <div className="relative">
      {/* Menu Button */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-gray-100 h-10 w-10"
          aria-label="Minimalizovat"
          tabIndex={0}
        >
          <span className="text-2xl font-light">−</span>
        </Button>

        <Button 
          className="rounded-full bg-[#1f2937] hover:bg-[#111827] text-white px-6"
          aria-label="Kontaktovat nás"
          tabIndex={0}
        >
          LET&apos;S TALK
        </Button>

        <motion.div
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="ghost" 
            onClick={handleToggle} 
            className="font-medium"
            aria-label="Otevřít menu"
            tabIndex={0}
          >
            <motion.span
              animate={{ 
                rotate: isOpen ? 90 : 0,
                color: isOpen ? "#ff4060" : "#000000"
              }}
              transition={{ duration: 0.3 }}
              className="flex items-center"
            >
              {isOpen ? "ZAVŘÍT" : "MENU"}
              <motion.span
                animate={{ 
                  rotate: isOpen ? 90 : 0,
                  color: isOpen ? "#ff4060" : "#000000" 
                }}
                className="ml-2 h-5 w-5 inline-block"
              >
                {isOpen ? "×" : "≡"}
              </motion.span>
            </motion.span>
          </Button>
        </motion.div>
      </div>

      {/* Popup Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 top-16 w-[320px] bg-white rounded-lg shadow-lg z-50 overflow-hidden"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={menuVariants}
          >
            <div className="flex flex-col">
              {/* Navigation Links */}
              <nav className="p-6">
                <ul className="space-y-4">
                  <motion.li 
                    className="flex justify-between items-center"
                    variants={itemVariants}
                  >
                    <Link 
                      href="/" 
                      className="text-xl font-medium hover:opacity-70"
                      tabIndex={0}
                      aria-label="Domů"
                    >
                      DOMŮ
                    </Link>
                    <span className="h-2 w-2 rounded-full bg-black" />
                  </motion.li>
                  <motion.li variants={itemVariants}>
                    <Link 
                      href="/o-nas" 
                      className="text-xl font-medium hover:opacity-70"
                      tabIndex={0}
                      aria-label="O nás"
                    >
                      O NÁS
                    </Link>
                  </motion.li>
                  <motion.li variants={itemVariants}>
                    <Link 
                      href="/projekty" 
                      className="text-xl font-medium hover:opacity-70"
                      tabIndex={0}
                      aria-label="Projekty"
                    >
                      PROJEKTY
                    </Link>
                  </motion.li>
                  <motion.li variants={itemVariants}>
                    <Link 
                      href="/kontakt" 
                      className="text-xl font-medium hover:opacity-70"
                      tabIndex={0}
                      aria-label="Kontakt"
                    >
                      KONTAKT
                    </Link>
                  </motion.li>
                </ul>
              </nav>

              {/* Newsletter Section */}
              <motion.div 
                className="p-6 border-t"
                variants={itemVariants}
              >
                <h3 className="text-xl font-medium mb-4">
                  Přihlaste se k
                  <br />
                  našemu newsletteru
                </h3>
                <motion.div 
                  className="flex items-center bg-gray-100 rounded-lg overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <input 
                    type="email" 
                    placeholder="Váš email" 
                    className="flex-1 bg-transparent p-3 outline-none" 
                    aria-label="Váš email pro newsletter"
                  />
                  <motion.button 
                    className="p-3"
                    aria-label="Odeslat"
                    tabIndex={0}
                    type="button"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                </motion.div>
              </motion.div>

              {/* Labs Section */}
              <motion.div 
                className="p-4 bg-black text-white flex justify-between items-center"
                variants={itemVariants}
                whileHover={{ backgroundColor: "#1a1a1a" }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex">
                    <motion.div 
                      className="h-2 w-2 rounded-full bg-white mr-1"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
                    />
                    <motion.div 
                      className="h-2 w-2 rounded-full bg-white"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "loop", delay: 0.5 }}
                    />
                  </div>
                  <span className="font-medium">LABORATOŘ</span>
                </div>
                <motion.div
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ArrowRight className="h-5 w-5" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 