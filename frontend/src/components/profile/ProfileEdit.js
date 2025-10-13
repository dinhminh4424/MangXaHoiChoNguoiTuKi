// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { useProfile } from "../../contexts/ProfileContext";
// import "./profileEdit.css";
// import notificationService from "../../services/notificationService";

// const ProfileEdit = () => {
//   const {
//     viewedUser,
//     loading,
//     error,
//     updateSuccess,
//     updateProfileWithAvatar,
//     clearError,
//     clearSuccess,
//   } = useProfile();

//   const [formData, setFormData] = useState({
//     fullName: "",
//     bio: "",
//     interests: [],
//     skills: [], // Thêm skills
//   });
//   const [newInterest, setNewInterest] = useState("");
//   const [newSkill, setNewSkill] = useState("");
//   const [avatarFile, setAvatarFile] = useState(null);
//   const [avatarPreview, setAvatarPreview] = useState("");
//   const [isDragging, setIsDragging] = useState(false);
//   const [showAvatarModal, setShowAvatarModal] = useState(false);
//   const fileInputRef = useRef(null);
//   const dropAreaRef = useRef(null);

//   const defaultAvatar = "/images/default-avatar.png";

//   useEffect(() => {
//     if (viewedUser) {
//       const userAvatar = viewedUser.profile?.avatar || "";
//       setFormData({
//         fullName: viewedUser.fullName || "",
//         bio: viewedUser.profile?.bio || "",
//         interests: viewedUser.profile?.interests || [],
//         skills: viewedUser.profile?.skills || [], // Thêm skills
//       });
//       setAvatarPreview(userAvatar || defaultAvatar);
//     }
//   }, [viewedUser]);

//   // Drag and drop handlers (giữ nguyên)
//   const handleDragOver = useCallback((e) => {
//     e.preventDefault();
//     setIsDragging(true);
//   }, []);

//   const handleDragLeave = useCallback((e) => {
//     e.preventDefault();
//     setIsDragging(false);
//   }, []);

//   const handleDrop = useCallback((e) => {
//     e.preventDefault();
//     setIsDragging(false);

//     const files = e.dataTransfer.files;
//     if (files.length > 0) {
//       handleFileSelect(files[0]);
//     }
//   }, []);

//   const handleFileSelect = (file) => {
//     if (file) {
//       if (file.size > 10 * 1024 * 1024) {
//         notificationService.error({
//           title: "Lỗi",
//           text: "File ảnh không được vượt quá 10MB",
//           timer: 3000,
//           showConfirmButton: false,
//         });
//         return;
//       }

//       if (!file.type.startsWith("image/")) {
//         notificationService.error({
//           title: "Lỗi",
//           text: "Vui lòng chọn file ảnh hợp lệ (JPEG, PNG, GIF, WebP)",
//           timer: 3000,
//           showConfirmButton: false,
//         });
//         return;
//       }

//       setAvatarFile(file);

//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setAvatarPreview(e.target.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleFileInputChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       handleFileSelect(file);
//     }
//   };

//   const handleAvatarClick = () => {
//     setShowAvatarModal(true);
//   };

//   const handleRemoveAvatar = () => {
//     setAvatarFile(null);
//     setAvatarPreview(defaultAvatar);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleAddInterest = () => {
//     if (
//       newInterest.trim() &&
//       !formData.interests.includes(newInterest.trim())
//     ) {
//       setFormData((prev) => ({
//         ...prev,
//         interests: [...prev.interests, newInterest.trim()],
//       }));
//       setNewInterest("");
//     }
//   };

//   // SỬA LỖI: Tách hàm handleAddSkill riêng
//   const handleAddSkill = () => {
//     if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
//       setFormData((prev) => ({
//         ...prev,
//         skills: [...prev.skills, newSkill.trim()],
//       }));
//       setNewSkill("");
//     }
//   };

//   const handleRemoveInterest = (interestToRemove) => {
//     setFormData((prev) => ({
//       ...prev,
//       interests: prev.interests.filter(
//         (interest) => interest !== interestToRemove
//       ),
//     }));
//   };

