// import React, { useState, useEffect, useMemo } from "react";
// import {
//   Container,
//   Row,
//   Col,
//   Card,
//   Button,
//   Form,
//   Modal,
//   Nav,
//   Alert,
//   Badge,
//   InputGroup,
//   Dropdown,
//   Tooltip,
//   OverlayTrigger,
//   Spinner,
// } from "react-bootstrap";
// import * as imageService from "../../../services/imageService";
// import "./ImageManagement.css";

// const ImageManagement = () => {
//   const [images, setImages] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [selectedCategory, setSelectedCategory] = useState("all");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showModal, setShowModal] = useState(false);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [stats, setStats] = useState(null);
//   const [alert, setAlert] = useState({ show: false, message: "", type: "" });
//   const [viewMode, setViewMode] = useState("grid"); // grid or list
//   const [sortBy, setSortBy] = useState("newest");

//   // Form state
//   const [formData, setFormData] = useState({
//     title: "",
//     description: "",
//     category: "Other",
//     tags: "",
//     active: false,
//   });
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [uploadLoading, setUploadLoading] = useState(false);
//   const [dragOver, setDragOver] = useState(false);

//   const categories = [
//     { value: "all", label: "Tất cả", icon: "📁", color: "#6c757d" },
//     {
//       value: "BannerGroup",
//       label: "Banner Nhóm",
//       icon: "🏢",
//       color: "#007bff",
//     },
//     {
//       value: "AvartarGroup",
//       label: "Avatar Nhóm",
//       icon: "👥",
//       color: "#28a745",
//     },
//     { value: "AvatarUser", label: "Avatar User", icon: "👤", color: "#e83e8c" },
//     { value: "BannerUser", label: "Banner User", icon: "🎨", color: "#ffc107" },
//     { value: "Feed", label: "Feed", icon: "📰", color: "#17a2b8" },
//     { value: "Journal", label: "Journal", icon: "📔", color: "#6f42c1" },
//     { value: "Other", label: "Khác", icon: "📄", color: "#fd7e14" },
//   ];

//   // Filter and sort images
//   const filteredImages = useMemo(() => {
//     let filtered = images.filter((image) => {
//       const matchesCategory =
//         selectedCategory === "all" || image.category === selectedCategory;
//       const matchesSearch =
//         image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         image.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         image.tags?.some((tag) =>
//           tag.toLowerCase().includes(searchTerm.toLowerCase())
//         );
//       return matchesCategory && matchesSearch;
//     });

//     // Sort images
//     switch (sortBy) {
//       case "newest":
//         filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//         break;
//       case "oldest":
//         filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
//         break;
//       case "name":
//         filtered.sort((a, b) => a.title.localeCompare(b.title));
//         break;
//       case "size":
//         filtered.sort((a, b) => b.file.size - a.file.size);
//         break;
//       default:
//         break;
//     }

//     return filtered;
//   }, [images, selectedCategory, searchTerm, sortBy]);

//   // Hiển thị alert
//   const showAlert = (message, type = "success") => {
//     setAlert({ show: true, message, type });
//     setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
//   };

//   // Load images
//   const loadImages = async () => {
//     setLoading(true);
//     try {
//       const response = await imageService.getAllImages();
//       setImages(response.data.images);
//     } catch (error) {
//       console.error("Error loading images:", error);
//       showAlert("Lỗi khi tải danh sách hình ảnh", "danger");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Load stats
//   const loadStats = async () => {
//     try {
//       const response = await imageService.getImageStats();
//       setStats(response.data);
//     } catch (error) {
//       console.error("Error loading stats:", error);
//     }
//   };

//   useEffect(() => {
//     loadImages();
//     loadStats();
//   }, []);

//   const handleCategoryChange = (category) => {
//     setSelectedCategory(category);
//   };

//   const handleSearch = (e) => {
//     setSearchTerm(e.target.value);
//   };

//   const handleImageClick = (image) => {
//     setSelectedImage(image);
//     setShowModal(true);
//   };

//   const handleCloseModal = () => {
//     setShowModal(false);
//     setSelectedImage(null);
//   };

//   const handleCloseAddModal = () => {
//     setShowAddModal(false);
//     resetForm();
//   };

//   const handleCloseEditModal = () => {
//     setShowEditModal(false);
//     resetForm();
//     setSelectedImage(null);
//   };

//   const resetForm = () => {
//     setFormData({
//       title: "",
//       description: "",
//       category: "Other",
//       tags: "",
//       active: false,
//     });
//     setSelectedFile(null);
//     setDragOver(false);
//   };

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     processFile(file);
//   };

//   const processFile = (file) => {
//     if (file) {
//       // Kiểm tra loại file
//       if (!file.type.startsWith("image/")) {
//         showAlert("Vui lòng chọn file hình ảnh", "danger");
//         return;
//       }

//       // Kiểm tra kích thước file (max 10MB)
//       if (file.size > 10 * 1024 * 1024) {
//         showAlert("Kích thước file không được vượt quá 10MB", "danger");
//         return;
//       }

//       setSelectedFile(file);
//     }
//   };

//   // Drag and drop handlers
//   const handleDragOver = (e) => {
//     e.preventDefault();
//     setDragOver(true);
//   };

//   const handleDragLeave = (e) => {
//     e.preventDefault();
//     setDragOver(false);
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     setDragOver(false);
//     const file = e.dataTransfer.files[0];
//     processFile(file);
//   };

//   const handleAddImage = async (e) => {
//     e.preventDefault();
//     e.stopPropagation(); // Thêm dòng này

//     console.log("Add image clicked"); // Debug
//     if (!selectedFile) {
//       showAlert("Vui lòng chọn file hình ảnh", "danger");
//       return;
//     }

//     if (!formData.title.trim()) {
//       showAlert("Vui lòng nhập tiêu đề", "danger");
//       return;
//     }

//     setUploadLoading(true);
//     try {
//       const submitData = new FormData();
//       submitData.append("image", selectedFile);
//       submitData.append("title", formData.title);
//       submitData.append("description", formData.description);
//       submitData.append("category", formData.category);
//       submitData.append("tags", formData.tags);
//       submitData.append("active", formData.active.toString());

//       await imageService.createImage(submitData);

//       showAlert("Thêm hình ảnh thành công");
//       handleCloseAddModal();
//       loadImages();
//       loadStats();
//     } catch (error) {
//       console.error("Error adding image:", error);
//       showAlert("Lỗi khi thêm hình ảnh", "danger");
//     } finally {
//       setUploadLoading(false);
//     }
//   };

//   const handleEditImage = (image) => {
//     setSelectedImage(image);
//     setFormData({
//       title: image.title,
//       description: image.description || "",
//       category: image.category,
//       tags: image.tags ? image.tags.join(", ") : "",
//       active: image.active,
//     });
//     setShowEditModal(true);
//   };

//   const handleUpdateImage = async (e) => {
//     e.preventDefault();

//     if (!formData.title.trim()) {
//       showAlert("Vui lòng nhập tiêu đề", "danger");
//       return;
//     }

