const { formatUnits, getUsdPrice, getErc20Balance, CHAIN_ID_TO_COINGECKO_PLATFORM, isAddress, json, cors } = require('./_helpers');

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const UNISWAP_API_KEY = process.env.UNISWAP_API_KEY;
const ODOS_API_KEY = process.env.ODOS_API_KEY;
const SWAP_FEE_BPS = 40;
const NATIVE_TOKEN_ALIAS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const ODOS_NATIVE_TOKEN = '0x0000000000000000000000000000000000000000';

const WRAPPED_NATIVE_BY_CHAIN = {
  8453: '0x4200000000000000000000000000000000000006',
  1: '0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2',
};

const isWrappedNative = (address, chainId) => {
  const weth = WRAPPED_NATIVE_BY_CHAIN[Number(chainId)];
  return weth && address.toLowerCase() === weth.toLowerCase();
};

const TOKEN_DECIMALS = {
  '0x4200000000000000000000000000000000000006': 18,
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 6,
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 18,
  '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2': 6,
  '0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2': 18,
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 6,
  '0x6b175474e89094c44da98b954eedeac495271d0f': 18,
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 6,
  // Base ecosystem tokens
  '0xfe91f7ef81ec8ae07ba563a76943caf52df3bfa9': 18, // MAGB
  '0x10cfae91f373917eca57ccc3add7016fca132f22': 18, // PLEI
  '0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4': 18, // TOSH
  '0x0deb1ce15254d6b6cf261b3effeeda7889150fe2': 18, // BLUSH
  '0x1dd2d631c92b1acdfcdd51a0f7145a50130050c4': 18, // ALB
  '0x7e067aa42503a9acdfbce1ead8bbbc13c6ff8453': 18, // MEOW
};

const toAmountRaw = (amountDecimal, decimals) => {
  const [wholePart, fractionPart = ''] = String(amountDecimal).trim().split('.');
  const safeWhole = wholePart || '0';
  const safeFraction = fractionPart.replace(/[^0-9]/g, '');
  const paddedFraction = (safeFraction + '0'.repeat(decimals)).slice(0, decimals);
  return BigInt(safeWhole || '0') * 10n ** BigInt(decimals) + BigInt(paddedFraction || '0');
};

const toAmountHex = (amountDecimal, decimals) => {
  const value = toAmountRaw(amountDecimal, decimals);
  return `0x${value.toString(16)}`;
};

const toQuantityHex = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? `0x${n.toString(16)}` : '0x1';
};

const encodeErc20Transfer = (recipient, amountRaw) => {
  const methodId = 'a9059cbb';
  const recipientEncoded = recipient.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const amountEncoded = BigInt(amountRaw).toString(16).padStart(64, '0');
  return `0x${methodId}${recipientEncoded}${amountEncoded}`;
};

const pickExecution = (quoteResult) => {
  if (quoteResult && quoteResult.transaction && typeof quoteResult.transaction === 'object') {
    return { type: 'transaction', transaction: quoteResult.transaction };
  }

  const calls = Array.isArray(quoteResult?.calls) ? quoteResult.calls : null;
  if (calls && calls.length > 0) {
    return { type: 'calls', calls };
  }

  return null;
};

const getOutputAmountRaw = (quoteResult) => {
  const rawCandidates = [
    quoteResult?.toAmountMin,
    quoteResult?.toAmount,
    quoteResult?.buyAmount,
    quoteResult?.amountOut,
    quoteResult?.quote?.toAmount,
    quoteResult?.quote?.toAmountMin,
  ].filter(Boolean);

  if (rawCandidates.length === 0) return null;

  return rawCandidates[0];
};

const parseOutputAmount = (quoteResult, toDecimals) => {
  const raw = getOutputAmountRaw(quoteResult);
  if (!raw) return null;

  if (typeof raw === 'string' && raw.startsWith('0x')) {
    return formatUnits(BigInt(raw), toDecimals, 9);
  }

  if (/^[0-9]+$/.test(String(raw))) {
    return formatUnits(BigInt(String(raw)), toDecimals, 9);
  }

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    return numeric.toFixed(9);
  }

  return null;
};

