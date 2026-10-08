import { formatPoints } from '@/lib/format';

export default function LevelProgress({ info, pointsX100 }) {
  const { current, next, designation, nextDesignation, percent, pointsToNextX100 } = info;
  return (
    <section className="rounded-2xl border border-divider bg-content1 p-6">
      <p className="text-xs font-semibold tracking-wide text-primary">YOUR LEVEL</p>
      <h2 className="mt-1 text-3xl font-bold">{current ? `Level ${current.level}` : 'No level yet'}</h2>
      <p className="text-default-600">{designation || 'Buy and receive your first order to start earning Points.'}</p>

      <div className="mt-5">
        <div className="mb-1 flex justify-between text-sm">
          <span>{formatPoints(pointsX100, { fixed: true })} Points earned</span>
          {next && <span>Next: Level {next.level}{nextDesignation && nextDesignation !== designation ? ` · ${nextDesignation}` : ''}</span>}
        </div>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Progress to next level" className="h-3 overflow-hidden rounded-full bg-content2">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-sm text-default-600">
          {next ? `${formatPoints(pointsToNextX100, { fixed: true })} more Points to reach Level ${next.level}.` : 'You have reached the highest level.'}
        </p>
      </div>
    </section>
  );
}