//   // THÊM HÀM: Xóa skill
//   const handleRemoveSkill = (skillToRemove) => {
//     setFormData((prev) => ({
//       ...prev,
//       skills: prev.skills.filter((skill) => skill !== skillToRemove),
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const submitData = {
//       fullName: formData.fullName,
//       bio: formData.bio,
//       interests: formData.interests,
//       skills: formData.skills,
//       avatar: avatarFile, // File object
//     };

//     console.log("Submitting data:", {
//       fullName: formData.fullName,
//       bio: formData.bio,
//       interests: formData.interests,
//       skills: formData.skills,
//       hasAvatarFile: !!avatarFile,
//     });

//     const result = await updateProfileWithAvatar(submitData);

//     if (result.success) {
//       setAvatarFile(null);
//       notificationService.success({
//         title: "Thành công",
//         text: "Cập nhật thông tin thành công!",
//         timer: 3000,
//         showConfirmButton: false,
//       });
//       setTimeout(() => {
//         clearSuccess();
//       }, 2000);
//     } else {
//       notificationService.error({
//         title: "Lỗi",
//         text: result.message || "Có lỗi xảy ra khi cập nhật",
//         timer: 3000,
//         showConfirmButton: false,
//       });
//     }
//   };

//   const handleCloseAlert = () => {
//     clearError();
//     clearSuccess();
//   };

//   if (!viewedUser) {
//     return null;
//   }

//   return (
//     <div className="card shadow-sm">
//       <div className="card-header bg-primary text-white">
//         <h5 className="mb-0">Chỉnh sửa trang cá nhân</h5>
//       </div>
//       <div className="card-body p-4">
//         {/* Alerts */}
//         {error && (
//           <div className="alert alert-danger alert-dismissible fade show mb-4">
//             <div className="d-flex align-items-center">
//               <i className="fas fa-exclamation-circle me-2"></i>
//               <span>{error}</span>
//             </div>
//             <button
//               type="button"
//               className="btn-close"
//               onClick={handleCloseAlert}
//             ></button>
//           </div>
//         )}

//         {updateSuccess && (
//           <div className="alert alert-success alert-dismissible fade show mb-4">
//             <div className="d-flex align-items-center">
//               <i className="fas fa-check-circle me-2"></i>
//               <span>Cập nhật thông tin thành công!</span>
//             </div>
//             <button
//               type="button"
//               className="btn-close"
//               onClick={handleCloseAlert}
//             ></button>
//           </div>
//         )}

//         <form onSubmit={handleSubmit}>
//           {/* Avatar Section - Giữ nguyên */}
//           <div className="text-center mb-4">
//             <div className="position-relative d-inline-block">
//               <div
//                 ref={dropAreaRef}
//                 className={`avatar-upload-container ${
//                   isDragging ? "dragging" : ""
//                 }`}
//                 onDragOver={handleDragOver}
//                 onDragLeave={handleDragLeave}
//                 onDrop={handleDrop}
//                 onClick={handleAvatarClick}
//                 style={{ cursor: "pointer" }}
//               >
//                 <img
//                   src={avatarPreview}
//                   className="rounded-circle border"
//                   style={{
//                     width: "150px",
//                     height: "150px",
//                     objectFit: "cover",
//                     transition: "all 0.3s ease",
//                   }}
//                   alt="Avatar"
//                 />
//                 <div className="avatar-overlay">
//                   <div className="avatar-overlay-content">
//                     <i className="fas fa-camera fa-2x mb-2"></i>
//                     <small>Cập nhật ảnh đại diện</small>
//                   </div>
//                 </div>
//               </div>

//               <div className="position-absolute bottom-0 end-0">
//                 <button
//                   type="button"
//                   className="btn btn-primary btn-sm rounded-circle shadow"
//                   onClick={handleAvatarClick}
//                   title="Đổi ảnh đại diện"
//                   style={{ width: "36px", height: "36px" }}
//                 >
//                   <i className="fas fa-camera"></i>
//                 </button>
//               </div>
//             </div>

//             <input
//               type="file"
//               ref={fileInputRef}
//               onChange={handleFileInputChange}
//               accept="image/jpeg, image/jpg, image/png, image/gif, image/webp"
//               style={{ display: "none" }}
//             />

//             <div className="d-flex justify-content-center gap-2 mt-3">
//               <button
//                 type="button"
//                 className="btn btn-outline-primary btn-sm"
//                 onClick={handleAvatarClick}
//               >
//                 <i className="fas fa-upload me-1"></i>
//                 Tải ảnh lên
//               </button>
//               {avatarFile && (
//                 <button
//                   type="button"
//                   className="btn btn-outline-danger btn-sm"
//                   onClick={handleRemoveAvatar}
//                 >
//                   <i className="fas fa-trash me-1"></i>
//                   Hủy ảnh mới
//                 </button>
//               )}
//             </div>

//             {avatarFile && (
//               <div className="mt-2">
//                 <small className="text-success">
//                   <i className="fas fa-check-circle me-1"></i>
//                   Đã chọn ảnh mới: {avatarFile.name}
//                 </small>
//               </div>
//             )}
//           </div>

//           <hr className="my-4" />

//           {/* Full Name - Giữ nguyên */}
//           <div className="form-group mb-4">
//             <label className="form-label fw-semibold">Họ và tên *</label>
//             <div className="input-group">
//               <span className="input-group-text">
//                 <i className="fas fa-user"></i>
//               </span>
//               <input
//                 type="text"
//                 className="form-control"
//                 name="fullName"
//                 value={formData.fullName}
//                 onChange={handleInputChange}
//                 required
//                 placeholder="Nhập họ và tên của bạn"
//               />
//             </div>
//           </div>

//           {/* Bio - Giữ nguyên */}
//           <div className="form-group mb-4">
//             <label className="form-label fw-semibold">
//               Giới thiệu bản thân
//             </label>
//             <div className="position-relative">
//               <textarea
//                 className="form-control"
//                 rows="4"
//                 name="bio"
//                 value={formData.bio}
//                 onChange={handleInputChange}
//                 placeholder="Hãy chia sẻ đôi điều về bản thân bạn, sở thích, hoặc bất cứ điều gì bạn muốn mọi người biết..."
//                 maxLength="500"
//                 style={{ resize: "none" }}
//               ></textarea>
//               <div className="d-flex justify-content-between align-items-center mt-2">
//                 <small className="form-text text-muted">
//                   <i className="fas fa-info-circle me-1"></i>
//                   Mô tả ngắn gọn về bản thân
//                 </small>
//                 <small
//                   className={`form-text ${
//                     formData.bio.length >= 480 ? "text-warning" : "text-muted"
//                   }`}
//                 >
//                   {formData.bio.length}/500 ký tự
//                 </small>
//               </div>
//             </div>
//           </div>

//           {/* Interests - Giữ nguyên */}
//           <div className="form-group mb-4">
//             <label className="form-label fw-semibold">Sở thích</label>
//             <div className="d-flex mb-3">
//               <div className="input-group">
//                 <span className="input-group-text">
//                   <i className="fas fa-heart"></i> {/* Đổi icon cho sở thích */}
//                 </span>
//                 <input
//                   type="text"
//                   className="form-control"
//                   value={newInterest}
//                   onChange={(e) => setNewInterest(e.target.value)}
//                   placeholder="Thêm sở thích mới (ví dụ: Đá bóng, Âm nhạc, Du lịch...)"
//                   onKeyPress={(e) => {
//                     if (e.key === "Enter") {
//                       e.preventDefault();
//                       handleAddInterest();
//                     }
//                   }}
//                 />
//                 <button
//                   className="btn btn-primary"
//                   type="button"
//                   onClick={handleAddInterest}
//                   disabled={!newInterest.trim()}
//                 >
//                   <i className="fas fa-plus me-1"></i>
//                   Thêm
//                 </button>
//               </div>
//             </div>

//             {formData.interests.length > 0 && (
//               <div className="mb-3">
//                 <small className="text-muted mb-2 d-block">
//                   Sở thích của bạn ({formData.interests.length})
//                 </small>
//                 <div className="d-flex flex-wrap gap-2">
//                   {formData.interests.map((interest, index) => (
//                     <span
//                       key={index}
//                       className="badge bg-primary text-white d-flex align-items-center py-2 px-3"
//                       style={{ fontSize: "0.85rem" }}
//                     >
//                       <i className="fas fa-heart me-1"></i>
//                       {interest}
//                       <button
//                         type="button"
//                         className="btn-close btn-close-white ms-2"
//                         style={{ fontSize: "0.6rem" }}
//                         onClick={() => handleRemoveInterest(interest)}
//                         aria-label="Remove"
//                       ></button>
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Skills - SỬA LỖI */}
//           <div className="form-group mb-4">
//             <label className="form-label fw-semibold">Kỹ năng</label>
//             <div className="d-flex mb-3">
//               <div className="input-group">
//                 <span className="input-group-text">
//                   <i className="fas fa-cogs"></i> {/* Icon cho kỹ năng */}
//                 </span>
//                 <input
//                   type="text"
//                   className="form-control"
//                   value={newSkill}
//                   onChange={(e) => setNewSkill(e.target.value)}
//                   placeholder="Thêm kỹ năng mới (ví dụ: JavaScript, Photoshop, Giao tiếp...)"
//                   onKeyPress={(e) => {
//                     if (e.key === "Enter") {
//                       e.preventDefault();
//                       handleAddSkill();
//                     }
//                   }}
//                 />
//                 <button
//                   className="btn btn-success"
//                   type="button"
//                   onClick={handleAddSkill}
//                   disabled={!newSkill.trim()}
//                 >
//                   <i className="fas fa-plus me-1"></i>
//                   Thêm
//                 </button>
//               </div>
//             </div>

