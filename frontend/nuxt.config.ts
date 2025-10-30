// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/color-mode',
    '@nuxt/content',
    '@nuxtjs/i18n',
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxtjs/mdc',
    '@nuxt/ui'
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

  runtimeConfig: {
    API_BASE_URL: process.env.NUXT_PUBLIC_API_BASE || "http://127.0.0.1:3000/",
    POCKETBASE_URL: process.env.POCKETBASE_URL,
    POCKETBASE_ADMIN_EMAIL: process.env.POCKETBASE_ADMIN_EMAIL,
    POCKETBASE_ADMIN_PASSWORD: process.env.POCKETBASE_ADMIN_PASSWORD,
    MINIO_URL: process.env.MINIO_URL,
    MINIO_PORT: process.env.MINIO_PORT,
    MINIO_BUCKET: process.env.MINIO_BUCKET,
    MINIO_ROOT_USER: process.env.MINIO_ROOT_USER,
    MINIO_ROOT_PASSWORD: process.env.MINIO_ROOT_PASSWORD,
    ENV: process.env.ENV || 'DEV',
    public: {
      ENV: process.env.ENV || 'DEV',
    },
    // app: {
    //   devtools: {
    //     iframeProps: {
    //       allow: 'cross-origin-isolated',
    //       credentialless: true,
    //     },
    //   },
    // },
  },

  // image: {
  //   domains: [process.env.POCKETBASE_URL || '127.0.0.1:8090']
  // },
})