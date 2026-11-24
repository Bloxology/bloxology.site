import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '@/components/Seo.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { blogPosts } from '@/lib/content.js';
import { collectionSchema } from '@/lib/seo.js';
import { SITE_URL } from '@/lib/guides.js';

const title = 'Bloxology Blog | Base DeFi Insights';
const description = 'Product updates, DeFi education, and practical insights from Bloxology.';

const BlogPage = () => (
  <>
    <Seo
      title={title}
      description={description}
      url={`${SITE_URL}/blog`}
      schemas={[
        collectionSchema({
          name: 'Bloxology Blog',
          description,
          url: `${SITE_URL}/blog`,
          items: blogPosts.map((post) => ({ name: post.title, url: post.url })),
        }),
      ]}
    />
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-balance">Blog</h1>
          <p className="text-lg text-[var(--text-secondary)] font-medium">{description}</p>
        </header>
        {blogPosts.map((post) => (
          <Card key={post.slug} className="glass-card border-border/50">
            <CardHeader>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                {post.datePublished}
              </p>
              <CardTitle>
                <Link className="hover:underline" to={post.url.replace(SITE_URL, '')}>
                  {post.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[var(--text-secondary)] font-medium">
              <p>{post.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </>
);

export default BlogPage;
