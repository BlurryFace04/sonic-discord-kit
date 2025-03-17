"use client"

import { useEffect, useState } from "react"
import { DiscordSDK } from "@discord/embedded-app-sdk"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// just for reference, this is how privy's user object looks like
const USER = {
  "id": "did:privy:cm83m1783016e11yav3lwalea",
  "createdAt": "2025-03-10T22:04:34.000Z",
  "linkedAccounts": [
    {
      "subject": "611143412720074752",
      "username": "blurryface04#0",
      "email": "arnav29104@gmail.com",
      "type": "discord_oauth",
      "verifiedAt": "2025-03-10T22:04:34.000Z",
      "firstVerifiedAt": "2025-03-10T22:04:34.000Z",
      "latestVerifiedAt": "2025-03-16T12:52:13.000Z"
    },
    {
      "id": null,
      "address": "0xcbfFe3A281998dbaD51E2EeE52F6992DD881ff45",
      "type": "wallet",
      "imported": false,
      "delegated": false,
      "verifiedAt": "2025-03-10T22:04:38.000Z",
      "firstVerifiedAt": "2025-03-10T22:04:38.000Z",
      "latestVerifiedAt": "2025-03-10T22:04:38.000Z",
      "chainType": "ethereum",
      "walletClientType": "privy",
      "connectorType": "embedded",
      "recoveryMethod": "privy",
      "walletIndex": 0
    },
    {
      "id": "hh9ro3laqcyf47wxfrtxwj5c",
      "address": "CbqJ3U5XSDr2jGem8EtsKU2cPGMHimRnSRevWhKeo2CM",
      "type": "wallet",
      "imported": false,
      "delegated": true,
      "verifiedAt": "2025-03-10T22:14:52.000Z",
      "firstVerifiedAt": "2025-03-10T22:04:38.000Z",
      "latestVerifiedAt": "2025-03-10T22:04:38.000Z",
      "chainType": "solana",
      "walletClientType": "privy",
      "connectorType": "embedded",
      "recoveryMethod": "privy",
      "walletIndex": 0
    }
  ],
  "wallet": {
    "id": null,
    "address": "0xcbfFe3A281998dbaD51E2EeE52F6992DD881ff45",
    "chainType": "ethereum",
    "walletClientType": "privy",
    "connectorType": "embedded",
    "recoveryMethod": "privy",
    "imported": false,
    "delegated": false,
    "walletIndex": 0
  },
  "discord": {
    "subject": "611143412720074752",
    "username": "blurryface04#0",
    "email": "arnav29104@gmail.com"
  },
  "delegatedWallets": [],
  "mfaMethods": [],
  "hasAcceptedTerms": false,
  "isGuest": false
}

