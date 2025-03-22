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
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function DiscordApp() {
  console.log("DiscordApp component mounted")
  const discordSdk = new DiscordSDK(process.env.NEXT_PUBLIC_DISCORD_APP_ID || "")

  const [walletLoading, setWalletLoading] = useState(true)
  const [walletError, setWalletError] = useState<string | null>(null)

  // SOL transfer states
  const [auth, setAuth] = useState(null)
  const [user, setUser] = useState<any>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletId, setWalletId] = useState<string | null>(null)
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

  // Token balances state - now null initially to indicate no fetch performed yet
  const [tokenBalances, setTokenBalances] = useState<{ splTokens: any[]; token2022Tokens: any[] } | null>(null)
  const [tokenBalancesLoading, setTokenBalancesLoading] = useState(false)
  const [tokenBalancesError, setTokenBalancesError] = useState<string | null>(null)

  // NFT mint states
  const [nftToAddress, setNftToAddress] = useState("")
  const [nftMintLoading, setNftMintLoading] = useState(false)
  const [nftMintTxHash, setNftMintTxHash] = useState<string | null>(null)
  const [nftMintError, setNftMintError] = useState<string | null>(null)
  const [mintedAsset, setMintedAsset] = useState<any>(null)

  // Deploy Collection states
  const [collectionDeployLoading, setCollectionDeployLoading] = useState(false)
  const [collectionDeployTxHash, setCollectionDeployTxHash] = useState<string | null>(null)
  const [collectionDeployError, setCollectionDeployError] = useState<string | null>(null)
  const [deployedCollection, setDeployedCollection] = useState<any>(null)

  // Mint NFT to Collection states
  const [collectionMintToAddress, setCollectionMintToAddress] = useState("")
  const [collectionMintCollectionMint, setCollectionMintCollectionMint] = useState("")
  const [collectionMintLoading, setCollectionMintLoading] = useState(false)
  const [collectionMintTxHash, setCollectionMintTxHash] = useState<string | null>(null)
  const [collectionMintError, setCollectionMintError] = useState<string | null>(null)
  const [mintedCollectionAsset, setMintedCollectionAsset] = useState<any>(null)

  // New states for fetching NFTs
  const [nfts, setNfts] = useState<any[] | null>(null)
  const [nftsLoading, setNftsLoading] = useState(false)
  const [nftsError, setNftsError] = useState<string | null>(null)

  useEffect(() => {
    async function setupDiscord() {
      setWalletLoading(true)
      try {
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
          throw new Error("Authorization failed: No code returned")
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

        const userResponse = await fetch(`/.proxy/api/user?discordId=${discordId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        })

        const data = await userResponse.json()

        if (data.user) {
          console.log("User found in ephemeral storage:", data)
          setUser(data.user)

          // Find the wallet address from the linked accounts (e.g., for Solana)
          const solanaAccount = (data.user.linkedAccounts as any[]).find(
            (account) => account.chainType === 'solana'
          )
          const address = solanaAccount ? solanaAccount.address : null
          const id = solanaAccount ? solanaAccount.id : null

          console.log("Wallet address:", address)
          console.log("Wallet ID:", id)

          setWalletAddress(address)
          setWalletId(id)
        } else {
          throw new Error("No user found in ephemeral storage")
        }
      } catch (err: any) {
        console.error("Error fetching wallet address:", err)
        setWalletError(err.message)
      } finally {
        setWalletLoading(false)
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
          walletId: walletId,
          lamports: parseInt(amount)
        })
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
          walletId: walletId,
          amount: parseInt(tokenAmount)
        })
      })

      const data = await response.json()
      if (data.success) {
        setTokenTransferTxHash(data.txHash)
        // Removed automatic token balances refresh here
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
      const response = await fetch("/.proxy/api/metaplex/standalone-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payer: walletAddress,
          to: nftToAddress,
          walletId: walletId
        })
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

  // Handle Deploy Collection
  async function handleDeployCollection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCollectionDeployError(null)
    setCollectionDeployTxHash(null)
    setCollectionDeployLoading(true)
    try {
      const response = await fetch("/.proxy/api/metaplex/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payer: walletAddress, walletId })
      })
      const data = await response.json()
      if (data.success) {
        setCollectionDeployTxHash(data.txHash)
        setDeployedCollection(data.collection)
      } else {
        setCollectionDeployError(data.error || "Collection deployment failed")
      }
    } catch (err: any) {
      setCollectionDeployError(err.message)
    } finally {
      setCollectionDeployLoading(false)
    }
  }

  // Handle Mint NFT to Collection
  async function handleMintNftToCollection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCollectionMintError(null)
    setCollectionMintTxHash(null)
    setCollectionMintLoading(true)
    try {
      const response = await fetch("/.proxy/api/metaplex/nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payer: walletAddress,
          to: collectionMintToAddress,
          collectionMint: collectionMintCollectionMint,
          walletId: walletId
        })
      })
      const data = await response.json()
      if (data.success) {
        setCollectionMintTxHash(data.txHash)
        setMintedCollectionAsset(data.asset)
      } else {
        setCollectionMintError(data.error || "Minting NFT to collection failed")
      }
    } catch (err: any) {
      setCollectionMintError(err.message)
    } finally {
      setCollectionMintLoading(false)
    }
  }

  // Conditional rendering based on wallet loading state and error
  if (walletLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Label>Loading wallet address...</Label>
      </div>
    )
  }

  if (walletError || !walletAddress) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Label>First login using privy by using the command /privy to create your sonic account.</Label>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 px-4 md:px-40 py-4 md:py-20 justify-center">
      {/* SOL Transfer Card */}
      <Card className="w-full max-w-[500px]">
        <CardHeader>
          <CardTitle>Transfer SOL</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTransfer}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label>Your privy account</Label>
                <pre style={{ fontSize: '14px' }}>{walletAddress}</pre>
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
      <Card className="w-full max-w-[500px]">
        <CardHeader>
          <CardTitle>Transfer Token</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTokenTransfer}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label>Your privy account</Label>
                <pre style={{ fontSize: '14px' }}>{walletAddress}</pre>
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
      <Card className="w-full max-w-[500px]">
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
        </CardHeader>
        <CardContent>
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
                  console.error("Error fetching token balances:", err)
                  setTokenBalancesError(err.message)
                } finally {
                  setTokenBalancesLoading(false)
                }
              }
            }}
            disabled={tokenBalancesLoading}
            className="w-full"
          >
            {tokenBalancesLoading ? "Fetching..." : "Fetch Token Balances"}
          </Button>
          {tokenBalancesError ? (
            <div className="mt-4">
              <Label className="text-red-600">Error: {tokenBalancesError}</Label>
            </div>
          ) : tokenBalances ? (
            <>
              <div className="mt-4">
                <Label className="font-bold">SPL Tokens</Label>
                {tokenBalances.splTokens.length > 0 ? (
                  tokenBalances.splTokens.map((token, idx) => (
                    <div key={idx} className="mt-2 border p-2 rounded space-y-1">
                      <Label>Name: {token.name}</Label>
                      <Label>Symbol: {token.symbol}</Label>
                      <div className="flex items-center space-x-2">
                        <Label>Mint:</Label>
                        <pre style={{ fontSize: '14px' }}>{token.mint}</pre>
                      </div>
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
                      <div className="flex items-center space-x-2">
                        <Label>Mint:</Label>
                        <pre style={{ fontSize: '14px' }}>{token.mint}</pre>
                      </div>                      
                      <Label>Balance (smallest unit): {token.balance}</Label>
                      <Label>Decimals: {token.decimals}</Label>
                    </div>
                  ))
                ) : (
                  <Label className="mt-2">No Token-2022 tokens found.</Label>
                )}
              </div>
            </>
          ) : null}
        </CardContent>
        <CardFooter />
      </Card>

      {/* NFT Mint Card */}
      <Card className="w-full max-w-[500px]">
        <CardHeader>
          <CardTitle>Mint Standalone Metaplex Core NFT</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNftMint}>
            <div className="grid w-full items-center gap-4">
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

      {/* Deploy Collection Card */}
      <Card className="w-full max-w-[500px]">
        <CardHeader>
          <CardTitle>Deploy Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDeployCollection}>
            <div className="grid w-full items-center gap-4">
              <Button type="submit" className="w-full" disabled={collectionDeployLoading}>
                {collectionDeployLoading ? "Deploying Collection..." : "Deploy Collection"}
              </Button>
            </div>
          </form>
          {collectionDeployTxHash && (
            <div className="mt-4">
              <Label className="text-green-600 mb-2">Collection Deployed Successfully!</Label>
              <Label>
                <a
                  href={`https://explorer.sonic.game/tx/${collectionDeployTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View Transaction
                </a>
              </Label>
              {deployedCollection && (
                <div className="mt-2 border p-2 rounded overflow-auto" style={{ maxWidth: '100%', whiteSpace: 'pre-wrap' }}>
                  <pre style={{ fontSize: '12px', overflowX: 'auto' }}>{JSON.stringify(deployedCollection, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
          {collectionDeployError && (
            <div className="mt-4">
              <Label className="text-red-600">Error: {collectionDeployError}</Label>
            </div>
          )}
        </CardContent>
        <CardFooter />
      </Card>

      {/* Mint NFT to Collection Card */}
      <Card className="w-full max-w-[500px]">
        <CardHeader>
          <CardTitle>Mint NFT to Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleMintNftToCollection}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="collection-mint-to">Mint NFT to wallet address</Label>
                <Input
                  id="collection-mint-to"
                  placeholder="destination address"
                  autoComplete="off"
                  value={collectionMintToAddress}
                  onChange={(e) => setCollectionMintToAddress(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="collection-mint-collection">Collection Mint Address</Label>
                <Input
                  id="collection-mint-collection"
                  placeholder="collection mint address"
                  autoComplete="off"
                  value={collectionMintCollectionMint}
                  onChange={(e) => setCollectionMintCollectionMint(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={collectionMintLoading}>
                {collectionMintLoading ? "Minting NFT..." : "Mint NFT to Collection"}
              </Button>
            </div>
          </form>
          {collectionMintTxHash && (
            <div className="mt-4">
              <Label className="text-green-600 mb-2">NFT Minted Successfully!</Label>
              <Label>
                <a
                  href={`https://explorer.sonic.game/tx/${collectionMintTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View Transaction
                </a>
              </Label>
              {mintedCollectionAsset && (
                <div className="mt-2 border p-2 rounded overflow-auto" style={{ maxWidth: '100%', whiteSpace: 'pre-wrap' }}>
                  <pre style={{ fontSize: '12px', overflowX: 'auto' }}>{JSON.stringify(mintedCollectionAsset, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
          {collectionMintError && (
            <div className="mt-4">
              <Label className="text-red-600">Error: {collectionMintError}</Label>
            </div>
          )}
        </CardContent>
        <CardFooter />
      </Card>

      {/* Fetch NFTs Card */}
      <Card className="w-full max-w-[500px]">
        <CardHeader>
          <CardTitle>Fetch NFTs</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={async () => {
              if (walletAddress && walletId) {
                setNftsLoading(true)
                setNftsError(null)
                try {
                  const response = await fetch("/.proxy/api/metaplex/fetchnfts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ address: walletAddress, walletId }),
                  })
                  const data = await response.json()
                  if (data.success) {
                    setNfts(data.assets)
                  } else {
                    setNftsError(data.error || "Failed to fetch NFTs")
                  }
                } catch (err: any) {
                  setNftsError(err.message)
                } finally {
                  setNftsLoading(false)
                }
              }
            }}
            disabled={nftsLoading}
            className="w-full"
          >
            {nftsLoading ? "Fetching NFTs..." : "Fetch NFTs"}
          </Button>
          {nftsError && (
            <div className="mt-4">
              <Label className="text-red-600">Error: {nftsError}</Label>
            </div>
          )}
          {nfts && (
            <div className="mt-4">
              {nfts.length > 0 ? (
                nfts.map((nft, idx) => (
                  <div key={idx} className="mt-2 border p-2 rounded overflow-x-auto">
                    <div className="min-w-max space-y-1">
                      <div className="flex items-center space-x-2">
                        <Label>Mint:</Label>
                        <pre style={{ fontSize: '14px' }}>{nft.publicKey}</pre>
                      </div>
                      <Label>Name: {nft.name}</Label>
                      <Label>URI: {nft.uri}</Label>
                    </div>
                  </div>
                ))
              ) : (
                <Label>No NFTs found.</Label>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter />
      </Card>
    </div>
  )
}
