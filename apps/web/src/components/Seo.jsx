import React from 'react';
import { Helmet } from 'react-helmet';
import { DEFAULT_OG_IMAGE } from '@/lib/guides.js';

const Seo = ({ title, description, url, type = 'website', image = DEFAULT_OG_IMAGE, schemas = [], noindex = false }) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={url} />
    {noindex && <meta name="robots" content="noindex,nofollow" />}
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content={type} />
    <meta property="og:url" content={url} />
    <meta property="og:image" content={image} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={image} />
    {schemas.map((schema, i) => (
      <script key={i} type="application/ld+json">{JSON.stringify(schema)}</script>
    ))}
  </Helmet>
);

export default Seo;
