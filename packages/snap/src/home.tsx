import type { OnHomePageHandler, OnUserInputHandler } from "@metamask/snaps-sdk";
import { UserInputEventType } from "@metamask/snaps-sdk";
import {
  Box,
  Heading,
  Row,
  Address,
  Value,
  Button,
  Form,
  Field,
  Input,
  Spinner,
  Text,
  Copyable,
  Section,
  Link,
  Image
} from '@metamask/snaps-sdk/jsx';
import { formatQuai, Ledger, quais, Wallet as QuaisWallet, Zone, getAddressDetails } from "quais";
import { CONFIG } from './config';

type QuaiWalletState = {
  [key: string]: string | number;
  address: string;
  derivationPath: string;
  index: number;
}

type AddressParam = {
  hash: string;
  implementation_name?: string;
  is_contract?: boolean;
  is_verified?: boolean;
  name?: string;
};

type Transaction = {
  hash: string;
  from?: AddressParam;
  to: AddressParam;
  value: string;
  timestamp: string;
  type: 'Transfer' | 'Contract Call';
  _outgoing?: boolean;
};

export type SnapState = {
  quaiWallet?: QuaiWalletState;
  sentTxs?: Transaction[];
};

export const onHomePage: OnHomePageHandler = async () => {
  const wallet = await getQuaiWallet();
  const bal    = await wallet.provider!.getBalance(wallet.address);
  const history = await buildTxHistory(wallet.address);
  return {
    // MetaMask will keep this UI alive until the user closes the panel
    content: (
      <Box>
        <Row label="Address">
          <Address address={wallet.address as `0x${string}`} />
        </Row>
        <Copyable value={wallet.address} />
        <Link href={CONFIG.EXPLORER_ADDRESS_URL(wallet.address)}>View on Quaiscan ↗</Link>
        <Row label="Balance">
          <Value value={Number(formatQuai(bal)).toFixed(4).replace(/\.?0+$/, '')} extra="QUAI" />
        </Row>

        <Section>
            <Button name="open-send" variant="primary">Send QUAI</Button>
        </Section>
          <Button name="refresh">Refresh</Button>

        {history}
      </Box>
    ),
  };
};

// ---------------------------------------------------------------------------
//  2. LISTEN FOR THE BUTTON (“open-send”) AND SHOW THE FORM
// ---------------------------------------------------------------------------
export const onUserInput: OnUserInputHandler = async ({ id, event }) => {
  // User clicked "Send QUAI" on the home-page
  if (event.type === UserInputEventType.ButtonClickEvent && event.name === 'open-send') {
    await showSendForm(id);          // 👈 show modal with the form
    return;
  }

  // User submitted the send form
  if (event.type === UserInputEventType.FormSubmitEvent && event.name === 'send-form') {
    const { to, amount } = event.value as {
      to: string;
      amount: string;
    };

    // ── Validation ─────────────────────────────────────────────────────────
    if (!quais.isAddress(to)) {
      await errorScreen(id, 'Invalid "to" address');
      return;
    }
    if (+amount <= 0) {
      await errorScreen(id, 'Amount must be > 0');
      return;
    }

    // ── Send the transaction ───────────────────────────────────────────────
    const wallet = await getQuaiWallet();
    try {
      await loadingScreen(id, 'Sending…');

      const tx = await wallet.sendTransaction({
        to,
        value: quais.parseQuai(amount),
        from: wallet.address,
      });

      const st = (await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
      })) as SnapState ?? {};
      st.sentTxs ??= [];
      st.sentTxs.unshift({
        hash: tx.hash,
        from: { hash: wallet.address },
        to: { hash: to },
        value: quais.parseQuai(amount).toString(),
        timestamp: new Date().toISOString(),
        type: 'Transfer',
      });
      st.sentTxs = st.sentTxs.slice(0, 100);          // keep max 100
      await snap.request({
        method: 'snap_manageState',
        params: { operation: 'update', newState: st },
      });

      await successScreen(
        id,
        `Tx sent! Hash: ${tx.hash}`,
        <Link href={CONFIG.EXPLORER_TX_URL(tx.hash)}>View on Quaiscan ↗</Link>
      );
    } catch (err: any) {
      await errorScreen(id, String(err?.message ?? err));
    }
  }

  if (event.type === UserInputEventType.ButtonClickEvent && (event.name === 'back' || event.name === 'refresh')) {
    await reRenderOverview(id); // <- reuse same interface id
    return;
  }
};

