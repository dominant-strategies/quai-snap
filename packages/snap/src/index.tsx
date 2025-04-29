import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { Box, Text, Bold } from '@metamask/snaps-sdk/jsx';
import { quais } from 'quais';
import { getQuaiWallet } from './home';
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
      const params = request.params as [{ to: string; value: string; data?: string }];
      if (!params?.[0]) {
        throw new Error('Missing transaction parameters');
      }
      const { to, value, data } = params[0];
      let quaiWallet = await getQuaiWallet();
      quaiWallet = quaiWallet.connect(new quais.JsonRpcProvider('https://rpc.quai.network'));

      // Prompt user to confirm transaction
      const confirmed = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: (
            <Box>
              <Text>Send {value} QUAI to {to}?</Text>
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
        value: quais.parseQuai(value),
        data: data || '0x',
        from: quaiWallet.address,
      };
      try {
        // Sign and send the transaction
        const txResponse = await quaiWallet.sendTransaction(tx);
        return txResponse.hash;
      } catch (error) {
        console.log(error);
          await snap.request({
            method: "snap_dialog",
            params: {
              type: "alert",
              content: <Box><Text>{`Error: ${error}`}</Text></Box>,
            },
          });
          throw error;
        }

    default:
      throw new Error(`Unsupported method: ${request.method}`);
  }
};


