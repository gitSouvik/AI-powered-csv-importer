'use client';

/**
 * A small grid of cells, most hollow, a few filled solid orange - a
 * literal nod to the subject matter: a CSV is a grid of cells, and
 * the app's whole job is deciding which cells (columns) map where.
 * Used sparingly as a single signature accent, not a repeated motif.
 */
export default function GridMotif({
  className = '',
  filled = [2, 7, 13],
}: {
  className?: string;
  filled?: number[];
}) {
  const cells = Array.from({ length: 16 }, (_, i) => i);
  const cols = 4;
  const size = 10;
  const gap = 4;

  return (
    <svg
      viewBox={`0 0 ${cols * (size + gap) - gap} ${cols * (size + gap) - gap}`}
      className={className}
      aria-hidden="true"
    >
      {cells.map((i) => {
        const x = (i % cols) * (size + gap);
        const y = Math.floor(i / cols) * (size + gap);
        const isFilled = filled.includes(i);
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={size}
            height={size}
            fill={isFilled ? '#F97316' : 'none'}
            stroke={isFilled ? 'none' : '#E4E4E7'}
            strokeWidth={1}
          />
        );
      })}
    </svg>
  );
}
