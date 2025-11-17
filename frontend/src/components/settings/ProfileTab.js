// // src/components/settings/ProfileTab.js
// import React, { useState, useRef } from "react";
// import { Card, Form, Button, Row, Col, Alert, Badge } from "react-bootstrap";
// import { accountService } from "../../services/accountService";

// const ProfileTab = ({ user, onUpdate }) => {
//   const [formData, setFormData] = useState({
//     fullName: user?.fullName || "",
//     bio: user?.profile?.bio || "",
//     location: user?.profile?.location || "",
//     interests: user?.profile?.interests?.join(", ") || "",
//     skills: user?.profile?.skills?.join(", ") || "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState({ type: "", text: "" });
//   const [avatarPreview, setAvatarPreview] = useState(
//     user?.profile?.avatar || "/assets/images/default-avatar.png"
//   );
//   const [coverPreview, setCoverPreview] = useState(
//     user?.profile?.coverPhoto || "/assets/images/default-cover.jpg"
//   );

//   const avatarInputRef = useRef(null);
//   const coverInputRef = useRef(null);
//   const [avatarFile, setAvatarFile] = useState(null);
//   const [coverFile, setCoverFile] = useState(null);

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleAvatarChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setAvatarFile(file);
//       const previewUrl = URL.createObjectURL(file);
//       setAvatarPreview(previewUrl);
//     }
//   };

//   const handleCoverChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setCoverFile(file);
//       const previewUrl = URL.createObjectURL(file);
//       setCoverPreview(previewUrl);
//     }
//   };

//   const triggerAvatarInput = () => {
//     avatarInputRef.current?.click();
//   };

//   const triggerCoverInput = () => {
//     coverInputRef.current?.click();
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage({ type: "", text: "" });

//     try {
//       const submitData = new FormData();

//       // Thêm dữ liệu text
//       submitData.append("fullName", formData.fullName);
//       submitData.append("bio", formData.bio);
//       submitData.append("location", formData.location);
//       submitData.append("interests", formData.interests);
//       submitData.append("skills", formData.skills);

//       // Thêm file nếu có
//       if (avatarFile) {
//         submitData.append("avatar", avatarFile);
//       }
//       if (coverFile) {
//         submitData.append("coverPhoto", coverFile);
//       }

//       await accountService.updateProfile(submitData);
//       setMessage({ type: "success", text: "Cập nhật hồ sơ thành công!" });

//       // Reset file states
//       setAvatarFile(null);
//       setCoverFile(null);

//       onUpdate();
//     } catch (error) {
//       setMessage({
//         type: "danger",
//         text:
//           error.response?.data?.message || "Có lỗi xảy ra khi cập nhật hồ sơ",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Card className="settings-card">
//       <Card.Header>
//         <h4 className="mb-0">
//           <i className="fas fa-user me-2"></i>
//           Thông Tin Hồ Sơ
//         </h4>
//       </Card.Header>
//       <Card.Body className="p-0">
//         {/* Cover Photo */}
//         <div className="cover-photo-section position-relative">
//           <div
//             className="cover-photo-preview position-relative"
//             style={{
//               height: "200px",
//               backgroundImage: `url(${coverPreview})`,
//               backgroundSize: "cover",
//               backgroundPosition: "center",
//               backgroundColor: "#f8f9fa",
//             }}
//           >
//             <div className="cover-photo-overlay position-absolute w-100 h-100 d-flex align-items-center justify-content-center">
//               <Button
//                 variant="outline-light"
//                 size="sm"
//                 onClick={triggerCoverInput}
//                 className="rounded-pill"
//               >
//                 <i className="fas fa-camera me-2"></i>
//                 Đổi ảnh bìa
//               </Button>
//             </div>
//           </div>