export default function DiscordApp() {
  console.log("DiscordApp component mounted")
  const discordSdk = new DiscordSDK(process.env.NEXT_PUBLIC_DISCORD_APP_ID || "")

  // SOL transfer states
  const [auth, setAuth] = useState(null)
  const [user, setUser] = useState<any>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [toAddress, setToAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Token transfer states
  const [tokenToAddress, setTokenToAddress] = useState("")
  const [mintAddress, setMintAddress] = useState("")
  const [tokenAmount, setTokenAmount] = useState("")
  const [tokenTransferLoading, setTokenTransferLoading] = useState(false)
  const [tokenTransferTxHash, setTokenTransferTxHash] = useState<string | null>(null)
  const [tokenTransferError, setTokenTransferError] = useState<string | null>(null)

  // Token balances state
  const [tokenBalances, setTokenBalances] = useState<{ splTokens: any[]; token2022Tokens: any[] }>({ splTokens: [], token2022Tokens: [] })
  const [tokenBalancesLoading, setTokenBalancesLoading] = useState(false)
  const [tokenBalancesError, setTokenBalancesError] = useState<string | null>(null)

  // NFT mint states
  const [nftToAddress, setNftToAddress] = useState("")
  const [nftMintLoading, setNftMintLoading] = useState(false)
  const [nftMintTxHash, setNftMintTxHash] = useState<string | null>(null)
  const [nftMintError, setNftMintError] = useState<string | null>(null)
  const [mintedAsset, setMintedAsset] = useState<any>(null)

  useEffect(() => {
    async function setupDiscord() {
      await discordSdk.ready()
      console.log("Discord SDK is ready")
      
      console.log("🔄 Requesting Discord authorization...")
      const { code } = await discordSdk.commands.authorize({
        client_id: process.env.NEXT_PUBLIC_DISCORD_APP_ID || "",
        response_type: "code",
        state: "",
        prompt: "none",
        scope: ["identify", "guilds", "applications.commands"],
      })

      if (!code) {
        console.error("❌ Authorization failed: No code returned")
        return
      }
      console.log("✅ Authorization successful, code received:", code)

      console.log("🔄 Sending token request to backend...")
      const response = await fetch("/.proxy/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      const { access_token } = await response.json()
      const authData = await discordSdk.commands.authenticate({ access_token })

      if (!authData) {
        throw new Error("Authenticate command failed")
      }

      setAuth(authData as any)

      const userInfoResponse = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
      })

      const userInfo = await userInfoResponse.json()
      console.log("Discord User Info:", userInfo)

      const discordId = userInfo.id

      try {
        const userResponse = await fetch(`/.proxy/api/user?discordId=${discordId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        })

        const data = await userResponse.json()

        if (data.user) {
          console.log("User found in ephemeral storage:", data)
          setUser(data.user)

          const solanaAccount = (data.user.linkedAccounts as any[]).find(account => (account as any).chainType === 'solana')
          const address = solanaAccount ? (solanaAccount as any).address : null
          console.log("Wallet address:", address)

          setWalletAddress(address)
        } else {
          console.log("No user found in ephemeral storage")
        }

      } catch (error) {
        console.error("Error fetching user session:", error)
      }
    }

    setupDiscord()
  }, [])

  // Fetch SOL balance when walletAddress updates
  useEffect(() => {
    async function fetchBalance() {
      if (walletAddress) {
        try {
          const response = await fetch("/.proxy/api/balance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: walletAddress }),
          })
          const data = await response.json()
          if (data.balance !== undefined) {
            setBalance(data.balance)
          }
        } catch (err) {
          console.error("Error fetching balance:", err)
        }
      }
    }
    fetchBalance()
  }, [walletAddress])

  // Fetch token balances when walletAddress updates or after token transfer
  useEffect(() => {
    async function fetchTokenBalances() {
      if (walletAddress) {
        setTokenBalancesLoading(true)
        setTokenBalancesError(null)
        try {
          const response = await fetch("/.proxy/api/token-balance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: walletAddress }),
          })
          const data = await response.json()
          if (data.splTokens !== undefined && data.token2022Tokens !== undefined) {
            setTokenBalances({ splTokens: data.splTokens, token2022Tokens: data.token2022Tokens })
          }
        } catch (err: any) {
          console.error("Error fetching token balances:", err)
          setTokenBalancesError(err.message)
        } finally {
          setTokenBalancesLoading(false)
        }
      }
    }
    fetchTokenBalances()
  }, [walletAddress, tokenTransferTxHash])

  // Handle SOL transfer
  async function handleTransfer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setTxHash(null)
    setLoading(true)
    try {
      const response = await fetch("/.proxy/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: walletAddress,
          to: toAddress,
          lamports: parseInt(amount),
        }),
      })

      const data = await response.json()
      if (data.success) {
        setTxHash(data.txHash)

        const balanceResponse = await fetch("/.proxy/api/balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: walletAddress }),
        })
        const balanceData = await balanceResponse.json()
        if (balanceData.balance !== undefined) {
          setBalance(balanceData.balance)
        }
      } else {
        setError(data.error || "Transfer failed")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle token transfer
  async function handleTokenTransfer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTokenTransferError(null)
    setTokenTransferTxHash(null)
    setTokenTransferLoading(true)
    try {
      const response = await fetch("/.proxy/api/transfer-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: walletAddress,
          to: tokenToAddress,
          mintAddress: mintAddress,
          amount: parseInt(tokenAmount),
        }),
      })

      const data = await response.json()
      if (data.success) {
        setTokenTransferTxHash(data.txHash)
        // Refresh token balances after successful transfer
        const balanceResponse = await fetch("/.proxy/api/token-balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: walletAddress }),
        })
        const balanceData = await balanceResponse.json()
        if (balanceData.splTokens !== undefined && balanceData.token2022Tokens !== undefined) {
          setTokenBalances({ splTokens: balanceData.splTokens, token2022Tokens: balanceData.token2022Tokens })
        }
      } else {
        setTokenTransferError(data.error || "Token transfer failed")
      }
    } catch (err: any) {
      setTokenTransferError(err.message)
    } finally {
      setTokenTransferLoading(false)
    }
  }

  // Handle NFT minting
  async function handleNftMint(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setNftMintError(null)
    setNftMintTxHash(null)
    setNftMintLoading(true)
    try {
      const response = await fetch("/.proxy/api/nft/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payer: walletAddress,
          to: nftToAddress,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setNftMintTxHash(data.txHash)
        setMintedAsset(data.asset)
      } else {
        setNftMintError(data.error || "NFT mint failed")
      }
    } catch (err: any) {
      setNftMintError(err.message)
    } finally {
      setNftMintLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-y-8 px-40 py-20 justify-center">
      {/* SOL Transfer Card */}
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Transfer SOL</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTransfer}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label>Your privy account</Label>
                <Label>{walletAddress}</Label>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label>Balance: {balance} lamports</Label>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="to">To wallet address</Label>
                <Input
                  id="to"
                  placeholder="address"
                  autoComplete="off"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="amount">Amount (lamports)</Label>
                <Input
                  id="amount"
                  placeholder="in lamports"
                  autoComplete="off"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Transferring..." : "Transfer"}
              </Button>
            </div>
          </form>
          {txHash && (
            <div className="mt-4">
              <Label className="text-green-600 mb-2">Transfer successful!</Label>
              <Label>
                <a
                  href={`https://explorer.sonic.game/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View Transaction
                </a>
              </Label>
            </div>
          )}
          {error && (
            <div className="mt-4">
              <Label className="text-red-600">Error: {error}</Label>
            </div>
          )}
        </CardContent>
        <CardFooter />
      </Card>

      {/* Token Transfer Card */}
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Transfer Token</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTokenTransfer}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label>Your privy account</Label>
                <Label>{walletAddress}</Label>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="token-to">To wallet address</Label>
                <Input
                  id="token-to"
                  placeholder="address"
                  autoComplete="off"
                  value={tokenToAddress}
                  onChange={(e) => setTokenToAddress(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="mint">Mint Address</Label>
                <Input
                  id="mint"
                  placeholder="mint address"
                  autoComplete="off"
                  value={mintAddress}
                  onChange={(e) => setMintAddress(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="token-amount">Amount (smallest unit)</Label>
                <Input
                  id="token-amount"
                  placeholder="amount"
                  autoComplete="off"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={tokenTransferLoading}>
                {tokenTransferLoading ? "Transferring token..." : "Transfer Token"}
              </Button>
            </div>
          </form>
          {tokenTransferTxHash && (
            <div className="mt-4">
              <Label className="text-green-600 mb-2">Token Transfer successful!</Label>
              <Label>
                <a
                  href={`https://explorer.sonic.game/tx/${tokenTransferTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View Transaction
                </a>
              </Label>
            </div>
          )}
          {tokenTransferError && (
            <div className="mt-4">
              <Label className="text-red-600">Error: {tokenTransferError}</Label>
            </div>
          )}
        </CardContent>
        <CardFooter />
      </Card>

      {/* Token Balances Card */}
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
        </CardHeader>
        <CardContent>
          {tokenBalancesLoading ? (
            <Label>Loading token balances...</Label>
          ) : tokenBalancesError ? (
            <Label className="text-red-600">Error: {tokenBalancesError}</Label>
          ) : (
            <>
              <div>
                <Label className="font-bold">SPL Tokens</Label>
                {tokenBalances.splTokens.length > 0 ? (
                  tokenBalances.splTokens.map((token, idx) => (
                    <div key={idx} className="mt-2 border p-2 rounded space-y-1">
                      <Label>Name: {token.name}</Label>
                      <Label>Symbol: {token.symbol}</Label>
                      <Label>Mint: {token.mint}</Label>
                      <Label>Balance (smallest unit): {token.balance}</Label>
                      <Label>Decimals: {token.decimals}</Label>
                    </div>
                  ))
                ) : (
                  <Label className="mt-2">No SPL tokens found.</Label>
                )}
              </div>
              <div className="mt-4">
                <Label className="font-bold">Token-2022 Tokens</Label>
                {tokenBalances.token2022Tokens.length > 0 ? (
                  tokenBalances.token2022Tokens.map((token, idx) => (
                    <div key={idx} className="mt-2 border p-2 rounded space-y-1">
                      <Label>Name: {token.name}</Label>
                      <Label>Symbol: {token.symbol}</Label>
                      <Label>Mint: {token.mint}</Label>
                      <Label>Balance (smallest unit): {token.balance}</Label>
                      <Label>Decimals: {token.decimals}</Label>
                    </div>
                  ))
                ) : (
                  <Label className="mt-2">No Token-2022 tokens found.</Label>
                )}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={async () => {
              if (walletAddress) {
                setTokenBalancesLoading(true)
                try {
                  const response = await fetch("/.proxy/api/token-balance", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ address: walletAddress }),
                  })
                  const data = await response.json()
                  if (data.splTokens !== undefined && data.token2022Tokens !== undefined) {
                    setTokenBalances({ splTokens: data.splTokens, token2022Tokens: data.token2022Tokens })
                  }
                } catch (err: any) {
                  console.error("Error refreshing token balances:", err)
                  setTokenBalancesError(err.message)
                } finally {
                  setTokenBalancesLoading(false)
                }
              }
            }}
            disabled={tokenBalancesLoading}
            className="w-full"
          >
            {tokenBalancesLoading ? "Refreshing..." : "Refresh Token Balances"}
          </Button>
        </CardFooter>
      </Card>

      {/* NFT Mint Card */}
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Mint Metaplex Core NFT</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNftMint}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label>Your privy account</Label>
                <Label>{walletAddress}</Label>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="nft-to">Mint NFT to wallet address</Label>
                <Input
                  id="nft-to"
                  placeholder="address"
                  autoComplete="off"
                  value={nftToAddress}
                  onChange={(e) => setNftToAddress(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={nftMintLoading}>
                {nftMintLoading ? "Minting NFT..." : "Mint NFT"}
              </Button>
            </div>
          </form>
          {nftMintTxHash && (
            <div className="mt-4">
              <Label className="text-green-600 mb-2">NFT Mint successful!</Label>
              <Label>
                <a
                  href={`https://explorer.sonic.game/tx/${nftMintTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View Transaction
                </a>
              </Label>
              {mintedAsset && (
                <div className="mt-2 border p-2 rounded overflow-auto" style={{ maxWidth: '100%', whiteSpace: 'pre-wrap' }}>
                  <pre style={{ fontSize: '12px', overflowX: 'auto' }}>{JSON.stringify(mintedAsset, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
          {nftMintError && (
            <div className="mt-4">
              <Label className="text-red-600">Error: {nftMintError}</Label>
            </div>
          )}
        </CardContent>
        <CardFooter />
      </Card>
    </div>
  )
}