const parseRawAmount = (value) => {
  if (!value) return null;
  if (typeof value === 'string' && value.startsWith('0x')) {
    return BigInt(value);
  }
  if (/^[0-9]+$/.test(String(value))) {
    return BigInt(String(value));
  }
  return null;
};

// NOTE: previously accidentally nested inside parseRawAmount(), which made it unreachable
// (ReferenceError) everywhere the handler called it. Moved to module scope.
const enrichQuoteMetrics = async ({ quote, amount, fromToken, toToken, chainId }) => {
  const platform = CHAIN_ID_TO_COINGECKO_PLATFORM[Number(chainId)] || 'base';
  const nativeAddress = Number(chainId) === 1
    ? '0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2'
    : '0x4200000000000000000000000000000000000006';

  try {
    const [fromPrice, toPrice, nativePrice] = await Promise.all([
      getUsdPrice(fromToken, platform),
      getUsdPrice(toToken, platform),
      getUsdPrice(nativeAddress, platform),
    ]);
    const inputUsd = Number(amount) * fromPrice.value;
    const outputUsd = Number(quote.outputAmount || 0) * toPrice.value;
    const priceImpact = inputUsd > 0 && outputUsd >= 0
      ? Math.max(0, (1 - (outputUsd / inputUsd)) * 100)
      : Number(quote.slippage || 0);
    const transaction = quote.execution?.transaction;
    const gasUnits = Number(transaction?.gas || transaction?.gasLimit);
    const gasPriceWei = Number(transaction?.gasPrice);
    const estimatedGasEth = Number.isFinite(gasUnits) && Number.isFinite(gasPriceWei) && gasPriceWei > 0
      ? (gasUnits * gasPriceWei) / 1e18
      : 0.00015;

    return {
      ...quote,
      gasFee: estimatedGasEth.toFixed(6),
      priceImpact: priceImpact.toFixed(2),
      slippage: priceImpact.toFixed(2),
      fromUsd: fromPrice.value,
      toUsd: toPrice.value,
      estimatedGasUsd: Number((estimatedGasEth * nativePrice.value).toFixed(2)),
      pricing: {
        fromTokenSource: fromPrice.source,
        toTokenSource: toPrice.source,
      },
    };
  } catch (_) {
    return quote;
  }
};

const requestAlchemyQuote = async (quoteParams) => {
  const response = await fetch(`https://api.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'wallet_requestQuote_v0',
      params: [quoteParams],
    }),
  });

  if (!response.ok) {
    throw new Error(`Alchemy quote request failed: ${response.status}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message || 'Alchemy quote error');
  }

  if (!payload.result) {
    throw new Error('Alchemy returned empty quote result');
  }

  return payload.result;
};

