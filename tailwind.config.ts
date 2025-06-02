
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(0 0% 20%)',
				input: 'hsl(0 0% 20%)',
				ring: 'hsl(45 100% 50%)',
				background: 'hsl(0 0% 100%)',
				foreground: 'hsl(0 0% 0%)',
				primary: {
					DEFAULT: 'hsl(45 100% 50%)',
					foreground: 'hsl(0 0% 0%)'
				},
				secondary: {
					DEFAULT: 'hsl(45 100% 95%)',
					foreground: 'hsl(0 0% 0%)'
				},
				destructive: {
					DEFAULT: 'hsl(0 84.2% 60.2%)',
					foreground: 'hsl(0 0% 98%)'
				},
				muted: {
					DEFAULT: 'hsl(45 50% 96%)',
					foreground: 'hsl(0 0% 20%)'
				},
				accent: {
					DEFAULT: 'hsl(45 100% 90%)',
					foreground: 'hsl(0 0% 0%)'
				},
				popover: {
					DEFAULT: 'hsl(0 0% 100%)',
					foreground: 'hsl(0 0% 0%)'
				},
				card: {
					DEFAULT: 'hsl(0 0% 100%)',
					foreground: 'hsl(0 0% 0%)'
				},
				sidebar: {
					DEFAULT: 'hsl(45 100% 98%)',
					foreground: 'hsl(0 0% 0%)',
					primary: 'hsl(45 100% 50%)',
					'primary-foreground': 'hsl(0 0% 0%)',
					accent: 'hsl(45 100% 95%)',
					'accent-foreground': 'hsl(0 0% 0%)',
					border: 'hsl(0 0% 20%)',
					ring: 'hsl(45 100% 50%)'
				},
				yellow: {
					DEFAULT: 'hsl(45 100% 50%)',
					50: 'hsl(45 100% 98%)',
					100: 'hsl(45 100% 95%)',
					200: 'hsl(45 100% 90%)',
					300: 'hsl(45 100% 80%)',
					400: 'hsl(45 100% 65%)',
					500: 'hsl(45 100% 50%)',
					600: 'hsl(45 100% 40%)',
					700: 'hsl(45 100% 30%)',
					800: 'hsl(45 100% 20%)',
					900: 'hsl(45 100% 10%)',
					950: 'hsl(45 100% 5%)'
				},
				black: {
					DEFAULT: 'hsl(0 0% 0%)',
					50: 'hsl(0 0% 95%)',
					100: 'hsl(0 0% 90%)',
					200: 'hsl(0 0% 80%)',
					300: 'hsl(0 0% 70%)',
					400: 'hsl(0 0% 60%)',
					500: 'hsl(0 0% 50%)',
					600: 'hsl(0 0% 40%)',
					700: 'hsl(0 0% 30%)',
					800: 'hsl(0 0% 20%)',
					900: 'hsl(0 0% 10%)',
					950: 'hsl(0 0% 5%)'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
