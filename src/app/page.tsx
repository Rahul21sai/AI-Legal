import { ProofClockWorkbench } from '@/features/workbench/proofclock-workbench';
import { rulePacks } from '@/domain/rule-packs/registry';
import { getSnapshotsForPack } from '@/sources/registry';

export default function Page() {
  const snapshotsByPack = Object.fromEntries(
    rulePacks.map((pack) => [pack.id, getSnapshotsForPack(pack)]),
  );
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

      <ProofClockWorkbench snapshotsByPack={snapshotsByPack} />
    </main>
  );
}
