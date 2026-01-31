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
  Nestable,
  GenericSnapElement
} from '@metamask/snaps-sdk/jsx';
import { formatQuai, Ledger, quais, Wallet as QuaisWallet, Zone, getAddressDetails, getAddress } from "quais";
import { HDKey } from '@scure/bip32';
import { CONFIG } from './config';

function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (h.length % 2 !== 0) throw new Error('Invalid hex string length');
  if (!/^[0-9a-fA-F]*$/.test(h)) throw new Error('Invalid hex characters');
  const bytes = new Uint8Array(h.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(h.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

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
    await showSendForm(id);
    return;
  }

  // User clicked "Send" on the send form
  if (event.type === UserInputEventType.ButtonClickEvent && event.name === 'send-action') {
    // Read form values via snap_getInterfaceState (avoids FormSubmitEvent phantom crash)
    const ifaceState = await snap.request({
      method: 'snap_getInterfaceState',
      params: { id },
    });
    const formState = (ifaceState as Record<string, any>)?.['send-form'] ?? ifaceState;
    const to = String(formState?.to ?? '');
    const amount = String(formState?.amount ?? '');

    // ── Validation ─────────────────────────────────────────────────────────
    try {
      quais.getAddress(to);
      const details = quais.getAddressDetails(to);
      if (details?.ledger !== quais.Ledger.Quai) {
        throw new Error('Invalid recipient: Address must be a Quai address');
      } else if (details?.zone !== quais.Zone.Cyprus1) {
        throw new Error('Invalid recipient: Address must be a Cyprus1 address');
      }
    } catch (e) {
      await errorScreen(id, 'Is that a valid Quai address? ' + e);
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

  if (event.type === UserInputEventType.ButtonClickEvent &&
      (event.name === 'back' || event.name === 'refresh')) {
    await reRenderOverview(id);
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
    <Box>
      <Heading>Send&nbsp;QUAI</Heading>
      <Form name="send-form">
        <Field label="To">
          <Input name="to" placeholder="0x…" />
        </Field>

        <Field label="Amount">
          <Input name="amount" type="number" placeholder="0.0" />
        </Field>
      </Form>
      <Button name="send-action" variant="primary">Send</Button>
      <Button name="back" variant="destructive">Back</Button>
    </Box>
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

export async function successScreen(id: string, title: string, extra?: Nestable<boolean | GenericSnapElement | null>) {
  await snap.request({
    method: 'snap_updateInterface',
    params: {
      id,
      ui: (
        <Box>
          <Heading>{title}</Heading>
          {extra ?? null}
          <Button name="back">Back</Button>
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
          <Button name="back" variant="destructive">Back</Button>
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

    // Request the parent key ONCE — all child keys are derived locally
    const parentNode = await snap.request({
      method: 'snap_getBip32Entropy',
      params: {
        path: ["m", "44'", "994'", "0'"], // Quai coin type 994
        curve: 'secp256k1',
      },
    });
    if (!parentNode.privateKey || !parentNode.chainCode) {
      throw new Error('Failed to get parent key from snap_getBip32Entropy');
    }
    const parentHDKey = new HDKey({
      privateKey: hexToBytes(parentNode.privateKey),
      chainCode: hexToBytes(parentNode.chainCode),
    });

    if (state.quaiWallet?.address) {
      // Check if the stored address is actually a valid Quai address in Cyprus1
      const storedAddressDetails = getAddressDetails(getAddress(state.quaiWallet.address));
      if (storedAddressDetails?.ledger === Ledger.Quai && storedAddressDetails?.zone === Zone.Cyprus1) {
        // Valid Quai address — derive the child key locally
        const childKey = parentHDKey.deriveChild(state.quaiWallet.index);
        if (!childKey.privateKey) {
          throw new Error('Failed to derive child key');
        }
        let wallet = new QuaisWallet(bytesToHex(childKey.privateKey));
        wallet = wallet.connect(new quais.JsonRpcProvider('https://rpc.quai.network'));
        return wallet;
      } else {
        // Invalid address stored (wrong ledger or zone), clear it and regenerate
        console.log('Stored address %s is not a valid Quai address in Cyprus1, regenerating...', state.quaiWallet.address);
        await snap.request({
          method: 'snap_manageState',
          params: { operation: 'clear' },
        });
        state = {}; // Reset local state reference
      }
    }

    // Derive keys locally to find a Cyprus1 Quai address
    const maxAttempts = 1000000;
    let wallet: QuaisWallet;

    for (let index = 0; index < maxAttempts; index++) {
      const childKey = parentHDKey.deriveChild(index);
      if (!childKey.privateKey) {
        continue;
      }
      wallet = new QuaisWallet(bytesToHex(childKey.privateKey));
      let details;
      try {
        if (!quais.isAddress(wallet.address)) {
          continue;
        }
        details = getAddressDetails(wallet.address);
      } catch {
        continue;
      }
      // Check if address is in Cyprus1 zone on the Quai ledger
      if (details?.zone === Zone.Cyprus1 && details?.ledger === Ledger.Quai) {
        state.quaiWallet = {
          address: wallet.address.toString(),
          derivationPath: `m/44'/994'/0'/${index}`,
          index: index,
        };
        await snap.request({
          method: 'snap_manageState',
          params: { operation: 'update', newState: state },
        });
        wallet = wallet.connect(new quais.JsonRpcProvider('https://rpc.quai.network'));
        return wallet;
      }
    }

    throw new Error('Could not find a Cyprus1 Quai address after 1000000 attempts');
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
  
  // Pretty "5 min ago", "3 h", "2 d" …
function timeAgo(tsIso: string): string {
  const sec = (Date.now() - Date.parse(tsIso)) / 1_000;
  if (sec < 120)          return `${Math.floor(sec)} seconds ago`;
  if (sec < 3600)         return `${Math.floor(sec / 60)} minutes ago`;
  if (sec < 86_400)       return `${Math.floor(sec / 3600)} hours ago`;
  return `${Math.floor(sec / 86_400)} days ago`;
}