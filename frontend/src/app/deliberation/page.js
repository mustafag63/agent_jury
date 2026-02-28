"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AgentCard from "@/components/AgentCard";
import { AgentCardSkeleton } from "@/components/LoadingSkeleton";
import { getSession } from "@/lib/storage";

export default function DeliberationPage() {
  const router = useRouter();
  const [revealing, setRevealing] = useState(true);
  const [revealedCount, setRevealedCount] = useState(0);
  const session = getSession();
  const agentResults = session?.evaluation?.agent_results || [];
  const consensus = session?.evaluation?.consensus_analysis || null;

  useEffect(() => {
    if (!agentResults.length) return;
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setRevealedCount(count);
      if (count >= agentResults.length) {
        clearInterval(interval);
        setTimeout(() => setRevealing(false), 400);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [agentResults.length]);

  if (!agentResults.length) {
    return (
      <div className="card" role="alert">
        <h3>No Evaluation Found</h3>
        <p>Submit a case first to see agent deliberations.</p>
        <button className="button" onClick={() => router.push("/submit")}>
          Go to Submit
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h2>
          <span className="step-badge">3</span>
          Agent Deliberation
        </h2>
        <p role="status" aria-live="polite">
          {revealing
            ? `Revealing agent evaluations… (${revealedCount}/${agentResults.length})`
            : "All agent evaluations complete."}
        </p>
      </div>

      <div className="agents-grid" role="list" aria-label="Agent evaluations">
        {agentResults.map((agent, idx) => (
          <div role="listitem" key={agent.role}>
            {idx < revealedCount ? (
              <div className="fade-in">
                <AgentCard agent={agent} loading={false} />
              </div>
            ) : (
              <AgentCardSkeleton />
            )}
          </div>
        ))}
      </div>

      {!revealing && consensus && (
        <div className="card consensus-card fade-in">
          <h3>Consensus Analysis</h3>
          <div className="consensus-grid">
            {consensus.std_deviation != null && (
              <div className="consensus-stat">
                <span className="consensus-label">Score Spread (σ)</span>
                <span className="consensus-value">
                  {consensus.std_deviation.toFixed(1)}
                </span>
              </div>
            )}
            {consensus.agreement_level && (
              <div className="consensus-stat">
                <span className="consensus-label">Agreement</span>
                <span
                  className={`badge ${consensus.agreement_level.toLowerCase()}`}
                >
                  {consensus.agreement_level}
                </span>
              </div>
            )}
          </div>
          {consensus.disagreements?.length > 0 && (
            <details style={{ marginTop: 12 }}>
              <summary>
                <strong>Disagreements</strong> (
                {consensus.disagreements.length})
              </summary>
              <ul>
                {consensus.disagreements.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button
          className="button"
          disabled={revealing}
          onClick={() => router.push("/verdict")}
        >
          View Final Verdict
        </button>
      </div>
    </>
  );
}
