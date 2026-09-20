const rulePacks = [
  {
    id: 'ni-act-138',
    title: 'Cheque dishonour',
    detail: 'NI Act sections 138 and 142',
  },
  {
    id: 'rbi-ombudsman-2026',
    title: 'RBI Ombudsman',
    detail: 'Integrated Ombudsman Scheme 2026',
  },
] as const;

export default function Page() {
  return (
    <main id="main-content">
      <section className="intro" aria-labelledby="page-title">
        <p className="boundary-note">Arithmetic, not a legal verdict</p>
        <h1 id="page-title">ProofClock</h1>
        <p className="intro-statement">
          You choose the trigger. Code computes the dates. Every step keeps its evidence
          and source in view.
        </p>
      </section>

      <section className="starter-ledger" aria-labelledby="choose-clock">
        <div className="ledger-heading">
          <h2 id="choose-clock">Choose a statutory clock</h2>
          <p>No option is selected for you.</p>
        </div>
        <fieldset className="rule-options">
          <legend className="sr-only">Supported statutory clocks</legend>
          {rulePacks.map((pack) => (
            <label className="rule-option" key={pack.id}>
              <input type="radio" name="rule-pack" value={pack.id} />
              <span>
                <strong>{pack.title}</strong>
                <small>{pack.detail}</small>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="empty-ledger" aria-label="No clock selected">
          <span className="binding-seam" aria-hidden="true" />
          <p>Select a clock to reveal its named anchors and worked rows.</p>
        </div>
      </section>
    </main>
  );
}
