/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#59f20d",
                "background-dark": "#070a06",
                "surface-dark": "#0d160a",
                "surface-highlight": "#1a2b15",
            },
            fontFamily: {
                "display": ["Space Grotesk", "sans-serif"],
            },
            backgroundImage: {
                'scanlines': 'linear-gradient(rgba(89, 242, 13, 0.05) 50%, rgba(0, 0, 0, 0.3) 50%)',
            }
        },
    },
    plugins: [],
}
