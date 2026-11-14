const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const esbuild = require('esbuild');

const source = fs.readFileSync(`${__dirname}/remix-deploy-locker.ts`, 'utf8');

async function runScript({ chainId = 84532, balance = true, bytecode = '0x1234' } = {}) {
  const { code } = await esbuild.transform(source, { loader: 'ts', format: 'cjs' });
  const messages = [];
  const calls = [];
  const signer = { getAddress: async () => '0xdeployer' };
  class Web3Provider {
    async getNetwork() { return { chainId }; }
    getSigner() { return signer; }
    async getBalance() { return { isZero: () => !balance }; }
  }
  class ContractFactory {
    constructor(abi, code, providedSigner) {
      calls.push({ abi, code, providedSigner });
    }
    async deploy() {
      calls.push('deploy');
      return {
        address: '0xcontract',
        deployTransaction: { hash: '0xtransaction' },
        async deployed() { calls.push('mined'); },
      };
    }
  }
  const context = {
    require: () => ({ ethers: { providers: { Web3Provider }, ContractFactory } }),
    web3Provider: {},
    remix: { call: async () => JSON.stringify({ abi: [], data: { bytecode: { object: bytecode } } }) },
    console: {
      log: (...args) => messages.push(args.join(' ')),
      error: (...args) => messages.push(args.join(' ')),
    },
  };
  await vm.runInNewContext(code, context);
  return { calls, messages };
}

test('deploys compiled artifact and waits for confirmation on Base Sepolia', async () => {
  const { calls, messages } = await runScript();
  assert.equal(calls[0].code, '0x1234');
  assert.deepEqual(calls.slice(1), ['deploy', 'mined']);
  assert.ok(messages.some((message) => message.includes('0xcontract')));
});

test('refuses another network, an unfunded account, or missing bytecode', async () => {
  for (const options of [{ chainId: 1 }, { balance: false }, { bytecode: '' }]) {
    const { calls, messages } = await runScript(options);
    assert.equal(calls.length, 0);
    assert.ok(messages.some((message) => message.includes('Deployment failed')));
  }
});
