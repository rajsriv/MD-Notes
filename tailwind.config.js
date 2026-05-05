export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.slate.300'),
            a: {
              color: theme('colors.blue.400'),
              '&:hover': {
                color: theme('colors.blue.300'),
              },
            },
            h1: { color: theme('colors.slate.100') },
            h2: { color: theme('colors.slate.100') },
            h3: { color: theme('colors.slate.100') },
            h4: { color: theme('colors.slate.100') },
            strong: { color: theme('colors.slate.100') },
            code: { color: theme('colors.slate.200') },
            blockquote: {
              color: theme('colors.slate.400'),
              borderLeftColor: theme('colors.slate.600'),
            },
          },
        },
      }),
    },
  },
  plugins: [],
}