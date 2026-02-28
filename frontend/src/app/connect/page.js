"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ensureCorrectNetwork, getBrowserProvider } from "@/lib/contract";
import { getSession, setSession } from "@/lib/storage";
import { checkHealth } from "@/lib/api";
import ErrorAlert from "@/components/ErrorAlert";

export default function ConnectPage() {
  const [address, setAddress] = useState("");
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [backendOk, setBackendOk] = useState(null);
  const [hasMetaMask, setHasMetaMask] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasMetaMask(!!window.ethereum);

      const saved = getSession()?.walletAddress;
      if (saved) setAddress(saved);

      checkHealth().then(setBackendOk);

      if (window.ethereum) {
        const onAccounts = (accounts) => {
          if (accounts.length === 0) {
            setAddress("");
            setSession({ walletAddress: null });
          } else {
            setAddress(accounts[0]);
            setSession({ walletAddress: accounts[0] });
          }
        };
        window.ethereum.on("accountsChanged", onAccounts);
        return () =>
          window.ethereum?.removeListener?.("accountsChanged", onAccounts);
      }
    }
  }, []);

  async function connectWallet() {
    try {
      setError(null);
      setConnecting(true);

      if (!window.ethereum) {
        setError({
          message: "MetaMask not found. Please install MetaMask.",
          category: "wallet",
          retryable: false,
        });
        return;
      }

      const provider = await getBrowserProvider();
      await provider.send("eth_requestAccounts", []);
      await ensureCorrectNetwork(provider);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      setAddress(signerAddress);
      setSession({ walletAddress: signerAddress });
    } catch (err) {
      setAddress("");
      const msg = err instanceof Error ? err.message : "Failed to connect";

      if (msg.includes("User rejected") || msg.includes("user rejected")) {
        setError({
          message:
            "Connection request rejected. Please approve the MetaMask prompt.",
          category: "wallet",
          retryable: true,
        });
      } else if (msg.includes("Already processing")) {
        setError({
          message:
            "MetaMask is busy. Check for a pending prompt in MetaMask.",
          category: "wallet",
          retryable: true,
        });
      } else {
        setError({ message: msg, category: "wallet", retryable: true });
      }
    } finally {
      setConnecting(false);
    }
  }

  async function disconnectWallet() {
    setAddress("");
    setSession({ walletAddress: null });
  }

  return (
    <>
      <div className="page-header">
        <h2>
          <span className="step-badge">1</span>
          Connect Wallet
        </h2>
        <p>Link your MetaMask wallet to get started</p>
      </div>

      {backendOk === false && (
        <div className="warning-banner info-banner" role="alert">
          <strong>Backend unreachable</strong> — evaluation will not work until
          the server is online.
        </div>
      )}

      <div className="card">
        {!hasMetaMask ? (
          <div>
            <h3>MetaMask Required</h3>
            <p>
              MetaMask is required to interact with the blockchain. Install it to
              continue.
            </p>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="button"
            >
              Install MetaMask
            </a>
          </div>
        ) : !address ? (
          <div>
            <h3>No Wallet Connected</h3>
            <p>
              Connect your MetaMask wallet to authenticate and sign on-chain
              transactions.
            </p>
            <button
              className="button"
              onClick={connectWallet}
              disabled={connecting}
              aria-describedby="connect-heading"
            >
              {connecting ? "Connecting…" : "Connect MetaMask"}
            </button>
          </div>
        ) : (
          <div>
            <h3>Wallet Connected</h3>
            <div className="wallet-status" style={{ marginBottom: 16 }}>
              <span className="wallet-dot" />
              {address.slice(0, 6)}…{address.slice(-4)}
            </div>
            <div className="row">
              <button
                className="button"
                onClick={() => router.push("/submit")}
              >
                Continue to Case Input
              </button>
              <button
                className="button button-ghost"
                onClick={disconnectWallet}
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        <ErrorAlert
          error={error}
          onRetry={connectWallet}
          onDismiss={() => setError(null)}
        />
      </div>
    </>
  );
}
