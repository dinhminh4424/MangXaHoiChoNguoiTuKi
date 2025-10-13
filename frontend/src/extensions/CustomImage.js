// extensions/CustomImage.js
import { Image } from "@tiptap/extension-image";
import { Plugin, PluginKey } from "prosemirror-state";

export const CustomImage = Image.extend({
  name: "customImage",

  addAttributes() {
    return {
      ...this.parent?.(),
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: {
        default: "100%",
        parseHTML: (element) =>
          element.style.width || element.getAttribute("width") || "100%",
        renderHTML: (attributes) => ({
          style: `
            width: ${attributes.width};
            max-width: 100%;
            height: auto;
            display: block;
            margin: 10px auto;
            cursor: pointer;
            border-radius: ${attributes.rounded ? "12px" : "0"};
            box-shadow: ${
              attributes.shadow ? "0 2px 10px rgba(0,0,0,0.2)" : "none"
            };
            border: ${attributes.border ? "2px solid #ccc" : "none"};
            text-align: ${attributes.align || "center"};
          `,
          class: "resizeable",
        }),
      },
      align: { default: "center" },
      rounded: { default: false },
      shadow: { default: false },
      border: { default: false },
    };
  },

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey("customImagePlugin");

    return [
      new Plugin({
        key: pluginKey,
        props: {
          handleClick: (view, pos, event) => {
            const target = event.target;
            if (
              target.tagName === "IMG" &&
              target.classList.contains("resizeable")
            ) {
              showImageToolbar(target, view);
              return true;
            }

            const existingToolbar = document.querySelector(".image-toolbar");
            if (existingToolbar) existingToolbar.remove();
            return false;
          },
        },
      }),
    ];
  },
});

//
// ⚙️ Toolbar hiển thị khi click vào ảnh
//
function showImageToolbar(target, view) {
  const existing = document.querySelector(".image-toolbar");
  if (existing) existing.remove();

  const toolbar = document.createElement("div");
  toolbar.className =
    "image-toolbar fixed bg-white shadow-md rounded-lg border border-gray-300 flex flex-wrap gap-2 p-1 items-center z-[9999]";
  toolbar.style.position = "absolute";

  const rect = target.getBoundingClientRect();
  toolbar.style.top = `${window.scrollY + rect.top - 50}px`;
  toolbar.style.left = `${window.scrollX + rect.left + rect.width / 2 - 150}px`;

  //
  // 🧩 Các nút chức năng
  //
  const buttons = [
    {
      label: "25%",
      title: "Kích thước 25%",
      action: () => setFixedSize(view, target, "25%"),
    },
    {
      label: "50%",
      title: "Kích thước 50%",
      action: () => setFixedSize(view, target, "50%"),
    },
    {
      label: "75%",
      title: "Kích thước 75%",
      action: () => setFixedSize(view, target, "75%"),
    },
    {
      label: "100%",
      title: "Kích thước 100%",
      action: () => setFixedSize(view, target, "100%"),
    },
    {
      label: "150%",
      title: "Kích thước 150%",
      action: () => setFixedSize(view, target, "150%"),
    },
    {
      label: "200%",
      title: "Kích thước 200%",
      action: () => setFixedSize(view, target, "200%"),
    },
    {
      label: "−",
      title: "Thu nhỏ 10%",
      action: () => resizeImage(view, target, -10),
    },
    {
      label: "+",
      title: "Phóng to 10%",
      action: () => resizeImage(view, target, 10),
    },
    {
      label: "↔️",
      title: "Căn trái",
      action: () => alignImage(view, target, "left"),
    },
    {
      label: "⏹️",
      title: "Căn giữa",
      action: () => alignImage(view, target, "center"),
    },
    {
      label: "↪️",
      title: "Căn phải",
      action: () => alignImage(view, target, "right"),
    },
    {
      label: "⭕",
      title: "Bo góc",
      action: () => toggleAttr(view, target, "rounded"),
    },
    {
      label: "🌫️",
      title: "Bóng đổ",
      action: () => toggleAttr(view, target, "shadow"),
    },
    {
      label: "🎨",
      title: "Viền ảnh",
      action: () => toggleAttr(view, target, "border"),
    },
    { label: "🔄", title: "Reset", action: () => resetImage(view, target) },
    { label: "🗑️", title: "Xóa ảnh", action: () => deleteImage(view, target) },
  ];

  //
  // 🧱 Tạo nút
  //
  buttons.forEach((btn) => {
    const button = document.createElement("button");
    button.textContent = btn.label;
    button.title = btn.title;
    button.className =
      "text-xs font-semibold w-8 h-8 rounded hover:bg-blue-100 transition border border-gray-200";
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      btn.action();
      toolbar.remove();
    });
    toolbar.appendChild(button);
  });

  document.body.appendChild(toolbar);

  //
  // Ẩn toolbar khi click ra ngoài
  //
  const removeToolbar = (e) => {
    if (!toolbar.contains(e.target)) {
      toolbar.remove();
      document.removeEventListener("click", removeToolbar);
    }
  };
  setTimeout(() => document.addEventListener("click", removeToolbar), 10);
}

//
// ⚙️ Các hàm xử lý hành động
//
function setFixedSize(view, target, size) {
  const pos = view.posAtDOM(target);
  const node = view.state.doc.nodeAt(pos);
  if (!node) return;
  const tr = view.state.tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    width: size,
  });
  view.dispatch(tr);
}

function resizeImage(view, target, delta) {
  const pos = view.posAtDOM(target);
  const node = view.state.doc.nodeAt(pos);
  if (!node) return;

  const currentWidth = parseFloat(node.attrs.width) || 100;
  const newWidth = Math.max(10, Math.min(300, currentWidth + delta));
  const tr = view.state.tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    width: `${newWidth}%`,
  });
  view.dispatch(tr);
}

function alignImage(view, target, align) {
  const pos = view.posAtDOM(target);
  const node = view.state.doc.nodeAt(pos);
  if (!node) return;
  const tr = view.state.tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    align,
  });
  view.dispatch(tr);
}

function toggleAttr(view, target, attr) {
  const pos = view.posAtDOM(target);
  const node = view.state.doc.nodeAt(pos);
  if (!node) return;
  const newValue = !node.attrs[attr];
  const tr = view.state.tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    [attr]: newValue,
  });
  view.dispatch(tr);
}

function resetImage(view, target) {
  const pos = view.posAtDOM(target);
  const node = view.state.doc.nodeAt(pos);
  if (!node) return;
  const tr = view.state.tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    width: "100%",
    align: "center",
    rounded: false,
    shadow: false,
    border: false,
  });
  view.dispatch(tr);
}

function deleteImage(view, target) {
  const pos = view.posAtDOM(target);
  const node = view.state.doc.nodeAt(pos);
  if (!node) return;
  const tr = view.state.tr.delete(pos, pos + node.nodeSize);
  view.dispatch(tr);
}
