// // pages/social/EditPost.js
// import React, { useState, useEffect, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { usePost } from "../../contexts/PostContext";
// import { useAuth } from "../../contexts/AuthContext";
// import {
//   ArrowLeft,
//   Image,
//   Video,
//   File,
//   X,
//   Smile,
//   Paperclip,
//   Globe,
//   Users,
//   Lock,
//   Send,
//   Save,
// } from "lucide-react";
// import "./CreatePost.css"; // Có thể đổi tên thành PostForm.css

// const EditPost = () => {
//   const { postId } = useParams();
//   const navigate = useNavigate();
//   const { fetchPostById, updatePost } = usePost();
//   const { user } = useAuth();

//   const [formData, setFormData] = useState({
//     content: "",
//     privacy: "public",
//     isAnonymous: false,
//     emotions: "",
//     tags: "",
//   });

//   const [files, setFiles] = useState([]);
//   const [previews, setPreviews] = useState([]);
//   const [existingFiles, setExistingFiles] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [loadingPost, setLoadingPost] = useState(true);
//   const [error, setError] = useState("");
//   const fileInputRef = useRef(null);
//   const textareaRef = useRef(null);

//   // Load post data
//   useEffect(() => {
//     loadPost();
//     console.log("formData: ", formData);
//   }, [postId]);

//   const loadPost = async () => {
//     try {
//       setLoadingPost(true);
//       const res = await fetchPostById(postId);

//       console.log("pposst: ", res);
//       console.log("res.post.userCreateID._id: ", res.post.userCreateID._id);
//       console.log("user.userId: ", user.id);
//       // Kiểm tra quyền truy cập
//       if (res.post.userCreateID._id + "" !== user.id + "") {
//         setError("Bạn không có quyền chỉnh sửa bài viết này");
//         console.log("Bạn không có quyền chỉnh sửa bài viết này");
//         return;
//       }

//       const emotionsString = Array.isArray(res.post.emotions)
//         ? res.post.emotions.join(", ")
//         : res.post.emotions || "";

//       const tagsString = Array.isArray(res.post.tags)
//         ? res.post.tags.join(", ")
//         : res.post.tags || "";

//       console.log("Emotions as string:", emotionsString);
//       console.log("Tags as string:", tagsString);
//       // Set form data
//       setFormData({
//         content: res.post.content || "",
//         privacy: res.post.privacy || "public",
//         isAnonymous: res.post.isAnonymous || false,
//         emotions: emotionsString,
//         tags: tagsString,
//       });

//       // Set existing files
//       if (res.post.files && res.post.files.length > 0) {
//         setExistingFiles(res.post.files);
//       }
//     } catch (err) {
//       setError(err.message || "Không thể tải bài viết");
//       console.error("Error loading post:", err);
//     } finally {
//       setLoadingPost(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleFileChange = (e) => {
//     const selectedFiles = Array.from(e.target.files);

//     // Validate file sizes and types
//     const validFiles = selectedFiles.filter((file) => {
//       const maxSize = 50 * 1024 * 1024; // 50MB
//       if (file.size > maxSize) {
//         setError(`File ${file.name} vượt quá kích thước cho phép (50MB)`);
//         return false;
//       }
//       return true;
//     });

//     setFiles((prev) => [...prev, ...validFiles]);

//     // Create previews
//     const newPreviews = validFiles.map((file) => {
//       const preview = {
//         type: file.type.startsWith("image/")
//           ? "image"
//           : file.type.startsWith("video/")
//           ? "video"
//           : "file",
//         fileUrl: URL.createObjectURL(file),
//         fileName: file.name,
//         fileSize: file.size,
//         fileObject: file,
//         isNew: true, // Đánh dấu file mới
//       };
//       return preview;
//     });

//     setPreviews((prev) => [...prev, ...newPreviews]);
//   };

//   const removeFile = (index, isExisting = false) => {
//     if (isExisting) {
//       // Đánh dấu file cũ sẽ bị xóa
//       const updatedExistingFiles = [...existingFiles];
//       updatedExistingFiles[index].toDelete = true;
//       setExistingFiles(updatedExistingFiles);
//     } else {
//       // Xóa file mới
//       const newFiles = [...files];
//       const newPreviews = [...previews];

