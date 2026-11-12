import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowRight, Award, Coins, Droplets, Repeat2, Users, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const QUEST_TYPES = [
  {
    icon: Repeat2,
    title: 'First swap',
    description: 'Learn the swap flow and complete your first token swap on Bloxology.'
  },
  {
    icon: Repeat2,
    title: 'Swap streak',
    description: 'Build your onchain confidence with a multi-swap challenge, such as five swaps within a campaign period.'
  },
  {
    icon: Droplets,
    title: 'Liquidity explorer',
    description: 'Learn how liquidity provision works. Only participate when a live campaign clearly lists an eligible pool.'
  },
  {
    icon: Users,
    title: 'Community builder',
    description: 'Help others discover Bloxology through campaign-approved referrals and social activities.'
  }
];

const REWARD_TYPES = [
  {
    icon: Award,
    title: 'Badges',
    description: 'Collectible recognition for completing campaign milestones.'
  },
  {
    icon: Coins,
    title: 'Points and tokens',
    description: 'A campaign may offer points or token rewards with published eligibility and terms.'
  },
  {
    icon: Users,
    title: 'Community recognition',
    description: 'Leaderboards can highlight participation when a campaign includes them.'
  }
];

const QUEST_STEPS = [
  'Connect a supported wallet and review the swap guide.',
  'Choose your tokens and network, then carefully review the transaction details.',
  'Complete the swap when you are ready. Never trade solely to chase a reward.',
  'Check the official campaign page for eligibility and completion status when a quest is live.'
];

const QuestsPage = () => (
  <>
    <Helmet>
      <title>Quests &amp; Rewards - Bloxology</title>
      <meta
        name="description"
        content="Learn how Bloxology quests work, prepare for your first swap, and check campaign status and reward terms."
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
            <Award className="h-8 w-8 text-white" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Learn · swap · participate</p>
          <h1 className="text-4xl md:text-5xl font-bold text-balance" style={{ letterSpacing: '-0.02em' }}>
            Bloxology Quests
          </h1>
          <p className="text-lg text-[var(--text-secondary)] font-medium max-w-3xl mx-auto">
            Get comfortable with your first swap and see how community campaigns can reward useful onchain learning.
          </p>
        </motion.div>

        <section aria-labelledby="campaign-status-heading">
          <Card className="glass-card border-primary/30">
            <CardContent className="p-6 md:p-8 space-y-3">
              <p className="text-sm font-bold uppercase tracking-widest text-primary">Campaign status</p>
              <h2 id="campaign-status-heading" className="text-2xl font-bold text-[var(--text-primary)]">
                No quests are live right now
              </h2>
              <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                Galxe and Layer3 campaigns are not currently available through Bloxology. We’ll share official campaign
                links and rules here when a campaign is ready. Swaps made before then are not eligible for future
                rewards unless the published campaign terms explicitly say otherwise.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-5" aria-labelledby="quest-types-heading">
          <div className="text-center space-y-2">
            <h2 id="quest-types-heading" className="text-2xl font-bold text-[var(--text-primary)]">
              Quest ideas
            </h2>
            <p className="text-[var(--text-secondary)] font-medium">
              Future campaigns may include activities like these; none are currently earning rewards.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUEST_TYPES.map(({ icon: Icon, title, description }) => (
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

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Your first-swap path</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {QUEST_STEPS.map((step, index) => (
                  <li key={step} className="flex items-start gap-3 text-[var(--text-secondary)] font-medium">
                    <span className="w-7 h-7 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link to="/swap">
                  <Button className="crypto-gradient text-white font-bold">
                    Explore swaps
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/guides/base-mainnet-token-swap-low-fees">
                  <Button variant="outline">Read the swap guide</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-[var(--text-primary)]">Possible reward formats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {REWARD_TYPES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="w-9 h-9 shrink-0 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)]">{title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] font-medium">{description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <p className="text-center text-sm text-[var(--text-muted)] max-w-3xl mx-auto">
          Quest ideas are not offers or guarantees. Any live campaign will have its own eligibility, timing, reward,
          network, and participation terms. Consider network fees and transaction risks before using DeFi.
        </p>

        <div className="flex justify-center">
          <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
            Questions about community campaigns?
            <Wallet className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  </>
);

export default QuestsPage;
