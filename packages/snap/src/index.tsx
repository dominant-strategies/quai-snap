import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { Box, Text, Bold, Copyable, Row, Address, Link, Heading, Section } from '@metamask/snaps-sdk/jsx';
import { formatQuai, id, Interface, quais } from 'quais';
import { getQuaiWallet, successScreen } from './home';
import { getAbiFromIpfsWithTimeout } from './ipfs';
import { CONFIG } from './config';
import { SnapState } from './home';
export * from "./home";          // re-export the handler so MetaMask can find it
import { ContractABI } from './ipfs';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
  // Validate origin is a string and not empty
  if (typeof origin !== 'string' || !origin) {
    throw new Error('Invalid origin');
  }

  // Only allow specific methods
  const allowedMethods = ['hello', 'quai_getAddress', 'quai_sendTransaction'];
  if (!allowedMethods.includes(request.method)) {
    throw new Error(`Method ${request.method} not allowed`);
  }

  switch (request.method) {
    case 'hello':
      const helloConfirmed = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: (
            <Box>
              <Text>
                Hello, <Bold>{origin}</Bold>!
              </Text>
              <Text>
                This demonstrates proper confirmation handling for secure wallet interactions.
              </Text>
            </Box>
          ),
        },
      });

      if (!helloConfirmed) {
        throw new Error('User rejected the hello request');
      }
      return 'Hello request confirmed';

    case 'quai_getAddress':
      const wallet = await getQuaiWallet();
      return wallet.address;

    case 'quai_sendTransaction':
      const params = request.params as [{ to: string; from?: string; value?: string; data?: string }];
      if (!params?.[0]) {
        throw new Error('Missing transaction parameters');
      }
      const { to, from, value, data } = params[0];
      let quaiWallet = await getQuaiWallet();

      if (!to) {
        throw new Error('Invalid recipient: Address must start with 0x00 for shard 0');
      }

      const isContract = data && data !== '0x';
      const confirmationBody = (
        <Box>
              <Text>
                Sending {value??"0"} QUAI to
              </Text>
              <Row label={isContract ? "Contract Address" : "Address"}>
                <Address address={to as `0x${string}`} />
              </Row>
              {isContract ? (
                <Box>
                  <Text>Contract call data</Text>
                  <Copyable value={data} />
                </Box>
              ) : null}
            </Box>
      );
    

      const uiId = await snap.request({
        method: 'snap_createInterface',
        params: { ui: confirmationBody },
      });

      if (!quaiWallet.provider) {
        throw new Error('No provider found');
      }
      if (data) {
        getAbiFromIpfsWithTimeout(to, quaiWallet.provider)
        .then((abi) => abi && updateInterfaceWithDecodedCall(uiId, abi, data, confirmationBody))
        .catch(() => {/* swallow errors / timeouts */});
      }

      const confirmed = await snap.request({
        method: "snap_dialog",
        params: { type: "confirmation", id: uiId },
      });

      if (!confirmed) {
        throw new Error('Transaction rejected by user');
      }

      // Construct the transaction
      const tx = {
        to,
        value: BigInt(value || 0),
        data: data || '0x',
        from: from??quaiWallet.address,
      };
      try {
        // Sign and send the transaction
        const txResponse = await quaiWallet.sendTransaction(tx);
        const st = (await snap.request({
          method: 'snap_manageState',
          params: { operation: 'get' },
        })) as SnapState ?? {};
        st.sentTxs ??= [];
        st.sentTxs.unshift({
          hash:  txResponse.hash,
          from: { hash: quaiWallet.address as `0x${string}` },
          to: { hash: to },
          value: tx.value.toString(),
          timestamp:    new Date().toISOString(),
          type: data && data !== '0x' ? 'Contract Call' : 'Transfer',
        });
        st.sentTxs = st.sentTxs.slice(0, 100);          // keep max 100
        await snap.request({
          method: 'snap_manageState',
          params: { operation: 'update', newState: st },
        });
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: (
              <Box>
                <Heading>Tx sent! Hash: {txResponse.hash}</Heading>
                <Link href={CONFIG.EXPLORER_TX_URL(txResponse.hash)}>
                  View on QuaiScan ↗
                </Link>
              </Box>
            ),
          },
        });
        return txResponse.hash;
      } catch (error: any) {
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: (
              <Box>
                <Text>Error: {error.message || 'Transaction failed'}</Text>
              </Box>
            ),
          },
        });
        throw error;
        }

    default:
      throw new Error(`Unsupported method: ${request.method}`);
  }
};

type DecodedCall = {
  name: string;
  signature: string;
  params: { name: string; type: string; value: unknown }[];
};  

async function updateInterfaceWithDecodedCall(uiId: string, abi: ContractABI, data: string, baseUi: JSX.Element) {
  let decoded: DecodedCall | undefined;
try {
  const iface = Interface.from(abi);
  const parsed = iface.parseTransaction({ data });
  if (!parsed) {
    return;
  }
  decoded = {
    name: parsed.name,
    signature: parsed.signature,
    params: parsed.args.map((arg, i) => ({
      name: parsed.fragment.inputs[i]?.name || `arg${i}`,
      type: parsed.fragment.inputs[i]?.type || `arg${i}`,
      value: arg,
    })),
  };
} catch(e) {
  console.error(e);
  return; // could not decode -> just ignore
}
await snap.request({
  method: 'snap_updateInterface',
  params: {
    id: uiId,
    ui: (
      <Box>
        {/* original confirmation part */}
        {baseUi}

        <Section>
        {/* separator — optional */}
        <Box>
          <Heading size="sm">Decoded contract call</Heading>
        </Box>

        <Row label="function">
          <Text>{decoded.name}</Text>
        </Row>

        {decoded.params.map((p) => {
          const isAddr  = p.type === 'address';
          const is18Dec = ['amountIn', 'amountOutMin', 'amountMin', 'amountOut', 'amountInMax', 'amountOutMax'].includes(p.name) || (['approve', 'transfer', 'transferFrom'].includes(decoded.name) && p.name === 'amount');

          const main = isAddr
            ? <Address address={p.value as `0x${string}`} truncate />
            : <Text>{String(p.value)}</Text>;

          const rows = [
            <Row key={p.name} label={p.name}>{main}</Row>,
          ];

          if (is18Dec) {
            rows.push(
              <Row key={p.name + '-helper'} label="">
                <Text color="muted">
                  ({Number(formatQuai(BigInt(p.value as string | number))).toFixed(5)} parsed as 18 decimals)
                </Text>
              </Row>,
            );
          }
          return rows;                // returns [<Row …>, (<Row …>)]
        })}
        </Section>
      </Box>
      
    ),
  },
});
}