//       // Revoke object URL to prevent memory leaks
//       URL.revokeObjectURL(newPreviews[index].fileUrl);

//       newFiles.splice(index, 1);
//       newPreviews.splice(index, 1);

//       setFiles(newFiles);
//       setPreviews(newPreviews);
//     }
//   };

//   const restoreFile = (index) => {
//     const updatedExistingFiles = [...existingFiles];
//     delete updatedExistingFiles[index].toDelete;
//     setExistingFiles(updatedExistingFiles);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (
//       !formData.content.trim() &&
//       files.length === 0 &&
//       existingFiles.filter((f) => !f.toDelete).length === 0
//     ) {
//       setError("Vui lòng nhập nội dung hoặc chọn file đính kèm");
//       return;
//     }

//     setLoading(true);
//     setError("");

//     try {
//       const submitData = {
//         ...formData,
//         emotions: formData.emotions
//           .split(",")
//           .map((e) => e.trim())
//           .filter((e) => e),
//         tags: formData.tags
//           .split(",")
//           .map((t) => t.trim())
//           .filter((t) => t),
//         files: files, // Files mới
//         filesToDelete: existingFiles
//           .filter((file) => file.toDelete)
//           .map((file) => file._id), // Files cũ cần xóa
//       };

//       console.log("======================== updateData =================");
//       console.log(submitData);
//       console.log("======================== =================");

//       const response = await updatePost(postId, submitData);

//       if (response?.success) {
//         // Show success message
//         alert("Cập nhật bài viết thành công!");
//         navigate("/feed");
//       } else {
//         setError(response?.message || "Có lỗi xảy ra khi cập nhật bài viết");
//       }
//     } catch (err) {
//       setError(err.message || "Có lỗi xảy ra khi cập nhật bài viết");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFileClick = () => {
//     fileInputRef.current?.click();
//   };

//   const privacyOptions = [
//     {
//       value: "public",
//       icon: Globe,
//       label: "Công khai",
//       description: "Mọi người đều có thể xem",
//     },
//     {
//       value: "friends",
//       icon: Users,
//       label: "Bạn bè",
//       description: "Chỉ bạn bè có thể xem",
//     },
//     {
//       value: "private",
//       icon: Lock,
//       label: "Riêng tư",
//       description: "Chỉ mình tôi có thể xem",
//     },
//   ];

//   if (loadingPost) {
//     return (
//       <div className="create-post-container">
//         <div className="container">
//           <div className="row justify-content-center">
//             <div className="col-lg-8 col-md-10">
//               <div className="text-center py-5">
//                 <div className="spinner-border text-primary" role="status">
//                   <span className="visually-hidden">Loading...</span>
//                 </div>
//                 <p className="mt-3">Đang tải bài viết...</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="create-post-container">
//       {/* Header */}
//       <div className="create-post-header">
//         <div className="container">
//           <div className="row align-items-center">
//             <div className="col">
//               <button
//                 className="btn btn-back"
//                 onClick={() => navigate("/feed")}
//                 disabled={loading}
//               >
//                 <ArrowLeft size={20} />
//               </button>
//               <h1 className="page-title">Chỉnh sửa bài viết</h1>
//             </div>
//             <div className="col-auto">
//               <button
//                 className="btn btn-primary btn-publish"
//                 onClick={handleSubmit}
//                 disabled={
//                   loading ||
//                   (!formData.content.trim() &&
//                     files.length === 0 &&
//                     existingFiles.filter((f) => !f.toDelete).length === 0)
//                 }
//               >
//                 {loading ? (
//                   <div
//                     className="spinner-border spinner-border-sm me-2"
//                     role="status"
//                   >
//                     <span className="visually-hidden">Loading...</span>
//                   </div>
//                 ) : (
//                   <Save size={16} className="me-2" />
//                 )}
//                 Lưu thay đổi
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="container">
//         <div className="row justify-content-center">
//           <div className="col-lg-8 col-md-10">
//             {/* User Info */}
//             <div className="user-info-card">
//               <div className="d-flex align-items-center">
//                 <img
//                   src={user?.avatar || "/images/default-avatar.png"}
//                   alt="Avatar"
//                   className="user-avatar"
//                 />
//                 <div className="user-details">
//                   <div className="user-name">
//                     {formData.isAnonymous ? "🕶️ Ẩn danh" : user?.fullName}
//                   </div>
//                   <div className="privacy-selector">
//                     <select
//                       name="privacy"
//                       value={formData.privacy}
//                       onChange={handleInputChange}
//                       className="form-select privacy-select"
//                       disabled={loading}
//                     >
//                       {privacyOptions.map((option) => {
//                         const Icon = option.icon;
//                         return (
//                           <option key={option.value} value={option.value}>
//                             {option.label} - {option.description}
//                           </option>
//                         );
//                       })}
//                     </select>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Error Alert */}
//             {error && (
//               <div
//                 className="alert alert-danger alert-dismissible fade show"
//                 role="alert"
//               >
//                 {error}
//                 <button
//                   type="button"
//                   className="btn-close"
//                   onClick={() => setError("")}
//                 ></button>
//               </div>
//             )}

