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
  Quote,
  Minus,
} from "lucide-react";

// Estilos del contenido en fondo claro: coinciden con .article-body de la página pública,
// así lo que se escribe en el admin se ve igual que lo publicado
export const editorStyles = `
  .tiptap-editor {
    color: #44403c;
    font-size: 1.0625rem;
    line-height: 1.8;
  }

  .tiptap-editor h1,
  .tiptap-editor .ProseMirror h1 {
    display: block !important;
    font-size: 1.875rem !important;
    font-weight: 600 !important;
    color: #0a0a0a !important;
    letter-spacing: -0.02em;
    margin-top: 2rem !important;
    margin-bottom: 0.75rem !important;
    line-height: 1.2 !important;
  }

  .tiptap-editor h2,
  .tiptap-editor .ProseMirror h2 {
    display: block !important;
    font-size: 1.5rem !important;
    font-weight: 600 !important;
    color: #0a0a0a !important;
    letter-spacing: -0.02em;
    margin-top: 1.8rem !important;
    margin-bottom: 0.75rem !important;
    line-height: 1.2 !important;
  }

  .tiptap-editor p,
  .tiptap-editor .ProseMirror p {
    margin-bottom: 1.2rem !important;
  }

  .tiptap-editor strong {
    color: #0a0a0a;
    font-weight: 600;
  }

  .tiptap-editor blockquote {
    border-left: 2px solid #e7e5e4;
    padding-left: 1rem;
    color: #57534e;
    margin: 1.2rem 0;
  }

  .tiptap-editor hr {
    border: 0;
    border-top: 1px solid #e7e5e4;
    margin: 2rem 0;
  }

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
    color: #c2410c !important;
  }

  .tiptap-editor .ProseMirror {
    outline: none;
    min-height: 300px;
  }

  .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    color: #a8a29e;
    float: left;
    height: 0;
    pointer-events: none;
  }
`;

function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  const tools = [
    {
      label: "Título",
      icon: <Heading1 size={16} />,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      active: editor.isActive("heading", { level: 1 }),
    },
    {
      label: "Subtítulo",
      icon: <Heading2 size={16} />,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
    },
    { type: "sep" },
    {
      label: "Negrita",
      icon: <Bold size={16} />,
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
    },
    {
      label: "Itálica",
      icon: <Italic size={16} />,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
    },
    { type: "sep" },
    {
      label: "Lista",
      icon: <List size={16} />,
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
    {
      label: "Cita",
      icon: <Quote size={16} />,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
    },
    {
      label: "Línea divisoria",
      icon: <Minus size={16} />,
      action: () => editor.chain().focus().setHorizontalRule().run(),
    },
  ];

  return (
    <div className="sticky top-4 z-10 mb-4 flex w-fit flex-wrap items-center gap-1 rounded-full border border-[#e7e5e4] bg-white/90 p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md">
      {tools.map((tool, i) =>
        tool.type === "sep" ? (
          <div key={i} aria-hidden="true" className="mx-1 h-5 w-px bg-[#e7e5e4]" />
        ) : (
          <button
            key={i}
            type="button"
            aria-label={tool.label}
            title={tool.label}
            aria-pressed={tool.active ?? undefined}
            onClick={(e) => {
              e.preventDefault();
              tool.action?.();
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] ${
              tool.active ? "bg-[#0a0a0a] text-white" : "text-[#57534e] hover:bg-[#f5f5f4] hover:text-[#0a0a0a]"
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
      <div className="tiptap-editor rounded-[1.5rem] border border-[#e7e5e4] bg-white p-6 transition-[border-color,box-shadow] focus-within:border-[#0a0a0a] focus-within:ring-2 focus-within:ring-[#FF6B00]/30 md:p-8">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
