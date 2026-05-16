import { createContext, useContext, useEffect, useState } from "react"

// Create Context
const ThemeContext = createContext({
    theme: "system",
    setTheme: (theme: string) => { },
})

// Provider using local storage / system preference (Simplified mold match)
export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
    ...props
}: any) {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem(storageKey) || defaultTheme
    })

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark")

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light"

            root.classList.add(systemTheme)
            return
        }

        root.classList.add(theme)
    }, [theme])

    const value = {
        theme,
        setTheme: (theme: string) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
    }

    return (
        <ThemeContext.Provider {...props} value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
