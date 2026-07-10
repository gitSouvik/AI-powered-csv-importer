'use client';

export default function PreviewTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Record<string, string>[];
}) {
  return (
    <div className="border border-line">
      <div className="flex items-center justify-between border-b border-line bg-[#FAFAFA] px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-wide text-muted">
          Preview · {rows.length} row{rows.length === 1 ? '' : 's'} detected
        </span>
        <span className="font-mono text-xs text-muted">no processing yet</span>
      </div>

      <div className="thin-scroll max-h-[420px] overflow-auto">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-ink text-white">
            <tr>
              <th className="sticky left-0 z-20 border-r border-ink/40 bg-ink px-3 py-2 text-left font-mono text-xs font-normal text-white/50">
                #
              </th>
              {headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap border-r border-white/10 px-3 py-2 text-left font-mono text-xs font-medium last:border-r-0"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="odd:bg-white even:bg-[#FAFAFA]">
                <td className="sticky left-0 z-10 border-b border-r border-line bg-inherit px-3 py-1.5 font-mono text-xs text-muted">
                  {i + 1}
                </td>
                {headers.map((h) => (
                  <td
                    key={h}
                    className="whitespace-nowrap border-b border-r border-line px-3 py-1.5 text-ink last:border-r-0"
                  >
                    {row[h] || <span className="text-line">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
