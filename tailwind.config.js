/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
  	extend: {
  		keyframes: {
  			'key-press': {
  				'0%': {
  					filter: 'brightness(1)'
  				},
  				'50%': {
  					filter: 'brightness(1.1)'
  				},
  				'100%': {
  					filter: 'brightness(1)'
  				}
  			}
  		},
  		animation: {
  			'key-press': 'key-press 0.15s ease-in-out'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {}
  	}
  },
  plugins: [require("tailwindcss-animate")]
}
