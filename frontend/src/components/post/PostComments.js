// import React, { useState, useEffect, useRef } from "react";
// import {
//   Send,
//   Paperclip,
//   MoreHorizontal,
//   Reply,
//   ChevronDown,
//   ChevronUp,
//   Flag,
//   Download,
// } from "lucide-react";
// import { useAuth } from "../../contexts/AuthContext";
// import commentService from "../../services/commentService";
// import { useEmotionPicker } from "../../hooks/useEmotionPicker";
// import EmotionPicker from "./EmojiPicker";
// import {
//   EMOTION_ICONS,
//   EMOTION_COLORS,
//   EMOTIONS,
// } from "../../constants/emotions";
// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";
// import "dayjs/locale/vi";
// import "./PostComments.css";
// import { Modal, Button } from "react-bootstrap";

// dayjs.extend(relativeTime);
// dayjs.locale("vi");

// const PostComments = ({ postId, onCommentAdded }) => {
//   const { user } = useAuth();
//   const [comments, setComments] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState(null);
//   const [commentText, setCommentText] = useState("");
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [filePreview, setFilePreview] = useState(null);
//   const fileInputRef = useRef(null);
//   const commentEndRef = useRef(null);

//   // ---------- QUẢN LÝ PREVIEW CỦA CÁC REPLY ----------
//   const [replyFileStates, setReplyFileStates] = useState({}); // { commentId: { file, preview } }