//     setUploadLoading(true);
//     try {
//       const submitData = new FormData();
//       if (selectedFile) {
//         submitData.append("image", selectedFile);
//       }
//       submitData.append("title", formData.title);
//       submitData.append("description", formData.description);
//       submitData.append("category", formData.category);
//       submitData.append("tags", formData.tags);
//       submitData.append("active", formData.active.toString());

//       await imageService.updateImage(selectedImage._id, submitData);

//       showAlert("Cập nhật hình ảnh thành công");
//       handleCloseEditModal();
//       loadImages();
//       loadStats();
//     } catch (error) {
//       console.error("Error updating image:", error);
//       showAlert("Lỗi khi cập nhật hình ảnh", "danger");
//     } finally {
//       setUploadLoading(false);
//     }
//   };

//   const handleDeleteImage = async (imageId) => {
//     if (!window.confirm("Bạn có chắc chắn muốn xóa hình ảnh này?")) {
//       return;
//     }

//     try {
//       await imageService.deleteImage(imageId);
//       showAlert("Xóa hình ảnh thành công");
//       handleCloseModal();
//       loadImages();
//       loadStats();
//     } catch (error) {
//       console.error("Error deleting image:", error);
//       showAlert("Lỗi khi xóa hình ảnh", "danger");
//     }
//   };

//   const handleToggleActive = async (imageId, currentActive) => {
//     try {
//       const submitData = new FormData();
//       submitData.append("active", (!currentActive).toString());

//       await imageService.updateImage(imageId, submitData);
//       showAlert(
//         currentActive ? "Đã tắt trạng thái active" : "Đã kích hoạt hình ảnh"
//       );

//       loadImages();
//       loadStats();
//     } catch (error) {
//       console.error("Error toggling active status:", error);
//       showAlert("Lỗi khi cập nhật trạng thái active", "danger");
//     }
//   };

//   const handleUseImage = async (image) => {
//     const imageUrl = getImageUrl(image);
//     try {
//       await navigator.clipboard.writeText(imageUrl);
//       showAlert("Đã sao chép URL hình ảnh vào clipboard");
//     } catch (error) {
//       showAlert("Không thể sao chép URL", "warning");
//     }
//   };

//   const getImageUrl = (image) => {
//     return `${process.env.REACT_APP_API_URL}${image.file.path}`;
//   };

//   const formatFileSize = (bytes) => {
//     if (bytes === 0) return "0 Bytes";
//     const k = 1024;
//     const sizes = ["Bytes", "KB", "MB", "GB"];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString("vi-VN", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   const getCategoryColor = (categoryValue) => {
//     return (
//       categories.find((c) => c.value === categoryValue)?.color || "#6c757d"
//     );
//   };

//   const QuickActions = ({ image }) => (
//     <div className="quick-actions">
//       <OverlayTrigger placement="top" overlay={<Tooltip>Sao chép URL</Tooltip>}>
//         <Button
//           variant="outline-primary"
//           size="sm"
//           onClick={() => handleUseImage(image)}
//         >
//           <i className="fas fa-link"></i>
//         </Button>
//       </OverlayTrigger>
//       <OverlayTrigger
//         placement="top"
//         overlay={
//           <Tooltip>{image.active ? "Tắt Active" : "Bật Active"}</Tooltip>
//         }
//       >
//         <Button
//           variant={image.active ? "outline-warning" : "outline-success"}
//           size="sm"
//           onClick={() => handleToggleActive(image._id, image.active)}
//         >
//           <i className={`fas ${image.active ? "fa-times" : "fa-check"}`}></i>
//         </Button>
//       </OverlayTrigger>
//       <OverlayTrigger placement="top" overlay={<Tooltip>Sửa</Tooltip>}>
//         <Button
//           variant="outline-info"
//           size="sm"
//           onClick={() => handleEditImage(image)}
//         >
//           <i className="fas fa-edit"></i>
//         </Button>
//       </OverlayTrigger>
//       <OverlayTrigger placement="top" overlay={<Tooltip>Xóa</Tooltip>}>
//         <Button
//           variant="outline-danger"
//           size="sm"
//           onClick={() => handleDeleteImage(image._id)}
//         >
//           <i className="fas fa-trash"></i>
//         </Button>
//       </OverlayTrigger>
//     </div>
//   );

//   return (
//     <Container className="container image-management">
//       {/* Alert */}
//       {alert.show && (
//         <Alert
//           variant={alert.type}
//           dismissible
//           className="alert-fixed"
//           onClose={() => setAlert({ show: false, message: "", type: "" })}
//         >
//           {alert.message}
//         </Alert>
//       )}

//       {/* Header */}
//       <div className="management-header">
//         <Row className="align-items-center">
//           <Col>
//             <div className="header-content">
//               <h1>
//                 <i className="fas fa-images me-3 text-primary"></i>
//                 Quản lý Hình ảnh
//               </h1>
//               <p className="text-muted mb-0">
//                 Quản lý hình ảnh mặc định cho các phần của trang web
//               </p>
//             </div>
//           </Col>
//           <Col xs="auto">
//             <Button
//               variant="primary"
//               size="lg"
//               onClick={() => setShowAddModal(true)}
//               className="add-btn"
//             >
//               <i className="fas fa-plus me-2"></i>
//               Thêm Hình ảnh
//             </Button>
//           </Col>
//         </Row>
//       </div>

//       {/* Stats Cards */}
//       {stats && (
//         <Row className="stats-row">
//           <Col xl={3} lg={6} className="mb-4">
//             <Card className="stat-card total-card">
//               <Card.Body>
//                 <div className="stat-content">
//                   <div className="stat-icon">
//                     <i className="fas fa-images"></i>
//                   </div>
//                   <div className="stat-info">
//                     <h3>{stats.totalImages}</h3>
//                     <p>Tổng số hình ảnh</p>
//                   </div>
//                 </div>
//               </Card.Body>
//             </Card>
//           </Col>
//           {stats.categoryStats.slice(0, 3).map((stat, index) => {
//             const category = categories.find((c) => c.value === stat._id);
//             return (
//               <Col xl={3} lg={6} key={index} className="mb-4">
//                 <Card className="stat-card category-card">
//                   <Card.Body>
//                     <div className="stat-content">
//                       <div
//                         className="stat-icon"
//                         style={{
//                           backgroundColor: category?.color + "20",
//                           color: category?.color,
//                         }}
//                       >
//                         <span>{category?.icon}</span>
//                       </div>
//                       <div className="stat-info">
//                         <h3>{stat.count}</h3>
//                         <p>{category?.label}</p>
//                       </div>
//                     </div>
//                   </Card.Body>
//                 </Card>
//               </Col>
//             );
//           })}
//         </Row>
//       )}