const fetchOdosQuote = async ({ fromAddress, fromToken, toToken, amount, chainId }) => {
  if (!ODOS_API_KEY || String(ODOS_API_KEY).includes('YOUR_ODOS_API_KEY')) {
    throw new Error('Odos fallback unavailable: ODOS_API_KEY is not configured');
  }

  const fromTokenLower = fromToken.toLowerCase();
  const toTokenLower = toToken.toLowerCase();
  const fromDecimals = TOKEN_DECIMALS[fromTokenLower] ?? 18;
  const toDecimals = TOKEN_DECIMALS[toTokenLower] ?? 18;
  const sellAmountRaw = toAmountRaw(amount, fromDecimals).toString();

  // ODOS uses zero-address for native ETH, not WETH
  const odosFromToken = isWrappedNative(fromToken, chainId) ? ODOS_NATIVE_TOKEN : fromToken;
  const odosToToken = isWrappedNative(toToken, chainId) ? ODOS_NATIVE_TOKEN : toToken;

  const quoteResponse = await fetch('https://api.odos.xyz/sor/quote/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ODOS_API_KEY,
    },
    body: JSON.stringify({
      chainId: Number(chainId),
      userAddr: fromAddress,
      inputTokens: [
        {
          tokenAddress: odosFromToken,
          amount: sellAmountRaw,
        },
      ],
      outputTokens: [
        {
          tokenAddress: odosToToken,
          proportion: 1,
        },
      ],
      slippageLimitPercent: 1,
      disableRFQs: true,
      compact: true,
    }),
  });

  const quotePayload = await quoteResponse.json().catch(() => ({}));
  if (!quoteResponse.ok) {
    throw new Error(quotePayload?.message || `Odos quote request failed: ${quoteResponse.status}`);
  }

  const pathId = quotePayload?.pathId;
  if (!pathId) {
    throw new Error('Odos quote did not return pathId');
  }

  const assembleResponse = await fetch('https://api.odos.xyz/sor/assemble', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ODOS_API_KEY,
    },
    body: JSON.stringify({
      userAddr: fromAddress,
      pathId,
      simulate: false,
    }),
  });

  const assemblePayload = await assembleResponse.json().catch(() => ({}));
  if (!assembleResponse.ok) {
    throw new Error(assemblePayload?.message || `Odos assemble request failed: ${assembleResponse.status}`);
  }

  const tx = assemblePayload?.transaction;
  if (!tx || !tx.to || !tx.data) {
    throw new Error('Odos assemble did not return executable transaction data');
  }

  const buyAmountRaw = parseRawAmount(quotePayload?.outAmounts?.[0]);
  const outputAmount = buyAmountRaw != null ? formatUnits(buyAmountRaw, toDecimals, 9) : '0';
  const exchangeRate = Number(amount) > 0 && Number(outputAmount) > 0 ? Number(outputAmount) / Number(amount) : 0;

  return {
    outputAmount,
    feeAmount: '0',
    netOutputAmount: outputAmount,
    exchangeRate: Number.isFinite(exchangeRate) ? exchangeRate.toFixed(9) : '0',
    gasFee: '0',
    slippage: '0.50',
    fromUsd: null,
    toUsd: null,
    estimatedGasUsd: null,
    pricing: {
      fromTokenSource: 'odos-quote',
      toTokenSource: 'odos-quote',
    },
    provider: 'odos',
    execution: {
      type: 'transaction',
      transaction: {
        to: tx.to,
        data: tx.data,
        value: tx.value || '0x0',
        gas: tx.gas,
        gasPrice: tx.gasPrice,
      },
    },
  };
};

const UNISWAP_API_BASE = 'https://trade-api.gateway.uniswap.org/v1';
// Uniswap's Trading API represents native ETH as the zero address, not WETH or the
// 0xeeee.. alias used by Alchemy/Odos.
const UNISWAP_NATIVE_TOKEN = '0x0000000000000000000000000000000000000000';

const buildUniswapHeaders = () => ({
  'Content-Type': 'application/json',
  'x-api-key': UNISWAP_API_KEY,
  'x-universal-router-version': '2.0',
  // decision_origin is 'human_mediated' because every swap still requires an explicit
  // button click + wallet signature in the UI before anything is broadcast.
  'x-agent-info': JSON.stringify({
    integration_name: 'bloxology-token-swap',
    decision_origin: 'human_mediated',
    version: '1.6.0',
  }),
});

