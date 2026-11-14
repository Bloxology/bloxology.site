import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '@/components/Seo.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { guides, guidePath, guideUrl, SITE_URL } from '@/lib/guides.js';
import { breadcrumbSchema, collectionSchema } from '@/lib/seo.js';

const title = 'DeFi Guides for Base Network | Bloxology';
const description = 'Educational guides on swapping, liquidity and trading on Base Mainnet with Bloxology.';

const GuidesIndexPage = () => (
  <>
    <Seo
      title={title}
      description={description}
      url={`${SITE_URL}/guides`}
      schemas={[
        breadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Guides', url: `${SITE_URL}/guides` },
        ]),
        collectionSchema({
          name: 'Bloxology Guides',
          description,
          url: `${SITE_URL}/guides`,
          items: guides.map((g) => ({ name: g.title, url: guideUrl(g.slug) })),
        }),
      ]}
    />
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-balance" style={{ letterSpacing: '-0.02em' }}>
            Guides
          </h1>
          <p className="text-lg text-[var(--text-secondary)] font-medium">{description}</p>
        </header>
        {guides.map((g) => (
          <Card key={g.slug} className="glass-card border-border/50">
            <CardHeader>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">{g.category}</p>
              <CardTitle>
                <Link className="hover:underline" to={guidePath(g.slug)}>{g.title}</Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[var(--text-secondary)] font-medium">
              <p>{g.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </>
);

export default GuidesIndexPage;
