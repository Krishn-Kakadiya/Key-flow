import { lazy, Suspense, type ComponentProps } from 'react';

// Recharts is the heaviest dependency; load it only when a chart is first shown.
const Wpm = lazy(() => import('./charts').then((m) => ({ default: m.WpmChart })));
const Trend = lazy(() => import('./charts').then((m) => ({ default: m.TrendChart })));

function Placeholder({ height }: { height: number }) {
  return <div className="animate-pulse rounded-xl bg-surface2/60" style={{ height }} aria-hidden="true" />;
}

export function WpmChart(props: ComponentProps<typeof Wpm>) {
  return (
    <Suspense fallback={<Placeholder height={props.height ?? 220} />}>
      <Wpm {...props} />
    </Suspense>
  );
}

export function TrendChart(props: ComponentProps<typeof Trend>) {
  return (
    <Suspense fallback={<Placeholder height={props.height ?? 200} />}>
      <Trend {...props} />
    </Suspense>
  );
}

export type { TrendPoint } from './charts';
