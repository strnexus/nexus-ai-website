import { NextSeo, OrganizationJsonLd, LocalBusinessJsonLd } from 'next-seo'

interface SEOHeadProps {
  title?: string
  description?: string
  canonical?: string
  openGraph?: {
    title?: string
    description?: string
    image?: string
    type?: string
  }
  noindex?: boolean
}

const defaultTitle = 'Nexus AI Automation Agency - Advanced AI Solutions & Lead Generation'
const defaultDescription = 
  'Transform your business with Nexus AI Automation Agency. Expert AI automation, intelligent lead generation, and ElevenLabs voice agents. Boost efficiency and conversions with cutting-edge AI technology.'

const siteUrl = 'https://nexusai-agency.com' // Update with actual domain

export default function SEOHead({
  title,
  description = defaultDescription,
  canonical,
  openGraph,
  noindex = false,
}: SEOHeadProps) {
  const pageTitle = title ? `${title} | Nexus AI Automation Agency` : defaultTitle

  return (
    <>
      <NextSeo
        title={pageTitle}
        description={description}
        canonical={canonical || siteUrl}
        noindex={noindex}
        openGraph={{
          type: 'website',
          locale: 'en_US',
          url: canonical || siteUrl,
          siteName: 'Nexus AI Automation Agency',
          title: openGraph?.title || pageTitle,
          description: openGraph?.description || description,
          images: [
            {
              url: openGraph?.image || `${siteUrl}/images/og-default.jpg`,
              width: 1200,
              height: 630,
              alt: 'Nexus AI Automation Agency',
            },
          ],
        }}
        twitter={{
          handle: '@nexusai',
          site: '@nexusai',
          cardType: 'summary_large_image',
        }}
        additionalMetaTags={[
          {
            name: 'keywords',
            content: 'AI automation, lead generation, voice agents, ElevenLabs, business automation, AI solutions, chatbots, conversion optimization, artificial intelligence',
          },
          {
            name: 'author',
            content: 'Nexus AI Automation Agency',
          },
          {
            name: 'robots',
            content: noindex ? 'noindex,nofollow' : 'index,follow',
          },
          {
            name: 'viewport',
            content: 'width=device-width, initial-scale=1',
          },
          {
            name: 'theme-color',
            content: '#4F46E5',
          },
        ]}
        additionalLinkTags={[
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
            rel: 'manifest',
            href: '/site.webmanifest',
          },
        ]}
      />
      
      <OrganizationJsonLd
        type="Organization"
        id={siteUrl}
        name="Nexus AI Automation Agency"
        url={siteUrl}
        logo={`${siteUrl}/images/logo.png`}
        sameAs={[
          'https://linkedin.com/company/nexus-ai-automation',
          'https://twitter.com/nexusai',
        ]}
        contactPoint={[
          {
            telephone: '+1-555-AI-NEXUS',
            contactType: 'customer service',
            availableLanguage: 'English',
          },
        ]}
        description="Leading AI automation agency specializing in intelligent lead generation, voice agents, and business process automation using cutting-edge artificial intelligence technology."
      />
      
      <LocalBusinessJsonLd
        type="ProfessionalService"
        id={`${siteUrl}/business`}
        name="Nexus AI Automation Agency"
        description="Professional AI automation and lead generation services"
        url={siteUrl}
        telephone="+1-555-AI-NEXUS"
        address={{
          streetAddress: '123 AI Innovation Drive',
          addressLocality: 'Tech City',
          addressRegion: 'CA',
          postalCode: '90210',
          addressCountry: 'US',
        }}
        openingHours={[
          {
            opens: '09:00',
            closes: '18:00',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          },
        ]}
        sameAs={[
          'https://linkedin.com/company/nexus-ai-automation',
          'https://twitter.com/nexusai',
        ]}
      />
    </>
  )
}