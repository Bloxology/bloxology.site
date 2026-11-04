import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Droplets, Handshake, MessageCircle, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const OPPORTUNITIES = [
  {
    icon: Droplets,
    title: 'Liquidity partnerships',
    description: 'Explore Base token pairs, pool requirements, and incentive structures together. Pool launches are subject to technical review and mutual agreement.'
  },
  {
    icon: Megaphone,
    title: 'Co-marketing campaigns',
    description: 'Plan coordinated announcements, educational threads, and AMAs on X, with clear timelines and responsibilities for each team.'
  },
  {
    icon: MessageCircle,
    title: 'Community engagement',
    description: 'Bring partner communities together through Farcaster discussions, exclusive updates, and opportunities to share feedback.'
  },
  {
    icon: BarChart3,
    title: 'Shared success measures',
    description: 'Agree on engagement, referral conversions, pool participation, and TVL measures before a campaign so results can be reviewed together.'
  }
];

const PARTNERSHIP_STEPS = [
  'Share your protocol, audience, and goals with our team.',
  'Discuss fit, campaign scope, liquidity needs, and incentives.',
  'Agree on responsibilities, safeguards, and success measures.',
  'Launch together and review engagement and pool performance.'
];

const PartnershipsPage = () => (
  <>
    <Helmet>
      <title>Base Ecosystem Partnerships - Bloxology</title>
      <meta
        name="description"
        content="Explore liquidity and co-marketing partnerships with Bloxology for the Base ecosystem."
      />
    </Helmet>

    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-5"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl crypto-gradient flex items-center justify-center">
            <Handshake className="h-8 w-8 text-white" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Base ecosystem</p>
          <h1 className="text-4xl md:text-5xl font-bold text-balance" style={{ letterSpacing: '-0.02em' }}>
            Build together on Base
          </h1>
          <p className="text-lg text-[var(--text-secondary)] font-medium max-w-3xl mx-auto">
            Bloxology is exploring partnerships with Base protocols and token communities to grow liquidity and connect users through useful, coordinated campaigns.
          </p>
          <Link to="/contact">
            <Button className="crypto-gradient text-white font-bold">
              Discuss a partnership
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        <section className="space-y-5" aria-labelledby="opportunities-heading">
          <div className="text-center space-y-2">
            <h2 id="opportunities-heading" className="text-2xl font-bold text-[var(--text-primary)]">
              Ways to work together
            </h2>
            <p className="text-[var(--text-secondary)] font-medium">
              Shape each collaboration around complementary communities and shared goals.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OPPORTUNITIES.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="glass-card border-border/50 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-[var(--text-primary)]">
                    <span className="w-10 h-10 rounded-lg crypto-gradient flex items-center justify-center">
                      <Icon className="h-5 w-5 text-white" />
                    </span>
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-[var(--text-secondary)] font-medium leading-relaxed">
                  {description}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="process-heading">
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle id="process-heading" className="text-[var(--text-primary)]">
                From introduction to launch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PARTNERSHIP_STEPS.map((step, index) => (
                  <li key={step} className="flex items-start gap-3 text-[var(--text-secondary)] font-medium">
                    <span className="w-7 h-7 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>

        <p className="text-center text-sm text-[var(--text-muted)] max-w-3xl mx-auto">
          Partnership opportunities are exploratory. Pool availability, incentives, and campaign plans require separate technical review and agreement; this page does not represent existing partnerships or guaranteed returns.
        </p>
      </div>
    </div>
  </>
);

export default PartnershipsPage;
