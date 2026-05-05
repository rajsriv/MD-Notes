import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';

const editor = new Editor({
  extensions: [StarterKit, Markdown],
  content: '',
});

editor.commands.setContent('# Hello\n\nWorld', false, { contentType: 'markdown' });
console.log(editor.getHTML());
