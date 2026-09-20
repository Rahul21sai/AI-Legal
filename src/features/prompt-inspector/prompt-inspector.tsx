'use client';

import { useState } from 'react';

import type { ExtractionTrace } from '@/ai/extract-service';

function JsonBlock({ label, value }: Readonly<{ label: string; value: unknown }>) {
  const [copied, setCopied] = useState(false);
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <section className="inspector-block">
      <div>
        <h4>{label}</h4>
        <button onClick={() => void copy()} type="button">
          {copied ? 'Copied' : `Copy ${label.toLowerCase()}`}
        </button>
      </div>
      <pre>{text}</pre>
    </section>
  );
}

export function PromptInspector({ trace }: Readonly<{ trace: ExtractionTrace }>) {
  return (
    <details className="prompt-inspector">
      <summary>Inspect Gemini prompt and guard</summary>
      <div className="inspector-meta">
        <span>Prompt {trace.prompt.version}</span>
        <span>Model {trace.prompt.model}</span>
        <span>Thinking {trace.prompt.thinkingLevel}</span>
      </div>
      <JsonBlock label="System instruction" value={trace.prompt.systemInstruction} />
      <JsonBlock label="User input" value={trace.prompt.userInput} />
      <JsonBlock label="Response schema" value={trace.prompt.responseJsonSchema} />
      <JsonBlock label="Raw response" value={trace.rawResponse} />
      <JsonBlock label="Accepted candidates" value={trace.accepted} />
      <JsonBlock label="Rejected candidates" value={trace.rejected} />
    </details>
  );
}
