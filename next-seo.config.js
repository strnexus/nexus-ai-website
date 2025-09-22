/** @type {import('next-seo').DefaultSeoProps} */
const defaultSEOConfig = {
  title: 'Nexus AI Automation Agency - Advanced AI Solutions & Lead Generation',
  description: 'Transform your business with Nexus AI Automation Agency. Expert AI automation, intelligent lead generation, and ElevenLabs voice agents. Boost efficiency and conversions with cutting-edge AI technology.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nexusai-agency.com',
    siteName: 'Nexus AI Automation Agency',
    images: [
      {
        url: 'https://nexusai-agency.com/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Nexus AI Automation Agency - AI Solutions & Lead Generation',
      },
    ],
  },
  twitter: {
    handle: '@nexusai',
    site: '@nexusai',
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'keywords',
      content: 'AI automation, lead generation, voice agents, ElevenLabs, business automation, AI solutions, chatbots, conversion optimization, artificial intelligence, machine learning, automated sales, customer acquisition',
    },
    {
      name: 'author',
      content: 'Nexus AI Automation Agency',
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, shrink-to-fit=no',
    },
    {
      name: 'theme-color',
      content: '#4F46E5',
    },
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'black-translucent',
    },
  ],
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon.png',
      sizes: '180x180',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      href: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      href: '/favicon-16x16.png',
    },
    {
      rel: 'manifest',
      href: '/site.webmanifest',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous',
    },
  ],
}

export default defaultSEOConfig