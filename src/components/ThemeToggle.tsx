'use client'

import { useEffect, useState } from 'react'
import { Palette } from 'lucide-react'

const THEMES = {
    light: ['light', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'garden', 'lofi', 'pastel', 'fantasy', 'wireframe', 'cmyk', 'autumn', 'lemonade', 'winter'],
    dark: ['dark', 'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'forest', 'aqua', 'black', 'luxury', 'dracula', 'business', 'acid', 'night', 'coffee', 'dim', 'nord', 'sunset'],
}

export function ThemeToggle() {
    const [theme, setTheme] = useState('light')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem('theme') || 'light'
        setTheme(savedTheme)
        document.documentElement.setAttribute('data-theme', savedTheme)
    }, [])

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        document.documentElement.setAttribute('data-theme', newTheme)
    }

    if (!mounted) {
        return (
            <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                    <Palette className="w-5 h-5" />
                </div>
            </div>
        )
    }

    return (
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle" aria-label="Change theme">
                <Palette className="w-5 h-5" />
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] p-2 shadow-2xl bg-base-200 rounded-box w-52 max-h-96 overflow-y-auto">
                <li className="menu-title">
                    <span className="text-xs font-bold opacity-60">Light Themes</span>
                </li>
                {THEMES.light.map((t) => (
                    <li key={t}>
                        <button
                            onClick={() => handleThemeChange(t)}
                            className={`${theme === t ? 'active' : ''}`}
                            data-theme={t}
                        >
                            <span className="flex-1 capitalize">{t}</span>
                            {theme === t && <span className="text-primary">✓</span>}
                        </button>
                    </li>
                ))}
                <li className="menu-title mt-2">
                    <span className="text-xs font-bold opacity-60">Dark Themes</span>
                </li>
                {THEMES.dark.map((t) => (
                    <li key={t}>
                        <button
                            onClick={() => handleThemeChange(t)}
                            className={`${theme === t ? 'active' : ''}`}
                            data-theme={t}
                        >
                            <span className="flex-1 capitalize">{t}</span>
                            {theme === t && <span className="text-primary">✓</span>}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