//       {/* Controls */}
//       <Card className="controls-card">
//         <Card.Body>
//           <Row className="align-items-center">
//             <Col md={4}>
//               <InputGroup>
//                 <InputGroup.Text>
//                   <i className="fas fa-search"></i>
//                 </InputGroup.Text>
//                 <Form.Control
//                   type="text"
//                   placeholder="Tìm kiếm hình ảnh..."
//                   value={searchTerm}
//                   onChange={handleSearch}
//                 />
//               </InputGroup>
//             </Col>
//             <Col md={4}>
//               <div className="view-controls">
//                 <Button
//                   variant={
//                     viewMode === "grid" ? "primary" : "outline-secondary"
//                   }
//                   size="sm"
//                   onClick={() => setViewMode("grid")}
//                 >
//                   <i className="fas fa-th"></i>
//                 </Button>
//                 <Button
//                   variant={
//                     viewMode === "list" ? "primary" : "outline-secondary"
//                   }
//                   size="sm"
//                   onClick={() => setViewMode("list")}
//                 >
//                   <i className="fas fa-list"></i>
//                 </Button>
//               </div>
//             </Col>
//             <Col md={4} className="text-end">
//               <Dropdown>
//                 <Dropdown.Toggle variant="outline-secondary" id="sort-dropdown">
//                   <i className="fas fa-sort me-2"></i>
//                   Sắp xếp:{" "}
//                   {sortBy === "newest"
//                     ? "Mới nhất"
//                     : sortBy === "oldest"
//                     ? "Cũ nhất"
//                     : sortBy === "name"
//                     ? "Tên"
//                     : "Kích thước"}
//                 </Dropdown.Toggle>
//                 <Dropdown.Menu>
//                   <Dropdown.Item onClick={() => setSortBy("newest")}>
//                     Mới nhất
//                   </Dropdown.Item>
//                   <Dropdown.Item onClick={() => setSortBy("oldest")}>
//                     Cũ nhất
//                   </Dropdown.Item>
//                   <Dropdown.Item onClick={() => setSortBy("name")}>
//                     Theo tên
//                   </Dropdown.Item>
//                   <Dropdown.Item onClick={() => setSortBy("size")}>
//                     Theo kích thước
//                   </Dropdown.Item>
//                 </Dropdown.Menu>
//               </Dropdown>
//             </Col>
//           </Row>
//         </Card.Body>
//       </Card>

//       {/* Category Filter */}
//       <Card className="category-filter-card">
//         <Card.Body>
//           <Nav className="category-nav">
//             {categories.map((category) => (
//               <Nav.Item key={category.value}>
//                 <Nav.Link
//                   active={selectedCategory === category.value}
//                   onClick={() => handleCategoryChange(category.value)}
//                   style={{
//                     borderLeft: `4px solid ${
//                       selectedCategory === category.value
//                         ? category.color
//                         : "transparent"
//                     }`,
//                   }}
//                 >
//                   <span className="category-icon me-2">{category.icon}</span>
//                   {category.label}
//                   {stats && (
//                     <Badge bg="light" text="dark" className="ms-2">
//                       {stats.categoryStats.find((s) => s._id === category.value)
//                         ?.count || 0}
//                     </Badge>
//                   )}
//                 </Nav.Link>
//               </Nav.Item>
//             ))}
//           </Nav>
//         </Card.Body>
//       </Card>

//       {/* Images Grid/List */}
//       {loading ? (
//         <div className="loading-state">
//           <Spinner animation="border" variant="primary" />
//           <p>Đang tải hình ảnh...</p>
//         </div>
//       ) : (
//         <>
//           {viewMode === "grid" ? (
//             <Row className="images-grid">
//               {filteredImages.map((image) => (
//                 <Col key={image._id} xl={3} lg={4} md={6} className="mb-4">
//                   <Card className="image-card h-100">
//                     <div className="image-container">
//                       <div
//                         className="image-preview"
//                         style={{
//                           backgroundImage: `url(${getImageUrl(image)})`,
//                         }}
//                         onClick={() => handleImageClick(image)}
//                       />
//                       {image.active && (
//                         <Badge bg="success" className="active-badge">
//                           <i className="fas fa-star me-1"></i>
//                           Active
//                         </Badge>
//                       )}
//                       <QuickActions image={image} />
//                     </div>
//                     <Card.Body>
//                       <Card.Title
//                         className="h6 text-truncate"
//                         title={image.title}
//                       >
//                         {image.title}
//                       </Card.Title>
//                       <Card.Text className="text-muted small image-description">
//                         {image.description || "Không có mô tả"}
//                       </Card.Text>
//                       <div className="image-meta">
//                         <Badge
//                           bg="light"
//                           text="dark"
//                           style={{
//                             borderLeft: `3px solid ${getCategoryColor(
//                               image.category
//                             )}`,
//                           }}
//                         >
//                           {
//                             categories.find((c) => c.value === image.category)
//                               ?.label
//                           }
//                         </Badge>
//                         <small className="text-muted">
//                           {formatFileSize(image.file.size)}
//                         </small>
//                       </div>
//                     </Card.Body>
//                   </Card>
//                 </Col>
//               ))}
//             </Row>
//           ) : (
//             <Card className="images-list-card">
//               <Card.Body>
//                 {filteredImages.map((image) => (
//                   <div key={image._id} className="list-item">
//                     <Row className="align-items-center">
//                       <Col md={1}>
//                         <div
//                           className="list-thumbnail"
//                           style={{
//                             backgroundImage: `url(${getImageUrl(image)})`,
//                           }}
//                           onClick={() => handleImageClick(image)}
//                         />
//                       </Col>
//                       <Col md={3}>
//                         <div className="list-title">
//                           <h6 className="mb-1">{image.title}</h6>
//                           <p className="text-muted small mb-0">
//                             {image.description}
//                           </p>
//                         </div>
//                       </Col>
//                       <Col md={2}>
//                         <Badge
//                           bg="light"
//                           text="dark"
//                           style={{
//                             borderLeft: `3px solid ${getCategoryColor(
//                               image.category
//                             )}`,
//                           }}
//                         >
//                           {
//                             categories.find((c) => c.value === image.category)
//                               ?.label
//                           }
//                         </Badge>
//                       </Col>
//                       <Col md={2}>
//                         <small className="text-muted">
//                           {formatFileSize(image.file.size)}
//                         </small>
//                       </Col>
//                       <Col md={2}>
//                         <small className="text-muted">
//                           {formatDate(image.createdAt)}
//                         </small>
//                       </Col>
//                       <Col md={2} className="text-end">
//                         <QuickActions image={image} />
//                       </Col>
//                     </Row>
//                   </div>
//                 ))}
//               </Card.Body>
//             </Card>
//           )}

//           {filteredImages.length === 0 && (
//             <div className="empty-state">
//               <i className="fas fa-image fa-4x text-muted mb-3"></i>
//               <h5>Không có hình ảnh nào</h5>
//               <p className="text-muted">Hãy thêm hình ảnh đầu tiên của bạn</p>
//               <Button variant="primary" onClick={() => setShowAddModal(true)}>
//                 <i className="fas fa-plus me-2"></i>
//                 Thêm Hình ảnh
//               </Button>
//             </div>
//           )}
//         </>
//       )}

