
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, ExternalLink, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ_ITEMS = [
  {
    question: 'How do I connect my wallet?',
    answer: 'Click the "Connect Wallet" button in the header. Select your preferred wallet provider (MetaMask, WalletConnect, etc.) and approve the connection request. Your wallet address will appear in the header once connected.'
  },
  {
    question: 'What blockchains does Bloxology support?',
    answer: 'Bloxology supports 7 major blockchain networks: Ethereum, Base, Polygon, Solana, Kava, Sonic, and Flow. You can switch between networks using the network selector in your dashboard.'
  },
  {
    question: 'How do I add liquidity to a pool?',
    answer: 'Navigate to the Liquidity Pool tab in DeFi Suite. Enter the token addresses for both tokens, specify the amounts you want to add, and click "Add Liquidity". Approve the transaction in your wallet to complete the process.'
  },
  {
    question: 'What is slippage tolerance?',
    answer: 'Slippage tolerance is the maximum price difference you are willing to accept between when you submit a transaction and when it is executed. A higher tolerance means your transaction is more likely to succeed, but you may get a worse price.'
  },
  {
    question: 'How do token swaps work?',
    answer: 'Token swaps allow you to exchange one cryptocurrency for another. Enter the token addresses, specify the amount, and click "Swap". The system will calculate the exchange rate and execute the trade through decentralized liquidity pools.'
  },
  {
    question: 'What are price alerts?',
    answer: 'Price alerts notify you when a token reaches your target price. Set alerts in the Price Chart tab by entering your desired price. You will receive a notification when the price crosses your threshold.'
  },
  {
    question: 'How does token locking work?',
    answer: 'Token locking allows you to lock tokens until a specific date. This is useful for vesting schedules or time-locked investments. Once locked, tokens cannot be withdrawn until the unlock date is reached.'
  },
  {
    question: 'Are there any fees?',
    answer: 'Bloxology does not charge platform fees. However, you will need to pay blockchain network fees (gas fees) for all transactions. These fees vary by network and current network congestion.'
  }
];

const GUIDES = [
  {
    title: 'How to add liquidity',
    steps: [
      'Connect your wallet and ensure you have both tokens',
      'Navigate to the Liquidity Pool tab',
      'Enter token addresses for both tokens',
      'Specify the amounts you want to add',
      'Review the pool ratio and click "Add Liquidity"',
      'Approve the transaction in your wallet'
    ]
  },
  {
    title: 'How to swap tokens',
    steps: [
      'Go to the Token Swap tab',
      'Enter the token address you want to swap from',
      'Enter the token address you want to receive',
      'Specify the amount to swap',
      'Review the exchange rate and slippage',
      'Click "Swap" and confirm in your wallet'
    ]
  },
  {
    title: 'How to lock tokens',
    steps: [
      'Navigate to the Token Locker tab',
      'Enter the token address you want to lock',
      'Specify the amount to lock',
      'Select the unlock date using the date picker',
      'Click "Lock Tokens" and approve the transaction',
      'Use "Check Status" to view your locked tokens'
    ]
  },
  {
    title: 'How to read price charts',
    steps: [
      'Search for a token by symbol or address',
      'Select your preferred timeframe (1H, 24H, 7D, 30D, 1Y)',
      'Toggle between line and area chart views',
      'Hover over the chart to see exact prices at specific times',
      'View key metrics like 24h high/low, market cap, and volume',
      'Set price alerts to track important price levels'
    ]
  }
];

const GLOSSARY = [
  { term: 'Liquidity', definition: 'The availability of assets in a market. Higher liquidity means easier and faster trading with less price impact.' },
  { term: 'Slippage', definition: 'The difference between the expected price of a trade and the actual executed price, often caused by market volatility or low liquidity.' },
  { term: 'Gas', definition: 'Transaction fees paid to blockchain validators for processing and validating transactions on the network.' },
  { term: 'DeFi', definition: 'Decentralized Finance - financial services built on blockchain technology without traditional intermediaries like banks.' },
  { term: 'Liquidity Pool', definition: 'A collection of funds locked in a smart contract, used to facilitate decentralized trading and lending.' },
  { term: 'Token', definition: 'A digital asset built on a blockchain that represents value, utility, or ownership rights.' },
  { term: 'Wallet', definition: 'A software or hardware tool that stores your private keys and allows you to interact with blockchain networks.' },
  { term: 'Smart Contract', definition: 'Self-executing code on a blockchain that automatically enforces the terms of an agreement.' }
];

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFAQ = FAQ_ITEMS.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGlossary = GLOSSARY.filter(item =>
    item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Help Center - Bloxology</title>
        <meta name="description" content="Get help with Bloxology DeFi tools, FAQs, and guides" />
      </Helmet>

      <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-balance" style={{ letterSpacing: '-0.02em' }}>
              Help Center
            </h1>
            <p className="text-lg text-[var(--text-secondary)] font-medium">
              Find answers to common questions and learn how to use Bloxology
            </p>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-secondary)]" />
              <Input
                placeholder="Search help topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 input-high-contrast h-12"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-[var(--text-primary)]">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFAQ.map((item, index) => (
                    <AccordionItem key={index} value={`faq-${index}`}>
                      <AccordionTrigger className="text-left font-bold text-[var(--text-primary)] hover:text-primary transition-colors">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-[var(--text-secondary)] font-medium leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                {filteredFAQ.length === 0 && (
                  <p className="text-center text-[var(--text-secondary)] font-medium py-8">
                    No results found for "{searchQuery}"
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                  <BookOpen className="h-5 w-5 text-primary" />
                  How-To Guides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {GUIDES.map((guide, index) => (
                  <div key={index} className="space-y-3">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{guide.title}</h3>
                    <ol className="space-y-2 list-decimal list-inside text-[var(--text-secondary)] font-medium">
                      {guide.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="text-sm">{step}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-[var(--text-primary)]">DeFi Glossary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredGlossary.map((item, index) => (
                    <div key={index} className="glass-card p-4 rounded-lg">
                      <h3 className="font-bold mb-1 text-[var(--text-primary)]">{item.term}</h3>
                      <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{item.definition}</p>
                    </div>
                  ))}
                </div>
                {filteredGlossary.length === 0 && (
                  <p className="text-center text-[var(--text-secondary)] font-medium py-8">
                    No glossary terms found for "{searchQuery}"
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-[var(--text-primary)]">External Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a
                  href="https://ethereum.org/en/defi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 glass-card rounded-lg hover:glass-card-strong transition-all duration-200 group text-[var(--text-primary)] font-medium"
                >
                  <span>Ethereum DeFi Guide</span>
                  <ExternalLink className="h-4 w-4 text-[var(--text-secondary)] group-hover:text-primary transition-colors" />
                </a>
                <a
                  href="https://docs.uniswap.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 glass-card rounded-lg hover:glass-card-strong transition-all duration-200 group text-[var(--text-primary)] font-medium"
                >
                  <span>Uniswap Documentation</span>
                  <ExternalLink className="h-4 w-4 text-[var(--text-secondary)] group-hover:text-primary transition-colors" />
                </a>
                <a
                  href="https://academy.binance.com/en/articles/what-is-defi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 glass-card rounded-lg hover:glass-card-strong transition-all duration-200 group text-[var(--text-primary)] font-medium"
                >
                  <span>What is DeFi?</span>
                  <ExternalLink className="h-4 w-4 text-[var(--text-secondary)] group-hover:text-primary transition-colors" />
                </a>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default HelpPage;
