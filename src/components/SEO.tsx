import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    tags?: string[];
  };
  noindex?: boolean;
}

const DEFAULT_SEO = {
  title: 'SPARK Business Buddy - AI-Powered Canadian Business Ideas',
  description: 'Discover personalized business ideas tailored to your Canadian province. Get market insights, registration guidance, and AI-powered recommendations to start your entrepreneurial journey.',
  keywords: [
    'canadian business ideas',
    'business opportunities canada',
    'start a business canada',
    'AI business ideas',
    'entrepreneurship canada',
    'small business canada',
    'business registration canada',
  ],
  image: '/og-image.jpg', // You'll need to create this
  url: 'https://sparkbusinessbuddy.ca', // Update with actual domain
  siteName: 'SPARK Business Buddy',
  twitterHandle: '@sparkbusiness', // Update with actual handle
};

/**
 * SEO Component
 * Manages meta tags, Open Graph, Twitter Cards, and structured data
 */
export const SEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  article,
  noindex = false,
}: SEOProps) => {
  const seo = {
    title: title ? `${title} | ${DEFAULT_SEO.siteName}` : DEFAULT_SEO.title,
    description: description || DEFAULT_SEO.description,
    keywords: keywords || DEFAULT_SEO.keywords,
    image: image || DEFAULT_SEO.image,
    url: url || DEFAULT_SEO.url,
  };

  const fullImageUrl = seo.image.startsWith('http')
    ? seo.image
    : `${DEFAULT_SEO.url}${seo.image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords.join(', ')} />

      {/* Canonical URL */}
      <link rel="canonical" href={seo.url} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content={DEFAULT_SEO.siteName} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={seo.url} />
      <meta property="og:locale" content="en_CA" />

      {/* Article specific */}
      {type === 'article' && article && (
        <>
          {article.publishedTime && (
            <meta property="article:published_time" content={article.publishedTime} />
          )}
          {article.modifiedTime && (
            <meta property="article:modified_time" content={article.modifiedTime} />
          )}
          {article.author && <meta property="article:author" content={article.author} />}
          {article.tags?.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={DEFAULT_SEO.twitterHandle} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Additional Meta */}
      <meta name="author" content="SPARK Business Buddy" />
      <meta name="language" content="English" />
      <meta name="geo.region" content="CA" />
      <meta name="geo.placename" content="Canada" />
    </Helmet>
  );
};

/**
 * Structured Data Component
 * JSON-LD schema markup for SEO
 */
export const StructuredData = ({ type, data }: { type: string; data: any }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

/**
 * Organization Schema
 */
export const OrganizationSchema = () => {
  return (
    <StructuredData
      type="Organization"
      data={{
        name: 'SPARK Business Buddy',
        url: DEFAULT_SEO.url,
        logo: `${DEFAULT_SEO.url}/logo.png`,
        sameAs: [
          // Add social media URLs
          'https://twitter.com/sparkbusiness',
          'https://linkedin.com/company/sparkbusiness',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'support@sparkbusinessbuddy.ca',
          availableLanguage: ['en', 'fr'],
        },
      }}
    />
  );
};

/**
 * Product/Service Schema
 */
export const ServiceSchema = () => {
  return (
    <StructuredData
      type="Service"
      data={{
        name: 'AI Business Idea Generator',
        provider: {
          '@type': 'Organization',
          name: 'SPARK Business Buddy',
        },
        areaServed: {
          '@type': 'Country',
          name: 'Canada',
        },
        description: DEFAULT_SEO.description,
        serviceType: 'Business Consulting',
      }}
    />
  );
};

/**
 * FAQ Schema
 */
export const FAQSchema = ({ faqs }: { faqs: Array<{ question: string; answer: string }> }) => {
  return (
    <StructuredData
      type="FAQPage"
      data={{
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }}
    />
  );
};

/**
 * Breadcrumb Schema
 */
export const BreadcrumbSchema = ({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) => {
  return (
    <StructuredData
      type="BreadcrumbList"
      data={{
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
};

/**
 * SoftwareApplication Schema
 */
export const SoftwareApplicationSchema = () => {
  return (
    <StructuredData
      type="SoftwareApplication"
      data={{
        name: 'SPARK Business Buddy',
        operatingSystem: 'Web',
        applicationCategory: 'BusinessApplication',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'CAD',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '1000',
        },
      }}
    />
  );
};