const fetchUniswapQuote = async ({ fromAddress, fromToken, toToken, amount, chainId }) => {
  if (!UNISWAP_API_KEY || String(UNISWAP_API_KEY).includes('YOUR_UNISWAP_API_KEY')) {
    throw new Error('Uniswap quote unavailable: UNISWAP_API_KEY is not configured');
  }

  const fromTokenLower = fromToken.toLowerCase();
  const toTokenLower = toToken.toLowerCase();
  const fromDecimals = TOKEN_DECIMALS[fromTokenLower] ?? 18;
  const toDecimals = TOKEN_DECIMALS[toTokenLower] ?? 18;
  const sellAmountRaw = toAmountRaw(amount, fromDecimals).toString();

  const uniswapFromToken = isWrappedNative(fromToken, chainId) ? UNISWAP_NATIVE_TOKEN : fromToken;
  const uniswapToToken = isWrappedNative(toToken, chainId) ? UNISWAP_NATIVE_TOKEN : toToken;
  const isNativeInput = uniswapFromToken === UNISWAP_NATIVE_TOKEN;

  // Step 1: /check_approval — skipped for native ETH input, which needs no token approval.
  let approvalCall = null;
  if (!isNativeInput) {
    const approvalResponse = await fetch(`${UNISWAP_API_BASE}/check_approval`, {
      method: 'POST',
      headers: buildUniswapHeaders(),
      body: JSON.stringify({
        walletAddress: fromAddress,
        token: uniswapFromToken,
        amount: sellAmountRaw,
        chainId: Number(chainId),
      }),
    });
    const approvalPayload = await approvalResponse.json().catch(() => ({}));
    if (!approvalResponse.ok) {
      throw new Error(approvalPayload?.detail || approvalPayload?.errorCode || `Uniswap check_approval failed: ${approvalResponse.status}`);
    }
    if (approvalPayload?.approval) {
      approvalCall = {
        to: approvalPayload.approval.to,
        data: approvalPayload.approval.data,
        value: approvalPayload.approval.value || '0x0',
      };
    }
  }

  // Step 2: /quote — routingPreference is forced to CLASSIC. UniswapX (DUTCH_V2/V3/PRIORITY)
  // and Permit2-signature swaps both require an off-chain EIP-712 signature step that this
  // integration's transaction-only execution model does not support yet, so those are
  // intentionally rejected below rather than producing a broken/unsigned transaction.
  const quoteResponse = await fetch(`${UNISWAP_API_BASE}/quote`, {
    method: 'POST',
    headers: buildUniswapHeaders(),
    body: JSON.stringify({
      type: 'EXACT_INPUT',
      amount: sellAmountRaw,
      tokenInChainId: Number(chainId),
      tokenOutChainId: Number(chainId),
      tokenIn: uniswapFromToken,
      tokenOut: uniswapToToken,
      swapper: fromAddress,
      slippageTolerance: 1,
      routingPreference: 'CLASSIC',
    }),
  });

  const quotePayload = await quoteResponse.json().catch(() => ({}));
  if (!quoteResponse.ok) {
    throw new Error(quotePayload?.detail || quotePayload?.errorCode || `Uniswap quote request failed: ${quoteResponse.status}`);
  }

  if (quotePayload?.routing && quotePayload.routing !== 'CLASSIC') {
    throw new Error(`Uniswap returned unsupported routing type: ${quotePayload.routing}`);
  }
  if (quotePayload?.permitData && typeof quotePayload.permitData === 'object') {
    throw new Error('Uniswap quote requires a Permit2 signature flow, which is not supported yet');
  }

  const outputAmountRaw = parseRawAmount(quotePayload?.quote?.output?.amount);
  if (outputAmountRaw == null) {
    throw new Error('Uniswap quote did not return an output amount');
  }
  const outputAmount = formatUnits(outputAmountRaw, toDecimals, 9);
  const exchangeRate = Number(amount) > 0 && Number(outputAmount) > 0 ? Number(outputAmount) / Number(amount) : 0;

  // Step 3: /swap — the quote response is spread directly into the body (never wrapped),
  // with permitData/permitTransaction stripped since we already rejected Permit2 flows above.
  const { permitData, permitTransaction, ...swapRequestBody } = quotePayload;
  const swapResponse = await fetch(`${UNISWAP_API_BASE}/swap`, {
    method: 'POST',
    headers: buildUniswapHeaders(),
    body: JSON.stringify(swapRequestBody),
  });

  const swapPayload = await swapResponse.json().catch(() => ({}));
  if (!swapResponse.ok) {
    throw new Error(swapPayload?.detail || swapPayload?.errorCode || `Uniswap swap request failed: ${swapResponse.status}`);
  }

  const swapTx = swapPayload?.swap;
  if (!swapTx?.to || !swapTx?.data) {
    throw new Error('Uniswap swap did not return an executable transaction');
  }

  const swapCall = {
    to: swapTx.to,
    data: swapTx.data,
    value: swapTx.value || '0x0',
    gas: swapTx.gasLimit,
  };

  const execution = approvalCall
    ? { type: 'calls', calls: [approvalCall, swapCall] }
    : { type: 'transaction', transaction: swapCall };

  return {
    outputAmount,
    feeAmount: '0',
    netOutputAmount: outputAmount,
    exchangeRate: Number.isFinite(exchangeRate) ? exchangeRate.toFixed(9) : '0',
    gasFee: '0',
    slippage: '1.00',
    fromUsd: null,
    toUsd: null,
    estimatedGasUsd: null,
    pricing: {
      fromTokenSource: 'uniswap-quote',
      toTokenSource: 'uniswap-quote',
    },
    provider: 'uniswap',
    execution,
  };
};

