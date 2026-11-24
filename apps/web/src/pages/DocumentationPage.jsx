import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '@/components/Seo.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { documentationSections } from '@/lib/content.js';
import { collectionSchema } from '@/lib/seo.js';
import { SITE_URL } from '@/lib/guides.js';

const title = 'Bloxology Documentation';
const description = 'Documentation and learning resources for using Bloxology DeFi tools.';

const DocumentationPage = () => (
  <>
    <Seo
      title={title}
      description={description}
      url={`${SITE_URL}/docs`}
      schemas={[
        collectionSchema({
          name: title,
          description,
          url: `${SITE_URL}/docs`,
          items: documentationSections.map((section) => ({
            name: section.title,
            url: `${SITE_URL}${section.url}`,
          })),
        }),
      ]}
    />
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-balance">Documentation</h1>
          <p className="text-lg text-[var(--text-secondary)] font-medium">{description}</p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {documentationSections.map((section) => (
            <Card key={section.url} className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>
                  <Link className="hover:underline" to={section.url}>{section.title}</Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-[var(--text-secondary)] font-medium">
                <p>{section.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </>
);

export default DocumentationPage;