//             {formData.skills.length > 0 && (
//               <div className="mb-3">
//                 <small className="text-muted mb-2 d-block">
//                   Kỹ năng của bạn ({formData.skills.length})
//                 </small>
//                 <div className="d-flex flex-wrap gap-2">
//                   {formData.skills.map((skill, index) => (
//                     <span
//                       key={index}
//                       className="badge bg-success text-white d-flex align-items-center py-2 px-3"
//                       style={{ fontSize: "0.85rem" }}
//                     >
//                       <i className="fas fa-cog me-1"></i>
//                       {skill}
//                       <button
//                         type="button"
//                         className="btn-close btn-close-white ms-2"
//                         style={{ fontSize: "0.6rem" }}
//                         onClick={() => handleRemoveSkill(skill)}
//                         aria-label="Remove"
//                       ></button>
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Submit Button - Giữ nguyên */}
//           <div className="d-grid gap-2">
//             <button
//               className="btn btn-primary btn-lg py-3 fw-semibold"
//               type="submit"
//               disabled={loading}
//             >
//               {loading ? (
//                 <>
//                   <span
//                     className="spinner-border spinner-border-sm me-2"
//                     role="status"
//                   ></span>
//                   Đang cập nhật...
//                 </>
//               ) : (
//                 <>
//                   <i className="fas fa-save me-2"></i>
//                   Lưu thay đổi
//                 </>
//               )}
//             </button>
//             <button
//               type="button"
//               className="btn btn-outline-secondary"
//               onClick={() => window.history.back()}
//             >
//               Hủy bỏ
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* Avatar Modal - Giữ nguyên */}
//       {showAvatarModal && (
//         <div
//           className="modal fade show"
//           style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
//         >
//           <div className="modal-dialog modal-dialog-centered">
//             <div className="modal-content">
//               <div className="modal-header">
//                 <h5 className="modal-title">Cập nhật ảnh đại diện</h5>
//                 <button
//                   type="button"
//                   className="btn-close"
//                   onClick={() => setShowAvatarModal(false)}
//                 ></button>
//               </div>
//               <div className="modal-body text-center">
//                 <div
//                   className={`border rounded p-5 mb-3 ${
//                     isDragging ? "bg-light" : ""
//                   }`}
//                   onDragOver={handleDragOver}
//                   onDragLeave={handleDragLeave}
//                   onDrop={handleDrop}
//                   style={{
//                     cursor: "pointer",
//                     borderStyle: isDragging ? "dashed" : "solid",
//                   }}
//                   onClick={() => fileInputRef.current?.click()}
//                 >
//                   <i className="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
//                   <p className="mb-1">Kéo thả ảnh vào đây hoặc nhấn để chọn</p>
//                   <small className="text-muted">
//                     JPEG, PNG, GIF, WebP (Tối đa 10MB)
//                   </small>
//                 </div>
//                 <div className="d-flex gap-2 justify-content-center">
//                   <button
//                     className="btn btn-primary"
//                     onClick={() => fileInputRef.current?.click()}
//                   >
//                     <i className="fas fa-folder-open me-2"></i>
//                     Chọn từ máy tính
//                   </button>
//                   {avatarFile && (
//                     <button
//                       className="btn btn-outline-danger"
//                       onClick={handleRemoveAvatar}
//                     >
//                       <i className="fas fa-trash me-2"></i>
//                       Hủy ảnh
//                     </button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProfileEdit;

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useProfile } from "../../contexts/ProfileContext";
import "./profileEdit.css";
import notificationService from "../../services/notificationService";

