# Hyperliquid Trader

A desktop trading client for [Hyperliquid](https://hyperliquid.xyz), the perpetuals DEX.
Electron shell, React 19 renderer, and a hand-written exchange client that signs orders
locally and streams account and price updates over WebSocket.

Built June 2025 to learn how an exchange integration actually behaves — order signing,
asset-id mapping, position and balance reconciliation — rather than to be used with real
money. See [Status](#status) before running it.

## What it does

- **Multi-account management** — several Hyperliquid wallets side by side, each connected
  independently ([`AccountsManagment/`](src/components/AccountsManagment))
- **Market and limit orders**, cancel-one, cancel-all, close-all-positions
  ([`hyperliquid.ts`](src/services/hyperliquid.ts))
- **Live positions, balances and open orders**, updated from the `user` WebSocket channel
- **Leverage adjustment** per asset
- **USDC spot trading** as a separate surface ([`USDc/`](src/components/USDc))
- **TradingView chart** embedding ([`TradingView/`](src/components/TradingView))
- **Builder codes** — attribution parameters on orders
  ([`Builder/BuilderSettings.tsx`](src/components/Builder/BuilderSettings.tsx))

## Status

**Prototype. Not safe for real funds, and not maintained.** Being specific about why,
because "prototype" on its own tells a reader nothing:

- **No tests.** None. The repo is a single commit.
- **Order placement is unverified against mainnet.** `createSignature()` signs
  `keccak256(JSON.stringify(action))` with `wallet.signMessage()`, which applies the
  EIP-191 personal-sign prefix. Hyperliquid's exchange endpoint expects EIP-712 typed
  data over a msgpack-encoded action. Read-only calls and the WebSocket feeds work;
  signed order submission almost certainly gets rejected. The 52 scratch pages and
  one-off scripts I had accumulated in `public/` were the archaeology of fighting
  exactly this; they are out of the tree now but still in the history.
- **Fill status is asserted, not confirmed.** `placeMarketOrder()` sets
  `status: 'filled'` whenever the HTTP response says `status: 'ok'` — but `ok` means the
  exchange *accepted the action*, not that it filled. When no order id comes back it
  fabricates one from `Date.now()` and `Math.random()`, which cannot be reconciled
  against anything later.
- **Private keys are typed into the UI** and held in renderer memory. Nothing is written
  to disk, but see [Security](#security).

Design notes written while building it are in [`docs/`](docs) — the multi-account model,
the trading-controls analysis, and what I found out about Hyperliquid's USDC spot API.

## Architecture

```
Electron main  ──▶  Vite dev server / built renderer
                         │
                    React 19 + TailwindCSS 4
                         │
                 TradingContext  ── app state, account registry
                         │
                 HyperliquidService  ── the whole exchange boundary
                   ├── ethers.Wallet          local signing
                   ├── POST /exchange         orders, cancels, leverage
                   ├── POST /info             positions, balances, meta
                   └── WebSocket              allMids, user channels
```

Everything that touches the exchange lives in one class,
[`HyperliquidService`](src/services/hyperliquid.ts), the largest file in the project at
roughly 950 lines. That was deliberate: a
single seam meant the signing and nonce logic had one home, and the React tree never
holds a wallet.

Asset ids are resolved by fetching exchange metadata and building a `symbol → index`
map, since Hyperliquid's order payload identifies assets by numeric index rather than by
ticker.

## What I would change now

Both of the real defects above are the same mistake, and it is one I have since gone and
written a library about.

**1. Replace the signing.** EIP-712 typed data, msgpack-encoded action, the documented
domain. `JSON.stringify` also has no canonical key ordering, so even the hash was
unstable.

**2. Stop asserting outcomes.** An order the exchange has accepted is not an order that
filled, and an order whose id you invented is an order you can never reconcile. The
honest model has terminal states and one that admits defeat:

```
submitted ──▶ accepted ──▶ filled | rejected | cancelled
                   └─────▶ unknown      (no id, or no confirmation — a human decides)
```

That is the same shape as a mobile-money charge whose callback never arrives, which is
what [daraja-reliable](https://github.com/Flopchamp/daraja-reliable) exists to handle:
idempotent submission, replay-safe confirmation, and a reconciler for the ones left
stranded. This repo is where I learned why that layer has to exist.

## Running it

Requires Node 20+.

```bash
npm install
npm start          # Vite dev server + Electron together
```

| Script | Purpose |
|---|---|
| `npm run dev` | renderer only, in the browser |
| `npm run build` | build the renderer |
| `npm run build-electron` | compile the Electron main process |
| `npm run dist` | package installers via electron-builder |
| `npm run lint` | ESLint |

## Security

Hyperliquid supports **API wallets** (agent wallets) — separate keys you can authorise
for trading only and revoke at any time. Use one. Do not paste a key controlling funds
you care about into this or any other desktop trading client.

This app keeps keys in memory only and never persists them or sends them anywhere but
Hyperliquid's own API. That is a weaker guarantee than it sounds: an Electron renderer is
a browser, so every dependency in the tree runs in the same process as the key.

## Licence

[MIT](LICENSE).
