"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded text-xs transition-colors ${
        active
          ? "bg-indigo-500/20 text-indigo-400"
          : "text-zinc-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="mx-1 h-5 w-px bg-white/10" />;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder ?? "Start typing..." }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-sm max-w-none min-h-[120px] px-4 py-3 outline-none text-sm text-white",
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-white/10 overflow-hidden" style={{ backgroundColor: "#161619" }}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-white/10 px-2 py-1.5">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 10h10a5 5 0 015 5v2M3 10l5-5M3 10l5 5" /></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10H11a5 5 0 00-5 5v2M21 10l-5-5M21 10l-5 5" /></svg>
        </ToolbarButton>

        <Separator />

        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          <span className="line-through">S</span>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline Code">
          {"</>"}
        </ToolbarButton>

        <Separator />

        <ToolbarButton active={editor.isActive("link")} onClick={setLink} title="Link">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
        </ToolbarButton>

        <Separator />

        <ToolbarButton active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align Left">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align Center">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align Right">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
        </ToolbarButton>

        <Separator />

        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="3" y="8" fontSize="7" fill="currentColor" stroke="none">1</text><text x="3" y="14" fontSize="7" fill="currentColor" stroke="none">2</text><text x="3" y="20" fontSize="7" fill="currentColor" stroke="none">3</text></svg>
        </ToolbarButton>

        <Separator />

        <select
          value={
            editor.isActive("heading", { level: 1 }) ? "h1"
            : editor.isActive("heading", { level: 2 }) ? "h2"
            : editor.isActive("heading", { level: 3 }) ? "h3"
            : "p"
          }
          onChange={(e) => {
            const val = e.target.value;
            if (val === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: parseInt(val[1]) as 1 | 2 | 3 }).run();
          }}
          className="h-7 rounded border border-white/10 bg-transparent px-1.5 text-xs text-zinc-400 outline-none"
        >
          <option value="p">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