//             {/* Content Form */}
//             <div className="post-form-card">
//               <form onSubmit={handleSubmit}>
//                 {/* Content Textarea */}
//                 <div className="mb-4">
//                   <textarea
//                     ref={textareaRef}
//                     name="content"
//                     value={formData.content}
//                     onChange={handleInputChange}
//                     placeholder="Bạn đang nghĩ gì?..."
//                     className="form-control post-textarea"
//                     rows="6"
//                     disabled={loading}
//                   />
//                 </div>

//                 {/* Existing Files Previews */}
//                 {existingFiles.length > 0 && (
//                   <div className="file-previews mb-4">
//                     <h6>Files hiện tại:</h6>
//                     <div className="row g-2">
//                       {existingFiles.map((file, index) => (
//                         <div key={file._id} className="col-6 col-md-4 col-lg-3">
//                           <div
//                             className={`file-preview-item position-relative ${
//                               file.toDelete ? "file-to-delete" : ""
//                             }`}
//                           >
//                             {file.fileType?.startsWith("image/") ? (
//                               <img
//                                 src={file.fileUrl}
//                                 alt={`Preview ${index}`}
//                                 className="img-fluid rounded"
//                               />
//                             ) : file.fileType?.startsWith("video/") ? (
//                               <div className="video-preview">
//                                 <video
//                                   src={file.fileUrl}
//                                   className="img-fluid rounded"
//                                 />
//                                 <div className="video-overlay">
//                                   <Video size={24} className="text-white" />
//                                 </div>
//                               </div>
//                             ) : (
//                               <div className="file-preview-document">
//                                 <File size={32} className="text-primary" />
//                                 <div className="file-name">{file.fileName}</div>
//                                 <small className="file-size">
//                                   {(file.fileSize / 1024 / 1024).toFixed(2)} MB
//                                 </small>
//                               </div>
//                             )}
//                             <button
//                               type="button"
//                               className={`btn-remove-file ${
//                                 file.toDelete ? "btn-restore-file" : ""
//                               }`}
//                               onClick={() =>
//                                 file.toDelete
//                                   ? restoreFile(index)
//                                   : removeFile(index, true)
//                               }
//                               disabled={loading}
//                             >
//                               {file.toDelete ? "↶" : <X size={16} />}
//                             </button>
//                             {file.toDelete && (
//                               <div className="file-delete-overlay">
//                                 <span>Sẽ bị xóa</span>
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {/* New Files Previews */}
//                 {previews.length > 0 && (
//                   <div className="file-previews mb-4">
//                     <h6>Files mới:</h6>
//                     <div className="row g-2">
//                       {previews.map((preview, index) => (
//                         <div key={index} className="col-6 col-md-4 col-lg-3">
//                           <div className="file-preview-item position-relative">
//                             {preview.type === "image" ? (
//                               <img
//                                 src={preview.fileUrl}
//                                 alt={`Preview ${index}`}
//                                 className="img-fluid rounded"
//                               />
//                             ) : preview.type === "video" ? (
//                               <div className="video-preview">
//                                 <video
//                                   src={preview.fileUrl}
//                                   className="img-fluid rounded"
//                                 />
//                                 <div className="video-overlay">
//                                   <Video size={24} className="text-white" />
//                                 </div>
//                               </div>
//                             ) : (
//                               <div className="file-preview-document">
//                                 <File size={32} className="text-primary" />
//                                 <div className="file-name">
//                                   {preview.fileName}
//                                 </div>
//                                 <small className="file-size">
//                                   {(preview.fileSize / 1024 / 1024).toFixed(2)}{" "}
//                                   MB
//                                 </small>
//                               </div>
//                             )}
//                             <button
//                               type="button"
//                               className="btn-remove-file"
//                               onClick={() => removeFile(index)}
//                               disabled={loading}
//                             >
//                               <X size={16} />
//                             </button>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {/* Additional Options */}
//                 <div className="post-options">
//                   <div className="row">
//                     {/* Emotions */}
//                     <div className="col-md-6 mb-3">
//                       <label className="form-label">Cảm xúc</label>
//                       <input
//                         type="text"
//                         name="emotions"
//                         value={formData.emotions}
//                         onChange={handleInputChange}
//                         placeholder="Ví dụ: vui vẻ, lo lắng, hạnh phúc..."
//                         className="form-control"
//                         disabled={loading}
//                       />
//                       <div className="form-text">
//                         Phân cách nhiều cảm xúc bằng dấu phẩy
//                       </div>
//                     </div>

