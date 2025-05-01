import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { Box, Text, Bold, Copyable, Row, Address, Link, Heading } from '@metamask/snaps-sdk/jsx';
import { id, quais } from 'quais';
import { getQuaiWallet, successScreen } from './home';
export * from "./home";          // re-export the handler so MetaMask can find it

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
  switch (request.method) {
    case 'hello':
      return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: (
            <Box>
              <Text>
                Hello, <Bold>{origin}</Bold>!
              </Text>
              <Text>
                This custom confirmation is just for display purposes.
              </Text>
              <Text>
                But you can edit the snap source code to make it do something,
                if you want to!
              </Text>
            </Box>
          ),
        },
      });

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

      // Prompt user to confirm transaction
      const confirmed = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: (
            <Box>
              <Text>
                Sending {value??"0"} QUAI to
              </Text>
              <Row label="Address">
                <Address address={to as `0x${string}`} />
              </Row>
              {data && data !== '0x' ? (
                <Box>
                  <Text>Contract call data</Text>
                  <Copyable value={data} />
                </Box>
              ) : null}
            </Box>
          ),
        },
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
        })) as any ?? {};
        st.sentTxs ??= [];
        st.sentTxs.unshift({
          hash:  txResponse.hash,
          to,
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
                <Link href={`https://quaiscan.io/tx/${txResponse.hash}`}>
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


