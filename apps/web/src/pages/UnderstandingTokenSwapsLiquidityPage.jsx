import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '@/components/Seo.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { articleSchema, breadcrumbSchema, faqSchema, howToSchema as buildHowTo } from '@/lib/seo.js';
import { guideUrl, SITE_URL } from '@/lib/guides.js';

const title = 'Understanding Token Swaps and Liquidity';
const description =
  'Learn how decentralized token swaps and liquidity pools work, what affects your execution price, and how to assess risks before trading or providing liquidity.';
const url = guideUrl('understanding-token-swaps-and-liquidity');

const steps = [
  { name: 'Choose a token pair', text: 'Select the token you want to sell and the token you want to receive, then verify both contract addresses.' },
  { name: 'Review the quote', text: 'Compare the expected output, price impact, slippage tolerance, network, and estimated fees.' },
  { name: 'Check your allowance', text: 'For an ERC-20 input token, review the approval request and approve only the amount and application you trust.' },
  { name: 'Confirm the swap', text: 'Sign the transaction only after checking the recipient token, minimum received amount, and wallet network.' },
  { name: 'Verify settlement', text: 'Wait for confirmation and check your balances and transaction details in your wallet.' },
];

const faqs = [
  {
    question: 'What is liquidity?',
    answer: 'Liquidity is the amount of an asset available to trade without moving its price significantly. In a decentralized exchange, liquidity is commonly supplied to a smart-contract pool.',
  },
  {
    question: 'Why does my quoted output change?',
    answer: 'Quotes can change when pool balances, market prices, network conditions, or competing transactions change. A quote is an estimate until the transaction is confirmed.',
  },
  {
    question: 'What is impermanent loss?',
    answer: 'Impermanent loss is the difference between the value of assets held in a liquidity pool and the value of simply holding those assets when their relative prices change. Fees may offset some or all of it, but they do not remove the risk.',
  },
];

const schemas = [
  articleSchema({ title, description, url, datePublished: '2026-11-26', dateModified: '2026-11-26' }),
  buildHowTo({
    name: title,
    description: 'A practical checklist for reviewing and completing a decentralized token swap.',
    totalTime: 'PT5M',
    steps,
  }),
  faqSchema(faqs),
  breadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Guides', url: `${SITE_URL}/guides` },
    { name: title, url },
  ]),
];

const UnderstandingTokenSwapsLiquidityPage = () => (
  <>
    <Seo title={`${title} | Bloxology Guide`} description={description} url={url} type="article" schemas={schemas} />
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
      <article className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-4">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">DeFi Fundamentals</p>
          <h1 className="text-4xl md:text-5xl font-bold text-balance" style={{ letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          <p className="text-lg text-[var(--text-secondary)] font-medium">
            A clear introduction to the markets behind decentralized trading and the decisions to make before you swap or supply funds.
          </p>
        </header>

        <Card className="glass-card border-border/50">
          <CardHeader><CardTitle>How a token swap works</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-[var(--text-secondary)] font-medium">
            <p>A token swap exchanges one digital asset for another through a smart contract rather than a traditional order book. The swap route uses available liquidity from one or more pools to calculate an expected output.</p>
            <p>The amount you receive depends on the input amount, pool liquidity, current prices, fees, and price impact. Larger trades relative to a pool usually move the pool price more.</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader><CardTitle>Liquidity pools and liquidity providers</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-[var(--text-secondary)] font-medium">
            <p>A liquidity pool holds reserves of two or more tokens and makes those reserves available for trading. Liquidity providers deposit assets according to the pool’s rules and receive a share of trading fees when swaps use the pool.</p>
            <p>Providing liquidity is not the same as holding a token. Pool balances are rebalanced as traders swap, so the value and composition of a provider’s position can change.</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader><CardTitle>Costs and execution details to review</CardTitle></CardHeader>
          <CardContent className="text-[var(--text-secondary)] font-medium">
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-[var(--text-primary)]">Network fee:</strong> the blockchain fee paid to process the transaction.</li>
              <li><strong className="text-[var(--text-primary)]">Protocol fee:</strong> a fee charged by the exchange or route, if applicable.</li>
              <li><strong className="text-[var(--text-primary)]">Price impact:</strong> how much your own trade moves the pool price.</li>
              <li><strong className="text-[var(--text-primary)]">Slippage:</strong> the acceptable difference between the quote and execution; lower limits can fail during volatility.</li>
              <li><strong className="text-[var(--text-primary)]">Minimum received:</strong> the least output your transaction will accept when the route supports a slippage limit.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader><CardTitle>Swap review checklist</CardTitle></CardHeader>
          <CardContent className="text-[var(--text-secondary)] font-medium">
            <ol className="space-y-3 list-decimal list-inside">
              {steps.map((step) => <li key={step.name}><strong className="text-[var(--text-primary)]">{step.name}:</strong> {step.text}</li>)}
            </ol>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader><CardTitle>Risks for liquidity providers</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-[var(--text-secondary)] font-medium">
            <p>Liquidity providers can earn fees, but returns are not guaranteed. Impermanent loss occurs when the relative prices of pooled assets change. Smart-contract bugs, malicious token contracts, low liquidity, and volatile markets can create additional risk.</p>
            <p>Research the pool, token contracts, fee structure, withdrawal conditions, and protocol audits before depositing funds. Never provide more than you can afford to lose.</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader><CardTitle>Frequently asked questions</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-[var(--text-secondary)] font-medium">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="font-semibold text-[var(--text-primary)]">{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-sm text-[var(--text-muted)]">
          Ready to explore? <Link className="text-primary hover:underline" to="/guides">Browse more Bloxology guides</Link> or review the <Link className="text-primary hover:underline" to="/guides/base-mainnet-token-swap-low-fees">Base swap walkthrough</Link>.
        </p>
      </article>
    </div>
  </>
);

export default UnderstandingTokenSwapsLiquidityPage;
