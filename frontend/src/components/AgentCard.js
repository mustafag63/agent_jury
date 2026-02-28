"use client";

import { AgentCardSkeleton } from "./LoadingSkeleton";

const AGENT_CONFIG = {
  "Feasibility Agent": { icon: "◈", cssClass: "agent-feasibility" },
  "Innovation Agent": { icon: "◇", cssClass: "agent-innovation" },
  "Risk & Ethics Agent": { icon: "△", cssClass: "agent-risk" },
};

function getScoreColor(pct) {
  if (pct >= 70) return "#34d399";
  if (pct >= 40) return "#fbbf24";
  return "#f87171";
}

function ScoreBar({ value, label }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = getScoreColor(pct);

  return (
    <div
      className="score-bar-container"
      role="meter"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="score-bar-value" style={{ color }}>
        {pct}
      </span>
    </div>
  );
}

export default function AgentCard({ agent, loading }) {
  if (loading) return <AgentCardSkeleton />;

  const config = AGENT_CONFIG[agent.role] || {
    icon: "●",
    cssClass: "",
  };
  const biasFlags = agent.bias_flags || [];
  const uncertaintyFlags = agent.uncertainty_flags || [];

  return (
    <article
      className={`card agent-card ${config.cssClass}`}
      aria-label={`${agent.role} evaluation`}
    >
      <h3>
        <span className="agent-icon">{config.icon}</span>
        {agent.role}
      </h3>

      <ScoreBar value={agent.score} label={`${agent.role} score`} />

      {agent.confidence != null && (
        <p className="agent-confidence">
          Confidence: <strong>{agent.confidence}%</strong>
        </p>
      )}

      <details>
        <summary>
          <strong>Pros</strong> ({(agent.pros || []).length})
        </summary>
        <ul>
          {(agent.pros || []).map((item, i) => (
            <li key={`pro-${i}`}>{item}</li>
          ))}
        </ul>
      </details>

      <details>
        <summary>
          <strong>Cons</strong> ({(agent.cons || []).length})
        </summary>
        <ul>
          {(agent.cons || []).map((item, i) => (
            <li key={`con-${i}`}>{item}</li>
          ))}
        </ul>
      </details>

      {agent.rationale && (
        <details>
          <summary>
            <strong>Rationale</strong>
          </summary>
          <p>{agent.rationale}</p>
        </details>
      )}

      {(biasFlags.length > 0 || uncertaintyFlags.length > 0) && (
        <details>
          <summary>
            <strong>Flags</strong> ({biasFlags.length + uncertaintyFlags.length})
          </summary>
          {biasFlags.length > 0 && (
            <ul className="flag-list bias">
              {biasFlags.map((f, i) => (
                <li key={`b-${i}`}>{f}</li>
              ))}
            </ul>
          )}
          {uncertaintyFlags.length > 0 && (
            <ul className="flag-list uncertainty">
              {uncertaintyFlags.map((f, i) => (
                <li key={`u-${i}`}>{f}</li>
              ))}
            </ul>
          )}
        </details>
      )}
    </article>
  );
}