//                     {/* Tags */}
//                     <div className="col-md-6 mb-3">
//                       <label className="form-label">Tags</label>
//                       <input
//                         type="text"
//                         name="tags"
//                         value={formData.tags}
//                         onChange={handleInputChange}
//                         placeholder="Ví dụ: #suckhoe #tamly #hoctap..."
//                         className="form-control"
//                         disabled={loading}
//                       />
//                       <div className="form-text">
//                         Phân cách nhiều tags bằng dấu phẩy
//                       </div>
//                     </div>
//                   </div>

//                   {/* Anonymous Option */}
//                   <div className="mb-4">
//                     <div className="form-check">
//                       <input
//                         className="form-check-input"
//                         type="checkbox"
//                         name="isAnonymous"
//                         checked={formData.isAnonymous}
//                         onChange={handleInputChange}
//                         id="anonymousCheck"
//                         disabled={loading}
//                       />
//                       <label
//                         className="form-check-label"
//                         htmlFor="anonymousCheck"
//                       >
//                         🕶️ Đăng ẩn danh
//                       </label>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Action Buttons */}
//                 <div className="post-actions">
//                   <div className="d-flex justify-content-between align-items-center">
//                     <div className="d-flex gap-2">
//                       {/* File Upload Button */}
//                       <button
//                         type="button"
//                         className="btn btn-outline-primary btn-action"
//                         onClick={handleFileClick}
//                         disabled={loading}
//                       >
//                         <Image size={18} className="me-2" />
//                         Thêm Ảnh/Video
//                       </button>

//                       <input
//                         ref={fileInputRef}
//                         type="file"
//                         multiple
//                         onChange={handleFileChange}
//                         accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
//                         className="d-none"
//                       />

//                       {/* Other Actions */}
//                       <button
//                         type="button"
//                         className="btn btn-outline-secondary btn-action"
//                         disabled={loading}
//                       >
//                         <Smile size={18} className="me-2" />
//                         Cảm xúc
//                       </button>

//                       <button
//                         type="button"
//                         className="btn btn-outline-secondary btn-action"
//                         disabled={loading}
//                       >
//                         <Paperclip size={18} className="me-2" />
//                         File
//                       </button>
//                     </div>

//                     <div className="text-muted small">
//                       {formData.content.length}/5000 ký tự
//                     </div>
//                   </div>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditPost;

// pages/social/EditPost.js
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePost } from "../../contexts/PostContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  ArrowLeft,
  Image,
  Video,
  File,
  X,
  Smile,
  Paperclip,
  Globe,
  Users,
  Lock,
  Send,
  Save,
} from "lucide-react";
import "./CreatePost.css";

const EditPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { fetchPostById, updatePost } = usePost();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    content: "",
    privacy: "public",
    isAnonymous: false,
    emotions: [],
    tags: [],
  });

  const [emotionInput, setEmotionInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const emotionInputRef = useRef(null);
  const tagInputRef = useRef(null);

  // Load post data
  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoadingPost(true);
      const res = await fetchPostById(postId);

      console.log("Post data from server:", res);

      // Kiểm tra quyền truy cập
      if (res.post.userCreateID._id + "" !== user.id + "") {
        setError("Bạn không có quyền chỉnh sửa bài viết này");
        return;
      }

      // Set form data
      setFormData({
        content: res.post.content || "",
        privacy: res.post.privacy || "public",
        isAnonymous: res.post.isAnonymous || false,
        emotions: Array.isArray(res.post.emotions) ? res.post.emotions : [],
        tags: Array.isArray(res.post.tags) ? res.post.tags : [],
      });

      // Set existing files
      if (res.post.files && res.post.files.length > 0) {
        setExistingFiles(res.post.files);
      }
    } catch (err) {
      setError(err.message || "Không thể tải bài viết");
      console.error("Error loading post:", err);
    } finally {
      setLoadingPost(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Xử lý thêm emotion bằng Enter
  const handleEmotionKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const emotion = emotionInput.trim();
      if (emotion && !formData.emotions.includes(emotion)) {
        setFormData((prev) => ({
          ...prev,
          emotions: [...prev.emotions, emotion],
        }));
        setEmotionInput("");
      }
    }
  };

  // Xử lý thêm tag bằng Enter
  const handleTagKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !formData.tags.includes(tag)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tag],
        }));
        setTagInput("");
      }
    }
  };

  // Xóa emotion
  const removeEmotion = (index) => {
    setFormData((prev) => ({
      ...prev,
      emotions: prev.emotions.filter((_, i) => i !== index),
    }));
  };

  // Xóa tag
  const removeTag = (index) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate file sizes and types
    const validFiles = selectedFiles.filter((file) => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setError(`File ${file.name} vượt quá kích thước cho phép (50MB)`);
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);

    // Create previews
    const newPreviews = validFiles.map((file) => {
      const preview = {
        type: file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
          ? "video"
          : "file",
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
        fileSize: file.size,
        fileObject: file,
        isNew: true,
      };
      return preview;
    });

    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index, isExisting = false) => {
    if (isExisting) {
      const updatedExistingFiles = [...existingFiles];
      updatedExistingFiles[index].toDelete = true;
      setExistingFiles(updatedExistingFiles);
    } else {
      const newFiles = [...files];
      const newPreviews = [...previews];

      URL.revokeObjectURL(newPreviews[index].fileUrl);

      newFiles.splice(index, 1);
      newPreviews.splice(index, 1);

      setFiles(newFiles);
      setPreviews(newPreviews);
    }
  };

  const restoreFile = (index) => {
    const updatedExistingFiles = [...existingFiles];
    delete updatedExistingFiles[index].toDelete;
    setExistingFiles(updatedExistingFiles);
  };

  //   const handleSubmit = async (e) => {
  //     e.preventDefault();

  //     if (
  //       !formData.content.trim() &&
  //       files.length === 0 &&
  //       existingFiles.filter((f) => !f.toDelete).length === 0
  //     ) {
  //       setError("Vui lòng nhập nội dung hoặc chọn file đính kèm");
  //       return;
  //     }

  //     setLoading(true);
  //     setError("");

  //     try {
  //       const submitData = {
  //         ...formData,
  //         files: files,
  //         filesToDelete: existingFiles
  //           .filter((file) => file.toDelete)
  //           .map((file) => file._id),
  //       };

  //       console.log("======================== updateData =================");
  //       console.log(submitData);
  //       console.log("======================== =================");

  //       const response = await updatePost(postId, submitData);

  //       if (response?.success) {
  //         alert("Cập nhật bài viết thành công!");
  //         navigate("/feed");
  //       } else {
  //         setError(response?.message || "Có lỗi xảy ra khi cập nhật bài viết");
  //       }
  //     } catch (err) {
  //       setError(err.message || "Có lỗi xảy ra khi cập nhật bài viết");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.content.trim() &&
      files.length === 0 &&
      existingFiles.filter((f) => !f.toDelete).length === 0
    ) {
      setError("Vui lòng nhập nội dung hoặc chọn file đính kèm");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const submitData = {
        content: formData.content,
        privacy: formData.privacy,
        isAnonymous: formData.isAnonymous,
        emotions: formData.emotions,
        tags: formData.tags,
        files: files,
        // ✅ DÙNG fileUrl THAY VÌ _id
        filesToDelete: existingFiles
          .filter((file) => file.toDelete)
          .map((file) => file.fileUrl), // Lấy fileUrl thay vì _id
      };

      console.log("=== 🚨 SUBMIT DATA ===");
      console.log("Files to delete (URLs):", submitData.filesToDelete);
      console.log("=== 🚨 END SUBMIT DATA ===");

      const response = await updatePost(postId, submitData);

      if (response?.success) {
        alert("Cập nhật bài viết thành công!");
        navigate("/feed");
      } else {
        setError(response?.message || "Có lỗi xảy ra khi cập nhật bài viết");
      }
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi cập nhật bài viết");
      console.error("Error updating post:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const privacyOptions = [
    {
      value: "public",
      icon: Globe,
      label: "Công khai",
      description: "Mọi người đều có thể xem",
    },
    {
      value: "friends",
      icon: Users,
      label: "Bạn bè",
      description: "Chỉ bạn bè có thể xem",
    },
    {
      value: "private",
      icon: Lock,
      label: "Riêng tư",
      description: "Chỉ mình tôi có thể xem",
    },
  ];

  if (loadingPost) {
    return (
      <div className="create-post-container">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-10">
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Đang tải bài viết...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-post-container">
      {/* Header */}
      <div className="create-post-header">
        <div className="container">
          <div className="row align-items-center">
            <div className="col">
              <button
                className="btn btn-back"
                onClick={() => navigate("/feed")}
                disabled={loading}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="page-title">Chỉnh sửa bài viết</h1>
            </div>
            <div className="col-auto">
              <button
                className="btn btn-primary btn-publish"
                onClick={handleSubmit}
                disabled={
                  loading ||
                  (!formData.content.trim() &&
                    files.length === 0 &&
                    existingFiles.filter((f) => !f.toDelete).length === 0)
                }
              >
                {loading ? (
                  <div
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  <Save size={16} className="me-2" />
                )}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-10">
            {/* User Info */}
            <div className="user-info-card">
              <div className="d-flex align-items-center">
                <img
                  src={user?.avatar || "/images/default-avatar.png"}
                  alt="Avatar"
                  className="user-avatar"
                />
                <div className="user-details">
                  <div className="user-name">
                    {formData.isAnonymous ? "🕶️ Ẩn danh" : user?.fullName}
                  </div>
                  <div className="privacy-selector">
                    <select
                      name="privacy"
                      value={formData.privacy}
                      onChange={handleInputChange}
                      className="form-select privacy-select"
                      disabled={loading}
                    >
                      {privacyOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <option key={option.value} value={option.value}>
                            {option.label} - {option.description}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div
                className="alert alert-danger alert-dismissible fade show"
                role="alert"
              >
                {error}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setError("")}
                ></button>
              </div>
            )}

            {/* Content Form */}
            <div className="post-form-card">
              <form onSubmit={handleSubmit}>
                {/* Content Textarea */}
                <div className="mb-4">
                  <textarea
                    ref={textareaRef}
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Bạn đang nghĩ gì?..."
                    className="form-control post-textarea"
                    rows="6"
                    disabled={loading}
                  />
                </div>

                {/* Existing Files Previews */}
                {existingFiles.length > 0 && (
                  <div className="file-previews mb-4">
                    <h6>Files hiện tại:</h6>
                    <div className="row g-2">
                      {existingFiles.map((file, index) => (
                        <div key={file._id} className="col-6 col-md-4 col-lg-3">
                          <div
                            className={`file-preview-item position-relative ${
                              file.toDelete ? "file-to-delete" : ""
                            }`}
                          >
                            {file.fileType?.startsWith("image/") ? (
                              <img
                                src={file.fileUrl}
                                alt={`Preview ${index}`}
                                className="img-fluid rounded"
                              />
                            ) : file.fileType?.startsWith("video/") ? (
                              <div className="video-preview">
                                <video
                                  src={file.fileUrl}
                                  className="img-fluid rounded"
                                />
                                <div className="video-overlay">
                                  <Video size={24} className="text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="file-preview-document">
                                <File size={32} className="text-primary" />
                                <div className="file-name">{file.fileName}</div>
                                <small className="file-size">
                                  {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                </small>
                              </div>
                            )}
                            <button
                              type="button"
                              className={`btn-remove-file ${
                                file.toDelete ? "btn-restore-file" : ""
                              }`}
                              onClick={() =>
                                file.toDelete
                                  ? restoreFile(index)
                                  : removeFile(index, true)
                              }
                              disabled={loading}
                            >
                              {file.toDelete ? "↶" : <X size={16} />}
                            </button>
                            {file.toDelete && (
                              <div className="file-delete-overlay">
                                <span>Sẽ bị xóa</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Files Previews */}
                {previews.length > 0 && (
                  <div className="file-previews mb-4">
                    <h6>Files mới:</h6>
                    <div className="row g-2">
                      {previews.map((preview, index) => (
                        <div key={index} className="col-6 col-md-4 col-lg-3">
                          <div className="file-preview-item position-relative">
                            {preview.type === "image" ? (
                              <img
                                src={preview.fileUrl}
                                alt={`Preview ${index}`}
                                className="img-fluid rounded"
                              />
                            ) : preview.type === "video" ? (
                              <div className="video-preview">
                                <video
                                  src={preview.fileUrl}
                                  className="img-fluid rounded"
                                />
                                <div className="video-overlay">
                                  <Video size={24} className="text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="file-preview-document">
                                <File size={32} className="text-primary" />
                                <div className="file-name">
                                  {preview.fileName}
                                </div>
                                <small className="file-size">
                                  {(preview.fileSize / 1024 / 1024).toFixed(2)}{" "}
                                  MB
                                </small>
                              </div>
                            )}
                            <button
                              type="button"
                              className="btn-remove-file"
                              onClick={() => removeFile(index)}
                              disabled={loading}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Options */}
                <div className="post-options">
                  <div className="row">
                    {/* Emotions */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Cảm xúc</label>
                      <div className="emotions-input-container">
                        <input
                          ref={emotionInputRef}
                          type="text"
                          value={emotionInput}
                          onChange={(e) => setEmotionInput(e.target.value)}
                          onKeyDown={handleEmotionKeyDown}
                          placeholder="Nhập cảm xúc và nhấn Enter..."
                          className="form-control"
                          disabled={loading}
                        />
                        <div className="emotions-tags-container mt-2">
                          {formData.emotions.map((emotion, index) => (
                            <span key={index} className="emotion-tag">
                              {emotion}
                              <button
                                type="button"
                                className="btn-tag-remove"
                                onClick={() => removeEmotion(index)}
                                disabled={loading}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="form-text">
                        Nhấn Enter để thêm cảm xúc
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Tags</label>
                      <div className="tags-input-container">
                        <input
                          ref={tagInputRef}
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                          placeholder="Nhập tag và nhấn Enter..."
                          className="form-control"
                          disabled={loading}
                        />
                        <div className="emotions-tags-container mt-2">
                          {formData.tags.map((tag, index) => (
                            <span key={index} className="tag-tag">
                              {tag}
                              <button
                                type="button"
                                className="btn-tag-remove"
                                onClick={() => removeTag(index)}
                                disabled={loading}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="form-text">Nhấn Enter để thêm tag</div>
                    </div>
                  </div>

                  {/* Anonymous Option */}
                  <div className="mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="isAnonymous"
                        checked={formData.isAnonymous}
                        onChange={handleInputChange}
                        id="anonymousCheck"
                        disabled={loading}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="anonymousCheck"
                      >
                        🕶️ Đăng ẩn danh
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="post-actions">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-action"
                        onClick={handleFileClick}
                        disabled={loading}
                      >
                        <Image size={18} className="me-2" />
                        Thêm Ảnh/Video
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                        className="d-none"
                      />

                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-action"
                        disabled={loading}
                      >
                        <Smile size={18} className="me-2" />
                        Cảm xúc
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-action"
                        disabled={loading}
                      >
                        <Paperclip size={18} className="me-2" />
                        File
                      </button>
                    </div>

                    <div className="text-muted small">
                      {formData.content.length}/5000 ký tự
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPost;
