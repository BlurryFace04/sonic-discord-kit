'use client'

import Head from "next/head"
import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Portal from "@/components/graphics/portal"
import { useLogin, useLogout } from "@privy-io/react-auth"
import { usePrivy, useHeadlessDelegatedActions, useSolanaWallets } from "@privy-io/react-auth"

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginComponent />
    </Suspense>
  )
}

function LoginComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const { ready, authenticated, user } = usePrivy()
  const { delegateWallet } = useHeadlessDelegatedActions()
  const { ready: readySolana, wallets } = useSolanaWallets()

  const { login } = useLogin({
    onComplete: () => {
      console.log("login complete")
    }
  })

  const { logout } = useLogout({
    onSuccess: () => {
      console.log("logout success")
    }
  })

  useEffect(() => {
    if (ready && authenticated && user && userId) {
      // const discordId = user.discord?.subject

      // if (discordId) {
      //   fetch("/api/user", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ discordId, user })
      //   })
      //     .then(res => res.json())
      //     .then(data => console.log("User session stored:", data))
      //     .catch(error => console.error("Error storing session:", error))
      // } else {
      //   console.log("No discordId found")
      // }

    fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discordId: userId, user })
    })
      .then(res => res.json())
      .then(data => console.log("User session stored:", data))
      .catch(error => console.error("Error storing session:", error))

      const solanaAccount = (user.linkedAccounts as any[]).find(
        account => (account as any).chainType === 'solana'
      )
      const address = solanaAccount ? (solanaAccount as any).address : null

      const isAlreadyDelegated = !!(user.linkedAccounts as any[]).find(
        (account: any) => account.type === 'wallet' && account.delegated
      )
      console.log("Is already delegated: ", isAlreadyDelegated)

      if (address) {
        fetch(`https://sonic-discord-kit-server-435887166123.asia-south1.run.app/privy-callback?userId=${userId}&address=${address}`)
          .then(response => response.json())
          .then(data => console.log('Callback response:', data))
          .catch(error => console.error('Error in callback:', error))

        if (!isAlreadyDelegated) {
          // Automatically delegate the Solana wallet
          delegateWallet({ address, chainType: 'solana' })
            .then(() => console.log('Wallet delegated successfully'))
            .catch(error => console.error('Error delegating wallet:', error))
        }
      }
    }
  }, [ready, authenticated, user, userId])

  return (
    <>
      <Head>
        <title>Login · Privy</title>
      </Head>

      <main className="relative flex min-h-screen min-w-full">
        {authenticated && (
          <div className="absolute top-4 right-4">
            <button
              className="bg-red-600 hover:bg-red-700 py-2 px-4 text-white rounded-lg"
              onClick={logout}
            >
              Log out
            </button>
          </div>
        )}
        <div className="flex bg-privy-light-blue flex-1 p-6 justify-center items-center">
          <div>
            <div>
              <Portal style={{ maxWidth: "100%", height: "auto" }} />
            </div>
            <div className="mt-6 flex justify-center text-center">
              {!authenticated ? (
                <button
                  className="bg-violet-600 hover:bg-violet-700 py-3 px-6 text-white rounded-lg"
                  onClick={login}
                >
                  Log in
                </button>
              ) : (
                <p className="text-lg font-medium text-white">
                  You are already signed in. You can now safely close this window.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

function Loading() {
  return <p>Loading...</p>
}