const fetchAlchemyQuote = async ({ fromAddress, fromToken, toToken, amount, chainId, providerToToken }) => {
  if (!ALCHEMY_API_KEY) return null;

  const fromTokenLower = fromToken.toLowerCase();
  const toTokenLower = toToken.toLowerCase();
  const fromDecimals = TOKEN_DECIMALS[fromTokenLower] ?? 18;
  const toDecimals = TOKEN_DECIMALS[toTokenLower] ?? 18;
  const fromAmountHex = toAmountHex(amount, fromDecimals);
  // Alchemy uses the native alias for ETH, not WETH
  const alchemyFromToken = isWrappedNative(fromToken, chainId) ? NATIVE_TOKEN_ALIAS : fromToken;
  const alchemyToToken = isWrappedNative(toToken, chainId) ? NATIVE_TOKEN_ALIAS : toToken;

  const baseQuoteParams = {
    from: fromAddress,
    chainId: toQuantityHex(chainId),
    fromToken: alchemyFromToken,
    toToken: providerToToken || alchemyToToken,
    fromAmount: fromAmountHex,
  };

  const initialQuote = await requestAlchemyQuote(baseQuoteParams);
  const outputRaw = parseRawAmount(getOutputAmountRaw(initialQuote));

  let quoteResult = initialQuote;
  let feeAmountRaw = 0n;
  // Temporary safety hotfix: do not inject postCalls in live quotes.
  // Some providers/wallets revert user operations when extra post-execution transfers are appended.

  const outputAmount = parseOutputAmount(quoteResult, toDecimals);
  const feeAmount = formatUnits(feeAmountRaw, toDecimals, 9);
  const netOutputRaw = outputRaw && feeAmountRaw <= outputRaw ? outputRaw - feeAmountRaw : outputRaw;
  const netOutputAmount = netOutputRaw != null ? formatUnits(netOutputRaw, toDecimals, 9) : outputAmount;
  const exchangeRate = Number(amount) > 0 && outputAmount ? Number(outputAmount) / Number(amount) : 0;
  const execution = pickExecution(quoteResult);

  if (!execution) {
    throw new Error('No executable route returned by quote provider');
  }

  return {
    outputAmount: outputAmount || '0',
    feeAmount,
    netOutputAmount: netOutputAmount || '0',
    exchangeRate: Number.isFinite(exchangeRate) ? exchangeRate.toFixed(9) : '0',
    gasFee: '0',
    slippage: '0.50',
    fromUsd: null,
    toUsd: null,
    estimatedGasUsd: null,
    pricing: {
      fromTokenSource: 'alchemy-quote',
      toTokenSource: 'alchemy-quote',
    },
    provider: 'alchemy',
    execution,
  };
};

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  const requestId = `swapq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { success: false, data: null, error: 'Method not allowed' });
  }

  const { fromAddress, fromToken, toToken, amount, chainId = 8453 } = req.body || {};
  if (!fromToken || !toToken || !amount) {
    return json(res, 400, {
      success: false,
      data: null,
      error: 'Missing required body parameters: fromToken, toToken, amount',
    });
  }

  if (!isAddress(fromToken) || !isAddress(toToken)) {
    return json(res, 400, {
      success: false,
      data: null,
      error: 'Invalid token address',
    });
  }

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return json(res, 400, { success: false, data: null, error: 'Invalid amount' });
  }

  if (fromAddress && !isAddress(fromAddress)) {
    return json(res, 400, { success: false, data: null, error: 'Invalid fromAddress' });
  }

  // Use dummy address for DEX quotes when no wallet is connected — allows preview quotes
  // before wallet connection. Balance check is skipped for dummy address.
  const DUMMY_ADDRESS = '0x000000000000000000000000000000000000dEaD';
  const quoteAddress = fromAddress || DUMMY_ADDRESS;

  try {
    if (quoteAddress) {
      const fromTokenLower = fromToken.toLowerCase();
      const fromDecimals = TOKEN_DECIMALS[fromTokenLower] ?? 18;
      const requestedAmountRaw = toAmountRaw(amount, fromDecimals);
      const retryBpsSteps = [10000n, 9000n, 7500n, 5000n, 2500n];

      const buildRetryAmount = (bps) => {
        if (bps === 10000n) return amount;
        const scaledRaw = (requestedAmountRaw * bps) / 10000n;
        if (scaledRaw <= 0n) return null;
        return formatUnits(scaledRaw, fromDecimals, fromDecimals);
      };

      // Only check balance when a real wallet address is provided
      if (fromAddress) {
        try {
          const fromBalance = await getErc20Balance(fromAddress, fromToken, Number(chainId));
          if (fromBalance.balanceRaw < requestedAmountRaw) {
            return json(res, 400, {
              success: false,
              data: null,
              errorCode: 'INSUFFICIENT_BALANCE',
              error: `Insufficient ${fromBalance.symbol || 'token'} balance. Available ${fromBalance.balance}, requested ${amount}.`,
            });
          }
        } catch (balanceError) {
          // If balance pre-check fails, continue to quote — let the provider return the error.
        }
      }

      // --- Primary: ODOS + Uniswap in parallel, pick the better price ---
      // Both providers are queried at each retry-amount step; whichever returns the higher
      // netOutputAmount wins. Only falls through to the next (smaller) amount step if both
      // fail, and only falls through to Alchemy if both fail at every amount step.
      const odosRetryErrors = [];
      const uniswapRetryErrors = [];
      const uniswapEnabled = UNISWAP_API_KEY && !String(UNISWAP_API_KEY).includes('YOUR_UNISWAP_API_KEY');

      for (const bps of retryBpsSteps) {
        const retryAmount = buildRetryAmount(bps);
        if (!retryAmount) continue;

        const [odosResult, uniswapResult] = await Promise.allSettled([
          fetchOdosQuote({ fromAddress: quoteAddress, fromToken, toToken, amount: retryAmount, chainId }),
          uniswapEnabled
            ? fetchUniswapQuote({ fromAddress: quoteAddress, fromToken, toToken, amount: retryAmount, chainId })
            : Promise.reject(new Error('Uniswap quote skipped: UNISWAP_API_KEY is not configured')),
        ]);

        if (odosResult.status === 'rejected') {
          odosRetryErrors.push(`ODOS ${retryAmount}: ${String(odosResult.reason?.message || odosResult.reason)}`);
        }
        if (uniswapResult.status === 'rejected') {
          uniswapRetryErrors.push(`Uniswap ${retryAmount}: ${String(uniswapResult.reason?.message || uniswapResult.reason)}`);
        }

        const candidates = [
          odosResult.status === 'fulfilled' ? odosResult.value : null,
          uniswapResult.status === 'fulfilled' ? uniswapResult.value : null,
        ].filter(Boolean);

        if (candidates.length > 0) {
          const bestQuote = candidates.reduce((best, candidate) =>
            Number(candidate.netOutputAmount) > Number(best.netOutputAmount) ? candidate : best
          );
          const enrichedQuote = await enrichQuoteMetrics({
            quote: bestQuote,
            amount: retryAmount,
            fromToken,
            toToken,
            chainId,
          });
          return json(res, 200, {
            success: true,
            data: {
              ...enrichedQuote,
              requestedAmount: amount,
              adjustedAmount: retryAmount,
              autoAdjusted: retryAmount !== amount,
            },
            error: null,
          });
        }
      }
      console.error('[token-swap-quote] odos/uniswap primary failed', {
        requestId,
        chainId: Number(chainId),
        fromToken,
        toToken,
        amount,
        odosErrors: odosRetryErrors,
        uniswapErrors: uniswapRetryErrors,
      });

      // --- Fallback: Alchemy swap API ---
      const alchemyRetryErrors = [];
      if (ALCHEMY_API_KEY && !String(ALCHEMY_API_KEY).includes('YOUR_ALCHEMY_API_KEY')) {
        for (const bps of retryBpsSteps) {
          const retryAmount = buildRetryAmount(bps);
          if (!retryAmount) continue;
          try {
            const alchemyQuote = await fetchAlchemyQuote({ fromAddress: quoteAddress, fromToken, toToken, amount: retryAmount, chainId });
            if (alchemyQuote) {
              const enrichedQuote = await enrichQuoteMetrics({
                quote: alchemyQuote,
                amount: retryAmount,
                fromToken,
                toToken,
                chainId,
              });
              return json(res, 200, {
                success: true,
                data: {
                  ...enrichedQuote,
                  requestedAmount: amount,
                  adjustedAmount: retryAmount,
                  autoAdjusted: retryAmount !== amount,
                },
                error: null,
              });
            }
          } catch (alchemyError) {
            alchemyRetryErrors.push(`Alchemy ${retryAmount}: ${String(alchemyError?.message || alchemyError)}`);
          }
        }
        console.error('[token-swap-quote] alchemy fallback failed', {
          requestId,
          chainId: Number(chainId),
          fromToken,
          toToken,
          amount,
          errors: alchemyRetryErrors,
        });
      }

      return json(res, 422, {
        success: false,
        data: null,
        errorCode: 'EXECUTION_UNAVAILABLE',
        error: `No executable route for this token pair and amount right now. Try a different amount or token pair. Ref: ${requestId}. ${odosRetryErrors.length ? `ODOS attempts: ${odosRetryErrors.join(' | ')}.` : ''} ${uniswapRetryErrors.length ? `Uniswap attempts: ${uniswapRetryErrors.join(' | ')}.` : ''} ${alchemyRetryErrors.length ? `Alchemy attempts: ${alchemyRetryErrors.join(' | ')}.` : ''}`,
        providerErrors: {
          odos: odosRetryErrors,
          uniswap: uniswapRetryErrors,
          alchemy: alchemyRetryErrors,
        },
      });
    }

    const platform = CHAIN_ID_TO_COINGECKO_PLATFORM[Number(chainId)] || 'base';
    const ethNativeAddress = Number(chainId) === 1
      ? '0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2'
      : '0x4200000000000000000000000000000000000006';

    const [fromPrice, toPrice, ethPrice] = await Promise.all([
      getUsdPrice(fromToken, platform),
      getUsdPrice(toToken, platform),
      getUsdPrice(ethNativeAddress, platform),
    ]);

    if (fromPrice.value <= 0 || toPrice.value <= 0) {
      return json(res, 400, {
        success: false,
        data: null,
        errorCode: 'PRICING_UNAVAILABLE',
        error: `No pricing data available for this token pair on ${platform}. Try a different pair or connect a wallet for a live quote.`,
      });
    }

    const priceImpactPercent = 0.5;
    const exchangeRate = fromPrice.value / toPrice.value;
    const grossOutput = parsedAmount * exchangeRate;
    const netOutput = grossOutput * (1 - priceImpactPercent / 100);
    const feeAmount = (netOutput * SWAP_FEE_BPS) / 10000;
    const estimatedGasEth = 0.00015;

    return json(res, 200, {
      success: true,
      data: {
        outputAmount: netOutput.toFixed(6),
        feeAmount: feeAmount.toFixed(6),
        netOutputAmount: (netOutput - feeAmount).toFixed(6),
        exchangeRate: exchangeRate.toFixed(6),
        gasFee: estimatedGasEth.toFixed(6),
        priceImpact: priceImpactPercent.toFixed(2),
        slippage: priceImpactPercent.toFixed(2),
        fromUsd: fromPrice.value,
        toUsd: toPrice.value,
        estimatedGasUsd: Number((estimatedGasEth * ethPrice.value).toFixed(2)),
        pricing: {
          fromTokenSource: fromPrice.source,
          toTokenSource: toPrice.source,
        },
        provider: 'fallback-pricing',
        execution: null,
      },
      error: null,
    });
  } catch (error) {
    console.error('[token-swap-quote] handler error', {
      requestId,
      chainId: Number(chainId),
      fromAddress,
      fromToken,
      toToken,
      amount,
      error: String(error?.message || error),
    });

    return json(res, 502, {
      success: false,
      data: null,
      error: error.message || `Failed to build swap quote (ref: ${requestId})`,
    });
  }
};
