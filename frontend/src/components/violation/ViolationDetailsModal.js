// components/ViolationDetailsModal.js
import React, { useState, useEffect } from "react";
import {
  Modal,
  Row,
  Col,
  Badge,
  Card,
  Button,
  Image,
  Table,
} from "react-bootstrap";

const ViolationDetailsModal = ({ show, onHide, violation }) => {
  // Lightbox state
  const [lightboxShow, setLightboxShow] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Phím tắt cho lightbox
  useEffect(() => {
    const handleKey = (e) => {
      if (!lightboxShow) return;
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxShow, currentIndex]);

  if (!violation) return null;

  /* ------------------- Helper ------------------- */
  const getActionTakenText = (action) => {
    const map = {
      none: "Không xử lý",
      warning: "Cảnh báo",
      block_post: "Chặn bài viết",
      block_comment: "Chặn bình luận",
      ban_user: "Cấm tài khoản",
      auto_blocked: "Tự động chặn",
      auto_warned: "Tự động cảnh báo",
      auto_baned: "Tự động cấm",
    };
    return map[action] || action;
  };

  const getAppealStatusBadge = (status) => {
    const map = {
      pending: { v: "warning", t: "Đang xử lý" },
      approved: { v: "success", t: "Chấp nhận" },
      rejected: { v: "danger", t: "Từ chối" },
      cancelled: { v: "secondary", t: "Đã hủy" },
    };
    const item = map[status] || { v: "secondary", t: status };
    return <Badge bg={item.v}>{item.t}</Badge>;
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Files
  const images = (violation.files || [])
    .filter((f) => f.type === "image")
    .map((f) => ({ url: f.fileUrl, name: f.fileName }));

  const otherFiles = (violation.files || []).filter((f) => f.type !== "image");

  // Lightbox actions
  const openLightbox = (url, idx) => {
    setCurrentImage(url);
    setCurrentIndex(idx);
    setLightboxShow(true);
  };
  const closeLightbox = () => setLightboxShow(false);
  const prevImage = () => {
    const i = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(i);
    setCurrentImage(images[i].url);
  };
  const nextImage = () => {
    const i = (currentIndex + 1) % images.length;
    setCurrentIndex(i);
    setCurrentImage(images[i].url);
  };

  /* ------------------- Render ------------------- */
  return (
    <>
      {/* ---------- Modal chi tiết ---------- */}
      <Modal show={show} onHide={onHide} size="xl" centered scrollable>
        <Modal.Header closeButton className="border-0 pb-2">
          <Modal.Title className="fw-bold text-primary">
            Chi Tiết Vi Phạm
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="pt-2">
          <Row className="g-4">
            {/* ---- Thông tin cơ bản ---- */}
            <Col lg={5}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-primary text-white small">
                  Thông Tin Cơ Bản
                </Card.Header>
                <Card.Body className="pt-3">
                  <Table borderless size="sm">
                    <tbody>
                      <tr>
                        <td className="text-muted">Loại:</td>
                        <td>
                          <Badge bg="light" text="dark" className="fw-medium">
                            {violation.targetType}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Hành động:</td>
                        <td className="text-danger fw-medium">
                          {getActionTakenText(violation.actionTaken)}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Thời gian:</td>
                        <td>
                          <small>{formatDate(violation.createdAt)}</small>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            {/* ---- Lý do vi phạm (text thường) ---- */}
            <Col lg={7}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-danger text-white small">
                  Lý Do Báo Cáo
                </Card.Header>
                <Card.Body>
                  <div
                    className="p-3 bg-light rounded border"
                    style={{
                      minHeight: "80px",
                      fontSize: "0.95rem",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {violation.reason || (
                      <span className="text-muted">Không có lý do</span>
                    )}
                  </div>

                  {/* ---- GHI CHÚ HỆ THỐNG: LÀ HTML ---- */}
                  {violation.notes && (
                    <div className="mt-3">
                      <strong className="text-muted d-block mb-1">
                        Ghi chú hệ thống:
                      </strong>
                      <div
                        className="p-3 bg-white border rounded shadow-sm"
                        style={{
                          maxHeight: "220px",
                          overflowY: "auto",
                          fontSize: "0.9rem",
                          lineHeight: "1.5",
                        }}
                        dangerouslySetInnerHTML={{ __html: violation.notes }}
                      />
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* ---- Kháng cáo ---- */}
            {violation.appeal?.isAppealed && (
              <Col lg={12}>
                <Card className="shadow-sm border-0">
                  <Card.Header className="bg-warning text-dark small">
                    Thông Tin Kháng Cáo
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={7}>
                        <p className="mb-2">
                          <strong>Lý do kháng cáo:</strong>
                        </p>
                        <p className="bg-light p-3 rounded small mb-0">
                          {violation.appeal.appealReason}
                        </p>
                      </Col>
                      <Col md={5}>
                        <Table borderless size="sm">
                          <tbody>
                            <tr>
                              <td className="text-muted">Trạng thái:</td>
                              <td>
                                {getAppealStatusBadge(
                                  violation.appeal.appealStatus
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className="text-muted">Ngày nộp:</td>
                              <td>{formatDate(violation.appeal.appealAt)}</td>
                            </tr>
                            {violation.appeal.appealReviewedAt && (
                              <tr>
                                <td className="text-muted">Xử lý lúc:</td>
                                <td>
                                  {formatDate(
                                    violation.appeal.appealReviewedAt
                                  )}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                    {violation.appeal.appealNotes && (
                      <div className="mt-3">
                        <strong className="text-muted">Phản hồi:</strong>
                        <p className="text-muted small">
                          {violation.appeal.appealNotes}
                        </p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            )}

            {/* ---- File đính kèm ---- */}
            {(violation.files || []).length > 0 && (
              <Col lg={12}>
                <Card className="shadow-sm border-0">
                  <Card.Header className="bg-secondary text-white small">
                    File Đính Kèm ({violation.files.length})
                  </Card.Header>
                  <Card.Body>
                    {/* Ảnh */}
                    {images.length > 0 && (
                      <div className="mb-4">
                        <h6 className="text-primary mb-3">Hình ảnh</h6>
                        <Row className="g-3">
                          {images.map((img, idx) => (
                            <Col xs={6} md={4} lg={3} key={idx}>
                              <div
                                className="border rounded overflow-hidden shadow-sm cursor-pointer"
                                onClick={() => openLightbox(img.url, idx)}
                                style={{ height: "110px" }}
                              >
                                <Image
                                  src={img.url}
                                  alt={img.name}
                                  fluid
                                  className="w-100 h-100"
                                  style={{
                                    objectFit: "cover",
                                    transition: "transform .3s",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.transform =
                                      "scale(1.08)")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.transform =
                                      "scale(1)")
                                  }
                                />
                              </div>
                              <small className="d-block text-center text-muted mt-1 text-truncate">
                                {img.name}
                              </small>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    )}

                    {/* File khác */}
                    {otherFiles.length > 0 && (
                      <div>
                        <h6 className="text-secondary mb-3">Tài liệu</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {otherFiles.map((file, idx) => (
                            <a
                              key={idx}
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline-secondary btn-sm"
                            >
                              {file.type === "video" ? (
                                <i className="fas fa-video me-1"></i>
                              ) : file.type === "audio" ? (
                                <i className="fas fa-music me-1"></i>
                              ) : (
                                <i className="fas fa-file me-1"></i>
                              )}
                              {file.fileName}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </Modal.Body>

        <Modal.Footer className="border-0">
          <Button variant="secondary" size="sm" onClick={onHide}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ---------- Lightbox tự xây ---------- */}
      <Modal
        show={lightboxShow}
        onHide={closeLightbox}
        size="xl"
        centered
        backdrop="static"
        className="lightbox-modal"
      >
        <Modal.Body className="p-0 ">
          <div
            className="position-relative d-flex align-items-center justify-content-center"
            style={{ minHeight: "70vh" }}
          >
            {/* Nút đóng */}
            <Button
              variant="link"
              className="position-absolute top-0 end-0 z-3"
              style={{ fontSize: "1.8rem" }}
              onClick={closeLightbox}
            >
              ×
            </Button>

            {/* Ảnh lớn */}
            <Image
              src={currentImage}
              alt="Zoom"
              fluid
              className="img-fluid"
              style={{
                maxHeight: "80vh",
                maxWidth: "90vw",
                objectFit: "contain",
              }}
            />

            {/* Prev / Next */}
            {images.length > 1 && (
              <>
                <Button
                  variant="link"
                  className="position-absolute start-0 text-white"
                  style={{
                    fontSize: "2.2rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                  onClick={prevImage}
                >
                  ‹
                </Button>
                <Button
                  variant="link"
                  className="position-absolute end-0 text-white"
                  style={{
                    fontSize: "2.2rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                  onClick={nextImage}
                >
                  ›
                </Button>
              </>
            )}

            {/* Caption */}
            <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-center py-2 small">
              {images[currentIndex]?.name} ({currentIndex + 1}/{images.length})
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ViolationDetailsModal;
