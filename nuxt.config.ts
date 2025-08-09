// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/color-mode',
    '@nuxt/content',
    '@nuxtjs/i18n',
    '@nuxt/eslint',
    '@nuxt/image',
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
    strategy: 'prefix_and_default',
    langDir: './',
    defaultLocale: 'en',
    vueI18n: './i18n.options.ts',
  },

  colorMode: {
    classSuffix: '',
  },

  content: {
    locales: ['en', 'fr'],
    highlight: {
      theme: {
        default: 'vitesse-light',
        dark: 'vitesse-dark',
      },
    },
    markdown: {
      remarkPlugins: [
        'remark-external-links',
      ],
    },
  },

  runtimeConfig: {
    API_BASE_URL: process.env.NUXT_PUBLIC_API_BASE || "http://127.0.0.1:3000/",
    POCKETBASE_URL: process.env.POCKETBASE_URL,
    ENV: process.env.NODE_ENV || 'DEV',
    app: {
      devtools: {
        iframeProps: {
          allow: 'cross-origin-isolated',
          credentialless: true,
        },
      },
    },
  },

  image: {
    domains: ['127.0.0.1:8090']
  },
})