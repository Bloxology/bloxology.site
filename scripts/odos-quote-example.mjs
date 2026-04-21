const quoteUrl = 'https://api.odos.xyz/sor/quote/v2';

const userAddr = process.env.ODOS_USER_ADDR || '0x000000000000000000000000000000000000dEaD';
const inputTokenAddress = process.env.ODOS_INPUT_TOKEN || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
const outputTokenAddress = process.env.ODOS_OUTPUT_TOKEN || '0x4200000000000000000000000000000000000006'; // WETH on Base
const inputAmount = process.env.ODOS_INPUT_AMOUNT || '10000000'; // 10 USDC (6 decimals)

const quoteRequestBody = {
  chainId: 8453,
  userAddr,
  inputTokens: [
    {
      tokenAddress: inputTokenAddress,
      amount: inputAmount
    }
  ],
  outputTokens: [
    {
      tokenAddress: outputTokenAddress,
      proportion: 1
    }
  ],
  slippageLimitPercent: 1,
  disableRFQs: true,
  compact: true
};

const response = await fetch(quoteUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ODOS_API_KEY
  },
  body: JSON.stringify(quoteRequestBody)
});

const quote = await response.json();
console.log(quote);