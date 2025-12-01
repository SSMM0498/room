// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  routeRules: {
    '/': { ssr: true },
    '/about': { ssr: true },
    '/contact': { ssr: true },
    '/terms': { ssr: true },
    '/privacy': { ssr: true },
    '/fr/': { ssr: true },
    '/fr/about': { ssr: true },
    '/fr/contact': { ssr: true },
    '/fr/terms': { ssr: true },
    '/fr/privacy': { ssr: true }
  },
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],

  i18n: {
    locales: [{
      code: 'en',
      iso: 'en-US',
      name: 'English(US)',
      file: 'en.json'
    },
    {
      code: 'fr',
      iso: 'fr-FR',
      name: 'Français',
      file: 'fr.json'
    }],
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    langDir: './',
    vueI18n: './i18n.options.ts',
  },

  colorMode: {
    classSuffix: '',
  },

  css: ['~/assets/css/main.css'],

  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: 'vitesse-light',
            dark: 'vitesse-dark',
          },
        },
        remarkPlugins: {
          'rehype-external-links': {}
        }
      },
    }
  },
  devServer: {
    host: '0.0.0.0',
    port: Number(process.env.NUXT_PORT) || 5555,
  },
  runtimeConfig: {
    API_BASE_URL: process.env.NUXT_PUBLIC_API_BASE || "http://127.0.0.1:5555/",

    POCKETBASE_URL: process.env.POCKETBASE_URL,
    POCKETBASE_ADMIN_EMAIL: process.env.POCKETBASE_ADMIN_EMAIL,
    POCKETBASE_ADMIN_PASSWORD: process.env.POCKETBASE_ADMIN_PASSWORD,

    MINIO_URL: process.env.MINIO_URL,
    MINIO_PORT: process.env.MINIO_PORT,
    MINIO_BUCKET: process.env.MINIO_BUCKET,
    MINIO_ROOT_USER: process.env.MINIO_ROOT_USER,
    MINIO_ROOT_PASSWORD: process.env.MINIO_ROOT_PASSWORD,

    NODE_ENV: process.env.NODE_ENV || 'DEV',
    COOKIE_NAME: process.env.COOKIE_NAME || "__room_session",
    COOKIE_SECRET: process.env.COOKIE_SECRET || "secret",
    public: {
      APP_NAME: process.env.APP_NAME || "room",
      ENV: process.env.ENV || 'DEV',
    },
  }
})