// ---------------------------------------------------------------------------
//  3. HELPERS TO OPEN / UPDATE THE INTERFACES
// ---------------------------------------------------------------------------

// ────────────────────────────────────────────────────────────────
// A helper that either creates the interface (first time) or
// re-uses the existing one (inside the modal). It never calls
// snap_dialog twice.
// ────────────────────────────────────────────────────────────────
async function showSendForm(existingId?: string) {
  const ui = (
    <Form name="send-form">
      <Heading>Send&nbsp;QUAI</Heading>

      <Field label="To">
        <Input name="to" placeholder="0x…" />
      </Field>

      <Field label="Amount">
        <Input name="amount" type="number" placeholder="0.0" />
      </Field>

      <Box direction="horizontal" alignment="space-between">
        <Button name="back"  variant="destructive">Back</Button>
        <Button type="submit">Send</Button>
      </Box>
    </Form>
  );

  if (existingId) {
    // We are already inside the modal → just replace the body
    await snap.request({
      method: 'snap_updateInterface',
      params: { id: existingId, ui },
    });
    return existingId;
  }

  // First time: build interface + open a dialog
  const id = await snap.request({
    method: 'snap_createInterface',
    params: { ui },
  });

  await snap.request({
    method: 'snap_dialog',
    params: { type: 'alert', id },
  });

  return id;
}

async function reRenderOverview(id: string) {
  const wallet  = await getQuaiWallet();
  const balance = await wallet.provider!.getBalance(wallet.address);
  const history = await buildTxHistory(wallet.address);

  const ui = (
    <Box>
      <Row label="Address">
        <Address address={wallet.address as `0x${string}`} />
      </Row>
      <Copyable value={wallet.address} />
      <Link href={CONFIG.EXPLORER_ADDRESS_URL(wallet.address)}>View on Quaiscan ↗</Link>

      <Row label="Balance">
        <Value value={Number(formatQuai(balance)).toFixed(4).replace(/\.?0+$/, '')} extra="QUAI" />
      </Row>

      <Section>
            <Button name="open-send" variant="primary">Send QUAI</Button>
        </Section>
      <Button name="refresh">Refresh</Button>
      {history}
    </Box>
  );

  await snap.request({
    method: 'snap_updateInterface',
    params: { id, ui },
  });
}

async function loadingScreen(id: string, title = 'Loading…') {
  await snap.request({
    method: 'snap_updateInterface',
    params: {
      id,
      ui: (
        <Box>
          <Heading>{title}</Heading>
          <Spinner />
        </Box>
      ),
    },
  });
}

export async function successScreen(id: string, title: string, extra?: any) {
  await snap.request({
    method: 'snap_updateInterface',
    params: {
      id,
      ui: (
        <Box>
          <Heading>{title}</Heading>
          {extra}
        </Box>
      ),
    },
  });
}

async function errorScreen(id: string, msg: string) {
  await snap.request({
    method: 'snap_updateInterface',
    params: {
      id,
      ui: (
        <Box>
          <Heading>Error</Heading>
          <Text color="error">{msg}</Text>
          <Button name="back"  variant="destructive">Back</Button>
        </Box>
      ),
    },
  });
}

