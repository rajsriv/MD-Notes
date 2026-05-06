import { Node, InputRule, mergeAttributes, PasteRule } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import katex from 'katex';

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

  addStorage() {
    return {
      markdown: {
        serialize: (state, node) => {
          if (node.attrs.display) {
            state.write(`\n\n$$\n${node.attrs.latex}\n$$\n\n`);
          } else {
            state.write(`$${node.attrs.latex}$`);
          }
        },
        parse: {
          setup: (markdownit) => {
            // Optional: configure markdown-it if needed
          },
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-latex]',
        getAttrs: (el) => ({ latex: el.getAttribute('data-latex'), display: false }),
      },
      {
        tag: 'div[data-latex]',
        getAttrs: (el) => ({ latex: el.getAttribute('data-latex'), display: true }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    if (node.attrs.display) {
      return ['div', mergeAttributes(HTMLAttributes, { 
        'data-latex': node.attrs.latex,
        class: 'math-node math-block-node' 
      })];
    }
    return ['span', mergeAttributes(HTMLAttributes, { 
      'data-latex': node.attrs.latex,
      class: 'math-node math-inline-node'
    })];
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\$\$([^$]+)\$\$$/,
        handler: ({ state, range, match }) => {
          const start = range.from;
          const end = range.to;
          const latex = match[1];
          state.tr.replaceWith(start, end, this.type.create({ latex, display: true }));
        },
      }),
      new InputRule({
        find: /\$([^$]+)\$$/,
        handler: ({ state, range, match }) => {
          const start = range.from;
          const end = range.to;
          const latex = match[1];
          state.tr.replaceWith(start, end, this.type.create({ latex, display: false }));
        },
      }),
    ];
  },

  addPasteRules() {
    return [
      new PasteRule({
        find: /\$\$([\s\S]+?)\$\$/g,
        type: this.type,
        getAttributes: match => ({ latex: match[1], display: true }),
      }),
      new PasteRule({
        find: /\$([^$]+)\$/g,
        type: this.type,
        getAttributes: match => ({ latex: match[1], display: false }),
      }),
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('math-auto-parse'),
        appendTransaction: (transactions, oldState, newState) => {
          if (!transactions.some(tr => tr.docChanged)) return;
          
          let tr = newState.tr;
          let modified = false;

          const matches = [];
          newState.doc.descendants((node, pos) => {
            if (node.isText) {
              const text = node.text;
              const regex = /\$\$([\s\S]+?)\$\$|\$([^$]+)\$/g;
              let match;
              while ((match = regex.exec(text)) !== null) {
                const isBlock = !!match[1];
                const latex = (match[1] || match[2]).trim();
                matches.push({
                  start: pos + match.index,
                  end: pos + match.index + match[0].length,
                  latex,
                  display: isBlock
                });
              }
            }
          });

          for (let i = matches.length - 1; i >= 0; i--) {
            const { start, end, latex, display } = matches[i];
            tr.replaceWith(start, end, this.type.create({ latex, display }));
            modified = true;
          }

          return modified ? tr : null;
        },
      }),
    ];
  },

  addNodeView() {
    return ({ node, getPos }) => {
      const dom = document.createElement(node.attrs.display ? 'div' : 'span');
      dom.className = node.attrs.display ? 'math-node math-block-node' : 'math-node math-inline-node';
      
      const render = () => {
        try {
          katex.render(node.attrs.latex || '...', dom, {
            displayMode: node.attrs.display,
            throwOnError: false,
          });
        } catch (e) {
          dom.textContent = node.attrs.latex;
        }
      };

      render();

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) return false;
          if (updatedNode.attrs.latex !== node.attrs.latex || updatedNode.attrs.display !== node.attrs.display) {
            render();
          }
          return true;
        },
      };
    };
  },
});

export default Mathematics;
