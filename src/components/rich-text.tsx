// Text with a tiny inline markup: **gras** and `code`.
import type { CSSProperties } from 'react';

export function RichText({ children, as: Tag = 'p', className, style }: { children: string; as?: 'p' | 'span' | 'div'; className?: string; style?: CSSProperties }) {
  const parts = children.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return (
    <Tag className={className ? `rich ${className}` : 'rich'} style={style}>
      {parts.map((p, i) =>
        p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p.startsWith('`') ? <code key={i}>{p.slice(1, -1)}</code> : p,
      )}
    </Tag>
  );
}
