import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CreditCard, ShieldCheck, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const BENEFITS = [
  {
    icon: Zap,
    title: 'Faster Checkout',
    description: 'Reduce transaction friction and keep your line moving with quick digital payments.'
  },
  {
    icon: CreditCard,
    title: 'More Payment Options',
    description: 'Accept modern payment methods so customers can pay the way they prefer.'
  },
  {
    icon: TrendingUp,
    title: 'Revenue Visibility',
    description: 'Track incoming payments with confidence and stay in control of cash flow.'
  },
  {
    icon: ShieldCheck,
    title: 'Secure by Design',
    description: 'Built with security-first infrastructure to protect your business and customers.'
  }
];

const PaymentsPage = () => {
  return (
    <>
      <Helmet>
        <title>Bloxology Payments</title>
        <meta
          name="description"
          content="Bloxology Payments helps small businesses accept fast, secure digital payments with simple setup and scalable tools."
        />
      </Helmet>

      <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-balance" style={{ letterSpacing: '-0.02em' }}>
              Bloxology Payments
            </h1>
            <p className="text-xl text-[var(--text-secondary)] font-medium max-w-3xl mx-auto leading-relaxed">
              Empower your business with fast, secure, and seamless digital payments built for local shops and growing teams.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-[var(--text-primary)]">Why Bloxology Payments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-[var(--text-secondary)] font-medium leading-relaxed">
                <p>
                  Empower your business with Bloxology Payments—a fast, secure, and seamless way for small businesses to accept modern digital payments.
                </p>
                <p>
                  By reducing transaction friction and expanding your payment options, Bloxology allows you to reach a broader customer base, speed up checkout times, and manage your incoming revenue with complete confidence.
                </p>
                <p>
                  Simple to set up and easy to scale, Bloxology gives local shops and growing companies the toolset they need to thrive in today’s digital-first economy.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="glass-card border-border/50 h-full">
                  <CardContent className="p-6 space-y-3">
                    <div className="w-12 h-12 rounded-lg crypto-gradient flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">{benefit.title}</h2>
                    <p className="text-sm text-[var(--text-secondary)] font-medium">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-center pt-2"
          >
            <Link to="/contact">
              <Button className="crypto-gradient text-white font-bold px-6">Talk to our team</Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PaymentsPage;
