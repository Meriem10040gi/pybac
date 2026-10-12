// Steps that only explain: a card (text + code + its output) and a step-by-step demo.
import { CodeView } from '@/components/code-view';
import { ConsoleView } from '@/components/console-view';
import { Figures } from '@/components/figure';
import { RichText } from '@/components/rich-text';
import { StepViewer } from '@/components/step-viewer';
import type { CardStep, DemoStep } from '@/content/types';

export function CardView({ step }: { step: CardStep }) {
  return (
    <div className="kind">
      <h2 className="step-title">{step.title}</h2>
      <div className="step-body">
        {step.body.map((p, i) => (
          <RichText key={i}>{p}</RichText>
        ))}
      </div>
      <Figures f={step.figure} />
      {step.code || step.output !== undefined ? (
        <div className={step.code && step.output !== undefined ? 'split' : undefined}>
          {step.code ? <CodeView code={step.code} /> : null}
          {step.output !== undefined ? <ConsoleView output={step.output} /> : null}
        </div>
      ) : null}
      {step.tip ? (
        <aside className="alert alert-gold">
          <RichText>{step.tip}</RichText>
        </aside>
      ) : null}
    </div>
  );
}

export function DemoView({ step }: { step: DemoStep }) {
  return (
    <div className="kind">
      <h2 className="step-title">{step.title}</h2>
      <div className="step-body">
        <RichText>{step.body}</RichText>
      </div>
      <StepViewer code={step.code} />
    </div>
  );
}
