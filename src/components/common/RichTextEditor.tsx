import React, {  useState } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import ImageInputModal from './ImageInputModal'; // Import the new image input modal
import PromptModal from './PromptModal';

interface RichTextEditorProps {
  value: string
  onChange: (htmlContent: string) => void
  placeholder?: string
  className?: string
}

// A simple toolbar component
const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null
  }

  const [isLinkModalOpen, setLinkModalOpen] = useState(false);
  const [currentLinkUrl, setCurrentLinkUrl] = useState('');
  const [isImageInputModalOpen, setImageInputModalOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  const handleOpenLinkModal = () => {
    setCurrentLinkUrl(editor.getAttributes('link').href || '');
    setLinkModalOpen(true);
  };

  const handleConfirmLink = (url: string) => {
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setLinkModalOpen(false);
  };

  const handleOpenImageInputModal = () => {
    // If there's an existing image selected, pre-fill the modal with its URL
    const existingImage = editor.getAttributes('image');
    setCurrentImageUrl(existingImage.src || '');
    setImageInputModalOpen(true);
  };

  const handleConfirmImageInput = (imageUrl: string) => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
    setImageInputModalOpen(false);
  };

  const btn =
    'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-[12px] font-medium text-text-secondary transition hover:bg-surface-muted hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent'
  const activeCls = 'bg-accent/15 text-accent hover:bg-accent/20 hover:text-accent'
  const divider = <span aria-hidden className="mx-1 h-5 w-px bg-border/60" />

  const Icon = ({
    path,
    label,
  }: {
    path: React.ReactNode
    label: string
  }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-label={label}
    >
      {path}
    </svg>
  )

  return (
    <>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-2xl border-b border-border/60 bg-surface/95 px-2 py-1.5 backdrop-blur">
        {/* Inline formatting */}
        <button
          type="button"
          title="Bold"
          aria-label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${btn} ${editor.isActive('bold') ? activeCls : ''}`}
        >
          <Icon label="Bold" path={<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" />} />
        </button>
        <button
          type="button"
          title="Italic"
          aria-label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${btn} ${editor.isActive('italic') ? activeCls : ''}`}
        >
          <Icon label="Italic" path={<><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></>} />
        </button>
        <button
          type="button"
          title="Strikethrough"
          aria-label="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`${btn} ${editor.isActive('strike') ? activeCls : ''}`}
        >
          <Icon label="Strike" path={<><path d="M4 12h16" /><path d="M17 7.5A5 5 0 0 0 12 5c-2 0-4 .8-4 3 0 1.5 1 2.3 3 3" /><path d="M9 16.5A4.5 4.5 0 0 0 12 18c2.5 0 4-1 4-3 0-.8-.3-1.5-1-2" /></>} />
        </button>
        <button
          type="button"
          title="Inline code"
          aria-label="Code"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`${btn} ${editor.isActive('code') ? activeCls : ''}`}
        >
          <Icon label="Code" path={<><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>} />
        </button>

        {divider}

        {/* Block types */}
        <button
          type="button"
          title="Quote"
          aria-label="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${btn} ${editor.isActive('blockquote') ? activeCls : ''}`}
        >
          <Icon label="Quote" path={<><path d="M7 7h4v4H7a2 2 0 0 0-2 2v4" /><path d="M15 7h4v4h-4a2 2 0 0 0-2 2v4" /></>} />
        </button>
        <button
          type="button"
          title="Paragraph"
          aria-label="Paragraph"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`${btn} ${editor.isActive('paragraph') ? activeCls : ''}`}
        >
          <span className="text-[14px] font-semibold leading-none">¶</span>
        </button>
        {([1, 2, 3, 4, 5, 6] as const).map((level) => (
          <button
            key={level}
            type="button"
            title={`Heading ${level}`}
            aria-label={`Heading ${level}`}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            className={`${btn} ${editor.isActive('heading', { level }) ? activeCls : ''}`}
          >
            <span className="text-[11px] font-semibold tracking-tight">H{level}</span>
          </button>
        ))}

        {divider}

        {/* Lists */}
        <button
          type="button"
          title="Bulleted list"
          aria-label="Bulleted list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${btn} ${editor.isActive('bulletList') ? activeCls : ''}`}
        >
          <Icon label="Bulleted list" path={<><line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><circle cx="5" cy="6" r="1" /><circle cx="5" cy="12" r="1" /><circle cx="5" cy="18" r="1" /></>} />
        </button>
        <button
          type="button"
          title="Numbered list"
          aria-label="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${btn} ${editor.isActive('orderedList') ? activeCls : ''}`}
        >
          <Icon label="Numbered list" path={<><line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></>} />
        </button>

        {divider}

        {/* Insertables */}
        <button
          type="button"
          title="Add link"
          aria-label="Add link"
          onClick={handleOpenLinkModal}
          className={`${btn} ${editor.isActive('link') ? activeCls : ''}`}
        >
          <Icon label="Link" path={<><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></>} />
        </button>
        <button
          type="button"
          title="Add image"
          aria-label="Add image"
          onClick={handleOpenImageInputModal}
          className={btn}
        >
          <Icon label="Image" path={<><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>} />
        </button>

        {divider}

        {/* History & clear */}
        <button
          type="button"
          title="Undo"
          aria-label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={btn}
        >
          <Icon label="Undo" path={<><polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" /></>} />
        </button>
        <button
          type="button"
          title="Redo"
          aria-label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={btn}
        >
          <Icon label="Redo" path={<><polyline points="15 14 20 9 15 4" /><path d="M4 20v-7a4 4 0 0 1 4-4h12" /></>} />
        </button>
        <button
          type="button"
          title="Clear formatting"
          aria-label="Clear formatting"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className={btn}
        >
          <Icon label="Clear formatting" path={<><path d="M6 4v6a6 6 0 0 0 11 3.3" /><path d="M14 4h6" /><line x1="4" y1="20" x2="20" y2="4" /></>} />
        </button>
      </div>

      <PromptModal
        isOpen={isLinkModalOpen}
        title="Add Link"
        message="Enter the URL for the link:"
        initialValue={currentLinkUrl}
        onConfirm={handleConfirmLink}
        onCancel={() => setLinkModalOpen(false)}
      />

      <ImageInputModal // This is the new ImageInputModal
        isOpen={isImageInputModalOpen}
        onClose={() => setImageInputModalOpen(false)}
        onConfirm={handleConfirmImageInput}
        initialUrl={currentImageUrl}
      />
    </>
  )
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  className,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { // Allow all heading levels
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc pl-5',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal pl-5',
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-accent hover:underline',
        },
      }),
      Image.configure({
        inline: true, // Allow images to be inline
        allowBase64: true, // Allow base64 images (if you want to support direct paste)
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Tiptap returns empty content as '<p></p>', check for that
      const html = editor.getHTML()
      onChange(html === '<p></p>' ? '' : html)
    },
    editorProps: {
      attributes: {
        // Apply styling to the editor content area itself
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none p-3 min-h-[100px]',
      },
    },
  })

  return (
    // The main wrapper gets the border and rounded corners
    <div className={`w-full rounded-2xl border border-border/60 bg-background text-text-primary focus-within:border-accent focus-within:ring-1 focus-within:ring-accent ${className || ''}`}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  )
}

export default RichTextEditor