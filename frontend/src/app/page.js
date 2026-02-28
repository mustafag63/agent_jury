import Link from "next/link";

const STEPS = [
  {
    num: 1,
    title: "Connect Wallet",
    desc: "Link your MetaMask wallet to authenticate and sign transactions on Monad.",
  },
  {
    num: 2,
    title: "Submit Case",
    desc: "Describe your startup idea. Our AI agents will evaluate it independently.",
  },
  {
    num: 3,
    title: "AI Deliberation",
    desc: "Three specialized agents analyze feasibility, innovation, and risk in parallel.",
  },
  {
    num: 4,
    title: "Review Verdict",
    desc: "See the weighted final score, decision rationale, and consensus analysis.",
  },
  {
    num: 5,
    title: "Save On-Chain",
    desc: "Sign the transaction via MetaMask. The verdict is stored immutably on-chain.",
  },
  {
    num: 6,
    title: "Verify History",
    desc: "Browse all verdicts directly from the smart contract — publicly verifiable.",
  },
];

export default function HomePage() {
  return (
    <>
      <div className="hero">
        <h1 className="hero-title">
          AI-Powered Startup Evaluation
          <br />
          <span className="hero-gradient">Verified On-Chain</span>
        </h1>
        <p className="hero-subtitle">
          Three specialized AI agents independently evaluate your startup case.
          The final verdict is cryptographically signed and stored immutably on
          the Monad blockchain.
        </p>
        <Link href="/connect" className="button button-lg">
          Start Evaluation
        </Link>
      </div>

      <div className="steps-grid">
        {STEPS.map((step) => (
          <div key={step.num} className="step-card">
            <div className="step-number">{step.num}</div>
            <div className="step-title">{step.title}</div>
            <p className="step-desc">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="trust-info">
        <p>
          <strong>Trust Model:</strong> AI evaluation runs off-chain for cost
          efficiency. The backend cryptographically signs (attests) each output.
          You then sign the transaction yourself via MetaMask. The final verdict
          record is stored immutably on the smart contract and can be
          independently verified by anyone.
        </p>
      </div>
    </>
  );
}
