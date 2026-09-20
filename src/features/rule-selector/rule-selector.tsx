import type { RulePack, RulePackId } from '@/domain/rule-packs/types';

export function RuleSelector({
  packs,
  selected,
  onSelect,
}: Readonly<{
  packs: readonly RulePack[];
  selected: RulePackId | null;
  onSelect: (id: RulePackId) => void;
}>) {
  return (
    <fieldset className="rule-options">
      <legend className="sr-only">Supported statutory clocks</legend>
      {packs.map((pack) => (
        <label className="rule-option" key={pack.id}>
          <input
            checked={selected === pack.id}
            name="rule-pack"
            onChange={() => onSelect(pack.id)}
            type="radio"
            value={pack.id}
          />
          <span>
            <strong>{pack.title}</strong>
            <small>{pack.scope}</small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