//           {/* Avatar Section */}
//           <div
//             className="avatar-section position-relative"
//             style={{ marginTop: "-50px" }}
//           >
//             <div className="d-flex align-items-end px-4">
//               <div className="avatar-upload position-relative">
//                 <img
//                   src={avatarPreview}
//                   alt="Avatar"
//                   className="avatar-preview rounded-circle border border-4 border-white"
//                   style={{
//                     width: "100px",
//                     height: "100px",
//                     objectFit: "cover",
//                   }}
//                 />
//                 <button
//                   type="button"
//                   className="avatar-upload-label btn btn-primary btn-sm rounded-circle position-absolute"
//                   style={{ bottom: "5px", right: "5px" }}
//                   onClick={triggerAvatarInput}
//                 >
//                   <i className="fas fa-camera"></i>
//                 </button>
//               </div>

//               <div className="ms-3 mb-2 text-white">
//                 <h4 className="mb-1">{user?.fullName || user?.username}</h4>
//                 <p className="mb-1">@{user?.username}</p>
//                 <Badge bg={user?.role === "admin" ? "danger" : "primary"}>
//                   {user?.role}
//                 </Badge>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* File Inputs (hidden) */}
//         <input
//           type="file"
//           ref={avatarInputRef}
//           onChange={handleAvatarChange}
//           accept="image/*"
//           style={{ display: "none" }}
//         />
//         <input
//           type="file"
//           ref={coverInputRef}
//           onChange={handleCoverChange}
//           accept="image/*"
//           style={{ display: "none" }}
//         />

//         {/* Form */}
//         <div className="p-4">
//           {message.text && (
//             <Alert
//               variant={message.type}
//               dismissible
//               onClose={() => setMessage({ type: "", text: "" })}
//             >
//               {message.text}
//             </Alert>
//           )}

//           <Form onSubmit={handleSubmit}>
//             <Row>
//               <Col md={6}>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Tên đầy đủ</Form.Label>
//                   <Form.Control
//                     type="text"
//                     name="fullName"
//                     value={formData.fullName}
//                     onChange={handleChange}
//                     placeholder="Nhập tên đầy đủ"
//                   />
//                 </Form.Group>
//               </Col>
//               <Col md={6}>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Địa điểm</Form.Label>
//                   <Form.Control
//                     type="text"
//                     name="location"
//                     value={formData.location}
//                     onChange={handleChange}
//                     placeholder="Nhập địa điểm"
//                   />
//                 </Form.Group>
//               </Col>
//             </Row>

//             <Form.Group className="mb-3">
//               <Form.Label>Giới thiệu bản thân</Form.Label>
//               <Form.Control
//                 as="textarea"
//                 rows={3}
//                 name="bio"
//                 value={formData.bio}
//                 onChange={handleChange}
//                 placeholder="Giới thiệu về bản thân..."
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Sở thích (phân cách bằng dấu phẩy)</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="interests"
//                 value={formData.interests}
//                 onChange={handleChange}
//                 placeholder="Ví dụ: Đọc sách, Du lịch, Âm nhạc..."
//               />
//             </Form.Group>

//             <Form.Group className="mb-4">
//               <Form.Label>Kỹ năng (phân cách bằng dấu phẩy)</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="skills"
//                 value={formData.skills}
//                 onChange={handleChange}
//                 placeholder="Ví dụ: JavaScript, React, Node.js..."
//               />
//             </Form.Group>

//             <div className="d-flex justify-content-end">
//               <Button variant="primary" type="submit" disabled={loading}>
//                 {loading ? (
//                   <>
//                     <span className="spinner-border spinner-border-sm me-2"></span>
//                     Đang cập nhật...
//                   </>
//                 ) : (
//                   <>
//                     <i className="fas fa-save me-2"></i>
//                     Cập Nhật Hồ Sơ
//                   </>
//                 )}
//               </Button>
//             </div>
//           </Form>
//         </div>
//       </Card.Body>
//     </Card>
//   );
// };

// export default ProfileTab;

// src/components/settings/ProfileTab.js
import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  Form,
  Button,
  Row,
  Col,
  Alert,
  Badge,
  Modal,
} from "react-bootstrap";
import { accountService } from "../../services/accountService";
import { getImagesByCategoryActive } from "../../services/imageService";

