import { visit } from 'unist-util-visit';

export const remarkHighlight = () => {
  return (tree: any) => {
    visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
      if (index === undefined || !parent) {
        return;
      }

      if (parent.type === 'inlineCode' || parent.type === 'code') {
        return;
      }

      const parts = String(node.value).split(/==/);
      if (parts.length < 3 || parts.length % 2 === 0) {
        return;
      }

      const children = parts.map((part, partIndex) => {
        if (partIndex % 2 === 0) {
          return { type: 'text', value: part };
        }

        return {
          type: 'highlight',
          data: { hName: 'mark' },
          children: [{ type: 'text', value: part }],
        };
      });

      parent.children.splice(index, 1, ...children);
      return index + children.length;
    });
  };
};
