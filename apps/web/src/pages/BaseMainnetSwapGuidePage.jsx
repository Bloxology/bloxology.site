import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Swap Tokens on Base Mainnet with Low Fees',
  description: 'Step-by-step guide to complete low fee DeFi swaps on Base network trading using Bloxology.',
  totalTime: 'PT5M',
  step: [
    { '@type': 'HowToStep', name: 'Connect your wallet', text: 'Open Bloxology and connect a Base-compatible wallet from the login button.' },
    { '@type': 'HowToStep', name: 'Fund your wallet with gas', text: 'Keep a small ETH balance on Base Mainnet to cover cheap token swap gas fees.' },
    { '@type': 'HowToStep', name: 'Open the swap interface', text: 'Go to the Swap tab from your dashboard and choose the token pair you want to trade.' },
    { '@type': 'HowToStep', name: 'Set swap amount and slippage', text: 'Enter the amount, confirm the quote, and keep slippage conservative unless market volatility is high.' },
    { '@type': 'HowToStep', name: 'Review and confirm', text: 'Check destination token, minimum received, and network before signing the transaction.' },
    { '@type': 'HowToStep', name: 'Verify settlement', text: 'After confirmation, verify your transaction and balances in wallet history.' }
  ]
};

const BaseMainnetSwapGuidePage = () => {
  return (
    <>
      <Helmet>
        <title>How to Swap Tokens on Base Mainnet with Low Fees | Bloxology Guide</title>
        <meta
          name="description"
          content="Learn how to complete a Base Mainnet token swap with low fees. Follow this step-by-step guide, compare costs, and trade safely with Bloxology."
        />
        <link rel="canonical" href="https://bloxology.site/guides/base-mainnet-token-swap-low-fees" />
        <meta property="og:title" content="How to Swap Tokens on Base Mainnet with Low Fees" />
        <meta
          property="og:description"
          content="A practical guide for low fee DeFi swaps on Base network trading with safety checks and fee comparison tips."
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://bloxology.site/guides/base-mainnet-token-swap-low-fees" />
        <meta property="og:image" content="https://bloxology.site/icon-512x512.svg" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="How to Swap Tokens on Base Mainnet with Low Fees" />
        <meta
          name="twitter:description"
          content="Step-by-step Base Mainnet token swap guide with low fee trading and security tips."
        />
        <meta name="twitter:image" content="https://bloxology.site/icon-512x512.svg" />
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
      </Helmet>

      <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto space-y-8">
          <header className="space-y-4">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">Base Mainnet Guide</p>
            <h1 className="text-4xl md:text-5xl font-bold text-balance" style={{ letterSpacing: '-0.02em' }}>
              How to Swap Tokens on Base Mainnet with Low Fees
            </h1>
            <p className="text-lg text-[var(--text-secondary)] font-medium">
              This tutorial helps you execute a Base Mainnet token swap safely while keeping costs low.
            </p>
          </header>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Base Mainnet overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-[var(--text-secondary)] font-medium">
              <p>Base is an Ethereum Layer 2 network designed for high throughput and lower transaction costs.</p>
              <p>For traders, this means cheap token swaps and faster confirmations compared with many Layer 1 alternatives.</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Step-by-step swap walkthrough</CardTitle>
            </CardHeader>
            <CardContent className="text-[var(--text-secondary)] font-medium">
              <ol className="space-y-3 list-decimal list-inside">
                <li>Connect your wallet on Bloxology and switch to Base Mainnet.</li>
                <li>Keep a small ETH balance on Base for gas before you start trading.</li>
                <li>Open the Swap tab, choose tokens, and enter the trade amount.</li>
                <li>Review quoted output, slippage, and minimum received amount.</li>
                <li>Confirm the transaction in your wallet and wait for confirmation.</li>
                <li>Verify final balances and transaction status after settlement.</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Fee comparison snapshot</CardTitle>
            </CardHeader>
            <CardContent className="text-[var(--text-secondary)] font-medium">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-[var(--text-primary)]">
                      <th className="py-2 pr-4">Network</th>
                      <th className="py-2 pr-4">Typical swap gas profile</th>
                      <th className="py-2">Cost efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4">Base Mainnet</td>
                      <td className="py-2 pr-4">Low gas during most periods</td>
                      <td className="py-2">High for frequent trading</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4">Ethereum Mainnet</td>
                      <td className="py-2 pr-4">Higher and more volatile gas</td>
                      <td className="py-2">Lower for small swaps</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Other L2s</td>
                      <td className="py-2 pr-4">Usually low, varies by activity</td>
                      <td className="py-2">Competitive</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Why use Bloxology for Base network trading</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[var(--text-secondary)] font-medium">
              <ul className="space-y-2 list-disc list-inside">
                <li>Base-first DeFi workflows for swaps and related tools in one app.</li>
                <li>Simple interface for quick token pair selection and quote review.</li>
                <li>Built-in support for broader DeFi actions like liquidity and token locking.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Safety checklist before you swap</CardTitle>
            </CardHeader>
            <CardContent className="text-[var(--text-secondary)] font-medium">
              <ul className="space-y-2 list-disc list-inside">
                <li>Verify token contract addresses from trusted sources before trading.</li>
                <li>Start with a small test swap for unfamiliar tokens.</li>
                <li>Confirm network, recipient token, and slippage before signing.</li>
                <li>Never approve unlimited allowances unless you fully trust the token and dApp.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>More learning resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[var(--text-secondary)] font-medium">
              <p>Next planned educational topics:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Base Mainnet DeFi Guide for Beginners</li>
                <li>Understanding Token Swaps and Liquidity</li>
                <li>Comparing DEX Platforms on Base Mainnet</li>
                <li>Gas Optimization Tips for Base Network Trading</li>
                <li>Why Base Mainnet is Ideal for Low-Cost Trading</li>
              </ul>
            </CardContent>
          </Card>

          <p className="text-sm text-[var(--text-muted)]">
            Ready to practice? <Link className="text-primary hover:underline" to="/login">Connect your wallet</Link> and start a swap on Base.
          </p>
        </article>
      </div>
    </>
  );
};

export default BaseMainnetSwapGuidePage;
