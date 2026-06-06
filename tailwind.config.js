/** @type {import('tailwindcss').Config} */
// Tailwind 自定义配置 - 暗金/深蓝主题
// 设计参考:得到 App、樊登读书
// 原则:专业、暗色、金色点缀,避免儿童蓝紫
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // 主背景 - 深蓝接近黑
        ink: {
          50:  '#f5f6fa',
          100: '#e5e7ee',
          200: '#c7cbd6',
          300: '#9ba0b3',
          400: '#6a7088',
          500: '#3f4661',
          600: '#2a2f47',
          700: '#1c2036',
          800: '#12162a',
          900: '#0a0d1f',
          950: '#060814',
        },
        // 暗金主色调
        gold: {
          50:  '#fbf7e8',
          100: '#f4ecbe',
          200: '#e8d77f',
          300: '#d9bd49',
          400: '#c8a52a',
          500: '#a8841c',
          600: '#866516',
          700: '#664a12',
          800: '#47330e',
          900: '#2c2009',
        },
        // 辅助 - 钢蓝/雾蓝
        steel: {
          50:  '#eef2f7',
          100: '#d6dfeb',
          200: '#aebed5',
          300: '#7e95b8',
          400: '#5873a0',
          500: '#3d5787',
          600: '#2e4368',
          700: '#22324d',
          800: '#172238',
          900: '#0d1424',
        },
        // 性格配色 - 4 种 AI 老师
        persona: {
          analyst: '#3d5787',  // 理性分析师 - 钢蓝
          warm:    '#c8956d',  // 暖心学姐 - 暖橙
          advisor: '#a8841c',  // 资深顾问 - 暗金
          strict:  '#8a3b46',  // 严苛督学 - 暗红
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"ZCOOL XiaoWei"', '"Noto Serif SC"', 'serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 24px rgba(200, 165, 42, 0.18)',
        'inner-deep': 'inset 0 2px 8px rgba(0, 0, 0, 0.35)',
      },
      backgroundImage: {
        'gold-shine': 'linear-gradient(135deg, #c8a52a 0%, #e8d77f 50%, #a8841c 100%)',
        'ink-grad':   'linear-gradient(180deg, #0a0d1f 0%, #12162a 60%, #1c2036 100%)',
        'panel-grad': 'linear-gradient(180deg, rgba(31, 36, 60, 0.85) 0%, rgba(18, 22, 42, 0.95) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: 0.6 }, '50%': { opacity: 1 } },
      },
    },
  },
  plugins: [],
}