const ProfileEdit = () => {
  const {
    viewedUser,
    loading,
    error,
    updateSuccess,
    updateProfileWithAvatar,
    clearError,
    clearSuccess,
  } = useProfile();

  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    interests: [],
    skills: [],
  });
  const [newInterest, setNewInterest] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);

  const defaultAvatar = "/images/default-avatar.png";

  useEffect(() => {
    if (viewedUser) {
      const userAvatar = viewedUser.profile?.avatar || "";
      setFormData({
        fullName: viewedUser.fullName || "",
        bio: viewedUser.profile?.bio || "",
        interests: viewedUser.profile?.interests || [],
        skills: viewedUser.profile?.skills || [],
      });
      setAvatarPreview(userAvatar || defaultAvatar);
    }
  }, [viewedUser]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        notificationService.error({
          title: "Lỗi",
          text: "File ảnh không được vượt quá 10MB",
          timer: 3000,
          showConfirmButton: false,
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        notificationService.error({
          title: "Lỗi",
          text: "Vui lòng chọn file ảnh hợp lệ (JPEG, PNG, GIF, WebP)",
          timer: 3000,
          showConfirmButton: false,
        });
        return;
      }

      setAvatarFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      setShowAvatarModal(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleAvatarClick = () => {
    setShowAvatarModal(true);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(defaultAvatar);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddInterest = () => {
    if (
      newInterest.trim() &&
      !formData.interests.includes(newInterest.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()],
      }));
      setNewInterest("");
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter(
        (interest) => interest !== interestToRemove
      ),
    }));
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitData = {
      fullName: formData.fullName,
      bio: formData.bio,
      interests: formData.interests,
      skills: formData.skills,
      avatar: avatarFile,
    };

    console.log("Submitting profile data:", submitData);

    const result = await updateProfileWithAvatar(submitData);

    if (result.success) {
      setAvatarFile(null);
      notificationService.success({
        title: "Thành công",
        text: "Cập nhật thông tin thành công!",
        timer: 3000,
        showConfirmButton: false,
      });
      setTimeout(() => {
        clearSuccess();
      }, 2000);
    } else {
      notificationService.error({
        title: "Lỗi",
        text: result.message || "Có lỗi xảy ra khi cập nhật",
        timer: 3000,
        showConfirmButton: false,
      });
    }
  };

  const handleCloseAlert = () => {
    clearError();
    clearSuccess();
  };

  if (!viewedUser) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="text-center">
          <div
            className="spinner-border text-primary mb-3"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="card-header bg-gradient-primary text-white py-4">
        <div className="d-flex align-items-center">
          <div className="flex-grow-1">
            <h4 className="mb-1 fw-bold">
              <i className="fas fa-user-edit me-2"></i>
              Chỉnh sửa trang cá nhân
            </h4>
            <p className="mb-0 opacity-75">
              Cập nhật thông tin và hình ảnh của bạn
            </p>
          </div>
          <div className="avatar-preview-sm">
            <img
              src={avatarPreview}
              className="rounded-circle border border-3 border-white"
              style={{
                width: "60px",
                height: "60px",
                objectFit: "cover",
              }}
              alt="Avatar preview"
            />
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        {/* Navigation Tabs */}
        <div className="border-bottom">
          <div className="container-fluid">
            <ul className="nav nav-pills nav-justified gap-2 p-3">
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "basic" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("basic")}
                >
                  <i className="fas fa-user me-2"></i>
                  Thông tin cơ bản
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "avatar" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("avatar")}
                >
                  <i className="fas fa-camera me-2"></i>
                  Ảnh đại diện
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "interests" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("interests")}
                >
                  <i className="fas fa-heart me-2"></i>
                  Sở thích & Kỹ năng
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Alerts */}
        <div className="container-fluid pt-4">
          {error && (
            <div className="alert alert-danger alert-dismissible fade show mb-4 border-0 shadow-sm">
              <div className="d-flex align-items-center">
                <i className="fas fa-exclamation-triangle me-3 fs-5"></i>
                <div className="flex-grow-1">
                  <h6 className="alert-heading mb-1">Có lỗi xảy ra!</h6>
                  <span className="small">{error}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={handleCloseAlert}
              ></button>
            </div>
          )}

          {updateSuccess && (
            <div className="alert alert-success alert-dismissible fade show mb-4 border-0 shadow-sm">
              <div className="d-flex align-items-center">
                <i className="fas fa-check-circle me-3 fs-5"></i>
                <div className="flex-grow-1">
                  <h6 className="alert-heading mb-1">Thành công!</h6>
                  <span className="small">
                    Thông tin đã được cập nhật thành công.
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={handleCloseAlert}
              ></button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="container-fluid pb-4">
            <div className="row">
              {/* Left Sidebar - Avatar & Quick Actions */}
              <div className="col-lg-4 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center p-4">
                    {/* Avatar Upload */}
                    <div className="position-relative d-inline-block mb-3">
                      <div
                        ref={dropAreaRef}
                        className={`avatar-upload-container ${
                          isDragging ? "dragging" : ""
                        } ${activeTab === "avatar" ? "active" : ""}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleAvatarClick}
                        style={{ cursor: "pointer" }}
                      >
                        <img
                          src={avatarPreview}
                          className="rounded-circle border-4 border-white shadow-lg"
                          style={{
                            width: "140px",
                            height: "140px",
                            objectFit: "cover",
                            transition: "all 0.3s ease",
                          }}
                          alt="Avatar"
                        />
                        <div className="avatar-overlay">
                          <div className="avatar-overlay-content">
                            <i className="fas fa-camera fa-lg mb-2"></i>
                            <small className="d-block">Đổi ảnh</small>
                          </div>
                        </div>
                      </div>

                      {viewedUser.isOnline && (
                        <span
                          className="position-absolute bottom-0 end-0 bg-success rounded-circle border-3 border-white"
                          style={{ width: "20px", height: "20px", zIndex: 3 }}
                        ></span>
                      )}
                    </div>

                    <h6 className="fw-bold text-dark mb-1">
                      {formData.fullName || "Chưa có tên"}
                    </h6>
                    <p className="text-muted small mb-3">
                      @{viewedUser.username}
                    </p>

                    <div className="d-grid gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={handleAvatarClick}
                      >
                        <i className="fas fa-camera me-2"></i>
                        Đổi ảnh đại diện
                      </button>
                      {avatarFile && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={handleRemoveAvatar}
                        >
                          <i className="fas fa-times me-2"></i>
                          Hủy ảnh mới
                        </button>
                      )}
                    </div>

                    {avatarFile && (
                      <div className="mt-3 p-2 bg-light rounded">
                        <small className="text-success">
                          <i className="fas fa-check-circle me-1"></i>
                          Ảnh mới: {avatarFile.name}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-4">
                    {/* Basic Info Tab */}
                    {activeTab === "basic" && (
                      <div className="tab-content">
                        <div className="mb-4">
                          <h6 className="fw-bold text-primary mb-3">
                            <i className="fas fa-id-card me-2"></i>
                            Thông tin cá nhân
                          </h6>

                          <div className="form-group mb-4">
                            <label className="form-label fw-semibold">
                              <i className="fas fa-user me-2 text-muted"></i>
                              Họ và tên *
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-lg border-0 bg-light"
                              name="fullName"
                              value={formData.fullName}
                              onChange={handleInputChange}
                              required
                              placeholder="Nhập họ và tên đầy đủ"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label fw-semibold">
                              <i className="fas fa-edit me-2 text-muted"></i>
                              Giới thiệu bản thân
                            </label>
                            <div className="position-relative">
                              <textarea
                                className="form-control border-0 bg-light"
                                rows="5"
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                placeholder="Hãy chia sẻ đôi điều về bản thân, sở thích, hoặc điều gì đó đặc biệt..."
                                maxLength="500"
                                style={{ resize: "none" }}
                              ></textarea>
                              <div className="d-flex justify-content-between align-items-center mt-2 px-2">
                                <small className="form-text text-muted">
                                  <i className="fas fa-lightbulb me-1"></i>
                                  Giúp mọi người hiểu hơn về bạn
                                </small>
                                <small
                                  className={`form-text ${
                                    formData.bio.length >= 480
                                      ? "text-warning"
                                      : "text-muted"
                                  }`}
                                >
                                  {formData.bio.length}/500
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Avatar Tab */}
                    {activeTab === "avatar" && (
                      <div className="tab-content text-center py-4">
                        <div className="mb-4">
                          <i className="fas fa-user-circle fa-4x text-primary mb-3"></i>
                          <h5 className="fw-bold">Tùy chỉnh ảnh đại diện</h5>
                          <p className="text-muted">
                            Chọn ảnh đại diện phù hợp để thể hiện cá tính của
                            bạn
                          </p>
                        </div>

                        <div
                          className={`drop-zone rounded-3 border-4 ${
                            isDragging
                              ? "border-primary bg-light"
                              : "border-dashed"
                          } p-5 mb-4`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          style={{ cursor: "pointer" }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <i className="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                          <h6 className="fw-semibold">Kéo thả ảnh vào đây</h6>
                          <p className="text-muted mb-3">hoặc</p>
                          <button
                            type="button"
                            className="btn btn-primary px-4"
                          >
                            <i className="fas fa-folder-open me-2"></i>
                            Chọn từ máy tính
                          </button>
                          <p className="small text-muted mt-3">
                            Hỗ trợ: JPEG, PNG, GIF, WebP • Tối đa: 10MB
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Interests & Skills Tab */}
                    {activeTab === "interests" && (
                      <div className="tab-content">
                        <div className="row">
                          {/* Interests */}
                          <div className="col-md-6 mb-4">
                            <h6 className="fw-bold text-primary mb-3">
                              <i className="fas fa-heart me-2"></i>
                              Sở thích
                            </h6>

                            <div className="d-flex mb-3">
                              <div className="input-group input-group-lg">
                                <input
                                  type="text"
                                  className="form-control border-0 bg-light"
                                  value={newInterest}
                                  onChange={(e) =>
                                    setNewInterest(e.target.value)
                                  }
                                  placeholder="Thêm sở thích..."
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddInterest();
                                    }
                                  }}
                                />
                                <button
                                  className="btn btn-primary"
                                  type="button"
                                  onClick={handleAddInterest}
                                  disabled={!newInterest.trim()}
                                >
                                  <i className="fas fa-plus"></i>
                                </button>
                              </div>
                            </div>

                            {formData.interests.length > 0 && (
                              <div className="d-flex flex-wrap gap-2">
                                {formData.interests.map((interest, index) => (
                                  <span
                                    key={index}
                                    className="badge bg-gradient-primary text-white d-flex align-items-center py-2 px-3 rounded-pill"
                                  >
                                    <i className="fas fa-heart me-2"></i>
                                    {interest}
                                    <button
                                      type="button"
                                      className="btn-close btn-close-white ms-2"
                                      style={{ fontSize: "0.6rem" }}
                                      onClick={() =>
                                        handleRemoveInterest(interest)
                                      }
                                      aria-label="Remove"
                                    ></button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Skills */}
                          <div className="col-md-6 mb-4">
                            <h6 className="fw-bold text-success mb-3">
                              <i className="fas fa-cogs me-2"></i>
                              Kỹ năng
                            </h6>

                            <div className="d-flex mb-3">
                              <div className="input-group input-group-lg">
                                <input
                                  type="text"
                                  className="form-control border-0 bg-light"
                                  value={newSkill}
                                  onChange={(e) => setNewSkill(e.target.value)}
                                  placeholder="Thêm kỹ năng..."
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddSkill();
                                    }
                                  }}
                                />
                                <button
                                  className="btn btn-success"
                                  type="button"
                                  onClick={handleAddSkill}
                                  disabled={!newSkill.trim()}
                                >
                                  <i className="fas fa-plus"></i>
                                </button>
                              </div>
                            </div>

                            {formData.skills.length > 0 && (
                              <div className="d-flex flex-wrap gap-2">
                                {formData.skills.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="badge bg-gradient-success text-white d-flex align-items-center py-2 px-3 rounded-pill"
                                  >
                                    <i className="fas fa-cog me-2"></i>
                                    {skill}
                                    <button
                                      type="button"
                                      className="btn-close btn-close-white ms-2"
                                      style={{ fontSize: "0.6rem" }}
                                      onClick={() => handleRemoveSkill(skill)}
                                      aria-label="Remove"
                                    ></button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="d-flex gap-3 justify-content-end mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={() => window.history.back()}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Quay lại
                  </button>
                  <button
                    className="btn btn-primary px-4 py-2 fw-semibold"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-gradient-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="fas fa-camera me-2"></i>
                  Cập nhật ảnh đại diện
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAvatarModal(false)}
                ></button>
              </div>
              <div className="modal-body text-center p-5">
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <div
                      className={`drop-zone rounded-3 border-4 ${
                        isDragging ? "border-primary bg-light" : "border-dashed"
                      } p-4`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      style={{ cursor: "pointer", minHeight: "200px" }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="fas fa-cloud-upload-alt fa-2x text-muted mb-3"></i>
                      <h6 className="fw-semibold">Kéo thả ảnh vào đây</h6>
                      <p className="text-muted small">hoặc nhấn để chọn file</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="avatar-preview-large">
                      <img
                        src={avatarPreview}
                        className="rounded-circle border shadow-lg"
                        style={{
                          width: "150px",
                          height: "150px",
                          objectFit: "cover",
                        }}
                        alt="Avatar preview"
                      />
                    </div>
                    <p className="text-muted small mt-3">Ảnh xem trước</p>
                  </div>
                </div>

                <div className="d-flex gap-2 justify-content-center mt-4">
                  <button
                    className="btn btn-primary px-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="fas fa-folder-open me-2"></i>
                    Chọn ảnh
                  </button>
                  {avatarFile && (
                    <button
                      className="btn btn-outline-danger"
                      onClick={handleRemoveAvatar}
                    >
                      <i className="fas fa-trash me-2"></i>
                      Xóa ảnh
                    </button>
                  )}
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setShowAvatarModal(false)}
                  >
                    <i className="fas fa-times me-2"></i>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/jpeg, image/jpg, image/png, image/gif, image/webp"
        style={{ display: "none" }}
      />
    </div>
  );
};

export default ProfileEdit;
