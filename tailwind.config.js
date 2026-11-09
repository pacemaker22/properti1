/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Exact tokens from Properti1-DESIGN.md section 2.
        primary: {
          500: '#16A34A',
          600: '#15803D',
        },
        navy: '#0F172A',
        'text-dark': '#1E293B',
        'text-grey': '#64748B',
        'page-bg': '#F8FAFC',
        'card-bg': '#FFFFFF',
        'border-brand': '#E2E8F0',
        'badge-dijual': '#16A34A',
        'badge-disewa': '#2563EB',
        'badge-terjual': '#64748B',
        'badge-baru': '#F59E0B',
        'heart-active': '#EF4444',
        'error-red': '#DC2626',
        'success-green': '#16A34A',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
