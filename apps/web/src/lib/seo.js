import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/guides.js';

const CONTEXT = 'https://schema.org';

export const breadcrumbSchema = (items) => ({
  '@context': CONTEXT,
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: item.url,
  })),
});

export const articleSchema = ({ title, description, url, datePublished, dateModified, image = DEFAULT_OG_IMAGE }) => ({
  '@context': CONTEXT,
  '@type': 'Article',
  headline: title,
  description,
  image,
  datePublished,
  dateModified: dateModified || datePublished,
  mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: DEFAULT_OG_IMAGE },
  },
});

export const howToSchema = ({ name, description, totalTime, steps }) => ({
  '@context': CONTEXT,
  '@type': 'HowTo',
  name,
  description,
  ...(totalTime ? { totalTime } : {}),
  step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text })),
});

export const faqSchema = (faqs) => ({
  '@context': CONTEXT,
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
});

export const collectionSchema = ({ name, description, url, items }) => ({
  '@context': CONTEXT,
  '@type': 'CollectionPage',
  name,
  description,
  url,
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, url: it.url, name: it.name })),
  },
});
