"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Minus,
} from "lucide-react";

export const editorStyles = `
  /* Contenedor General */
  .tiptap-editor {
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.8;
  }

  /* Títulos: Aplicable al editor (.ProseMirror h1) y al contenido estático (.tiptap-editor h1) */
  .tiptap-editor h1, 
  .tiptap-editor .ProseMirror h1 {
    display: block !important;
    font-size: 2.2rem !important;
    font-weight: 900 !important;
    color: white !important;
    margin-top: 2rem !important;
    margin-bottom: 1rem !important;
    line-height: 1.1 !important;
    text-transform: uppercase;
    font-style: italic;
  }

  .tiptap-editor h2, 
  .tiptap-editor .ProseMirror h2 {
    display: block !important;
    font-size: 1.5rem !important;
    font-weight: 900 !important;
    color: #FF6B00 !important;
    margin-top: 1.8rem !important;
    margin-bottom: 0.8rem !important;
    text-transform: uppercase;
  }

  /* Párrafos */
  .tiptap-editor p, 
  .tiptap-editor .ProseMirror p {
    margin-bottom: 1.2rem !important;
  }

  /* Listas */
  .tiptap-editor ul, 
  .tiptap-editor .ProseMirror ul {
    list-style: none !important;
    padding-left: 1.5rem !important;
    margin: 1.2rem 0 !important;
  }

  .tiptap-editor ul li, 
  .tiptap-editor .ProseMirror ul li {
    position: relative;
    margin-bottom: 0.5rem !important;
  }

  .tiptap-editor ul li::before, 
  .tiptap-editor .ProseMirror ul li::before {
    content: "—" !important;
    position: absolute;
    left: -1.5rem;
    color: #FF6B00 !important;
    font-weight: 900;
  }

  /* Reset para el editor específicamente */
  .tiptap-editor .ProseMirror {
    outline: none;
    min-height: 300px;
  }
`;
function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  const tools = [
    {
      icon: <Heading1 size={16} />,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      active: editor.isActive("heading", { level: 1 }),
    },
    {
      icon: <Heading2 size={16} />,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
    },
    { type: "sep" },
    {
      icon: <Bold size={16} />,
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
    },
    {
      icon: <Italic size={16} />,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
    },
    { type: "sep" },
    {
      icon: <List size={16} />,
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
    {
      icon: <Quote size={16} />,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
    },
    {
      icon: <Minus size={16} />,
      action: () => editor.chain().focus().setHorizontalRule().run(),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white/[0.03] border border-white/10 rounded-2xl mb-4 sticky top-4 z-10 backdrop-blur-xl">
      {tools.map((tool, i) =>
        tool.type === "sep" ? (
          <div key={i} className="w-px h-5 bg-white/10 mx-1" />
        ) : (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              tool.action?.();
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              tool.active
                ? "bg-[#FF6B00] text-white"
                : "text-white/30 hover:text-white hover:bg-white/5"
            }`}
          >
            {tool.icon}
          </button>
        ),
      )}
    </div>
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Comienza a escribir...",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: {},
        orderedList: {},
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sincronización: Si el value cambia externamente (ej: reset), actualiza el editor
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="w-full">
      <style>{editorStyles}</style>
      <EditorToolbar editor={editor} />
      <div className="tiptap-editor bg-[#050505] border border-white/[0.05] focus-within:border-[#FF6B00]/30 rounded-[2.5rem] p-8 md:p-12 transition-all shadow-2xl">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
