"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

import { Toggle } from "@/components/ui/toggle"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedTheme = localStorage.getItem("theme")
    const nextIsDark =
      storedTheme === "dark" ||
      (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)

    document.documentElement.classList.toggle("dark", nextIsDark)
    setIsDark(nextIsDark)
  }, [])

  const onToggle = (pressed: boolean) => {
    setIsDark(pressed)
    document.documentElement.classList.toggle("dark", pressed)
    localStorage.setItem("theme", pressed ? "dark" : "light")
  }

  if (!mounted) {
    return null
  }

  return (
    <Toggle
      aria-label="Toggle theme"
      pressed={isDark}
      onPressedChange={onToggle}
      variant="outline"
      size="sm"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Toggle>
  )
}