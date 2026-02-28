"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { keccak256, toUtf8Bytes } from "ethers";
import { getSession, setSession } from "@/lib/storage";
import {
  ensureCorrectNetwork,
  getBrowserProvider,
  getWriteContract,
  MONAD_BLOCK_EXPLORER_URL,
} from "@/lib/contract";
import ErrorAlert from "@/components/ErrorAlert";

function decisionClass(decision) {
  if (decision === "SHIP") return "ship";
  if (decision === "ITERATE") return "iterate";
  return "reject";
}

function classifyTxError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("user denied")) {
    return {
      message: "Transaction rejected — you declined in MetaMask.",
      category: "wallet",
      retryable: true,
    };
  }
  if (lower.includes("insufficient funds")) {
    return {
      message: "Insufficient funds for gas. Add MON to your wallet.",
      category: "wallet",
      retryable: false,
    };
  }
  if (lower.includes("wrong network") || lower.includes("chain mismatch")) {
    return {
      message: "Wrong network — please switch to Monad Testnet.",
      category: "wallet",
      retryable: true,
    };
  }
  if (lower.includes("nonce") || lower.includes("replacement")) {
    return {
      message:
        "Transaction conflict — try resetting MetaMask activity or wait.",
      category: "wallet",
      retryable: true,
    };
  }
  if (lower.includes("execution reverted")) {
    return {
      message:
        "Smart contract rejected the transaction. The verdict may already be saved.",
      category: "server",
      details: msg,
      retryable: false,
    };
  }
  return {
    message: msg.length > 200 ? msg.slice(0, 200) + "…" : msg,
    category: "unknown",
    retryable: true,
  };
}

export default function VerdictPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState(null);
  const [txStage, setTxStage] = useState("");

  const session = getSession();
  const caseText = session?.caseText || "";
  const evaluation = session?.evaluation || null;

  const { agent_results = [], final_verdict = null } = evaluation || {};
  const feasibility = agent_results.find((a) => a.role === "Feasibility Agent");
  const innovation = agent_results.find((a) => a.role === "Innovation Agent");
  const risk = agent_results.find((a) => a.role === "Risk & Ethics Agent");

  const shortVerdict = useMemo(() => {
    const text =
      final_verdict?.summary || final_verdict?.decision || "No summary";
    return text.slice(0, 140);
  }, [final_verdict]);

  async function saveOnChain() {
    try {
      setSaving(true);
      setError(null);
      setTxHash("");
      setTxStage("Connecting to wallet…");

      const provider = await getBrowserProvider();
      setTxStage("Verifying network…");
      await ensureCorrectNetwork(provider);

      setTxStage("Preparing transaction…");
      const contract = await getWriteContract();
      const hash = keccak256(toUtf8Bytes(caseText));
      const attestation = session?.attestation;
      const attestationSig = attestation?.signature || "0x";

      setTxStage("Confirm in MetaMask…");
      const tx = await contract.saveVerdict(
        hash,
        Number(feasibility?.score || 0),
        Number(innovation?.score || 0),
        Number(risk?.score || 0),
        Number(final_verdict?.final_score || 0),
        shortVerdict,
        attestationSig,
      );

      setTxStage("Waiting for confirmation…");
      await tx.wait();
      setTxHash(tx.hash);
      setSession({ lastTxHash: tx.hash });
      setTxStage("");
    } catch (err) {
      setError(classifyTxError(err));
      setTxStage("");
    } finally {
      setSaving(false);
    }
  }

  if (!final_verdict) {
    return (
      <div className="card" role="alert">
        <h3>No Verdict Found</h3>
        <p>Start from case submission to get an AI evaluation.</p>
        <button className="button" onClick={() => router.push("/submit")}>
          Go to Submit
        </button>
      </div>
    );
  }

  const dClass = decisionClass(final_verdict.decision);

  return (
    <>
      <div className="page-header">
        <h2>
          <span className="step-badge">4</span>
          Final Verdict
        </h2>
        <p>Review the AI evaluation result and save it on-chain</p>
      </div>

      <div className="card card-accent" style={{ textAlign: "center" }}>
        <div className={`verdict-score-ring ${dClass}`}>
          <span className="score-value">{final_verdict.final_score}</span>
        </div>
        <span className={`badge ${dClass}`} style={{ fontSize: "0.875rem", padding: "6px 20px" }}>
          {final_verdict.decision}
        </span>
        <p style={{ marginTop: 16, maxWidth: 560, marginInline: "auto" }}>
          {final_verdict.summary}
        </p>
      </div>

      <div className="score-breakdown">
        <div className="score-item">
          <div className="score-item-label">Feasibility</div>
          <div className="score-item-value" style={{ color: "var(--blue)" }}>
            {feasibility?.score ?? "–"}
          </div>
        </div>
        <div className="score-item">
          <div className="score-item-label">Innovation</div>
          <div className="score-item-value" style={{ color: "var(--purple)" }}>
            {innovation?.score ?? "–"}
          </div>
        </div>
        <div className="score-item">
          <div className="score-item-label">Risk</div>
          <div className="score-item-value" style={{ color: "var(--amber)" }}>
            {risk?.score ?? "–"}
          </div>
        </div>
      </div>

      {final_verdict.next_steps?.length > 0 && (
        <div className="card">
          <h3>Recommended Next Steps</h3>
          <ul style={{ paddingLeft: 20 }}>
            {final_verdict.next_steps.map((step, i) => (
              <li key={`step-${i}`} style={{ marginBottom: 6, color: "var(--text-secondary)", fontSize: "0.9375rem" }}>{step}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="trust-info">
        <p>
          <strong>How verification works:</strong> AI agents evaluate your case
          off-chain (scores, reasoning). When you click &quot;Save on-chain&quot;,{" "}
          <em>you</em> sign the transaction with MetaMask. The verdict record
          (scores, summary, your address, timestamp) is written immutably to the
          smart contract and can be independently verified on the block explorer.
        </p>
        {session?.attestation?.signature && (
          <p className="attestation-info">
            Backend attestation included — the AI output was cryptographically
            signed, binding scores to a verifiable signature.
          </p>
        )}
      </div>

      <div className="card">
        <div className="row">
          <button
            className={`button ${txHash ? "button-success" : ""}`}
            disabled={saving || !!txHash}
            onClick={saveOnChain}
            aria-describedby={txStage ? "tx-stage" : undefined}
          >
            {saving
              ? "Processing…"
              : txHash
                ? "Saved on-chain"
                : "Save Decision On-Chain"}
          </button>
          <button
            className="button button-ghost"
            onClick={() => router.push("/history")}
          >
            View History
          </button>
        </div>

        {txStage && (
          <div className="tx-stage" id="tx-stage" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true" />
            {txStage}
          </div>
        )}

        {txHash && (
          <div className="tx-confirmation" role="status">
            <p>
              <strong>Verdict saved on-chain successfully.</strong>
            </p>
            <p>
              Tx:{" "}
              <a
                href={`${MONAD_BLOCK_EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {txHash.slice(0, 10)}…{txHash.slice(-8)}
              </a>
            </p>
            <p className="verify-hint">
              Verify this record on the block explorer. The data is immutable and
              publicly readable.
            </p>
          </div>
        )}

        <ErrorAlert
          error={error}
          onRetry={saveOnChain}
          onDismiss={() => setError(null)}
        />
      </div>
    </>
  );
}
