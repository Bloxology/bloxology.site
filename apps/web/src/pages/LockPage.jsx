import React from 'react';
import { Helmet } from 'react-helmet';
import TokenLocker from '@/components/TokenLocker.jsx';

const LockPage = () => (
  <>
    <Helmet>
      <title>Token Locker - Bloxology</title>
      <meta name="description" content="Bloxology token locker availability." />
    </Helmet>
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <TokenLocker />
      </div>
    </div>
  </>
);

export default LockPage;
