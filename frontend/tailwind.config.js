/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                vpurple: {
                    light: '#8b5cf6',
                    DEFAULT: '#7c3aed',
                    dark: '#6d28d9',
                },
                vpink: {
                    light: '#ec4899',
                    DEFAULT: '#db2777',
                    dark: '#be185d',
                },
                vblue: {
                    light: '#3b82f6',
                    DEFAULT: '#2563eb',
                    dark: '#1d4ed8',
                }
            },
            animation: {
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(124, 58, 237, 0.2)' },
                    '100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.6)' },
                }
            }
        },
    },
    plugins: [],
}
