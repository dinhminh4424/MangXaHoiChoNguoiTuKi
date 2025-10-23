// // components/Post/PostHeader.js
// import React, { useState } from "react";
// import { MoreHorizontal, Edit3, Trash2, Eye, Flag } from "lucide-react";
// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";
// import "dayjs/locale/vi";
// import "./PostHeader.css";
// import { Link } from "react-router-dom";

// dayjs.extend(relativeTime);
// dayjs.locale("vi");

// const PostHeader = ({ post, isOwner, onUpdate, onDelete }) => {
//   const [showMenu, setShowMenu] = useState(false);

//   const handleMenuToggle = () => {
//     setShowMenu(!showMenu);
//   };

//   const handleMenuAction = (action) => {
//     setShowMenu(false);
//     switch (action) {
//       case "edit":
//         onUpdate(post);
//         break;
//       case "delete":
//         onDelete();
//         break;
//       case "report":
//         // Handle report
//         console.log("Report post:", post._id);
//         break;
//       default:
//         break;
//     }
//   };

//   return (
//     <div className="post-header">
//       <div className="header-content">
//         <div className="user-info ">
//           <Link to={`/profile/${post.userCreateID._id}`}>
//             <img
//               src={post.userCreateID.avatar || "/images/default-avatar.png"}
//               alt="Avatar"
//               className="user-avatar"
//             />
//           </Link>

//           <div className="user-details">
//             <div className="user-name text-text-end">
//               {post.isAnonymous ? "🕶️ Ẩn danh" : post.userCreateID.fullName}
//             </div>
//             <div className="post-meta">
//               <span className="post-time">
//                 {dayjs(post.createdAt).fromNow()}
//               </span>
//               {post.isEdited && (
//                 <span className="edited-badge">• Đã chỉnh sửa</span>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="header-actions">
//           <div className="menu-container">
//             <button className="menu-toggle" onClick={handleMenuToggle}>
//               <MoreHorizontal size={20} />
//             </button>

//             {showMenu && (
//               <div className="dropdown-menu">
//                 {isOwner ? (
//                   <>
//                     <button
//                       className="menu-item"
//                       onClick={() => handleMenuAction("edit")}
//                     >
//                       <Edit3 size={16} />
//                       <span>Chỉnh sửa</span>
//                     </button>
//                     <button
//                       className="menu-item delete"
//                       onClick={() => handleMenuAction("delete")}
//                     >
//                       <Trash2 size={16} />
//                       <span>Xóa</span>
//                     </button>
//                   </>
//                 ) : (
//                   <>
//                     <button
//                       className="menu-item"
//                       onClick={() => handleMenuAction("report")}
//                     >
//                       <Flag size={16} />
//                       <span>Báo cáo</span>
//                     </button>
//                     <button
//                       className="menu-item"
//                       onClick={() => handleMenuAction("hide")}
//                     >
//                       <Eye size={16} />
//                       <span>Ẩn bài viết</span>
//                     </button>
//                   </>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Privacy Badge */}
//       <div className="privacy-info">
//         <span className={`privacy-badge ${post.privacy}`}>
//           {post.privacy === "public" && "🌍 Công khai"}
//           {post.privacy === "friends" && "👥 Bạn bè"}
//           {post.privacy === "private" && "🔒 Riêng tư"}
//         </span>
//         {post.isAnonymous && (
//           <span className="anonymous-badge">🕶️ Ẩn danh</span>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PostHeader;

// components/Post/PostHeader.js
import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Edit3, Trash2, Eye, Flag } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import "./PostHeader.css";
import { Link } from "react-router-dom";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const PostHeader = ({ post, isOwner, onUpdate, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const toggleRef = useRef(null);
  const menuRef = useRef(null);

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setShowMenu((s) => !s);
  };

  const handleMenuAction = (action) => {
    setShowMenu(false);
    switch (action) {
      case "edit":
        if (onUpdate) {
          onUpdate(post);
        }
        break;
      case "delete":
        if (onDelete) {
          onDelete();
        }
        break;
      case "report":
        console.log("Report post:", post._id);
        break;
      default:
        break;
    }
  };

  // Click outside để đóng menu
  useEffect(() => {
    const onDocClick = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        toggleRef.current &&
        !toggleRef.current.contains(e.target)
      ) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="post-header">
      <div className="header-content d-flex align-items-start justify-content-between">
        <div className="user-info d-flex align-items-start">
          <Link to={`/profile/${post.userCreateID._id}`}>
            <img
              src={
                post.userCreateID.avatar || "/assets/images/default-avatar.png"
              }
              alt="Avatar"
              className="user-avatar rounded-circle"
            />
          </Link>

          <div className="user-details ms-2 ">
            <div className="user-name text-start">
              {post.isAnonymous ? "🕶️ Ẩn danh" : post.userCreateID.fullName}
            </div>
            <div className="post-meta small text-muted">
              <span className="post-time">
                {dayjs(post.createdAt).fromNow()}
              </span>
              {post.isEdited && (
                <span className="edited-badge"> • Đã chỉnh sửa</span>
              )}
            </div>
          </div>
        </div>

        <div className="header-actions">
          {/* Dùng cấu trúc Bootstrap dropdown */}
          <div
            className={`menu-container dropdown ${showMenu ? "show" : ""}`}
            style={{ position: "relative" }}
          >
            <button
              ref={toggleRef}
              className="menu-toggle btn btn-sm btn-light dropdown-toggle"
              onClick={handleMenuToggle}
              aria-expanded={showMenu}
              aria-haspopup="true"
            >
              <MoreHorizontal size={18} />
            </button>

            <div
              ref={menuRef}
              className={`dropdown-menu ${showMenu ? "show" : ""}`}
              style={{ right: 0, left: "auto" }}
            >
              {isOwner ? (
                <>
                  <button
                    className="dropdown-item d-flex align-items-center"
                    onClick={() => handleMenuAction("edit")}
                  >
                    <Edit3 size={16} /> <span className="ms-2">Chỉnh sửa</span>
                  </button>
                  <button
                    className="dropdown-item d-flex align-items-center text-danger"
                    onClick={() => handleMenuAction("delete")}
                  >
                    <Trash2 size={16} /> <span className="ms-2">Xóa</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="dropdown-item d-flex align-items-center"
                    onClick={() => handleMenuAction("report")}
                  >
                    <Flag size={16} /> <span className="ms-2">Báo cáo</span>
                  </button>
                  <button
                    className="dropdown-item d-flex align-items-center"
                    onClick={() => handleMenuAction("hide")}
                  >
                    <Eye size={16} /> <span className="ms-2">Ẩn bài viết</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Badge */}
      <div className="privacy-info mt-2 text-start">
        <span className={`privacy-badge ${post.privacy}`}>
          {post.privacy === "public" && "🌍 Công khai"}
          {post.privacy === "friends" && "👥 Bạn bè"}
          {post.privacy === "private" && "🔒 Riêng tư"}
        </span>
        {post.isAnonymous && (
          <span className="anonymous-badge ms-2">🕶️ Ẩn danh</span>
        )}
      </div>
    </div>
  );
};

export default PostHeader;
