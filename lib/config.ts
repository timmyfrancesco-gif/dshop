export const SITE = {
  name: "Heaven Market",
  tagline: "Trade crypto with confidence — escrow, middleman & exchange services built for Discord.",
  discordInvite: process.env.NEXT_PUBLIC_DISCORD_INVITE ?? "https://discord.gg/your-invite",
  shopUrl: process.env.NEXT_PUBLIC_SHOP_URL ?? "https://discord.gg/your-invite",
};

export const NAV_LINKS = [
  { href: "#top", label: "Home" },
  { href: "#shop", label: "Products" },
  { href: "#services", label: "Features" },
  { href: "#faq", label: "FAQ" },
  { href: "#vouches", label: "Reviews" },
  { href: "/track", label: "Track Order" },
  { href: "/terms", label: "Terms of Service" },
];

export const FAQS = [
  {
    question: "How do I buy a product?",
    answer:
      "Browse the shop, open a product to choose a quantity, then pay with Litecoin (LTC) directly on the site. Once your payment is confirmed, the item is delivered straight to this site and to your Discord DMs.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "Right now all purchases are paid in Litecoin (LTC). More payment methods are coming soon — they'll appear in the payment method selector once available.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Delivery is automatic. As soon as your LTC payment is confirmed on-chain, the bot marks your order as paid, delivers the item on this site and sends you a DM on Discord.",
  },
  {
    question: "What if I send the wrong amount?",
    answer:
      "Each order has an exact amount in EUR and LTC. If the payment received doesn't match exactly, the order stays pending and isn't delivered automatically — contact staff on Discord with your order ID and we'll sort it out.",
  },
  {
    question: "Can I track my order?",
    answer:
      "Yes — use the Track Order page and enter your order ID to see its current status (pending or paid).",
  },
] as const;

export const TICKER_COINS = [
  { id: "litecoin", symbol: "LTC", name: "Litecoin" },
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "tether", symbol: "USDT", name: "Tether" },
] as const;

export interface ServiceCard {
  title: string;
  description: string;
  fee?: string;
  icon: string;
}

export const SERVICES: ServiceCard[] = [
  {
    title: "Escrow",
    description:
      "A neutral third party holds funds until both sides of a deal confirm delivery. Built for buyer/seller trades of any size.",
    fee: "0.25% fee",
    icon: "shield",
  },
  {
    title: "Middleman",
    description:
      "An experienced staff member personally oversees high-value or high-risk trades from start to finish.",
    fee: "5% fee",
    icon: "handshake",
  },
  {
    title: "Exchange",
    description:
      "Swap between crypto and PayPal at competitive, transparent rates with fast turnaround.",
    icon: "exchange",
  },
  {
    title: "Casino",
    description:
      "Try your luck in our Discord blackjack tables — provably fair, fast-paced, and always open.",
    icon: "casino",
  },
  {
    title: "Advertising Slots",
    description:
      "Get your server or project in front of an active trading community with featured ad placements.",
    icon: "megaphone",
  },
  {
    title: "Digital Shop",
    description:
      "Browse and purchase digital goods directly through the bot, with secure delivery on every order.",
    icon: "shop",
  },
];

import type { Product } from "./types";

export const PRODUCTS: Product[] = [
  {
    id: "ltc-wallet-aged",
    name: "Aged LTC Wallet",
    category: "Wallets",
    price: 15,
    stock: 12,
    description:
      "Pre-funded, aged Litecoin wallet with verified transaction history. Ideal for traders who need an established on-chain footprint. Delivered instantly via the bot after payment confirmation.",
    icon: "wallet",
  },
  {
    id: "escrow-priority-pass",
    name: "Priority Escrow Pass",
    category: "Services",
    price: 8,
    stock: 30,
    description:
      "Skip the queue and get your escrow trade handled by staff first. Valid for one trade of any size, redeemable any time within 30 days of purchase.",
    icon: "shield",
  },
  {
    id: "discord-nitro-1m",
    name: "Discord Nitro (1 Month)",
    category: "Subscriptions",
    price: 6,
    stock: 25,
    description:
      "One month of Discord Nitro delivered as a redeemable gift link. Boosts your profile, unlocks bigger uploads, custom emojis and HD streaming.",
    icon: "nitro",
  },
  {
    id: "mm-vouch-pack",
    name: "Middleman Vouch Pack",
    category: "Services",
    price: 20,
    stock: 8,
    description:
      "Bundle of 5 fully-handled middleman trades with a senior staff member, perfect for sellers building reputation quickly on other servers.",
    icon: "handshake",
  },
  {
    id: "btc-fragment",
    name: "BTC Fragment (0.005)",
    category: "Wallets",
    price: 35,
    stock: 6,
    description:
      "Small Bitcoin fragment sent directly to your wallet address after purchase. Great for testing exchange flows or topping up a hot wallet.",
    icon: "exchange",
  },
  {
    id: "vps-trading-bot",
    name: "Trading Bot VPS (1 Month)",
    category: "Hosting",
    price: 12,
    stock: 18,
    description:
      "Lightweight 24/7 VPS preconfigured to run Discord and trading bots. Includes SSH access, 1 vCPU, 1GB RAM and 20GB SSD storage.",
    icon: "vps",
  },
];

export type SlotTier = "first" | "second" | "third";
export type SlotDuration = "weekly" | "monthly" | "lifetime";

export const SLOT_TIERS: { id: SlotTier; name: string; description: string }[] = [
  { id: "first", name: "First Slot", description: "Top placement — maximum visibility." },
  { id: "second", name: "Second Slot", description: "Prime placement at a great value." },
  { id: "third", name: "Third Slot", description: "Affordable entry-level visibility." },
];

export const SLOT_DURATIONS: { id: SlotDuration; name: string }[] = [
  { id: "weekly", name: "Weekly" },
  { id: "monthly", name: "Monthly" },
  { id: "lifetime", name: "Lifetime" },
];

export const SLOT_PRICES: Record<SlotTier, Record<SlotDuration, number>> = {
  first: { weekly: 5, monthly: 15, lifetime: 40 },
  second: { weekly: 3, monthly: 9, lifetime: 27 },
  third: { weekly: 2, monthly: 6, lifetime: 18 },
};

export const PAYPAL_TO_CRYPTO_FEES = [
  { range: "€0 – €50", fee: "8%" },
  { range: "€51 – €200", fee: "6%" },
  { range: "€201 – €500", fee: "5%" },
  { range: "€501+", fee: "4%" },
];

export const CRYPTO_TO_CRYPTO_FEES = [
  { range: "€0 – €100", fee: "3%" },
  { range: "€101 – €500", fee: "2%" },
  { range: "€501+", fee: "1%" },
];

export const TESTIMONIALS = [
  {
    quote:
      "Used the escrow for a $2k deal and it went smooth from start to finish. Funds released the second both sides confirmed.",
    author: "Anonymous Trader",
    role: "Escrow user",
  },
  {
    quote:
      "Had a middleman step in for a higher-risk trade and they were professional the whole way through. Would use again.",
    author: "Anonymous Trader",
    role: "Middleman user",
  },
  {
    quote:
      "Exchange rates were better than I expected and the payout landed in minutes. Easy process.",
    author: "Anonymous Trader",
    role: "Exchange user",
  },
  {
    quote:
      "Grabbed a First Slot for a week and saw a noticeable bump in traffic to our server.",
    author: "Anonymous Server Owner",
    role: "Advertising client",
  },
];
