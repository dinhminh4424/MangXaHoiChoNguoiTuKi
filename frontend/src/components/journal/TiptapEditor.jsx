// // components/journal/TiptapEditor.jsx
import React, { useCallback, useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import FontSize from "tiptap-extension-font-size";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import { CustomImage } from "../../extensions/CustomImage.js";
import "../../styles/tiptap.css";

import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  Maximize2,
  Minimize2,
  Video,
  Code,
  Minus,
  Eraser,
} from "lucide-react";

const TiptapEditor = ({ value, onChange, placeholder, onImageUpload }) => {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const editorRef = useRef(null);

  const handleImageUpload = useCallback(
    async (file) => {
      if (!onImageUpload) return URL.createObjectURL(file);
      try {
        const imageUrl = await onImageUpload(file);
        return imageUrl;
      } catch {
        return URL.createObjectURL(file);
      }
    },
    [onImageUpload]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "editor-link" },
      }),
      Youtube.configure({
        controls: true,
        allowFullscreen: true,
      }),
      CustomImage.configure({
        HTMLAttributes: { class: "editor-image resizeable" },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose focus:outline-none min-h-300 max-w-none",
        placeholder:
          placeholder || "Hôm nay của bạn thế nào? Viết cảm xúc của bạn...",
      },
    },
  });

  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        const src = await handleImageUpload(file);
        editor.chain().focus().setImage({ src }).run();
      }
    };
    input.click();
  }, [editor, handleImageUpload]);

  const addYoutubeVideo = useCallback(() => {
    const url = prompt("Nhập URL YouTube:");
    if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prevUrl = editor.getAttributes("link").href;
    setLinkUrl(prevUrl || "");
    setIsLinkModalOpen(true);
  }, [editor]);

  const confirmLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: linkUrl }).run();
    setIsLinkModalOpen(false);
  }, [editor, linkUrl]);

  const clearFormatting = useCallback(() => {
    editor.chain().focus().unsetAllMarks().clearNodes().run();
  }, [editor]);

  if (!editor)
    return <div className="p-3 text-muted">Đang tải trình soạn thảo...</div>;

  return (
    <div
      ref={editorRef}
      className={`tiptap-editor border rounded bg-white ${
        isFullscreen ? "position-fixed top-0 start-0 w-100 h-100 z-50" : ""
      }`}
      style={{ overflowY: "auto" }}
    >
      {/* Toolbar */}
      <div className="toolbar border-bottom p-2 d-flex flex-wrap gap-2 align-items-center bg-light">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="btn btn-sm btn-outline-secondary"
        >
          <Undo size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="btn btn-sm btn-outline-secondary"
        >
          <Redo size={14} />
        </button>

        <div className="vr"></div>

        {/* Font family */}
        <select
          className="form-select form-select-sm"
          style={{ width: "120px" }}
          onChange={(e) =>
            editor.chain().focus().setFontFamily(e.target.value).run()
          }
        >
          <option value="">Font chữ</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times</option>
          <option value="Courier New">Courier</option>
          <option value="Roboto">Roboto</option>
        </select>

        {/* Font size */}
        <select
          className="form-select form-select-sm"
          style={{ width: "80px" }}
          onChange={(e) =>
            editor.chain().focus().setFontSize(e.target.value).run()
          }
        >
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="20px">20</option>
          <option value="24px">24</option>
          <option value="28px">28</option>
          <option value="32px">32</option>
        </select>

        <div className="vr"></div>

        {/* Text format */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`btn btn-sm ${
            editor.isActive("bold") ? "btn-primary" : "btn-outline-secondary"
          }`}
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`btn btn-sm ${
            editor.isActive("italic") ? "btn-primary" : "btn-outline-secondary"
          }`}
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`btn btn-sm ${
            editor.isActive("strike") ? "btn-primary" : "btn-outline-secondary"
          }`}
        >
          <Underline size={14} />
        </button>

        <button
          type="button"
          onClick={clearFormatting}
          className="btn btn-sm btn-outline-danger"
          title="Xóa định dạng"
        >
          <Eraser size={14} />
        </button>

        <div className="vr"></div>

        {/* Heading */}
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            type="button"
            key={level}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level }).run()
            }
            className={`btn btn-sm ${
              editor.isActive("heading", { level })
                ? "btn-primary"
                : "btn-outline-secondary"
            }`}
          >
            H{level}
          </button>
        ))}

        <div className="vr"></div>

        {/* Align */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className="btn btn-sm btn-outline-secondary"
        >
          <AlignLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className="btn btn-sm btn-outline-secondary"
        >
          <AlignCenter size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className="btn btn-sm btn-outline-secondary"
        >
          <AlignRight size={14} />
        </button>

        <div className="vr"></div>

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="btn btn-sm btn-outline-secondary"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="btn btn-sm btn-outline-secondary"
        >
          <ListOrdered size={14} />
        </button>

        <div className="vr"></div>

        {/* Color & Highlight */}
        <input
          type="color"
          title="Màu chữ"
          onChange={(e) =>
            editor.chain().focus().setColor(e.target.value).run()
          }
          className="form-control form-control-color"
        />
        <input
          type="color"
          title="Highlight"
          onChange={(e) =>
            editor
              .chain()
              .focus()
              .toggleHighlight({ color: e.target.value })
              .run()
          }
          className="form-control form-control-color"
        />

        <div className="vr"></div>

        {/* Link, Image, Video */}
        <button
          type="button"
          onClick={setLink}
          className="btn btn-sm btn-outline-secondary"
          title="Gắn link"
        >
          <LinkIcon size={14} />
        </button>
        <button
          type="button"
          onClick={addImage}
          className="btn btn-sm btn-outline-secondary"
          title="Chèn ảnh"
        >
          <ImageIcon size={14} />
        </button>
        <button
          type="button"
          onClick={addYoutubeVideo}
          className="btn btn-sm btn-outline-secondary"
          title="Chèn video"
        >
          <Video size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="btn btn-sm btn-outline-secondary"
          title="Đường phân cách"
        >
          <Minus size={14} />
        </button>

        <div className="vr"></div>

        {/* Code / Fullscreen */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`btn btn-sm ${
            editor.isActive("codeBlock")
              ? "btn-primary"
              : "btn-outline-secondary"
          }`}
        >
          <Code size={14} />
        </button>

        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="btn btn-sm btn-outline-dark"
          title="Toàn màn hình"
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* Content */}
      <div className="editor-content p-3">
        <EditorContent editor={editor} />
      </div>

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div
          className="modal show d-block"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Thêm liên kết</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsLinkModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => editor.chain().focus().unsetLink().run()}
                >
                  Gỡ liên kết
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmLink}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TiptapEditor;
