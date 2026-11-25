tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                brand: {
                    // Paleta principal de la app
                    bgTop: '#F5ECE1',
                    bgMid: '#9CA6AD',
                    bgBottom: '#4F5D69',
                    surface: '#FFFFFF',
                    btnBg: '#DFCDAE',
                    navBg: '#EFE7D8',
                    textMain: '#1A2433',
                    textMuted: '#586573',

                    // Variantes de tarjetas y chips
                    beigeLight: '#EBE3D5',
                    beigeDark: '#D6CDBF',

                    // Indicadores de línea de tiempo (Metas)
                    timelineGreen: '#8EB29A',
                    timelineYellow: '#C79A5E',
                    timelineRed: '#C27A6D',

                    // Paleta específica de Login
                    'bg-top': '#e6dfd1',
                    'bg-bottom': '#4b5a66',
                    'logo-bg': '#e6d3b3',
                    'logo-dark': '#2a3b4c',
                    'text-dark': '#22303c',
                    'text-muted': '#7a8b9a',
                    'input-border': '#e5e7eb',
                    'btn-primary': '#dac3a1',
                    'btn-primary-hover': '#ceb693',
                    'btn-guest': '#eae3d5',
                    'btn-guest-hover': '#ddd5c5',
                    'error': '#ef4444'
                }
            },
            boxShadow: {
                'chip': '0 2px 0 0 rgba(214, 205, 191, 1)',
                'nav': '0 -4px 20px rgba(0, 0, 0, 0.05)',
                'card': '0 4px 15px rgba(0, 0, 0, 0.05)',
                'logo': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }
        }
    }
};