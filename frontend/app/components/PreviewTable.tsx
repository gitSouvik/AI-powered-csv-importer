'use client';

export default function PreviewTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Record<string, string>[];
}) {
  return (
    <div className="border border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-wide text-zinc-500">
          Preview · {rows.length} row{rows.length === 1 ? '' : 's'} detected
        </span>
        <span className="font-mono text-xs text-zinc-600">no processing yet</span>
      </div>

      <div className="thin-scroll max-h-[420px] overflow-auto">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-950 text-white">
            <tr>
              <th className="sticky left-0 z-20 border-r border-zinc-700 bg-zinc-950 px-3 py-2 text-left font-mono text-xs font-normal text-zinc-600">
                #
              </th>
              {headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap border-r border-zinc-800 px-3 py-2 text-left font-mono text-xs font-medium text-zinc-300 last:border-r-0"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="odd:bg-[#0a0a0b] even:bg-zinc-900/50">
                <td className="sticky left-0 z-10 border-b border-r border-zinc-800 bg-inherit px-3 py-1.5 font-mono text-xs text-zinc-600">
                  {i + 1}
                </td>
                {headers.map((h) => (
                  <td
                    key={h}
                    className="whitespace-nowrap border-b border-r border-zinc-800 px-3 py-1.5 text-zinc-300 last:border-r-0"
                  >
                    {row[h] || <span className="text-zinc-700">—</span>}
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
