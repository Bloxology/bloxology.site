import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, Store, BadgeDollarSign, ShieldCheck, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PAYMENT_BENEFITS = [
  {
    icon: BadgeDollarSign,
    title: 'Fast Settlements',
    description: 'Accept digital payments and settle quickly with transparent on-chain transactions.'
  },
  {
    icon: ShieldCheck,
    title: 'Secure by Design',
    description: 'Built with non-custodial wallet flows so your business stays in control.'
  },
  {
    icon: Store,
    title: 'Small Business Ready',
    description: 'Use Bloxology as a modern payment option for storefronts, events, and online orders.'
  }
];

const HOW_IT_WORKS = [
  'Set up your business wallet and connect it to Bloxology.',
  'Display your acceptance badge for in-store or online checkout.',
  'Receive payments and track transactions from your dashboard.'
];

const BusinessPaymentsPage = () => {
  const canonicalUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/payments` : 'https://bloxology.site/payments';

  return (
    <>
      <Helmet>
        <title>Accept Payments - Bloxology</title>
        <meta
          name="description"
          content="Help your small business accept digital payments with Bloxology using secure, transparent wallet-based transactions."
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-3"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-balance" style={{ letterSpacing: '-0.02em' }}>
              Accept Payments with Bloxology
            </h1>
            <p className="text-lg text-[var(--text-secondary)] font-medium max-w-3xl mx-auto">
              Built for small businesses that want a modern way to accept secure digital payments.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="glass-card border-primary/30 overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <img
                  src="/bloxology-payments.png"
                  alt="Bloxology accepted here sign for merchants"
                  className="w-full h-auto rounded-xl border border-border/40"
                />
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {PAYMENT_BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + index * 0.05 }}
                >
                  <Card className="glass-card border-border/50 h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                        <Icon className="h-5 w-5 text-primary" />
                        {benefit.title}
                      </CardTitle>
                      <CardDescription className="text-[var(--text-secondary)] font-medium">
                        {benefit.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-[var(--text-primary)]">How to start</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {HOW_IT_WORKS.map((step, index) => (
                  <div key={step} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                    <p className="text-[var(--text-secondary)] font-medium">
                      <span className="font-bold text-[var(--text-primary)] mr-1">Step {index + 1}:</span>
                      {step}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <Card className="glass-card border-primary/30">
              <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">Ready to accept payments?</h2>
                  <p className="text-[var(--text-secondary)] font-medium">
                    Reach out to the Bloxology team to launch payments for your business.
                  </p>
                </div>
                <Button asChild className="crypto-gradient text-white font-bold">
                  <Link to="/contact">
                    Contact Bloxology
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default BusinessPaymentsPage;
