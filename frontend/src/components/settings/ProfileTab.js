// // src/components/settings/ProfileTab.js
// import React, { useState } from "react";
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

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage({ type: "", text: "" });

//     try {
//       const submitData = {
//         ...formData,
//         interests: formData.interests
//           .split(",")
//           .map((item) => item.trim())
//           .filter((item) => item),
//         skills: formData.skills
//           .split(",")
//           .map((item) => item.trim())
//           .filter((item) => item),
//       };

//       await accountService.updateProfile(submitData);
//       setMessage({ type: "success", text: "Cập nhật hồ sơ thành công!" });
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
//       <Card.Body>
//         {/* {message.text && <Alert variant={message.type}>{message.text}</Alert>} */}
//         {message.text && (
//           <Alert
//             variant={message.type} // ví dụ: 'success', 'danger', 'warning'
//             dismissible // cho phép hiển thị nút tắt
//             onClose={() => setMessage({ type: "", text: "" })} // xử lý khi người dùng bấm tắt
//           >
//             {message.text}
//           </Alert>
//         )}

//         <div className="d-flex align-items-center mb-4">
//           <div className="avatar-upload me-4">
//             <img
//               src={user?.profile?.avatar || "/assets/images/default-avatar.png"}
//               alt="Avatar"
//               className="avatar-preview"
//             />
//             <label htmlFor="avatar-upload" className="avatar-upload-label">
//               <i className="fas fa-camera"></i>
//             </label>
//             <input type="file" id="avatar-upload" style={{ display: "none" }} />
//           </div>
//           <div>
//             <h4>{user?.fullName || user?.username}</h4>
//             <p className="text-muted mb-1">@{user?.username}</p>
//             <Badge bg={user?.role === "admin" ? "danger" : "primary"}>
//               {user?.role}
//             </Badge>
//           </div>
//         </div>

//         <Form onSubmit={handleSubmit}>
//           <Row>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Tên đầy đủ</Form.Label>
//                 <Form.Control
//                   type="text"
//                   name="fullName"
//                   value={formData.fullName}
//                   onChange={handleChange}
//                   placeholder="Nhập tên đầy đủ"
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Địa điểm</Form.Label>
//                 <Form.Control
//                   type="text"
//                   name="location"
//                   value={formData.location}
//                   onChange={handleChange}
//                   placeholder="Nhập địa điểm"
//                 />
//               </Form.Group>
//             </Col>
//           </Row>

//           <Form.Group className="mb-3">
//             <Form.Label>Giới thiệu bản thân</Form.Label>
//             <Form.Control
//               as="textarea"
//               rows={3}
//               name="bio"
//               value={formData.bio}
//               onChange={handleChange}
//               placeholder="Giới thiệu về bản thân..."
//             />
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Sở thích (phân cách bằng dấu phẩy)</Form.Label>
//             <Form.Control
//               type="text"
//               name="interests"
//               value={formData.interests}
//               onChange={handleChange}
//               placeholder="Ví dụ: Đọc sách, Du lịch, Âm nhạc..."
//             />
//           </Form.Group>

//           <Form.Group className="mb-4">
//             <Form.Label>Kỹ năng (phân cách bằng dấu phẩy)</Form.Label>
//             <Form.Control
//               type="text"
//               name="skills"
//               value={formData.skills}
//               onChange={handleChange}
//               placeholder="Ví dụ: JavaScript, React, Node.js..."
//             />
//           </Form.Group>

//           <div className="d-flex justify-content-end">
//             <Button variant="primary" type="submit" disabled={loading}>
//               {loading ? (
//                 <>
//                   <span className="spinner-border spinner-border-sm me-2"></span>
//                   Đang cập nhật...
//                 </>
//               ) : (
//                 <>
//                   <i className="fas fa-save me-2"></i>
//                   Cập Nhật Hồ Sơ
//                 </>
//               )}
//             </Button>
//           </div>
//         </Form>
//       </Card.Body>
//     </Card>
//   );
// };

// export default ProfileTab;

// src/components/settings/ProfileTab.js
import React, { useState, useRef } from "react";
import { Card, Form, Button, Row, Col, Alert, Badge } from "react-bootstrap";
import { accountService } from "../../services/accountService";

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
  const [avatarPreview, setAvatarPreview] = useState(
    user?.profile?.avatar || "/assets/images/default-avatar.png"
  );
  const [coverPreview, setCoverPreview] = useState(
    user?.profile?.coverPhoto || "/assets/images/default-cover.jpg"
  );

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

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

  return (
    <Card className="settings-card">
      <Card.Header>
        <h4 className="mb-0">
          <i className="fas fa-user me-2"></i>
          Thông Tin Hồ Sơ
        </h4>
      </Card.Header>
      <Card.Body className="p-0">
        {/* Cover Photo */}
        <div className="cover-photo-section position-relative">
          <div
            className="cover-photo-preview position-relative"
            style={{
              height: "200px",
              backgroundImage: `url(${coverPreview})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: "#f8f9fa",
            }}
          >
            <div className="cover-photo-overlay position-absolute w-100 h-100 d-flex align-items-center justify-content-center">
              <Button
                variant="outline-light"
                size="sm"
                onClick={triggerCoverInput}
                className="rounded-pill"
              >
                <i className="fas fa-camera me-2"></i>
                Đổi ảnh bìa
              </Button>
            </div>
          </div>

          {/* Avatar Section */}
          <div
            className="avatar-section position-relative"
            style={{ marginTop: "-50px" }}
          >
            <div className="d-flex align-items-end px-4">
              <div className="avatar-upload position-relative">
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="avatar-preview rounded-circle border border-4 border-white"
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                  }}
                />
                <button
                  type="button"
                  className="avatar-upload-label btn btn-primary btn-sm rounded-circle position-absolute"
                  style={{ bottom: "5px", right: "5px" }}
                  onClick={triggerAvatarInput}
                >
                  <i className="fas fa-camera"></i>
                </button>
              </div>

              <div className="ms-3 mb-2 text-white">
                <h4 className="mb-1">{user?.fullName || user?.username}</h4>
                <p className="mb-1">@{user?.username}</p>
                <Badge bg={user?.role === "admin" ? "danger" : "primary"}>
                  {user?.role}
                </Badge>
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

        {/* Form */}
        <div className="p-4">
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
