// Drawings for the lessons: binary trees, graphs (directed or not, with weights) and data tables.
// Trees and graphs are SVG drawn at the real width of the page (measured), so the nodes keep the
// same size on a phone and on a computer.
import { useEffect, useId, useRef, useState } from 'react';

import type { Figure, TreeFig } from '@/content/types';

const R = 19; // node radius

export function Figures({ f }: { f?: Figure | Figure[] }) {
  if (!f) return null;
  const list = Array.isArray(f) ? f : [f];
  return (
    <div className="figures">
      {list.map((x, i) => (
        <figure key={i} className="figure">
          {x.kind === 'tree' ? <TreeView tree={x.tree} /> : x.kind === 'graph' ? <GraphView f={x} /> : <DataTable title={x.title} columns={x.columns} rows={x.rows} />}
          {x.caption ? <figcaption>{x.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  );
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(320);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.min(640, e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

type PNode = { id: string; label: string; x: number; y: number };
type PEdge = { a: string; b: string; label?: string };

function Diagram({ nodes, edges, directed, width, height, title }: { nodes: PNode[]; edges: PEdge[]; directed?: boolean; width: number; height: number; title: string }) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const marker = useId().replace(/:/g, '');
  return (
    <svg className="diagram-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
      {directed ? (
        <defs>
          <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--encre)" />
          </marker>
        </defs>
      ) : null}
      {edges.map((e, i) => {
        const p = byId.get(e.a);
        const q = byId.get(e.b);
        if (!p || !q) return null;
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        // stop at the border of the nodes, so the arrow head stays visible
        const x1 = p.x + ux * R;
        const y1 = p.y + uy * R;
        const x2 = q.x - ux * (R + (directed ? 3 : 0));
        const y2 = q.y - uy * (R + (directed ? 3 : 0));
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--encre-line)" strokeWidth={2} markerEnd={directed ? `url(#${marker})` : undefined} />;
      })}
      {edges.map((e, i) => {
        const p = byId.get(e.a);
        const q = byId.get(e.b);
        if (!p || !q || !e.label) return null;
        const mx = (p.x + q.x) / 2;
        const my = (p.y + q.y) / 2;
        const w = Math.max(26, e.label.length * 8 + 12);
        return (
          <g key={`l${i}`}>
            <rect x={mx - w / 2} y={my - 11} width={w} height={22} rx={11} fill="var(--gold-soft)" stroke="var(--gold)" />
            <text x={mx} y={my + 4} textAnchor="middle" className="diagram-edge-label">
              {e.label}
            </text>
          </g>
        );
      })}
      {nodes.map((n) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={R} fill="var(--encre)" stroke="var(--encre-deep)" strokeWidth={2} />
          <text x={n.x} y={n.y + 5} textAnchor="middle" className="diagram-node-label" style={{ fontSize: n.label.length > 3 ? 11 : 14 }}>
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function GraphView({ f }: { f: Extract<Figure, { kind: 'graph' }> }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const h = 230;
  const pad = R + 4;
  const nodes = f.nodes.map((n) => ({ id: n.id, label: n.id, x: pad + (n.x / 100) * (w - 2 * pad), y: pad + (n.y / 100) * (h - 2 * pad) }));
  const edges = f.edges.map(([a, b, label]) => ({ a, b, label }));
  return (
    <div ref={ref} className="diagram">
      <Diagram nodes={nodes} edges={edges} directed={f.directed} width={w} height={h} title={f.caption ?? `Graphe de ${f.nodes.length} sommets`} />
    </div>
  );
}

function TreeView({ tree }: { tree: TreeFig }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const flat: { id: string; label: string; depth: number; parent?: string }[] = [];
  // in-order numbering gives each node its column, the depth gives its row
  let k = 0;
  const walk = (t: TreeFig | null | undefined, depth: number, parent?: string) => {
    if (!t) return;
    const id = `n${k++}`;
    const entry = { id, label: String(t[0]), depth, parent };
    walk(t[1], depth + 1, id);
    flat.push(entry);
    walk(t[2], depth + 1, id);
  };
  walk(tree, 0);
  const depth = Math.max(...flat.map((n) => n.depth));
  const rowH = 62;
  const nodes = flat.map((n, i) => ({ id: n.id, label: n.label, x: ((i + 0.5) / flat.length) * w, y: R + 8 + n.depth * rowH }));
  const edges = flat.filter((n) => n.parent).map((n) => ({ a: n.parent!, b: n.id }));
  return (
    <div ref={ref} className="diagram">
      <Diagram nodes={nodes} edges={edges} width={w} height={2 * R + 16 + depth * rowH} title={`Arbre binaire de ${flat.length} nœuds`} />
    </div>
  );
}

export function DataTable({ title, columns, rows }: { title?: string; columns: string[]; rows: (string | number | null)[][] }) {
  return (
    <div className="datatable">
      {title ? <div className="datatable-title mono">{title}</div> : null}
      <div className="datatable-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={Math.max(1, columns.length)} className="is-empty">
                  (aucune ligne)
                </td>
              </tr>
            ) : null}
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((v, j) => (
                  <td key={j}>{v === null ? 'NULL' : String(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
