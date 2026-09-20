import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Method',
  description:
    'How ProofClock separates optional event extraction from user binding and deterministic date arithmetic.',
};

const integrationMap = [
  ['Prompt contract', 'src/ai/prompts/extract-events.v1.ts'],
  ['Gemini Interactions API', 'src/ai/gemini-client.ts'],
  ['Evidence and date guard', 'src/ai/guard.ts'],
  ['Server boundary', 'src/app/api/extract-events/route.ts'],
] as const;

export default function MethodPage() {
  return (
    <main className="method-page" id="main-content">
      <header className="method-intro">
        <p>Method and limits</p>
        <h1>How ProofClock separates AI from arithmetic</h1>
        <p>
          Gemini is optional. The application remains a complete manual statutory-clock
          worksheet when no API key, quota, or network is available.
        </p>
        <Link className="method-link" href="/">
          Open the calculator
        </Link>
      </header>

      <section className="method-chain" aria-label="ProofClock control boundary">
        <article>
          <span>1</span>
          <h2>Extract</h2>
          <p>
            Gemini labels candidate event quotes from short user-supplied evidence. It
            cannot return statutory text, citations, legal conclusions, or calculations.
          </p>
        </article>
        <article>
          <span>2</span>
          <h2>Bind</h2>
          <p>
            Exact-source and deterministic date guards run first. A person must then review
            and bind each accepted candidate. Nothing is selected automatically.
          </p>
        </article>
        <article>
          <span>3</span>
          <h2>Compute</h2>
          <p>
            Pure date-only TypeScript applies the chosen rule pack. Missing evidence stops
            downstream rows with UNBOUND instead of supplying a guess.
          </p>
        </article>
      </section>

      <section className="method-section" aria-labelledby="genai-files">
        <h2 id="genai-files">GenAI integration map</h2>
        <p>The model boundary is inspectable in the interface and in these exact files.</p>
        <dl className="file-map">
          {integrationMap.map(([label, file]) => (
            <div key={file}>
              <dt>{label}</dt>
              <dd>
                <code>{file}</code>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="method-grid">
        <article>
          <h2>Privacy boundary</h2>
          <p>
            ProofClock does not retain case data. Manual dates stay in current-tab React
            state. Optional extraction text is sent to Google only after per-request
            acknowledgement and is never written to application logs or storage.
          </p>
        </article>
        <article>
          <h2>Source boundary</h2>
          <p>
            RBI timing text comes from an official RBI page. NI Act excerpts come from an
            attributed third-party structured mirror. The Gazette of India or official text
            prevails. Live checks may verify snapshots but never rewrite a rule.
          </p>
        </article>
        <article>
          <h2>Legal boundary</h2>
          <p>
            The worksheet does not choose a law, trigger, forum, or remedy. It does not call
            a matter timely or barred. Court holidays, exclusions, extensions, condonation,
            and legal characterisation remain outside its computation.
          </p>
        </article>
        <article>
          <h2>Coverage boundary</h2>
          <p>
            Two reviewed packs ship: NI Act sections 138 and 142, and RB-IOS 2026. Earlier
            RBI events stop at COVERAGE LIMIT instead of falling through to an older scheme.
          </p>
        </article>
      </section>
    </main>
  );
}
