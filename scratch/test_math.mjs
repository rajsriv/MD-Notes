import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { Node, mergeAttributes } from '@tiptap/core';

const Mathematics = Node.create({
  name: 'mathematics',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      latex: { default: '' },
      display: { default: false },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    if (node.attrs.display) {
      return ['div', mergeAttributes(HTMLAttributes, { 'data-latex': node.attrs.latex }), `$$${node.attrs.latex}$$`];
    }
    return ['span', mergeAttributes(HTMLAttributes, { 'data-latex': node.attrs.latex }), `$${node.attrs.latex}$`];
  },
});

const editor = new Editor({
  extensions: [
    StarterKit,
    Markdown,
    Mathematics,
  ],
});

editor.commands.setContent({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Math: ' },
        { type: 'mathematics', attrs: { latex: 'E=mc^2', display: false } },
      ],
    },
  ],
});

console.log('Markdown output:');
console.log(editor.getMarkdown());
