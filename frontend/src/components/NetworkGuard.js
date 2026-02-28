"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getBrowserProvider,
  getExpectedChainId,
  getNetworkStatus,
  onChainChanged,
  switchToExpectedNetwork,
} from "@/lib/contract";

function expectedChainLabel() {
  const expected = getExpectedChainId();
  return `0x${expected.toString(16)} (${expected.toString()})`;
}

export default function NetworkGuard() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [switching, setSwitching] = useState(false);

  const expectedLabel = useMemo(() => expectedChainLabel(), []);

  async function refreshStatus() {
    try {
      setError("");
      const provider = await getBrowserProvider();
      const nextStatus = await getNetworkStatus(provider);
      setStatus(nextStatus);
    } catch (err) {
      setStatus(null);
      setError(
        err instanceof Error ? err.message : "Failed to check network",
      );
    }
  }

  async function switchNetwork() {
    try {
      setSwitching(true);
      setError("");
      await switchToExpectedNetwork();
      await refreshStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to switch network",
      );
    } finally {
      setSwitching(false);
    }
  }

  useEffect(() => {
    refreshStatus();
    const unsubscribe = onChainChanged(() => {
      refreshStatus();
    });
    return unsubscribe;
  }, []);

  if (error && !status) {
    return (
      <div className="network-banner network-banner-error">
        <p>
          <strong>Network check:</strong> {error}
        </p>
      </div>
    );
  }

  if (!status || status.ok) return null;

  return (
    <div className="network-banner">
      <p>
        <strong>Wrong network.</strong> Expected {status.expectedHex} (
        {status.expected.toString()}) but got {status.currentHex} (
        {status.current.toString()}).
      </p>
      <div className="row" style={{ marginTop: 12 }}>
        <button
          className="button button-sm"
          disabled={switching}
          onClick={switchNetwork}
        >
          {switching ? "Switching…" : "Switch to Monad Testnet"}
        </button>
        <button
          className="button button-sm button-ghost"
          disabled={switching}
          onClick={refreshStatus}
        >
          Refresh
        </button>
      </div>
      {error && (
        <p style={{ color: "var(--danger)", marginTop: 8, fontSize: "0.8125rem" }}>
          {error}
        </p>
      )}
      {!error && (
        <p style={{ marginTop: 8, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          Target chain: {expectedLabel}
        </p>
      )}
    </div>
  );
}