//       {/* Image Detail Modal */}
//       <Modal
//         show={showModal}
//         onHide={handleCloseModal}
//         size="xl"
//         centered
//         className="image-detail-modal"
//       >
//         <Modal.Header closeButton>
//           <Modal.Title>
//             <i className="fas fa-image me-2 text-primary"></i>
//             Chi tiết Hình ảnh
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {selectedImage && (
//             <Row>
//               <Col lg={6}>
//                 <div className="detail-image-container">
//                   <img
//                     src={getImageUrl(selectedImage)}
//                     alt={selectedImage.title}
//                     className="detail-image"
//                   />
//                 </div>
//               </Col>
//               <Col lg={6}>
//                 <div className="detail-info">
//                   <h4>{selectedImage.title}</h4>
//                   <p className="text-muted">
//                     {selectedImage.description || "Không có mô tả"}
//                   </p>

//                   <div className="detail-grid">
//                     <div className="detail-item">
//                       <label>Trạng thái</label>
//                       <Badge
//                         bg={selectedImage.active ? "success" : "secondary"}
//                       >
//                         <i
//                           className={`fas ${
//                             selectedImage.active ? "fa-check" : "fa-times"
//                           } me-1`}
//                         ></i>
//                         {selectedImage.active ? "Đang Active" : "Inactive"}
//                       </Badge>
//                     </div>
//                     <div className="detail-item">
//                       <label>Danh mục</label>
//                       <Badge
//                         bg="light"
//                         text="dark"
//                         style={{
//                           borderLeft: `3px solid ${getCategoryColor(
//                             selectedImage.category
//                           )}`,
//                         }}
//                       >
//                         {
//                           categories.find(
//                             (c) => c.value === selectedImage.category
//                           )?.label
//                         }
//                       </Badge>
//                     </div>
//                     <div className="detail-item">
//                       <label>Kích thước</label>
//                       <span>{formatFileSize(selectedImage.file.size)}</span>
//                     </div>
//                     <div className="detail-item">
//                       <label>Định dạng</label>
//                       <span>{selectedImage.file.mimetype}</span>
//                     </div>
//                     <div className="detail-item">
//                       <label>Ngày tạo</label>
//                       <span>{formatDate(selectedImage.createdAt)}</span>
//                     </div>
//                   </div>

//                   {selectedImage.tags && selectedImage.tags.length > 0 && (
//                     <div className="detail-section">
//                       <label>Tags</label>
//                       <div className="tags-container">
//                         {selectedImage.tags.map((tag, index) => (
//                           <Badge
//                             key={index}
//                             bg="outline-secondary"
//                             className="tag-badge"
//                           >
//                             {tag}
//                           </Badge>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   <div className="action-buttons">
//                     <Button
//                       variant={selectedImage.active ? "warning" : "success"}
//                       onClick={() =>
//                         handleToggleActive(
//                           selectedImage._id,
//                           selectedImage.active
//                         )
//                       }
//                     >
//                       <i
//                         className={`fas ${
//                           selectedImage.active ? "fa-times" : "fa-check"
//                         } me-2`}
//                       ></i>
//                       {selectedImage.active ? "Tắt Active" : "Kích hoạt"}
//                     </Button>
//                     <Button
//                       variant="info"
//                       onClick={() => handleUseImage(selectedImage)}
//                     >
//                       <i className="fas fa-link me-2"></i>
//                       Sao chép URL
//                     </Button>
//                     <Button
//                       variant="primary"
//                       onClick={() => handleEditImage(selectedImage)}
//                     >
//                       <i className="fas fa-edit me-2"></i>
//                       Sửa
//                     </Button>
//                     <Button
//                       variant="danger"
//                       onClick={() => handleDeleteImage(selectedImage._id)}
//                     >
//                       <i className="fas fa-trash me-2"></i>
//                       Xóa
//                     </Button>
//                   </div>
//                 </div>
//               </Col>
//             </Row>
//           )}
//         </Modal.Body>
//       </Modal>

//       {/* Add Image Modal */}
//       <Modal
//         show={showAddModal}
//         onHide={handleCloseAddModal}
//         size="lg"
//         centered
//       >
//         <Modal.Header closeButton>
//           <Modal.Title>
//             <i className="fas fa-plus-circle me-2 text-success"></i>
//             Thêm Hình ảnh Mới
//           </Modal.Title>
//         </Modal.Header>
//         <Form onSubmit={handleAddImage}>
//           <Modal.Body>
//             <Row>
//               <Col md={6}>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Tiêu đề *</Form.Label>
//                   <Form.Control
//                     type="text"
//                     name="title"
//                     value={formData.title}
//                     onChange={handleInputChange}
//                     placeholder="Nhập tiêu đề hình ảnh"
//                     required
//                   />
//                 </Form.Group>

//                 <Form.Group className="mb-3">
//                   <Form.Label>Mô tả</Form.Label>
//                   <Form.Control
//                     as="textarea"
//                     rows={3}
//                     name="description"
//                     value={formData.description}
//                     onChange={handleInputChange}
//                     placeholder="Nhập mô tả hình ảnh"
//                   />
//                 </Form.Group>

//                 <Form.Group className="mb-3">
//                   <Form.Label>Danh mục *</Form.Label>
//                   <Form.Select
//                     name="category"
//                     value={formData.category}
//                     onChange={handleInputChange}
//                     required
//                   >
//                     {categories
//                       .filter((c) => c.value !== "all")
//                       .map((category) => (
//                         <option key={category.value} value={category.value}>
//                           {category.icon} {category.label}
//                         </option>
//                       ))}
//                   </Form.Select>
//                 </Form.Group>

//                 <Form.Group className="mb-3">
//                   <Form.Label>Tags</Form.Label>
//                   <Form.Control
//                     type="text"
//                     name="tags"
//                     value={formData.tags}
//                     onChange={handleInputChange}
//                     placeholder="Nhập tags, phân cách bằng dấu phẩy"
//                   />
//                   <Form.Text className="text-muted">
//                     Ví dụ: banner, background, nature
//                   </Form.Text>
//                 </Form.Group>

//                 <Form.Group className="mb-3">
//                   <Form.Check
//                     type="checkbox"
//                     name="active"
//                     label="Kích hoạt hình ảnh này (sẽ tắt tất cả hình ảnh khác cùng danh mục)"
//                     checked={formData.active}
//                     onChange={handleInputChange}
//                   />
//                 </Form.Group>
//               </Col>
//               <Col md={6}>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Hình ảnh *</Form.Label>
//                   <div
//                     className={`file-upload-area ${
//                       dragOver ? "drag-over" : ""
//                     } ${selectedFile ? "has-file" : ""}`}
//                     onDragOver={handleDragOver}
//                     onDragLeave={handleDragLeave}
//                     onDrop={handleDrop}
//                   >
//                     <div className="upload-content">
//                       <i className="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
//                       <p>Kéo thả file vào đây hoặc click để chọn</p>
//                       <small className="text-muted">
//                         Hỗ trợ: JPG, PNG, GIF (tối đa 10MB)
//                       </small>
//                       <Form.Control
//                         type="file"
//                         accept="image/*"
//                         onChange={handleFileChange}
//                         required
//                         className="file-input"
//                       />
//                     </div>
//                   </div>
//                 </Form.Group>

//                 {selectedFile && (
//                   <Card className="file-preview-card">
//                     <Card.Body>
//                       <div className="file-preview">
//                         <img
//                           src={URL.createObjectURL(selectedFile)}
//                           alt="Preview"
//                           className="preview-image"
//                         />
//                         <div className="file-info">
//                           <strong>{selectedFile.name}</strong>
//                           <small className="text-muted d-block">
//                             Kích thước: {formatFileSize(selectedFile.size)}
//                           </small>
//                           <small className="text-muted">
//                             Loại: {selectedFile.type}
//                           </small>
//                         </div>
//                       </div>
//                     </Card.Body>
//                   </Card>
//                 )}
//               </Col>
//             </Row>
//           </Modal.Body>
//           <Modal.Footer>
//             <Button variant="outline-secondary" onClick={handleCloseAddModal}>
//               <i className="fas fa-times me-2"></i>
//               Hủy
//             </Button>
//             <Button variant="primary" type="submit" disabled={uploadLoading}>
//               {uploadLoading ? (
//                 <>
//                   <Spinner animation="border" size="sm" className="me-2" />
//                   Đang tải lên...
//                 </>
//               ) : (
//                 <>
//                   <i className="fas fa-plus me-2"></i>
//                   Thêm Hình ảnh
//                 </>
//               )}
//             </Button>
//           </Modal.Footer>
//         </Form>
//       </Modal>

//       {/* Edit Image Modal - Similar structure to Add Modal */}
//       <Modal
//         show={showEditModal}
//         onHide={handleCloseEditModal}
//         size="lg"
//         centered
//       >
//         <Modal.Header closeButton>
//           <Modal.Title>
//             <i className="fas fa-edit me-2 text-warning"></i>
//             Sửa Hình ảnh
//           </Modal.Title>
//         </Modal.Header>
//         <Form onSubmit={handleUpdateImage}>
//           <Modal.Body>
//             {/* Similar content to Add Modal but with current values */}
//             <Row>
//               <Col md={6}>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Tiêu đề *</Form.Label>
//                   <Form.Control
//                     type="text"
//                     name="title"
//                     value={formData.title}
//                     onChange={handleInputChange}
//                     placeholder="Nhập tiêu đề hình ảnh"
//                     required
//                   />
//                 </Form.Group>

//                 <Form.Group className="mb-3">
//                   <Form.Label>Mô tả</Form.Label>
//                   <Form.Control
//                     as="textarea"
//                     rows={3}
//                     name="description"
//                     value={formData.description}
//                     onChange={handleInputChange}
//                     placeholder="Nhập mô tả hình ảnh"
//                   />
//                 </Form.Group>

//                 <Form.Group className="mb-3">
//                   <Form.Label>Danh mục *</Form.Label>
//                   <Form.Select
//                     name="category"
//                     value={formData.category}
//                     onChange={handleInputChange}
//                     required
//                   >
//                     {categories
//                       .filter((c) => c.value !== "all")
//                       .map((category) => (
//                         <option key={category.value} value={category.value}>
//                           {category.icon} {category.label}
//                         </option>
//                       ))}
//                   </Form.Select>
//                 </Form.Group>

//                 <Form.Group className="mb-3">
//                   <Form.Label>Tags</Form.Label>
//                   <Form.Control
//                     type="text"
//                     name="tags"
//                     value={formData.tags}
//                     onChange={handleInputChange}
//                     placeholder="Nhập tags, phân cách bằng dấu phẩy"
//                   />
//                 </Form.Group>

//                 <Form.Group className="mb-3">
//                   <Form.Check
//                     type="checkbox"
//                     name="active"
//                     label="Kích hoạt hình ảnh này"
//                     checked={formData.active}
//                     onChange={handleInputChange}
//                   />
//                 </Form.Group>
//               </Col>
//               <Col md={6}>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Hình ảnh mới (tùy chọn)</Form.Label>
//                   <div
//                     className={`file-upload-area ${
//                       dragOver ? "drag-over" : ""
//                     } ${selectedFile ? "has-file" : ""}`}
//                     onDragOver={handleDragOver}
//                     onDragLeave={handleDragLeave}
//                     onDrop={handleDrop}
//                   >
//                     <div className="upload-content">
//                       <i className="fas fa-sync-alt fa-3x text-muted mb-3"></i>
//                       <p>Kéo thả file mới vào đây hoặc click để chọn</p>
//                       <small className="text-muted">
//                         Để trống nếu không muốn thay đổi
//                       </small>
//                       <Form.Control
//                         type="file"
//                         accept="image/*"
//                         onChange={handleFileChange}
//                         className="file-input"
//                       />
//                     </div>
//                   </div>
//                 </Form.Group>

//                 {selectedFile && (
//                   <Card className="file-preview-card">
//                     <Card.Body>
//                       <div className="file-preview">
//                         <img
//                           src={URL.createObjectURL(selectedFile)}
//                           alt="Preview"
//                           className="preview-image"
//                         />
//                         <div className="file-info">
//                           <strong>File mới: {selectedFile.name}</strong>
//                           <small className="text-muted d-block">
//                             Kích thước: {formatFileSize(selectedFile.size)}
//                           </small>
//                         </div>
//                       </div>
//                     </Card.Body>
//                   </Card>
//                 )}

//                 {selectedImage && !selectedFile && (
//                   <Card className="current-file-card">
//                     <Card.Body>
//                       <div className="file-preview">
//                         <img
//                           src={getImageUrl(selectedImage)}
//                           alt="Current"
//                           className="preview-image"
//                         />
//                         <div className="file-info">
//                           <strong>File hiện tại</strong>
//                           <small className="text-muted d-block">
//                             {selectedImage.file.originalName}
//                           </small>
//                           <small className="text-muted">
//                             Kích thước:{" "}
//                             {formatFileSize(selectedImage.file.size)}
//                           </small>
//                         </div>
//                       </div>
//                     </Card.Body>
//                   </Card>
//                 )}
//               </Col>
//             </Row>
//           </Modal.Body>
//           <Modal.Footer>
//             <Button variant="outline-secondary" onClick={handleCloseEditModal}>
//               <i className="fas fa-times me-2"></i>
//               Hủy
//             </Button>
//             <Button variant="primary" type="submit" disabled={uploadLoading}>
//               {uploadLoading ? (
//                 <>
//                   <Spinner animation="border" size="sm" className="me-2" />
//                   Đang cập nhật...
//                 </>
//               ) : (
//                 <>
//                   <i className="fas fa-save me-2"></i>
//                   Cập nhật
//                 </>
//               )}
//             </Button>
//           </Modal.Footer>
//         </Form>
//       </Modal>
//     </Container>
//   );
// };

// export default ImageManagement;

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  Nav,
  Alert,
  Badge,
  InputGroup,
  Dropdown,
  Tooltip,
  OverlayTrigger,
  Spinner,
} from "react-bootstrap";
import * as imageService from "../../../services/imageService";
import "./ImageManagement.css";

const ImageManagement = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [stats, setStats] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Other",
    tags: "",
    active: false,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Refs
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const categories = [
    {
      value: "all",
      label: "Tất cả",
      icon: <i className="fas fa-folder"></i>,
      color: "#6c757d",
    },
    {
      value: "BannerGroup",
      label: "Banner Nhóm",
      icon: <i className="fas fa-building"></i>,
      color: "#007bff",
    },
    {
      value: "AvartarGroup",
      label: "Avatar Nhóm",
      icon: <i className="fas fa-users"></i>,
      color: "#28a745",
    },
    {
      value: "AvatarUser",
      label: "Avatar User",
      icon: <i className="fas fa-user"></i>,
      color: "#e83e8c",
    },
    {
      value: "BannerUser",
      label: "Banner User",
      icon: <i className="fas fa-paint-brush"></i>,
      color: "#ffc107",
    },
    {
      value: "Feed",
      label: "Feed",
      icon: <i className="fas fa-newspaper"></i>,
      color: "#17a2b8",
    },
    {
      value: "Journal",
      label: "Journal",
      icon: <i className="fas fa-book"></i>,
      color: "#6f42c1",
    },
    {
      value: "Other",
      label: "Khác",
      icon: <i className="fas fa-file-alt"></i>,
      color: "#fd7e14",
    },
  ];

  // Filter and sort images
  const filteredImages = useMemo(() => {
    let filtered = images.filter((image) => {
      const matchesCategory =
        selectedCategory === "all" || image.category === selectedCategory;
      const matchesSearch =
        image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.tags?.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });

    // Sort images
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "name":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "size":
        filtered.sort((a, b) => b.file.size - a.file.size);
        break;
      default:
        break;
    }

    return filtered;
  }, [images, selectedCategory, searchTerm, sortBy]);

  // Hiển thị alert
  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
  };

  // Load images
  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await imageService.getAllImages();
      setImages(response.data.images);
    } catch (error) {
      console.error("Error loading images:", error);
      showAlert("Lỗi khi tải danh sách hình ảnh", "danger");
    } finally {
      setLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const response = await imageService.getImageStats();
      setStats(response.data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  useEffect(() => {
    loadImages();
    loadStats();
  }, []);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedImage(null);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    resetForm();
    setSelectedImage(null);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "Other",
      tags: "",
      active: false,
    });
    setSelectedFile(null);
    setDragOver(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Upload area click handlers
  const handleUploadAreaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleEditUploadAreaClick = () => {
    if (editFileInputRef.current) {
      editFileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (file) {
      // Kiểm tra loại file
      if (!file.type.startsWith("image/")) {
        showAlert("Vui lòng chọn file hình ảnh", "danger");
        return;
      }

      // Kiểm tra kích thước file (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showAlert("Kích thước file không được vượt quá 10MB", "danger");
        return;
      }

      setSelectedFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleAddImage = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      showAlert("Vui lòng chọn file hình ảnh", "danger");
      return;
    }

    if (!formData.title.trim()) {
      showAlert("Vui lòng nhập tiêu đề", "danger");
      return;
    }

    setUploadLoading(true);
    try {
      const submitData = new FormData();
      submitData.append("image", selectedFile);
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("category", formData.category);
      submitData.append("tags", formData.tags);
      submitData.append("active", formData.active.toString());

      await imageService.createImage(submitData);

      showAlert("Thêm hình ảnh thành công");
      handleCloseAddModal();
      loadImages();
      loadStats();
    } catch (error) {
      console.error("Error adding image:", error);
      showAlert("Lỗi khi thêm hình ảnh", "danger");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleEditImage = (image) => {
    setSelectedImage(image);
    setFormData({
      title: image.title,
      description: image.description || "",
      category: image.category,
      tags: image.tags ? image.tags.join(", ") : "",
      active: image.active,
    });
    setShowEditModal(true);
  };

  const handleUpdateImage = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showAlert("Vui lòng nhập tiêu đề", "danger");
      return;
    }

    setUploadLoading(true);
    try {
      const submitData = new FormData();
      if (selectedFile) {
        submitData.append("image", selectedFile);
      }
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("category", formData.category);
      submitData.append("tags", formData.tags);
      submitData.append("active", formData.active.toString());

      await imageService.updateImage(selectedImage._id, submitData);

      showAlert("Cập nhật hình ảnh thành công");
      handleCloseEditModal();
      loadImages();
      loadStats();
    } catch (error) {
      console.error("Error updating image:", error);
      showAlert("Lỗi khi cập nhật hình ảnh", "danger");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hình ảnh này?")) {
      return;
    }

    try {
      await imageService.deleteImage(imageId);
      showAlert("Xóa hình ảnh thành công");
      handleCloseModal();
      loadImages();
      loadStats();
    } catch (error) {
      console.error("Error deleting image:", error);
      showAlert("Lỗi khi xóa hình ảnh", "danger");
    }
  };

  const handleToggleActive = async (imageId, currentActive) => {
    try {
      const submitData = new FormData();
      submitData.append("active", (!currentActive).toString());

      await imageService.updateImage(imageId, submitData);
      showAlert(
        currentActive ? "Đã tắt trạng thái active" : "Đã kích hoạt hình ảnh"
      );

      loadImages();
      loadStats();
    } catch (error) {
      console.error("Error toggling active status:", error);
      showAlert("Lỗi khi cập nhật trạng thái active", "danger");
    }
  };

  const handleUseImage = async (image) => {
    const imageUrl = getImageUrl(image);
    try {
      await navigator.clipboard.writeText(imageUrl);
      showAlert("Đã sao chép URL hình ảnh vào clipboard");
    } catch (error) {
      showAlert("Không thể sao chép URL", "warning");
    }
  };

  const getImageUrl = (image) => {
    return `${process.env.REACT_APP_API_URL}${image.file.path}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryColor = (categoryValue) => {
    return (
      categories.find((c) => c.value === categoryValue)?.color || "#6c757d"
    );
  };

  const QuickActions = ({ image }) => (
    <div className="quick-actions">
      <OverlayTrigger placement="top" overlay={<Tooltip>Sao chép URL</Tooltip>}>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => handleUseImage(image)}
        >
          <i className="fas fa-link"></i>
        </Button>
      </OverlayTrigger>
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip>{image.active ? "Tắt Active" : "Bật Active"}</Tooltip>
        }
      >
        <Button
          variant={image.active ? "outline-warning" : "outline-success"}
          size="sm"
          onClick={() => handleToggleActive(image._id, image.active)}
        >
          <i className={`fas ${image.active ? "fa-times" : "fa-check"}`}></i>
        </Button>
      </OverlayTrigger>
      <OverlayTrigger placement="top" overlay={<Tooltip>Sửa</Tooltip>}>
        <Button
          variant="outline-info"
          size="sm"
          onClick={() => handleEditImage(image)}
        >
          <i className="fas fa-edit"></i>
        </Button>
      </OverlayTrigger>
      <OverlayTrigger placement="top" overlay={<Tooltip>Xóa</Tooltip>}>
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => handleDeleteImage(image._id)}
        >
          <i className="fas fa-trash"></i>
        </Button>
      </OverlayTrigger>
    </div>
  );

  return (
    <Container className="container image-management">
      {/* Alert */}
      {alert.show && (
        <Alert
          variant={alert.type}
          dismissible
          className="alert-fixed"
          onClose={() => setAlert({ show: false, message: "", type: "" })}
        >
          {alert.message}
        </Alert>
      )}

      {/* Header */}
      <div className="management-header ">
        <Row className="align-items-center container">
          <Col>
            <div className="header-content">
              <div>
                <h1>
                  <i className="fas fa-images me-3 text-primary"></i>
                  Quản lý Hình ảnh
                </h1>
                <p className="text-muted mb-0">
                  Quản lý hình ảnh mặc định cho các phần của trang web
                </p>
              </div>
            </div>
          </Col>
          <Col xs="auto">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowAddModal(true)}
              className="add-btn"
            >
              <i className="fas fa-plus me-2"></i>
              Thêm Hình ảnh
            </Button>
          </Col>
        </Row>
      </div>

      {/* Stats Cards */}
      {stats && (
        <Row className="stats-row">
          <Col xl={3} lg={6} className="mb-4">
            <Card className="stat-card total-card">
              <Card.Body>
                <div className="stat-content">
                  <div className="stat-icon">
                    <i className="fas fa-images"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{stats.totalImages}</h3>
                    <p>Tổng số hình ảnh</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          {stats.categoryStats.slice(0, 3).map((stat, index) => {
            const category = categories.find((c) => c.value === stat._id);
            return (
              <Col xl={3} lg={6} key={index} className="mb-4">
                <Card className="stat-card category-card">
                  <Card.Body>
                    <div className="stat-content">
                      <div
                        className="stat-icon"
                        style={{
                          backgroundColor: category?.color + "20",
                          color: category?.color,
                        }}
                      >
                        <span>{category?.icon}</span>
                      </div>
                      <div className="stat-info">
                        <h3>{stat.count}</h3>
                        <p>{category?.label}</p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Controls */}
      <Card className="controls-card">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm hình ảnh..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <div className="view-controls">
                <Button
                  variant={
                    viewMode === "grid" ? "primary" : "outline-secondary"
                  }
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <i className="fas fa-th"></i>
                </Button>
                <Button
                  variant={
                    viewMode === "list" ? "primary" : "outline-secondary"
                  }
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <i className="fas fa-list"></i>
                </Button>
              </div>
            </Col>
            <Col md={4} className="text-end">
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" id="sort-dropdown">
                  <i className="fas fa-sort me-2"></i>
                  Sắp xếp:{" "}
                  {sortBy === "newest"
                    ? "Mới nhất"
                    : sortBy === "oldest"
                    ? "Cũ nhất"
                    : sortBy === "name"
                    ? "Tên"
                    : "Kích thước"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => setSortBy("newest")}>
                    Mới nhất
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setSortBy("oldest")}>
                    Cũ nhất
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setSortBy("name")}>
                    Theo tên
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setSortBy("size")}>
                    Theo kích thước
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Category Filter */}
      <Card className="category-filter-card">
        <Card.Body>
          <Nav className="category-nav">
            {categories.map((category) => (
              <Nav.Item key={category.value}>
                <Nav.Link
                  active={selectedCategory === category.value}
                  onClick={() => handleCategoryChange(category.value)}
                  style={{
                    borderLeft: `4px solid ${
                      selectedCategory === category.value
                        ? category.color
                        : "transparent"
                    }`,
                  }}
                >
                  <span className="category-icon me-2">{category.icon}</span>
                  {category.label}
                  {stats && (
                    <Badge bg="light" text="dark" className="ms-2">
                      {stats.categoryStats.find((s) => s._id === category.value)
                        ?.count || 0}
                    </Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </Card.Body>
      </Card>

      {/* Images Grid/List */}
      {loading ? (
        <div className="loading-state">
          <Spinner animation="border" variant="primary" />
          <p>Đang tải hình ảnh...</p>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <Row className="images-grid">
              {filteredImages.map((image) => (
                <Col key={image._id} xl={3} lg={4} md={6} className="mb-4">
                  <Card className="image-card h-100">
                    <div className="image-container">
                      <div
                        className="image-preview"
                        style={{
                          backgroundImage: `url(${getImageUrl(image)})`,
                        }}
                        onClick={() => handleImageClick(image)}
                      />
                      {image.active && (
                        <Badge bg="success" className="active-badge">
                          <i className="fas fa-star me-1"></i>
                          Active
                        </Badge>
                      )}
                      <QuickActions image={image} />
                    </div>
                    <Card.Body>
                      <Card.Title
                        className="h6 text-truncate"
                        title={image.title}
                      >
                        {image.title}
                      </Card.Title>
                      <Card.Text className="text-muted small image-description">
                        {image.description || "Không có mô tả"}
                      </Card.Text>
                      <div className="image-meta">
                        <Badge
                          bg="light"
                          text="dark"
                          style={{
                            borderLeft: `3px solid ${getCategoryColor(
                              image.category
                            )}`,
                          }}
                        >
                          {
                            categories.find((c) => c.value === image.category)
                              ?.label
                          }
                        </Badge>
                        <small className="text-muted">
                          {formatFileSize(image.file.size)}
                        </small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Card className="images-list-card">
              <Card.Body>
                {filteredImages.map((image) => (
                  <div key={image._id} className="list-item">
                    <Row className="align-items-center">
                      <Col md={1}>
                        <div
                          className="list-thumbnail"
                          style={{
                            backgroundImage: `url(${getImageUrl(image)})`,
                          }}
                          onClick={() => handleImageClick(image)}
                        />
                      </Col>
                      <Col md={3}>
                        <div className="list-title">
                          <h6 className="mb-1">{image.title}</h6>
                          <p className="text-muted small mb-0">
                            {image.description}
                          </p>
                        </div>
                      </Col>
                      <Col md={2}>
                        <Badge
                          bg="light"
                          text="dark"
                          style={{
                            borderLeft: `3px solid ${getCategoryColor(
                              image.category
                            )}`,
                          }}
                        >
                          {
                            categories.find((c) => c.value === image.category)
                              ?.label
                          }
                        </Badge>
                      </Col>
                      <Col md={2}>
                        <small className="text-muted">
                          {formatFileSize(image.file.size)}
                        </small>
                      </Col>
                      <Col md={2}>
                        <small className="text-muted">
                          {formatDate(image.createdAt)}
                        </small>
                      </Col>
                      <Col md={2} className="text-end">
                        <QuickActions image={image} />
                      </Col>
                    </Row>
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}

          {filteredImages.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-image fa-4x text-muted mb-3"></i>
              <h5>Không có hình ảnh nào</h5>
              <p className="text-muted">Hãy thêm hình ảnh đầu tiên của bạn</p>
              <Button variant="primary" onClick={() => setShowAddModal(true)}>
                <i className="fas fa-plus me-2"></i>
                Thêm Hình ảnh
              </Button>
            </div>
          )}
        </>
      )}

      {/* Image Detail Modal */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        size="xl"
        centered
        className="image-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-image me-2 text-primary"></i>
            Chi tiết Hình ảnh
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedImage && (
            <Row>
              <Col lg={6}>
                <div className="detail-image-container">
                  <img
                    src={getImageUrl(selectedImage)}
                    alt={selectedImage.title}
                    className="detail-image"
                  />
                </div>
              </Col>
              <Col lg={6}>
                <div className="detail-info">
                  <h4>{selectedImage.title}</h4>
                  <p className="text-muted">
                    {selectedImage.description || "Không có mô tả"}
                  </p>

                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Trạng thái</label>
                      <Badge
                        bg={selectedImage.active ? "success" : "secondary"}
                      >
                        <i
                          className={`fas ${
                            selectedImage.active ? "fa-check" : "fa-times"
                          } me-1`}
                        ></i>
                        {selectedImage.active ? "Đang Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="detail-item">
                      <label>Danh mục</label>
                      <Badge
                        bg="light"
                        text="dark"
                        style={{
                          borderLeft: `3px solid ${getCategoryColor(
                            selectedImage.category
                          )}`,
                        }}
                      >
                        {
                          categories.find(
                            (c) => c.value === selectedImage.category
                          )?.label
                        }
                      </Badge>
                    </div>
                    <div className="detail-item">
                      <label>Kích thước</label>
                      <span>{formatFileSize(selectedImage.file.size)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Định dạng</label>
                      <span>{selectedImage.file.mimetype}</span>
                    </div>
                    <div className="detail-item">
                      <label>Ngày tạo</label>
                      <span>{formatDate(selectedImage.createdAt)}</span>
                    </div>
                  </div>

                  {selectedImage.tags && selectedImage.tags.length > 0 && (
                    <div className="detail-section">
                      <label>Tags</label>
                      <div className="tags-container">
                        {selectedImage.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            bg="outline-secondary"
                            className="tag-badge"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="action-buttons">
                    <Button
                      variant={selectedImage.active ? "warning" : "success"}
                      onClick={() =>
                        handleToggleActive(
                          selectedImage._id,
                          selectedImage.active
                        )
                      }
                    >
                      <i
                        className={`fas ${
                          selectedImage.active ? "fa-times" : "fa-check"
                        } me-2`}
                      ></i>
                      {selectedImage.active ? "Tắt Active" : "Kích hoạt"}
                    </Button>
                    <Button
                      variant="info"
                      onClick={() => handleUseImage(selectedImage)}
                    >
                      <i className="fas fa-link me-2"></i>
                      Sao chép URL
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleEditImage(selectedImage)}
                    >
                      <i className="fas fa-edit me-2"></i>
                      Sửa
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteImage(selectedImage._id)}
                    >
                      <i className="fas fa-trash me-2"></i>
                      Xóa
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>

      {/* Add Image Modal */}
      <Modal
        show={showAddModal}
        onHide={handleCloseAddModal}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-plus-circle me-2 text-success"></i>
            Thêm Hình ảnh Mới
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddImage}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tiêu đề *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Nhập tiêu đề hình ảnh"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Mô tả</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Nhập mô tả hình ảnh"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Danh mục *</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    {categories
                      .filter((c) => c.value !== "all")
                      .map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.icon} {category.label}
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tags</Form.Label>
                  <Form.Control
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="Nhập tags, phân cách bằng dấu phẩy"
                  />
                  <Form.Text className="text-muted">
                    Ví dụ: banner, background, nature
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="active"
                    label="Kích hoạt hình ảnh này (sẽ tắt tất cả hình ảnh khác cùng danh mục)"
                    checked={formData.active}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hình ảnh *</Form.Label>
                  <div
                    className={`file-upload-area ${
                      dragOver ? "drag-over" : ""
                    } ${selectedFile ? "has-file" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleUploadAreaClick}
                  >
                    <div className="upload-content">
                      <i className="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                      <p>Kéo thả file vào đây hoặc click để chọn</p>
                      <small className="text-muted">
                        Hỗ trợ: JPG, PNG, GIF (tối đa 10MB)
                      </small>
                    </div>
                    <Form.Control
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                      className="file-input"
                    />
                  </div>
                </Form.Group>

                {selectedFile && (
                  <Card className="file-preview-card">
                    <Card.Body>
                      <div className="file-preview">
                        <img
                          src={URL.createObjectURL(selectedFile)}
                          alt="Preview"
                          className="preview-image"
                        />
                        <div className="file-info">
                          <strong>{selectedFile.name}</strong>
                          <small className="text-muted d-block">
                            Kích thước: {formatFileSize(selectedFile.size)}
                          </small>
                          <small className="text-muted">
                            Loại: {selectedFile.type}
                          </small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={handleCloseAddModal}>
              <i className="fas fa-times me-2"></i>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={uploadLoading}>
              {uploadLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <i className="fas fa-plus me-2"></i>
                  Thêm Hình ảnh
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Image Modal */}
      <Modal
        show={showEditModal}
        onHide={handleCloseEditModal}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-edit me-2 text-warning"></i>
            Sửa Hình ảnh
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateImage}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tiêu đề *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Nhập tiêu đề hình ảnh"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Mô tả</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Nhập mô tả hình ảnh"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Danh mục *</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    {categories
                      .filter((c) => c.value !== "all")
                      .map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.icon} {category.label}
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tags</Form.Label>
                  <Form.Control
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="Nhập tags, phân cách bằng dấu phẩy"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="active"
                    label="Kích hoạt hình ảnh này"
                    checked={formData.active}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hình ảnh mới (tùy chọn)</Form.Label>
                  <div
                    className={`file-upload-area ${
                      dragOver ? "drag-over" : ""
                    } ${selectedFile ? "has-file" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleEditUploadAreaClick}
                  >
                    <div className="upload-content">
                      <i className="fas fa-sync-alt fa-3x text-muted mb-3"></i>
                      <p>Kéo thả file mới vào đây hoặc click để chọn</p>
                      <small className="text-muted">
                        Để trống nếu không muốn thay đổi
                      </small>
                    </div>
                    <Form.Control
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditFileChange}
                      className="file-input"
                    />
                  </div>
                </Form.Group>

                {selectedFile && (
                  <Card className="file-preview-card">
                    <Card.Body>
                      <div className="file-preview">
                        <img
                          src={URL.createObjectURL(selectedFile)}
                          alt="Preview"
                          className="preview-image"
                        />
                        <div className="file-info">
                          <strong>File mới: {selectedFile.name}</strong>
                          <small className="text-muted d-block">
                            Kích thước: {formatFileSize(selectedFile.size)}
                          </small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                )}

                {selectedImage && !selectedFile && (
                  <Card className="current-file-card">
                    <Card.Body>
                      <div className="file-preview">
                        <img
                          src={getImageUrl(selectedImage)}
                          alt="Current"
                          className="preview-image"
                        />
                        <div className="file-info">
                          <strong>File hiện tại</strong>
                          <small className="text-muted d-block">
                            {selectedImage.file.originalName}
                          </small>
                          <small className="text-muted">
                            Kích thước:{" "}
                            {formatFileSize(selectedImage.file.size)}
                          </small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={handleCloseEditModal}>
              <i className="fas fa-times me-2"></i>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={uploadLoading}>
              {uploadLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  Cập nhật
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ImageManagement;