//   // Load comments
//   const loadComments = async (pageNum = 1, append = false) => {
//     if (loading) return;
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await commentService.getCommentsByPost(postId, {
//         page: pageNum,
//         limit: 10,
//       });

//       console.log("response.comments : ", response.comments);
//       const newComments = response.comments || [];

//       if (append) {
//         setComments((prev) => [...prev, ...newComments]);
//       } else {
//         setComments(newComments);
//       }
//       setHasMore(newComments.length === 10);
//       setPage(pageNum);
//     } catch (err) {
//       setError(err.message || "Có lỗi xảy ra khi tải bình luận");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- BÌNH LUẬN CHÍNH ----------
//   const handleFileSelect = (event) => {
//     const file = event.target.files[0];
//     if (!file) return;
//     setSelectedFile(file);
//     if (file.type.startsWith("image/")) {
//       const reader = new FileReader();
//       reader.onload = (e) => setFilePreview(e.target.result);
//       reader.readAsDataURL(file);
//     } else {
//       setFilePreview(null);
//     }
//   };

//   const removeFile = () => {
//     setSelectedFile(null);
//     setFilePreview(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const submitComment = async (e) => {
//     e.preventDefault();
//     if (!commentText.trim() && !selectedFile) return;

//     setSubmitting(true);
//     setError(null);
//     try {
//       const response = await commentService.createComment({
//         postID: postId,
//         content: commentText.trim(),
//         file: selectedFile,
//       });

//       setComments((prev) => [response.comment, ...prev]);
//       setCommentText("");
//       setSelectedFile(null);
//       setFilePreview(null);
//       if (fileInputRef.current) fileInputRef.current.value = "";
//       if (onCommentAdded) onCommentAdded(response.comment);

//       setTimeout(() => {
//         commentEndRef.current?.scrollIntoView({ behavior: "smooth" });
//       }, 100);
//     } catch (err) {
//       setError(err.message || "Có lỗi xảy ra khi gửi bình luận");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const loadMore = () => {
//     if (!loading && hasMore) loadComments(page + 1, true);
//   };

//   useEffect(() => {
//     if (postId) loadComments(1);
//   }, [postId]);

//   // -----------------------------------------------------------------
//   return (
//     <div className="post-comments">
//       {/* ----- FORM BÌNH LUẬN CHÍNH ----- */}
//       <form className="comment-form" onSubmit={submitComment}>
//         <div className="comment-input-container">
//           <div className="user-avatar">
//             <img
//               src={user?.avatar || "/assets/images/default-avatar.png"}
//               alt="Your avatar"
//               className="w-100 h-100"
//             />
//           </div>

//           <div className="input-wrapper">
//             {/* Preview file bình luận chính */}
//             {filePreview && (
//               <div className="file-preview">
//                 <img
//                   src={filePreview}
//                   alt="Preview"
//                   className="file-preview-image"
//                 />
//                 <button
//                   type="button"
//                   onClick={removeFile}
//                   className="remove-file-btn"
//                 >
//                   ×
//                 </button>
//               </div>
//             )}
//             {selectedFile && !filePreview && (
//               <div className="file-preview">
//                 <div className="file-info">
//                   <Paperclip size={16} />
//                   <span className="file-name">{selectedFile.name}</span>
//                   <span className="file-size">
//                     ({(selectedFile.size / 1024).toFixed(1)} KB)
//                   </span>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={removeFile}
//                   className="remove-file-btn"
//                 >
//                   ×
//                 </button>
//               </div>
//             )}

//             <textarea
//               value={commentText}
//               onChange={(e) => setCommentText(e.target.value)}
//               placeholder="Viết bình luận của bạn..."
//               disabled={submitting}
//               className="comment-textarea"
//               rows="2"
//             />

//             <div className="input-actions">
//               <div className="action-buttons">
//                 <input
//                   type="file"
//                   ref={fileInputRef}
//                   onChange={handleFileSelect}
//                   accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
//                   className="file-input"
//                   id="comment-file-input"
//                 />
//                 <label
//                   htmlFor="comment-file-input"
//                   className="action-btn file-upload-btn"
//                 >
//                   <Paperclip size={18} />
//                   File / Hình ảnh
//                 </label>
//               </div>

//               <button
//                 type="submit"
//                 disabled={(!commentText.trim() && !selectedFile) || submitting}
//                 className="submit-btn"
//               >
//                 {submitting ? (
//                   <div className="loading-spinner"></div>
//                 ) : (
//                   <Send size={16} />
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       </form>

//       {/* Error */}
//       {error && (
//         <div className="error-message">
//           {error}
//           <button onClick={() => setError(null)} className="close-error">
//             ×
//           </button>
//         </div>
//       )}

//       {/* Danh sách bình luận */}
//       <div className="comments-list">
//         {comments.length === 0 && !loading ? (
//           <div className="empty-comments">
//             <div className="empty-icon">Chat</div>
//             <p>Chưa có bình luận nào</p>
//             <span>Hãy là người đầu tiên bình luận!</span>
//           </div>
//         ) : (
//           <>
//             {comments.map((comment, index) => (
//               <CommentItem
//                 key={comment._id}
//                 comment={comment}
//                 postId={postId}
//                 depth={0}
//                 isLast={index === comments.length - 1}
//                 onCommentUpdate={(updatedComment) => {
//                   setComments((prev) =>
//                     prev.map((c) =>
//                       c._id === updatedComment._id ? updatedComment : c
//                     )
//                   );
//                 }}
//                 onCommentDelete={(deletedCommentId) => {
//                   setComments((prev) =>
//                     prev.filter((c) => c._id !== deletedCommentId)
//                   );
//                 }}
//                 replyFileStates={replyFileStates}
//                 setReplyFileStates={setReplyFileStates}
//               />
//             ))}

//             {hasMore && (
//               <div className="load-more">
//                 <button
//                   onClick={loadMore}
//                   disabled={loading}
//                   className="load-more-btn"
//                 >
//                   {loading ? "Đang tải..." : "Tải thêm bình luận"}
//                 </button>
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       <div ref={commentEndRef} />
//     </div>
//   );
// };

// /* -------------------------------------------------------------
//    COMPONENT COMMENT ITEM (với reply)
// ------------------------------------------------------------- */
// const CommentItem = ({
//   comment,
//   postId,
//   depth = 0,
//   isLast,
//   onCommentUpdate,
//   onCommentDelete,
//   replyFileStates,
//   setReplyFileStates,
// }) => {
//   const { user } = useAuth();
//   const [replies, setReplies] = useState([]);
//   const [showReplies, setShowReplies] = useState(depth < 2);
//   const [loadingReplies, setLoadingReplies] = useState(false);
//   const [replying, setReplying] = useState(false);
//   const [replyText, setReplyText] = useState("");
//   const [submittingReply, setSubmittingReply] = useState(false);
//   const [hasMoreReplies, setHasMoreReplies] = useState(false);
//   const [repliesPage, setRepliesPage] = useState(1);
//   const [hasLoadedReplies, setHasLoadedReplies] = useState(false);
//   const replyFileInputRef = useRef(null);
//   const replyInputRef = useRef(null);
//   const [isMenuVisible, setMenuVisible] = useState(false);
//   const [isReporting, setIsReporting] = useState(false);
//   const [reportReason, setReportReason] = useState("");
//   const menuRef = useRef(null);

//   // Thêm các state cập nhật bl
//   const [editingComment, setEditingComment] = useState(null);
//   const [editText, setEditText] = useState("");
//   const [reportingComment, setReportingComment] = useState(null);

//   const isCommentOwner = user && comment.userID._id === user.id;

//   const [showImageModal, setShowImageModal] = useState(false);
//   const [selectedImage, setSelectedImage] = useState(null);

//   // Hàm mở modal xem ảnh to
//   const openImageModal = (imageUrl) => {
//     setSelectedImage(imageUrl);
//     setShowImageModal(true);
//   };

//   // ---------- QUẢN LÝ FILE CỦA REPLY ----------
//   const commentId = comment._id;
//   const replyState = replyFileStates[commentId] || {
//     file: null,
//     preview: null,
//   };
//   const selectedReplyFile = replyState.file;
//   const replyFilePreview = replyState.preview;

//   const handleReplyFileSelect = (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     if (file.type.startsWith("image/")) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setReplyFileStates((prev) => ({
//           ...prev,
//           [commentId]: { file, preview: e.target.result },
//         }));
//       };
//       reader.readAsDataURL(file);
//     } else {
//       setReplyFileStates((prev) => ({
//         ...prev,
//         [commentId]: { file, preview: null },
//       }));
//     }
//   };

//   const removeReplyFile = () => {
//     setReplyFileStates((prev) => {
//       const newState = { ...prev };
//       delete newState[commentId];
//       return newState;
//     });
//     if (replyFileInputRef.current) replyFileInputRef.current.value = "";
//   };

//   // ---------- LOAD REPLIES ----------
//   const loadReplies = async (pageNum = 1, append = false) => {
//     if (loadingReplies) return;
//     setLoadingReplies(true);
//     try {
//       const response = await commentService.getCommentReplies(comment._id, {
//         page: pageNum,
//         limit: 10,
//       });
//       const newReplies = response.comments || [];
//       const totalReplies = response.total || 0;

//       if (append) {
//         setReplies((prev) => [...prev, ...newReplies]);
//       } else {
//         setReplies(newReplies);
//         setHasLoadedReplies(true);
//       }

//       const currentTotal = append
//         ? replies.length + newReplies.length
//         : newReplies.length;
//       setHasMoreReplies(currentTotal < totalReplies);
//       setRepliesPage(pageNum);

//       if (!append && newReplies.length > 0) setShowReplies(true);
//     } catch (err) {
//       console.error("Error loading replies:", err);
//     } finally {
//       setLoadingReplies(false);
//     }
//   };

//   const toggleReplies = async () => {
//     if (!showReplies) {
//       if (!hasLoadedReplies && replies.length === 0)
//         await loadReplies(1, false);
//       setShowReplies(true);
//     } else {
//       setShowReplies(false);
//     }
//   };

//   const loadMoreReplies = () => {
//     if (!loadingReplies && hasMoreReplies) loadReplies(repliesPage + 1, true);
//   };

//   // Cập nhật
//   const handleEdit = (comment) => {
//     setEditingComment(comment._id);
//     setEditText(comment.content);
//   };

//   const cancelEdit = () => {
//     setEditingComment(null);
//     setEditText("");
//   };

//   const submitEdit = async (commentId) => {
//     if (!editText.trim()) return;

//     try {
//       const response = await commentService.updateComment(commentId, editText);
//       onCommentUpdate?.(response.comment);
//       setEditingComment(null);
//       setEditText("");
//     } catch (err) {
//       console.error("Error updating comment:", err);
//     }
//   };

//   // ---------- SUBMIT REPLY ----------
//   const submitReply = async () => {
//     if (!replyText.trim() && !selectedReplyFile) return;

//     setSubmittingReply(true);
//     try {
//       const response = await commentService.createComment({
//         postID: postId,
//         content: replyText.trim(),
//         parentCommentID: comment._id,
//         file: selectedReplyFile,
//       });

//       const newReply = response.comment;
//       setReplies((prev) => [newReply, ...prev]);
//       setReplyText("");
//       removeReplyFile();
//       setReplying(false);
//       setShowReplies(true);
//       setHasLoadedReplies(true);

//       const updatedComment = {
//         ...comment,
//         replyCount: (comment.replyCount || 0) + 1,
//       };
//       onCommentUpdate?.(updatedComment);
//     } catch (err) {
//       console.error("Error submitting reply:", err);
//     } finally {
//       setSubmittingReply(false);
//     }
//   };

//   const startReplying = () => {
//     setReplying(true);
//     setTimeout(() => replyInputRef.current?.focus(), 100);
//   };

//   const cancelReply = () => {
//     setReplyText("");
//     removeReplyFile();
//     setReplying(false);
//   };

//   // ---------- LIKE ----------
//   const {
//     showEmotionPicker,
//     hoverEmotion,
//     likeButtonRef,
//     pickerRef,
//     setHoverEmotion,
//     handleEmotionSelect: handleCommentEmotionSelect,
//     handleLikeMouseEnter,
//     handleLikeMouseLeave,
//     handlePickerMouseEnter,
//     handlePickerMouseLeave,
//   } = useEmotionPicker((emotion) => handleEmotionSelect(comment, emotion));

//   const toggleLikeComment = async (commentToLike, emotion = "like") => {
//     try {
//       let response;
//       if (commentToLike.isLiked) {
//         response = await commentService.unlikeComment(commentToLike._id);
//       } else {
//         response = await commentService.likeComment(commentToLike._id, emotion);
//       }

//       if (commentToLike._id === comment._id) {
//         onCommentUpdate?.(response.comment);
//       } else {
//         setReplies((prev) =>
//           prev.map((r) => (r._id === commentToLike._id ? response.comment : r))
//         );
//       }
//     } catch (err) {
//       console.error("Error toggling like:", err);
//     }
//   };

//   const handleEmotionSelect = async (commentToLike, emotion) => {
//     await toggleLikeComment(commentToLike, emotion);
//   };

//   // ---------- DELETE ----------
//   // Hàm xoá bình luận
//   const handleDelete = async (commentId) => {
//     if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) {
//       return;
//     }

//     try {
//       await commentService.deleteComment(commentId);
//       onCommentDelete?.(commentId);
//     } catch (err) {
//       console.error("Error deleting comment:", err);
//     }
//   };

//   // ---------- REPORT ----------
//   // Hàm báo cáo bình luận
//   const handleReport = async (commentId) => {
//     if (!reportReason.trim()) return;

//     try {
//       await commentService.reportComment(commentId, reportReason);
//       setIsReporting(false);
//       setReportReason("");
//       setReportingComment(null);
//       alert("Báo cáo của bạn đã được gửi thành công!");
//     } catch (err) {
//       console.error("Error reporting comment:", err);
//       alert(err.message || "Có lỗi xảy ra khi gửi báo cáo");
//     }
//   };

//   // Mở modal báo cáo
//   const openReportModal = (comment) => {
//     setReportingComment(comment);
//     setReportReason("");
//     setIsReporting(true);
//   };

//   // Click outside menu
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (menuRef.current && !menuRef.current.contains(event.target)) {
//         setMenuVisible(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Auto load replies (first 2 levels)
//   useEffect(() => {
//     if (depth < 2 && comment.replyCount > 0 && !hasLoadedReplies) {
//       loadReplies(1, false);
//     }
//   }, [comment._id, depth, comment.replyCount, hasLoadedReplies]);

//   // ---------- UI HELPERS ----------
//   const getLikeIcon = () => {
//     if (comment.isLiked && comment.userEmotion)
//       return EMOTION_ICONS[comment.userEmotion];
//     if (hoverEmotion)
//       return EMOTION_ICONS[hoverEmotion] || getDefaultLikeIcon();
//     return getDefaultLikeIcon();
//   };

//   const getDefaultLikeIcon = () => (
//     <svg
//       width="16"
//       height="16"
//       xmlns="http://www.w3.org/2000/svg"
//       viewBox="0 0 24 24"
//     >
//       <path
//         fill="none"
//         stroke="currentColor"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         strokeWidth="1.5"
//         d="M.836 10.252h1.39c2.098 0 4.112-.074 5.608-1.544a8 8 0 0 0 2.392-5.566c0-3.385 4.278-1.8 4.278 1.22v3.89a2 2 0 0 0 2 2h4.709c1.046 0 1.925.806 1.946 1.852c.065 3.336-.49 5.763-1.84 8.346c-.778 1.49-2.393 2.32-4.073 2.283c-11.675-.261-10.165-2.231-16.41-2.231"
//       />
//     </svg>
//   );

//   const getLikeButtonStyle = () => {
//     if (hoverEmotion) return { color: EMOTION_COLORS[hoverEmotion] };
//     if (comment.isLiked && comment.userEmotion)
//       return { color: EMOTION_COLORS[comment.userEmotion] };
//     return {};
//   };

//   const getLikeButtonText = () => {
//     if (comment.isLiked && comment.userEmotion) {
//       const emotion = EMOTIONS.find((e) => e.key === comment.userEmotion);
//       return emotion?.label || "Thích";
//     }
//     return "Thích";
//   };

//   const getRepliesButtonText = () => {
//     if (loadingReplies) return "Đang tải...";
//     if (showReplies) return `Ẩn ${comment.replyCount} phản hồi`;
//     return `Xem ${comment.replyCount} phản hồi`;
//   };

//   // -----------------------------------------------------------------
//   return (
//     <div
//       className={`comment-item ${depth > 0 ? "comment-reply" : ""}`}
//       data-depth={depth}
//     >
//       <div className="comment-avatar">
//         <img
//           src={
//             comment.userID?.profile?.avatar ||
//             "/assets/images/default-avatar.png"
//           }
//           alt="Avatar"
//         />
//       </div>

//       <div className="comment-content">
//         <div className="comment-body">
//           <div className="comment-header">
//             <div className="comment-user">
//               <span className="user-name">
//                 {comment.userID?.fullName || "Người dùng"}
//               </span>
//               <span className="comment-time">
//                 {dayjs(comment.createdAt).fromNow()}
//                 {comment.isEdited && " (đã chỉnh sửa)"}
//               </span>
//             </div>

//             <div className="comment-actions">
//               <div className="comment-more-actions">
//                 <div className="menu-container" ref={menuRef}>
//                   <button
//                     className="action-btn"
//                     onClick={() => setMenuVisible(!isMenuVisible)}
//                   >
//                     <MoreHorizontal size={16} />
//                   </button>

//                   {isMenuVisible && (
//                     <div className="custom-dropdown-menu">
//                       {isCommentOwner ? (
//                         <>
//                           <button
//                             onClick={() => handleEdit(comment)}
//                             className="menu-item"
//                           >
//                             Chỉnh sửa
//                           </button>
//                           <button
//                             onClick={() => handleDelete(comment._id)}
//                             className="menu-item delete"
//                           >
//                             Xóa
//                           </button>
//                         </>
//                       ) : (
//                         <button
//                           onClick={() => openReportModal(comment)}
//                           className="menu-item report"
//                         >
//                           <Flag size={14} />
//                           Báo cáo bình luận
//                         </button>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="comment-text">{comment.content}</div>

//           {/* {comment.file && (
//             <div className="comment-file">
//               {comment.file.type === "image" ? (
//                 <div className="file-image-container">
//                   <img
//                     src={comment.file.fileUrl}
//                     alt="Attachment"
//                     className="file-image"
//                   />
//                   <a
//                     href={comment.file.fileUrl}
//                     download
//                     className="download-link"
//                     title="Tải xuống"
//                   >
//                     <Download size={16} />
//                   </a>
//                 </div>
//               ) : (
//                 <div className="file-document">
//                   <Paperclip size={16} />
//                   <span className="file-name">{comment.file.fileName}</span>
//                   <span className="file-size">
//                     ({(comment.file.fileSize / 1024).toFixed(1)} KB)
//                   </span>
//                   <a
//                     href={comment.file.fileUrl}
//                     download
//                     className="download-link"
//                   >
//                     <Download size={16} />
//                   </a>
//                 </div>
//               )}
//             </div>
//           )} */}

//           {comment.file && (
//             <div className="comment-file">
//               {comment.file.type === "image" ? (
//                 <div className="file-image-container">
//                   <img
//                     src={comment.file.fileUrl}
//                     alt="Attachment"
//                     className="file-image"
//                     onClick={() => openImageModal(comment.file.fileUrl)}
//                     style={{ cursor: "pointer" }}
//                   />
//                   <div className="file-actions">
//                     <a
//                       href={comment.file.fileUrl}
//                       download
//                       className="download-link"
//                       title="Tải xuống"
//                       onClick={(e) => e.stopPropagation()}
//                     >
//                       <Download size={16} />
//                     </a>
//                   </div>
//                 </div>
//               ) : comment.file.type === "video" ? (
//                 <div className="file-video-container">
//                   <video
//                     controls
//                     className="file-video"
//                     poster={comment.file.thumbnailUrl} // nếu có thumbnail
//                   >
//                     <source
//                       src={comment.file.fileUrl}
//                       type={comment.file.mimeType}
//                     />
//                     Trình duyệt của bạn không hỗ trợ video.
//                   </video>
//                   <a
//                     href={comment.file.fileUrl}
//                     download
//                     className="download-link"
//                     title="Tải xuống"
//                   >
//                     <Download size={16} />
//                   </a>
//                 </div>
//               ) : (
//                 <div className="file-document">
//                   <Paperclip size={16} />
//                   <span className="file-name">{comment.file.fileName}</span>
//                   <span className="file-size">
//                     ({(comment.file.fileSize / 1024).toFixed(1)} KB)
//                   </span>
//                   <a
//                     href={comment.file.fileUrl}
//                     download
//                     className="download-link"
//                   >
//                     <Download size={16} />
//                   </a>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         <Modal
//           show={showImageModal}
//           onHide={() => setShowImageModal(false)}
//           size="lg"
//           centered
//           className="image-modal"
//         >
//           <Modal.Header closeButton>
//             <Modal.Title>Xem ảnh</Modal.Title>
//           </Modal.Header>
//           <Modal.Body className="text-center">
//             {selectedImage && (
//               <img
//                 src={selectedImage}
//                 alt="Xem to"
//                 className="img-fluid"
//                 style={{ maxHeight: "70vh", objectFit: "contain" }}
//               />
//             )}
//           </Modal.Body>
//           <Modal.Footer>
//             <Button variant="primary" href={selectedImage || "#"} download>
//               <Download size={16} /> Tải xuống
//             </Button>
//             <Button
//               variant="secondary"
//               onClick={() => setShowImageModal(false)}
//             >
//               Đóng
//             </Button>
//           </Modal.Footer>
//         </Modal>

//         <div className="comment-footer-actions">
//           <div className="action-group">
//             <button
//               ref={likeButtonRef}
//               className={`action-btn like ${comment.isLiked ? "liked" : ""}`}
//               onClick={() => toggleLikeComment(comment)}
//               onMouseEnter={handleLikeMouseEnter}
//               onMouseLeave={handleLikeMouseLeave}
//               style={getLikeButtonStyle()}
//             >
//               <span className="like-icon">{getLikeIcon()}</span>
//               <span className="like-text">{getLikeButtonText()}</span>
//               {comment.likeCount > 0 && (
//                 <span className="like-count">{comment.likeCount}</span>
//               )}
//             </button>

//             <EmotionPicker
//               isOpen={showEmotionPicker}
//               selectedEmotion={comment.isLiked ? comment.userEmotion : null}
//               hoverEmotion={hoverEmotion}
//               onEmotionSelect={handleCommentEmotionSelect}
//               onHoverEmotion={setHoverEmotion}
//               pickerRef={pickerRef}
//               onMouseEnter={handlePickerMouseEnter}
//               onMouseLeave={handlePickerMouseLeave}
//               position={isLast ? "left" : "left"}
//             />
//           </div>

//           <button
//             className="action-btn reply-btn"
//             onClick={startReplying}
//             title="Trả lời"
//           >
//             <Reply size={14} /> Trả lời
//           </button>
//         </div>

//         {/* ----------------- REPORT MODAL ----------------- */}
//         <Modal
//           show={isReporting}
//           onHide={() => setIsReporting(false)}
//           size="sm"
//           centered
//           backdrop="static"
//           keyboard={false}
//           scrollable
//           animation
//         >
//           <Modal.Header
//             closeButton
//             closeVariant="white"
//             className="bg-primary text-white"
//           >
//             <Modal.Title>Modal đầy đủ thuộc tính</Modal.Title>
//           </Modal.Header>

//           <Modal.Body>
//             <h4>Báo cáo bình luận</h4>
//             <textarea
//               value={reportReason}
//               onChange={(e) => setReportReason(e.target.value)}
//               placeholder="Vui lòng mô tả lý do báo cáo..."
//               rows="3"
//               className="report-textarea"
//             />
//             <div className="report-actions">
//               <button
//                 onClick={() => setIsReporting(false)}
//                 className="cancel-btn"
//               >
//                 Hủy
//               </button>
//               <button
//                 onClick={handleReport}
//                 disabled={!reportReason.trim()}
//                 className="submit-report-btn"
//               >
//                 Gửi báo cáo
//               </button>
//             </div>
//           </Modal.Body>

//           <Modal.Footer>
//             <Button variant="secondary" onClick={() => setIsReporting(false)}>
//               Đóng
//             </Button>
//             <Button
//               variant="success"
//               onClick={() => {
//                 alert("Đã lưu dữ liệu!");
//                 setIsReporting(false);
//               }}
//             >
//               Lưu
//             </Button>
//           </Modal.Footer>
//         </Modal>

//         {/* ----------------- REPLY INPUT ----------------- */}
//         {replying && (
//           <div className="reply-input-container">
//             {/* Preview file reply */}
//             {replyFilePreview && (
//               <div className="file-preview small">
//                 <img
//                   src={replyFilePreview}
//                   alt="Preview"
//                   className="file-preview-image"
//                 />
//                 <button
//                   type="button"
//                   onClick={removeReplyFile}
//                   className="remove-file-btn"
//                 >
//                   ×
//                 </button>
//               </div>
//             )}
//             {selectedReplyFile && !replyFilePreview && (
//               <div className="file-preview small">
//                 <div className="file-info">
//                   <Paperclip size={16} />
//                   <span className="file-name">{selectedReplyFile.name}</span>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={removeReplyFile}
//                   className="remove-file-btn"
//                 >
//                   ×
//                 </button>
//               </div>
//             )}

//             <div className="user-avatar small">
//               <img
//                 src={user?.avatar || "/assets/images/default-avatar.png"}
//                 alt="Your avatar"
//                 className="w-100 h-100"
//               />
//             </div>

//             <div className="reply-input-wrapper">
//               <input
//                 ref={replyInputRef}
//                 type="text"
//                 value={replyText}
//                 onChange={(e) => setReplyText(e.target.value)}
//                 placeholder={`Trả lời ${
//                   comment.userID?.fullName || "người dùng"
//                 }...`}
//                 disabled={submittingReply}
//                 className="reply-input"
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter" && !e.shiftKey) {
//                     e.preventDefault();
//                     submitReply();
//                   }
//                   if (e.key === "Escape") cancelReply();
//                 }}
//               />

//               <div className="reply-actions">
//                 <div className="reply-file-actions">
//                   <input
//                     type="file"
//                     ref={replyFileInputRef}
//                     onChange={handleReplyFileSelect}
//                     accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
//                     className="file-input"
//                     id={`reply-file-${comment._id}`}
//                   />
//                   <label
//                     htmlFor={`reply-file-${comment._id}`}
//                     className="file-action-btn"
//                   >
//                     <Paperclip size={14} />
//                   </label>
//                 </div>

//                 <div className="reply-buttons">
//                   <button
//                     type="button"
//                     onClick={cancelReply}
//                     className="cancel-reply-btn"
//                   >
//                     Hủy
//                   </button>
//                   <button
//                     onClick={submitReply}
//                     disabled={
//                       (!replyText.trim() && !selectedReplyFile) ||
//                       submittingReply
//                     }
//                     className="submit-reply-btn"
//                   >
//                     {submittingReply ? (
//                       <div className="loading-spinner small"></div>
//                     ) : (
//                       <Send size={14} />
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ----------------- REPLIES SECTION ----------------- */}
//         {comment.replyCount > 0 && (
//           <div className="replies-section">
//             <button
//               className="view-replies-btn"
//               onClick={toggleReplies}
//               disabled={loadingReplies && !showReplies}
//             >
//               {showReplies ? (
//                 <ChevronUp size={14} />
//               ) : (
//                 <ChevronDown size={14} />
//               )}
//               {getRepliesButtonText()}
//             </button>

//             {showReplies && (
//               <div className="replies-list">
//                 {replies.length > 0 ? (
//                   <>
//                     {replies.map((reply, idx) => (
//                       <CommentItem
//                         key={reply._id}
//                         comment={reply}
//                         postId={postId}
//                         depth={depth + 1}
//                         isLast={idx === replies.length - 1}
//                         onCommentUpdate={(updatedReply) => {
//                           setReplies((prev) =>
//                             prev.map((r) =>
//                               r._id === updatedReply._id ? updatedReply : r
//                             )
//                           );
//                         }}
//                         onCommentDelete={(deletedReplyId) => {
//                           setReplies((prev) =>
//                             prev.filter((r) => r._id !== deletedReplyId)
//                           );
//                           const updatedComment = {
//                             ...comment,
//                             replyCount: Math.max(0, comment.replyCount - 1),
//                           };
//                           onCommentUpdate?.(updatedComment);
//                         }}
//                         replyFileStates={replyFileStates}
//                         setReplyFileStates={setReplyFileStates}
//                       />
//                     ))}

//                     {hasMoreReplies && (
//                       <div className="load-more-replies">
//                         <button
//                           onClick={loadMoreReplies}
//                           disabled={loadingReplies}
//                           className="load-more-replies-btn"
//                         >
//                           {loadingReplies ? "Đang tải..." : "Tải thêm phản hồi"}
//                         </button>
//                       </div>
//                     )}
//                   </>
//                 ) : (
//                   loadingReplies && (
//                     <div className="replies-loading">
//                       <div className="loading-spinner small"></div>
//                       <span>Đang tải phản hồi...</span>
//                     </div>
//                   )
//                 )}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PostComments;

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Paperclip,
  MoreHorizontal,
  Reply,
  ChevronDown,
  ChevronUp,
  Flag,
  Download,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import commentService from "../../services/commentService";
import { useEmotionPicker } from "../../hooks/useEmotionPicker";
import EmotionPicker from "./EmojiPicker";
import { Link, useNavigate } from "react-router-dom";

import {
  EMOTION_ICONS,
  EMOTION_COLORS,
  EMOTIONS,
} from "../../constants/emotions";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import "./PostComments.css";
import { Modal, Button } from "react-bootstrap";
import TiptapEditor from "../journal/TiptapEditor";
import NotificationService from "../../services/notificationService";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const PostComments = ({ postId, onCommentAdded }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);
  const commentEndRef = useRef(null);

  const navigate = useNavigate();

  // ---------- QUẢN LÝ PREVIEW CỦA CÁC REPLY ----------
  const [replyFileStates, setReplyFileStates] = useState({}); // { commentId: { file, preview } }

  // Load comments
  const loadComments = async (pageNum = 1, append = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await commentService.getCommentsByPost(postId, {
        page: pageNum,
        limit: 10,
      });

      console.log("response.comments : ", response.comments);
      const newComments = response.comments || [];

      if (append) {
        setComments((prev) => [...prev, ...newComments]);
      } else {
        setComments(newComments);
      }
      setHasMore(newComments.length === 10);
      setPage(pageNum);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi tải bình luận");
    } finally {
      setLoading(false);
    }
  };

  // ---------- BÌNH LUẬN CHÍNH ----------
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() && !selectedFile) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await commentService.createComment({
        postID: postId,
        content: commentText.trim(),
        file: selectedFile,
      });

      setComments((prev) => [response.comment, ...prev]);
      setCommentText("");
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (onCommentAdded) onCommentAdded(response.comment);

      setTimeout(() => {
        commentEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi gửi bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) loadComments(page + 1, true);
  };

  useEffect(() => {
    if (postId) loadComments(1);
  }, [postId]);

  // -----------------------------------------------------------------
  return (
    <div className="post-comments">
      {/* ----- FORM BÌNH LUẬN CHÍNH ----- */}
      <form className="comment-form" onSubmit={submitComment}>
        <div className="comment-input-container">
          <div className="user-avatar">
            <img
              src={user?.profile?.avatar || "/assets/images/default-avatar.png"}
              alt="Your avatar"
              className="w-100 h-100"
            />
          </div>

          <div className="input-wrapper">
            {/* Preview file bình luận chính */}
            {filePreview && (
              <div className="file-preview">
                <img
                  src={filePreview}
                  alt="Preview"
                  className="file-preview-image"
                />
                <button
                  type="button"
                  onClick={removeFile}
                  className="remove-file-btn"
                >
                  ×
                </button>
              </div>
            )}
            {selectedFile && !filePreview && (
              <div className="file-preview">
                <div className="file-info">
                  <Paperclip size={16} />
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="remove-file-btn"
                >
                  ×
                </button>
              </div>
            )}

            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Viết bình luận của bạn..."
              disabled={submitting}
              className="comment-textarea"
              rows="2"
            />

            <div className="input-actions">
              <div className="action-buttons">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  className="file-input"
                  id="comment-file-input"
                />
                <label
                  htmlFor="comment-file-input"
                  className="action-btn file-upload-btn"
                >
                  <Paperclip size={18} />
                  File / Hình ảnh
                </label>
              </div>

              <button
                type="submit"
                disabled={(!commentText.trim() && !selectedFile) || submitting}
                className="submit-btn"
              >
                {submitting ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-error">
            ×
          </button>
        </div>
      )}

      {/* Danh sách bình luận */}
      <div className="comments-list">
        {comments.length === 0 && !loading ? (
          <div className="empty-comments">
            <div className="empty-icon">Chat</div>
            <p>Chưa có bình luận nào</p>
            <span>Hãy là người đầu tiên bình luận!</span>
          </div>
        ) : (
          <>
            {comments.map((comment, index) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                postId={postId}
                depth={0}
                isLast={index === comments.length - 1}
                onCommentUpdate={(updatedComment) => {
                  setComments((prev) =>
                    prev.map((c) =>
                      c._id === updatedComment._id ? updatedComment : c
                    )
                  );
                }}
                onCommentDelete={(deletedCommentId) => {
                  setComments((prev) =>
                    prev.filter((c) => c._id !== deletedCommentId)
                  );
                }}
                replyFileStates={replyFileStates}
                setReplyFileStates={setReplyFileStates}
              />
            ))}

            {hasMore && (
              <div className="load-more">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="load-more-btn"
                >
                  {loading ? "Đang tải..." : "Tải thêm bình luận"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div ref={commentEndRef} />
    </div>
  );
};

/* -------------------------------------------------------------
   COMPONENT COMMENT ITEM (với reply)
------------------------------------------------------------- */
const CommentItem = ({
  comment,
  postId,
  depth = 0,
  isLast,
  onCommentUpdate,
  onCommentDelete,
  replyFileStates,
  setReplyFileStates,
}) => {
  const { user } = useAuth();
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(depth < 2);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [hasMoreReplies, setHasMoreReplies] = useState(false);
  const [repliesPage, setRepliesPage] = useState(1);
  const [hasLoadedReplies, setHasLoadedReplies] = useState(false);
  const replyFileInputRef = useRef(null);
  const replyInputRef = useRef(null);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportNote, setReportNote] = useState("");
  const menuRef = useRef(null);

  const navigate = useNavigate();

  // Thêm các state cập nhật bl
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [reportingComment, setReportingComment] = useState(null);

  const isCommentOwner = user && comment.userID._id === user.id;

  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Hàm mở modal xem ảnh to
  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  // ---------- QUẢN LÝ FILE CỦA REPLY ----------
  const commentId = comment._id;
  const replyState = replyFileStates[commentId] || {
    file: null,
    preview: null,
  };
  const selectedReplyFile = replyState.file;
  const replyFilePreview = replyState.preview;

  const handleReplyFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReplyFileStates((prev) => ({
          ...prev,
          [commentId]: { file, preview: e.target.result },
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setReplyFileStates((prev) => ({
        ...prev,
        [commentId]: { file, preview: null },
      }));
    }
  };

  const removeReplyFile = () => {
    setReplyFileStates((prev) => {
      const newState = { ...prev };
      delete newState[commentId];
      return newState;
    });
    if (replyFileInputRef.current) replyFileInputRef.current.value = "";
  };

  // ---------- LOAD REPLIES ----------
  const loadReplies = async (pageNum = 1, append = false) => {
    if (loadingReplies) return;
    setLoadingReplies(true);
    try {
      const response = await commentService.getCommentReplies(comment._id, {
        page: pageNum,
        limit: 10,
      });
      const newReplies = response.comments || [];
      const totalReplies = response.total || 0;

      if (append) {
        setReplies((prev) => [...prev, ...newReplies]);
      } else {
        setReplies(newReplies);
        setHasLoadedReplies(true);
      }

      const currentTotal = append
        ? replies.length + newReplies.length
        : newReplies.length;
      setHasMoreReplies(currentTotal < totalReplies);
      setRepliesPage(pageNum);

      if (!append && newReplies.length > 0) setShowReplies(true);
    } catch (err) {
      console.error("Error loading replies:", err);
    } finally {
      setLoadingReplies(false);
    }
  };

  const toggleReplies = async () => {
    if (!showReplies) {
      if (!hasLoadedReplies && replies.length === 0)
        await loadReplies(1, false);
      setShowReplies(true);
    } else {
      setShowReplies(false);
    }
  };

  const loadMoreReplies = () => {
    if (!loadingReplies && hasMoreReplies) loadReplies(repliesPage + 1, true);
  };

  // Cập nhật
  const handleEdit = (comment) => {
    setEditingComment(comment._id);
    setEditText(comment.content);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditText("");
  };

  const submitEdit = async (commentId) => {
    if (!editText.trim()) return;

    try {
      const response = await commentService.updateComment(commentId, editText);
      onCommentUpdate?.(response.comment);
      setEditingComment(null);
      setEditText("");
    } catch (err) {
      console.error("Error updating comment:", err);
    }
  };

  // ---------- SUBMIT REPLY ----------
  const submitReply = async () => {
    if (!replyText.trim() && !selectedReplyFile) return;

    setSubmittingReply(true);
    try {
      const response = await commentService.createComment({
        postID: postId,
        content: replyText.trim(),
        parentCommentID: comment._id,
        file: selectedReplyFile,
      });

      const newReply = response.comment;
      setReplies((prev) => [newReply, ...prev]);
      setReplyText("");
      removeReplyFile();
      setReplying(false);
      setShowReplies(true);
      setHasLoadedReplies(true);

      const updatedComment = {
        ...comment,
        replyCount: (comment.replyCount || 0) + 1,
      };
      onCommentUpdate?.(updatedComment);
    } catch (err) {
      console.error("Error submitting reply:", err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const startReplying = () => {
    setReplying(true);
    setTimeout(() => replyInputRef.current?.focus(), 100);
  };

  const cancelReply = () => {
    setReplyText("");
    removeReplyFile();
    setReplying(false);
  };

  // ---------- LIKE ----------
  const {
    showEmotionPicker,
    hoverEmotion,
    likeButtonRef,
    pickerRef,
    setHoverEmotion,
    handleEmotionSelect: handleCommentEmotionSelect,
    handleLikeMouseEnter,
    handleLikeMouseLeave,
    handlePickerMouseEnter,
    handlePickerMouseLeave,
  } = useEmotionPicker((emotion) => handleEmotionSelect(comment, emotion));

  const toggleLikeComment = async (commentToLike, emotion = "like") => {
    try {
      let response;
      if (commentToLike.isLiked) {
        response = await commentService.unlikeComment(commentToLike._id);
      } else {
        response = await commentService.likeComment(commentToLike._id, emotion);
      }

      if (commentToLike._id === comment._id) {
        onCommentUpdate?.(response.comment);
      } else {
        setReplies((prev) =>
          prev.map((r) => (r._id === commentToLike._id ? response.comment : r))
        );
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleEmotionSelect = async (commentToLike, emotion) => {
    await toggleLikeComment(commentToLike, emotion);
  };

  // ---------- DELETE ----------
  // Hàm xoá bình luận
  const handleDelete = async (commentId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) {
      return;
    }

    try {
      const res = await commentService.deleteComment(commentId);
      onCommentDelete?.(commentId);
      if (res.success) {
        alert("Thành công");
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Thất Bại");
    }
  };

  // ---------- REPORT ----------
  // Hàm báo cáo bình luận
  const handleReport = async (commentId) => {
    if (!reportReason.trim()) return;

    const reportData = {
      reason: reportReason.trim(),
      note: reportNote.trim(),
    };

    console.log("commentId: ", commentId);
    console.log("reportData: ", reportData);
    try {
      const res = await commentService.reportComment(commentId, reportData);
      setIsReporting(false);
      setReportReason("");
      setReportNote("");
      setReportingComment(null);
      // alert("Báo cáo của bạn đã được gửi thành công!");

      await NotificationService.success({
        title: "Thành Công",
        text: res?.message || "Báo Cáo Bình Luận Thành Công",
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error reporting comment:", err);
      await NotificationService.error({
        title: "Thất Bại",
        text: err.toString() || "Báo Cáo Bình Luận Thành Công",
        timer: 3000,
        showConfirmButton: false,
      });
    }
  };

  // Mở modal báo cáo
  const openReportModal = (comment) => {
    setReportingComment(comment);
    setReportReason("");
    setReportNote("");
    setIsReporting(true);
  };

  // Click outside menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto load replies (first 2 levels)
  useEffect(() => {
    if (depth < 2 && comment.replyCount > 0 && !hasLoadedReplies) {
      loadReplies(1, false);
    }
  }, [comment._id, depth, comment.replyCount, hasLoadedReplies]);

  // ---------- UI HELPERS ----------
  const getLikeIcon = () => {
    if (comment.isLiked && comment.userEmotion)
      return EMOTION_ICONS[comment.userEmotion];
    if (hoverEmotion)
      return EMOTION_ICONS[hoverEmotion] || getDefaultLikeIcon();
    return getDefaultLikeIcon();
  };

  const getDefaultLikeIcon = () => (
    <svg
      width="16"
      height="16"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M.836 10.252h1.39c2.098 0 4.112-.074 5.608-1.544a8 8 0 0 0 2.392-5.566c0-3.385 4.278-1.8 4.278 1.22v3.89a2 2 0 0 0 2 2h4.709c1.046 0 1.925.806 1.946 1.852c.065 3.336-.49 5.763-1.84 8.346c-.778 1.49-2.393 2.32-4.073 2.283c-11.675-.261-10.165-2.231-16.41-2.231"
      />
    </svg>
  );

  const getLikeButtonStyle = () => {
    if (hoverEmotion) return { color: EMOTION_COLORS[hoverEmotion] };
    if (comment.isLiked && comment.userEmotion)
      return { color: EMOTION_COLORS[comment.userEmotion] };
    return {};
  };

  const getLikeButtonText = () => {
    if (comment.isLiked && comment.userEmotion) {
      const emotion = EMOTIONS.find((e) => e.key === comment.userEmotion);
      return emotion?.label || "Thích";
    }
    return "Thích";
  };

  const getRepliesButtonText = () => {
    if (loadingReplies) return "Đang tải...";
    if (showReplies) return `Ẩn ${comment.replyCount} phản hồi`;
    return `Xem ${comment.replyCount} phản hồi`;
  };

  // -----------------------------------------------------------------
  return (
    <div
      className={`comment-item ${depth > 0 ? "comment-reply" : ""}`}
      data-depth={depth}
    >
      <div className="comment-avatar">
        <img
          src={
            comment.userID?.profile?.avatar ||
            "/assets/images/default-avatar.png"
          }
          onClick={() => navigate("/profile/" + comment.userID?._id)}
          alt="Avatar"
          style={{ cursor: "pointer" }}
        />
      </div>

      <div className="comment-content ">
        <div className="comment-body ms-3">
          <div className="comment-header ms-1">
            <div className="comment-user">
              <span className="user-name">
                {comment.userID?.fullName || "Người dùng"}
              </span>
              <span className="comment-time">
                {dayjs(comment.createdAt).fromNow()}
                {comment.isEdited && " (đã chỉnh sửa)"}
              </span>
            </div>

            <div className="comment-actions">
              <div className="comment-more-actions">
                <div className="menu-container" ref={menuRef}>
                  <button
                    className="action-btn"
                    onClick={() => setMenuVisible(!isMenuVisible)}
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {isMenuVisible && (
                    <div className="custom-dropdown-menu">
                      {isCommentOwner ? (
                        <>
                          <button
                            onClick={() => handleEdit(comment)}
                            className="menu-item"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={() => handleDelete(comment._id)}
                            className="menu-item delete"
                          >
                            Xóa
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openReportModal(comment)}
                          className="menu-item report"
                        >
                          <Flag size={14} />
                          Báo cáo bình luận
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="comment-text ms-1">
            {editingComment === comment._id ? (
              <div className="edit-comment-container">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="edit-comment-textarea"
                  rows="3"
                  placeholder="Nhập nội dung bình luận..."
                />
                <div className="edit-actions">
                  <button onClick={cancelEdit} className="cancel-edit-btn">
                    Hủy
                  </button>
                  <button
                    onClick={() => submitEdit(comment._id)}
                    disabled={!editText.trim()}
                    className="submit-edit-btn"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            ) : (
              comment.content
            )}
          </div>

          {/* {comment.file && (
            <div className="comment-file">
              {comment.file.type === "image" ? (
                <div className="file-image-container">
                  <img
                    src={comment.file.fileUrl}
                    alt="Attachment"
                    className="file-image"
                  />
                  <a
                    href={comment.file.fileUrl}
                    download
                    className="download-link"
                    title="Tải xuống"
                  >
                    <Download size={16} />
                  </a>
                </div>
              ) : (
                <div className="file-document">
                  <Paperclip size={16} />
                  <span className="file-name">{comment.file.fileName}</span>
                  <span className="file-size">
                    ({(comment.file.fileSize / 1024).toFixed(1)} KB)
                  </span>
                  <a
                    href={comment.file.fileUrl}
                    download
                    className="download-link"
                  >
                    <Download size={16} />
                  </a>
                </div>
              )}
            </div>
          )} */}

          {comment.file && (
            <div className="comment-file">
              {comment.file.type === "image" ? (
                <div className="file-image-container">
                  <img
                    src={comment.file.fileUrl}
                    alt="Attachment"
                    className="file-image"
                    onClick={() => openImageModal(comment.file.fileUrl)}
                    style={{ cursor: "pointer" }}
                  />
                  <div className="file-actions">
                    <a
                      href={comment.file.fileUrl}
                      download
                      className="download-link"
                      title="Tải xuống"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download size={16} />
                    </a>
                  </div>
                </div>
              ) : comment.file.type === "video" ? (
                <div className="file-video-container">
                  <video
                    controls
                    className="file-video"
                    poster={comment.file.thumbnailUrl} // nếu có thumbnail
                  >
                    <source
                      src={comment.file.fileUrl}
                      type={comment.file.mimeType}
                    />
                    Trình duyệt của bạn không hỗ trợ video.
                  </video>
                  <a
                    href={comment.file.fileUrl}
                    download
                    className="download-link"
                    title="Tải xuống"
                  >
                    <Download size={16} />
                  </a>
                </div>
              ) : (
                <div className="file-document">
                  <Paperclip size={16} />
                  <span className="file-name">{comment.file.fileName}</span>
                  <span className="file-size">
                    ({(comment.file.fileSize / 1024).toFixed(1)} KB)
                  </span>
                  <a
                    href={comment.file.fileUrl}
                    download
                    className="download-link"
                  >
                    <Download size={16} />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <Modal
          show={showImageModal}
          onHide={() => setShowImageModal(false)}
          size="xl"
          centered
          className="image-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>Xem ảnh</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Xem to"
                className="img-fluid"
                style={{ maxHeight: "70vh", objectFit: "contain" }}
              />
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" href={selectedImage || "#"} download>
              <Download size={16} /> Tải xuống
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowImageModal(false)}
            >
              Đóng
            </Button>
          </Modal.Footer>
        </Modal>

        <div className="comment-footer-actions">
          <div className="action-group">
            <button
              ref={likeButtonRef}
              className={`action-btn like ${comment.isLiked ? "liked" : ""}`}
              onClick={() => toggleLikeComment(comment)}
              onMouseEnter={handleLikeMouseEnter}
              onMouseLeave={handleLikeMouseLeave}
              style={getLikeButtonStyle()}
            >
              <span className="like-icon">{getLikeIcon()}</span>
              <span className="like-text">{getLikeButtonText()}</span>
              {comment.likeCount > 0 && (
                <span className="like-count">{comment.likeCount}</span>
              )}
            </button>

            <EmotionPicker
              isOpen={showEmotionPicker}
              selectedEmotion={comment.isLiked ? comment.userEmotion : null}
              hoverEmotion={hoverEmotion}
              onEmotionSelect={handleCommentEmotionSelect}
              onHoverEmotion={setHoverEmotion}
              pickerRef={pickerRef}
              onMouseEnter={handlePickerMouseEnter}
              onMouseLeave={handlePickerMouseLeave}
              position={isLast ? "left" : "left"}
            />
          </div>

          <button
            className="action-btn reply-btn"
            onClick={startReplying}
            title="Trả lời"
          >
            <Reply size={14} /> Trả lời
          </button>
        </div>

        {/* ----------------- REPORT MODAL ----------------- */}
        <Modal
          show={isReporting}
          onHide={() => {
            setIsReporting(false);
            setReportingComment(null);
          }}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Báo cáo bình luận</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {reportingComment && (
              <>
                <div className="reported-comment-preview">
                  <div className="comment-preview-header">
                    <img
                      src={
                        reportingComment.userID?.profile?.avatar ||
                        "/assets/images/default-avatar.png"
                      }
                      alt="Avatar"
                      className="comment-preview-avatar"
                    />
                    <div className="comment-preview-info">
                      <span className="user-name">
                        {reportingComment.userID?.fullName || "Người dùng"}
                      </span>
                      <span className="comment-time">
                        {dayjs(reportingComment.createdAt).fromNow()}
                      </span>
                    </div>
                  </div>
                  <div className="comment-preview-content">
                    {reportingComment.content}
                  </div>
                </div>

                <div className="report-reason-section">
                  <label className="report-reason-label">
                    Tại sao bạn lại Báo cáo bình luận này?{" "}
                  </label>
                  <div className="mb-3">
                    <label className="form-label">Lý do báo cáo</label>
                    <select
                      className="form-select"
                      name="reason"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      required
                    >
                      <option value="">-- Chọn lý do --</option>
                      <option value="Vấn đề liên quan đến người dưới 18 tuổi">
                        Vấn đề liên quan đến người dưới 18 tuổi
                      </option>
                      <option value="Bắt nạt, quấy rối hoặc lăng mạ/lạm dụng/ngược đãi">
                        Bắt nạt, quấy rối hoặc lăng mạ/lạm dụng/ngược đãi
                      </option>
                      <option value="Tự tử hoặc tự hại bản thân">
                        Tự tử hoặc tự hại bản thân
                      </option>
                      <option value="Nội dung mang tính bạo lực, thù ghét hoặc gây phiền toái">
                        Nội dung mang tính bạo lực, thù ghét hoặc gây phiền toái
                      </option>
                      <option value="Bán hoặc quảng cáo mặt hàng bị hạn chế">
                        Bán hoặc quảng cáo mặt hàng bị hạn chế
                      </option>
                      <option value="Nội dung người lớn">
                        Nội dung người lớn
                      </option>
                      <option value="Thông tin sai sự thật, lừa đảo hoặc gian lận">
                        Thông tin sai sự thật, lừa đảo hoặc gian lận
                      </option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Ghi chú</label>
                    <div className="tiptap-wrapper">
                      <TiptapEditor
                        value={reportNote}
                        onChange={(content) => setReportNote(content)}
                        maxHeight="40vh"
                        minContentHeight={150}
                        placeholder="Mô tả chi tiết lý do báo cáo..."
                      />
                    </div>
                  </div>
                  {/* <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Vui lòng mô tả chi tiết lý do báo cáo..."
                    rows="4"
                    className="report-reason-textarea"
                  /> */}
                </div>
              </>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setIsReporting(false);
                setReportingComment(null);
              }}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={() => handleReport(reportingComment?._id)}
              disabled={!reportReason.trim()}
            >
              Gửi báo cáo
            </Button>
          </Modal.Footer>
        </Modal>

        {/* ----------------- REPLY INPUT ----------------- */}
        {replying && (
          <div className="reply-input-container">
            {/* Preview file reply */}
            {replyFilePreview && (
              <div className="file-preview small">
                <img
                  src={replyFilePreview}
                  alt="Preview"
                  className="file-preview-image"
                />
                <button
                  type="button"
                  onClick={removeReplyFile}
                  className="remove-file-btn"
                >
                  ×
                </button>
              </div>
            )}
            {selectedReplyFile && !replyFilePreview && (
              <div className="file-preview small">
                <div className="file-info">
                  <Paperclip size={16} />
                  <span className="file-name">{selectedReplyFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={removeReplyFile}
                  className="remove-file-btn"
                >
                  ×
                </button>
              </div>
            )}

            <div className="user-avatar small">
              <img
                src={
                  user?.profile?.avatar || "/assets/images/default-avatar.png"
                }
                alt="Your avatar"
                className="w-100 h-100"
              />
            </div>

            <div className="reply-input-wrapper">
              <input
                ref={replyInputRef}
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Trả lời ${
                  comment.userID?.fullName || "người dùng"
                }...`}
                disabled={submittingReply}
                className="reply-input"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitReply();
                  }
                  if (e.key === "Escape") cancelReply();
                }}
              />

              <div className="reply-actions">
                <div className="reply-file-actions">
                  <input
                    type="file"
                    ref={replyFileInputRef}
                    onChange={handleReplyFileSelect}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    className="file-input"
                    id={`reply-file-${comment._id}`}
                  />
                  <label
                    htmlFor={`reply-file-${comment._id}`}
                    className="file-action-btn"
                  >
                    <Paperclip size={14} />
                  </label>
                </div>

                <div className="reply-buttons">
                  <button
                    type="button"
                    onClick={cancelReply}
                    className="cancel-reply-btn"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={submitReply}
                    disabled={
                      (!replyText.trim() && !selectedReplyFile) ||
                      submittingReply
                    }
                    className="submit-reply-btn"
                  >
                    {submittingReply ? (
                      <div className="loading-spinner small"></div>
                    ) : (
                      <Send size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- REPLIES SECTION ----------------- */}
        {comment.replyCount > 0 && (
          <div className="replies-section">
            <button
              className="view-replies-btn"
              onClick={toggleReplies}
              disabled={loadingReplies && !showReplies}
            >
              {showReplies ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
              {getRepliesButtonText()}
            </button>

            {showReplies && (
              <div className="replies-list">
                {replies.length > 0 ? (
                  <>
                    {replies.map((reply, idx) => (
                      <CommentItem
                        key={reply._id}
                        comment={reply}
                        postId={postId}
                        depth={depth + 1}
                        isLast={idx === replies.length - 1}
                        onCommentUpdate={(updatedReply) => {
                          setReplies((prev) =>
                            prev.map((r) =>
                              r._id === updatedReply._id ? updatedReply : r
                            )
                          );
                        }}
                        onCommentDelete={(deletedReplyId) => {
                          setReplies((prev) =>
                            prev.filter((r) => r._id !== deletedReplyId)
                          );
                          const updatedComment = {
                            ...comment,
                            replyCount: Math.max(0, comment.replyCount - 1),
                          };
                          onCommentUpdate?.(updatedComment);
                        }}
                        replyFileStates={replyFileStates}
                        setReplyFileStates={setReplyFileStates}
                      />
                    ))}

                    {hasMoreReplies && (
                      <div className="load-more-replies">
                        <button
                          onClick={loadMoreReplies}
                          disabled={loadingReplies}
                          className="load-more-replies-btn"
                        >
                          {loadingReplies ? "Đang tải..." : "Tải thêm phản hồi"}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  loadingReplies && (
                    <div className="replies-loading">
                      <div className="loading-spinner small"></div>
                      <span>Đang tải phản hồi...</span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostComments;