export async function getQuaiWallet() {
    // Check Snap state for cached wallet
    let state = (await snap.request({
      method: 'snap_manageState',
      params: { operation: 'get' },
    }) || {}) as { quaiWallet?: QuaiWalletState };
  
    if (state.quaiWallet?.address) {
      const bip32Node = await snap.request({
        method: 'snap_getBip32Entropy',
        params: {
          path: ["m", "44'", "994'", "0'", `${state.quaiWallet.index}`], // Quai coin type 994
          curve: 'secp256k1',
        },
      });
      if (!bip32Node.privateKey) {
        throw new Error('Failed to get private key');
      }
      // Reuse cached private key
      let wallet = new QuaisWallet(bip32Node.privateKey);
      wallet = wallet.connect(new quais.JsonRpcProvider('https://rpc.quai.network'));
      return wallet
    }
  
    // Derive keys iteratively to find shard 0 address
    let index = 0;
    const maxAttempts = 1000000;
    let wallet: QuaisWallet;
  
    while (index < maxAttempts) {
      // Request key for path m/44'/994'/0'/0/index
      const bip32Node = await snap.request({
        method: 'snap_getBip32Entropy',
        params: {
          path: ["m", "44'", "994'", "0'", `${index}`], // Quai coin type 994
          curve: 'secp256k1',
        },
      });
  
      if (!bip32Node.privateKey) {
        throw new Error('Failed to get private key');
      }
      // Create wallet from private key
      wallet = new QuaisWallet(bip32Node.privateKey);
      let details;
      try {
        // Check if address is valid
        if (!quais.isAddress(wallet.address)) {
          throw new Error('Invalid address');
        }
        details = getAddressDetails(wallet.address);
        details!.ledger = isQuaiAddress(wallet.address) ? Ledger.Quai : Ledger.Qi;
      }
      catch (error) {
        // Handle invalid address error
        index++;
        continue;
      }
      // Check if address starts with 0x00 (shard 0)
      if (details?.zone === Zone.Cyprus1 && details?.ledger === Ledger.Quai) {
        // Store wallet details in Snap state
        state.quaiWallet = {
          address: wallet.address.toString(),
          derivationPath: `m/44'/994'/0'/0/${index}`,
          index: index,
        };
        await snap.request({
          method: 'snap_manageState',
          params: { operation: 'update', newState: state },
        });
        wallet = wallet.connect(new quais.JsonRpcProvider('https://rpc.quai.network'));
        return wallet;
      }
  
      index++;
    }
  
    throw new Error('Could not find a shard 0 address after 10000 attempts');
  }

  async function buildTxHistory(addr: string) {
    const url = CONFIG.QUAISCAN_API_TXS(addr);
    let items: Transaction[] = [];
  
    try {
      const r = await fetch(url).then(r => r.json());
      const incoming = (r.items ?? []) as Transaction[];

      const st = (await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
      })) as SnapState ?? {};
      const outgoing = (st.sentTxs ?? [])
        .filter((tx) => tx.from !== undefined ? tx.from.hash.toLowerCase() === addr.toLowerCase() : true)
        .map((tx) => ({
          hash: tx.hash,
          from: { hash: addr as `0x${string}` },
          to: { hash: tx.to.hash },
          value: tx.value,
          timestamp: tx.timestamp,
          type: tx.type,
          _outgoing: true,
        }));
        items = [...incoming, ...outgoing]
        .sort((a: Transaction, b: Transaction) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
        .slice(0, 10);            // show last 10
    } catch (e) {
      return (
        <Section>
          <Text color="muted">Can't fetch history.</Text>
        </Section>
      );
    }
  
    return (
      <Section>
        <Heading size="sm">Latest transactions</Heading>
  
        {items.map((tx: Transaction) => {
          const peer = tx._outgoing ? tx.to.hash : tx.from?.hash;
          const sentReceived = tx._outgoing ? 'Sent' : 'Received';
          const toFrom = tx._outgoing ? 'To' : 'From';
          const isContract = tx.type === 'Contract Call';
          return (
            <Box key={tx.hash}>
  
              {/* line #1 – time-ago & amount */}
              <Row label={`${sentReceived} ${timeAgo(tx.timestamp)}`}>
                <Value value={Number(formatQuai(tx.value)).toFixed(4).replace(/\.?0+$/, '')} extra="QUAI" />
              </Row>
  
              {/* line #2 – sender */}
              <Row label={`${toFrom} ${isContract ? '(Contract)' : ''}`}>
                <Address address={peer as `0x${string}`} truncate />
              </Row>
  
              {/* line #3 – link to QuaiScan */}
              <Row label="">
                <Link href={CONFIG.EXPLORER_TX_URL(tx.hash)}>Quaiscan&nbsp;↗</Link>
              </Row>
  
            </Box>
          );
        })}
      </Section>
    );
  }

  export function isQuaiAddress(address: string) {
    if (typeof address !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
      throw new Error('Invalid address format');
    }
  
    // strip the 0x prefix and normalise case
    const hex = address.slice(2).toLowerCase();
  
    // The 5-th hex digit (index 4) contains bit-8 (LSB decides the ledger)
      const fifthDigit = parseInt(hex[4]!, 16);
  
    // bit 0 == 0 → Quai, 1 → Qi
    return (fifthDigit & 1) === 0;
  }
  
  // Pretty "5 min ago", "3 h", "2 d" …
function timeAgo(tsIso: string): string {
  const sec = (Date.now() - Date.parse(tsIso)) / 1_000;
  if (sec < 120)          return `${Math.floor(sec)} seconds ago`;
  if (sec < 3600)         return `${Math.floor(sec / 60)} minutes ago`;
  if (sec < 86_400)       return `${Math.floor(sec / 3600)} hours ago`;
  return `${Math.floor(sec / 86_400)} days ago`;
}