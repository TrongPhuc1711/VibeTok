/* @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
      extend: {
        colors: {
          primary:  '#ff2d78',
          accent:   '#ff6b35',
          base:     '#0a0a0f',
          surface:  '#111118',
          elevated: '#1a1a26',
          border:   '#1e1e2e',
          border2:  '#2a2a3e',
          'text-primary':   '#ffffff',
          'text-secondary': '#888888',
          'text-muted':     '#666666',
          'text-faint':     '#555555',
          'text-subtle':    '#444444',
          'text-dim':       '#333333',
        },
        fontFamily: {
          display: ["'Syne'", 'sans-serif'],
          body:    ["'DM Sans'", 'sans-serif'],
        },
        backgroundImage: {
          'brand-gradient': 'linear-gradient(135deg,#ff2d78,#ff6b35)',
        },
      },
    },
    plugins: [],
  };