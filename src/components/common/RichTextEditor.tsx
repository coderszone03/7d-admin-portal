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

  const buttonClass = 'p-2 text-sm font-medium text-text-secondary hover:bg-surface-muted rounded-md'
  const activeClass = 'bg-accent/20 text-accent'

  return (
    <>
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border-b border-border/60 bg-surface p-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`${buttonClass} ${editor.isActive('bold') ? activeClass : ''}`}>Bold</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${buttonClass} ${editor.isActive('italic') ? activeClass : ''}`}>Italic</button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`${buttonClass} ${editor.isActive('strike') ? activeClass : ''}`}>Strike</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={`${buttonClass} ${editor.isActive('code') ? activeClass : ''}`}>Code</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${buttonClass} ${editor.isActive('blockquote') ? activeClass : ''}`}>Quote</button>

        {/* Heading buttons */}
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`${buttonClass} ${editor.isActive('heading', { level: 1 }) ? activeClass : ''}`}>H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${buttonClass} ${editor.isActive('heading', { level: 2 }) ? activeClass : ''}`}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`${buttonClass} ${editor.isActive('heading', { level: 3 }) ? activeClass : ''}`}>H3</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} className={`${buttonClass} ${editor.isActive('heading', { level: 4 }) ? activeClass : ''}`}>H4</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()} className={`${buttonClass} ${editor.isActive('heading', { level: 5 }) ? activeClass : ''}`}>H5</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()} className={`${buttonClass} ${editor.isActive('heading', { level: 6 }) ? activeClass : ''}`}>H6</button>

        {/* Paragraph button */}
        <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className={`${buttonClass} ${editor.isActive('paragraph') ? activeClass : ''}`}>Paragraph</button>

        {/* List buttons */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${buttonClass} ${editor.isActive('bulletList') ? activeClass : ''}`}>Bullet List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${buttonClass} ${editor.isActive('orderedList') ? activeClass : ''}`}>Ordered List</button>

        {/* Link and Image buttons */}
        <button type="button" onClick={handleOpenLinkModal} className={`${buttonClass} ${editor.isActive('link') ? activeClass : ''}`}>Add Link</button>
        <button type="button" onClick={handleOpenImageInputModal} className={buttonClass}>Add Image</button>

        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={buttonClass}>Undo</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={buttonClass}>Redo</button>
        <button type="button" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} className={buttonClass}>Clear Formatting</button>
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