const ProfileTab = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    bio: user?.profile?.bio || "",
    location: user?.profile?.location || "",
    interests: user?.profile?.interests?.join(", ") || "",
    skills: user?.profile?.skills?.join(", ") || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // States for images
  const [avatarPreview, setAvatarPreview] = useState(
    user?.profile?.avatar || ""
  );
  const [coverPreview, setCoverPreview] = useState(
    user?.profile?.coverPhoto || "/assets/images/default-cover.jpg"
  );
  const [imageCover, setImageCover] = useState("");
  const [imageAvatar, setImageAvatar] = useState("");

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  // States for cover photo modal
  const [showModalUpdateCoverPhoto, setShowModalUpdateCoverPhoto] =
    useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Load default images
  const loadImageDefault = async () => {
    try {
      const resBanner = await getImagesByCategoryActive("BannerUser");
      if (resBanner.success) {
        setImageCover(resBanner.image?.file.path || "");
      }
      const resAvatar = await getImagesByCategoryActive("AvatarUser");
      if (resAvatar.success) {
        setImageAvatar(resAvatar.image?.file.path || "");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadImageDefault();
  }, []);

  const getBackgroundStyle = (user) => {
    return user?.profile?.coverPhoto
      ? {
          backgroundImage: `url("${user.profile.coverPhoto}")`,
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : imageCover
      ? {
          backgroundImage: `url("${imageCover}")`,
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : {
          backgroundImage:
            "linear-gradient(135deg, #667eea 0%, #674ba2ff 100%)",
        };
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);
    }
  };

  const triggerAvatarInput = () => {
    avatarInputRef.current?.click();
  };

  const triggerCoverInput = () => {
    coverInputRef.current?.click();
  };

  const handleFileClickCover = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const selectFile = e.target.files[0];
    setFile(selectFile);
  };

  const handleSubmitCover = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Bạn chưa chọn ảnh!");
      return;
    }

    try {
      setUploading(true);
      const submitData = new FormData();
      submitData.append("coverPhoto", file);

      await accountService.updateProfile(submitData);
      setShowModalUpdateCoverPhoto(false);
      setFile(null);
      setPreviewImage(null);

      // Update local preview
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);

      setMessage({ type: "success", text: "Cập nhật ảnh bìa thành công!" });
      onUpdate();
    } catch (error) {
      setMessage({
        type: "danger",
        text:
          error.response?.data?.message || "Có lỗi xảy ra khi cập nhật ảnh bìa",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const submitData = new FormData();

      // Thêm dữ liệu text
      submitData.append("fullName", formData.fullName);
      submitData.append("bio", formData.bio);
      submitData.append("location", formData.location);
      submitData.append("interests", formData.interests);
      submitData.append("skills", formData.skills);

      // Thêm file nếu có
      if (avatarFile) {
        submitData.append("avatar", avatarFile);
      }
      if (coverFile) {
        submitData.append("coverPhoto", coverFile);
      }

      await accountService.updateProfile(submitData);
      setMessage({ type: "success", text: "Cập nhật hồ sơ thành công!" });

      // Reset file states
      setAvatarFile(null);
      setCoverFile(null);

      onUpdate();
    } catch (error) {
      setMessage({
        type: "danger",
        text:
          error.response?.data?.message || "Có lỗi xảy ra khi cập nhật hồ sơ",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    }
  }, [file]);

  return (
    <Card className="settings-card">
      {/* <Card.Header>
        <h4 className="mb-0">
          <i className="fas fa-user me-2"></i>
          Thông Tin Hồ Sơ
        </h4>
      </Card.Header> */}
      <Card.Body className="p-0">
        {/* Cover Photo Section - Giống ProfileView */}
        <div
          className="profile-header position-relative"
          style={{
            ...getBackgroundStyle(user),
            height: "300px",
            position: "relative",
          }}
        >
          <div className="profile-cover" style={{ height: "100%" }}>
            <button
              className="btn btn-light btn-sm position-absolute top-0 end-0 m-3"
              onClick={() => setShowModalUpdateCoverPhoto(true)}
            >
              <i className="fas fa-camera me-1"></i>
              Thay ảnh bìa
            </button>
          </div>

          {/* Avatar Section */}
          <div className="avatar-section position-relative">
            <div className="container">
              <div className="row">
                <div className="col-md-4 text-center">
                  <div className="avatar-container position-relative d-inline-block">
                    <img
                      src={
                        avatarPreview ||
                        imageAvatar ||
                        "/assets/images/default-avatar.png"
                      }
                      className="rounded-circle border-4 border-white shadow-lg"
                      style={{
                        width: "125px",
                        height: "125px",
                        objectFit: "cover",
                        marginTop: "-130px",
                        position: "relative",
                        zIndex: 2,
                      }}
                      alt="Avatar"
                      onError={(e) => {
                        e.target.src = "/assets/images/default-avatar.png";
                      }}
                    />
                    <button
                      type="button"
                      className="avatar-upload-label btn btn-primary btn-sm rounded-circle position-absolute"
                      style={{ bottom: "8px", right: "13px", zIndex: 3 }}
                      onClick={triggerAvatarInput}
                    >
                      <i className="fas fa-camera"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* File Inputs (hidden) */}
        <input
          type="file"
          ref={avatarInputRef}
          onChange={handleAvatarChange}
          accept="image/*"
          style={{ display: "none" }}
        />
        <input
          type="file"
          ref={coverInputRef}
          onChange={handleCoverChange}
          accept="image/*"
          style={{ display: "none" }}
        />

        {/* Modal Thay đổi ảnh bìa */}
        <Modal
          show={showModalUpdateCoverPhoto}
          onHide={() => setShowModalUpdateCoverPhoto(false)}
          centered
          scrollable
          animation
          dialogClassName="rounded-4"
          contentClassName="shadow-lg border border-2"
          backdropClassName="bg-dark bg-opacity-75"
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>Thay đổi hình nền</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <form onSubmit={handleSubmitCover}>
              <div className="d-flex flex-column align-items-center">
                <button
                  type="button"
                  className="btn btn-outline-primary d-flex align-items-center gap-2 px-3 py-2"
                  onClick={handleFileClickCover}
                >
                  <i className="fas fa-camera"></i>
                  <span>Chọn ảnh bìa</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileChange}
                />

                {previewImage && (
                  <div className="mt-3 position-relative w-100 text-center">
                    <img
                      src={previewImage}
                      alt="Xem trước"
                      className="img-fluid rounded shadow-sm"
                      style={{ maxHeight: "250px", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                      onClick={() => setPreviewImage(null)}
                      title="Xóa ảnh"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 text-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowModalUpdateCoverPhoto(false)}
                  className="me-2"
                >
                  Đóng
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={uploading || !file}
                >
                  {uploading ? "Đang tải lên..." : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          </Modal.Body>
        </Modal>

        {/* Form */}
        <div className="p-4 pt-1">
          {message.text && (
            <Alert
              variant={message.type}
              dismissible
              onClose={() => setMessage({ type: "", text: "" })}
            >
              {message.text}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên đầy đủ</Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nhập tên đầy đủ"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Địa điểm</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Nhập địa điểm"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Giới thiệu bản thân</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Giới thiệu về bản thân..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Sở thích (phân cách bằng dấu phẩy)</Form.Label>
              <Form.Control
                type="text"
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                placeholder="Ví dụ: Đọc sách, Du lịch, Âm nhạc..."
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Kỹ năng (phân cách bằng dấu phẩy)</Form.Label>
              <Form.Control
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="Ví dụ: JavaScript, React, Node.js..."
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Cập Nhật Hồ Sơ
                  </>
                )}
              </Button>
            </div>
          </Form>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProfileTab;
