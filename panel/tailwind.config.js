const colors = require('tailwindcss/colors');

const gray = {
    50: 'hsl(216, 33%, 97%)',
    100: 'hsl(214, 15%, 91%)',
    200: 'hsl(210, 16%, 82%)',
    300: 'hsl(211, 13%, 65%)',
    400: 'hsl(211, 10%, 53%)',
    500: 'hsl(211, 12%, 43%)',
    600: 'hsl(209, 14%, 37%)',
    700: 'hsl(209, 18%, 30%)',
    800: 'hsl(209, 20%, 25%)',
    900: 'hsl(210, 24%, 16%)',
};

module.exports = {
    content: [
        './resources/scripts/**/*.{js,ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                black: '#131a20',
                primary: colors.blue,
                gray: gray,
                neutral: {
                    50: '#eef1f8',
                    100: '#e2e7f3',
                    200: '#cbd3e6',
                    300: '#a7b1c9',
                    400: '#8794b0',
                    500: '#6b7698',
                    600: '#2a3350',
                    700: '#111a32',
                    800: '#0d1326',
                    900: '#0a0f1e',
                },
                cyan: colors.cyan,
                brand: {
                    50: '#f1edff',
                    100: '#e5dcff',
                    200: '#cbbdff',
                    300: '#b9a8ff',
                    400: '#9d80ff',
                    500: '#7c5cff',
                    600: '#6a48f5',
                    700: '#5636d6',
                    800: '#452ca8',
                    900: '#2f1e73',
                },
                accent: {
                    400: '#67e8f9',
                    500: '#22d3ee',
                    600: '#0e7490',
                },
            },
            fontFamily: {
                header: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                xl: '1.25rem',
                '2xl': '1.5rem',
                '3xl': '1.75rem',
            },
            boxShadow: {
                aurora: '0 0 0 1px rgba(124,92,255,.2), 0 24px 70px -28px rgba(124,92,255,.55)',
            },
            fontSize: {
                '2xs': '0.625rem',
            },
            transitionDuration: {
                250: '250ms',
            },
            borderColor: theme => ({
                default: theme('colors.neutral.400', 'currentColor'),
            }),
        },
    },
    plugins: [
        require('@tailwindcss/line-clamp'),
        require('@tailwindcss/forms')({
            strategy: 'class',
        }),
    ]
};
