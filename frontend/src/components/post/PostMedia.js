import React, { useState } from "react";
import {
  Play,
  FileText,
  Download,
  X,
  ZoomIn,
  Expand,
  File,
} from "lucide-react";
import { Modal, Carousel, Button, Badge } from "react-bootstrap";
import "./PostMedia.css";

const PostMedia = ({ files }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [mediaType, setMediaType] = useState(""); // 'image', 'video', 'file'

  const handleMediaClick = (index, type) => {
    setSelectedMediaIndex(index);
    setMediaType(type);
    setShowModal(true);
  };

  const downloadFile = async (url, fileName) => {
    const res = await fetch(url, { credentials: "include" });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMediaIndex(0);
    setMediaType("");
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="text-danger" />;
      case "doc":
      case "docx":
        return <FileText className="text-primary" />;
      case "xls":
      case "xlsx":
        return <FileText className="text-success" />;
      case "zip":
      case "rar":
        return <File className="text-warning" />;
      default:
        return <FileText className="text-secondary" />;
    }
  };

  const getFileExtension = (fileName) => {
    return fileName?.split(".").pop()?.toLowerCase() || "file";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  };

  const renderMediaPreview = (file, index) => {
    switch (file.type) {
      case "image":
        return (
          <div
            key={index}
            className="media-item image-media position-relative"
            onClick={() => handleMediaClick(index, "image")}
          >
            <img
              src={file.fileUrl}
              alt={file.fileName}
              className="media-image img-fluid rounded"
              loading="lazy"
            />
            <div className="media-overlay">
              <ZoomIn size={20} className="text-white" />
            </div>
          </div>
        );

      case "video":
        return (
          <div
            key={index}
            className="media-item video-media position-relative"
            onClick={() => handleMediaClick(index, "video")}
          >
            <video
              preload="metadata"
              playsInline
              className="media-video img-fluid rounded"
              style={{ maxWidth: "100%", height: "auto" }}
            >
              <source src={file.fileUrl} type={file.mimeType || "video/mp4"} />
            </video>
            <div className="media-overlay">
              <Play size={20} className="text-white" />
            </div>
            <div className="video-duration">{file.duration || ""}</div>
          </div>
        );

      case "audio":
        return (
          <div key={index} className="media-item audio-media">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="audio-icon me-3">
                    <Play size={24} className="text-primary" />
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1 text-truncate">{file.fileName}</h6>
                    <small className="text-muted">
                      {formatFileSize(file.fileSize)}
                    </small>
                  </div>
                  <audio
                    src={file.fileUrl}
                    controls
                    className="audio-controls"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        const fileExt = getFileExtension(file.fileName);
        return (
          <div key={index} className="media-item file-media">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="file-icon me-3">{getFileIcon(fileExt)}</div>
                  <div className="flex-grow-1">
                    <h6
                      className="mb-1 text-truncate"
                      style={{ maxWidth: "200px" }}
                    >
                      {file.fileName}
                    </h6>
                    <div className="d-flex align-items-center">
                      <Badge bg="light" text="dark" className="me-2">
                        {fileExt.toUpperCase()}
                      </Badge>
                      <small className="text-muted">
                        {formatFileSize(file.fileSize)}
                      </small>
                    </div>
                  </div>
                  <button
                    type="button"
                    href={file.fileUrl}
                    download
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => downloadFile(file.fileUrl, file.fileName)}
                  >
                    <Download size={16} />
                  </button>
                  {/* <Button
                    size="sm"
                    onClick={() => downloadFile(file.fileUrl, file.fileName)}
                  >
                    <Download size={16} />
                  </Button> */}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const renderModalContent = () => {
    if (mediaType === "image") {
      return (
        <Carousel
          activeIndex={selectedMediaIndex}
          onSelect={setSelectedMediaIndex}
          interval={null}
          indicators={files.filter((f) => f.type === "image").length > 1}
          controls={files.filter((f) => f.type === "image").length > 1}
        >
          {files
            .filter((file) => file.type === "image")
            .map((file, index) => (
              <Carousel.Item key={index}>
                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{ minHeight: "70vh" }}
                >
                  <img
                    src={file.fileUrl}
                    alt={file.fileName}
                    className="img-fluid"
                    style={{ maxHeight: "80vh", objectFit: "contain" }}
                  />
                </div>
                <Carousel.Caption>
                  <p className="mb-0">{file.fileName}</p>
                </Carousel.Caption>
              </Carousel.Item>
            ))}
        </Carousel>
      );
    }

    if (mediaType === "video") {
      const videoFile = files[selectedMediaIndex];
      return (
        <div className="text-center">
          <video
            controls
            autoPlay
            className="img-fluid"
            style={{ maxHeight: "80vh", maxWidth: "100%" }}
          >
            <source
              src={videoFile.fileUrl}
              type={videoFile.mimeType || "video/mp4"}
            />
            Trình duyệt của bạn không hỗ trợ phần tử video.
          </video>
          <div className="mt-3">
            <h6>{videoFile.fileName}</h6>
            <div className="d-flex justify-content-center gap-2 mt-2">
              <a
                href={videoFile.fileUrl}
                download
                className="btn btn-outline-primary btn-sm"
              >
                <Download size={16} className="me-1" />
                Tải xuống
              </a>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (!files || files.length === 0) return null;

  // Phân loại file theo type
  const images = files.filter((file) => file.type === "image");
  const videos = files.filter((file) => file.type === "video");
  const audios = files.filter((file) => file.type === "audio");
  const otherFiles = files.filter(
    (file) => !["image", "video", "audio"].includes(file.type)
  );

  if (files.length === 1) {
    return (
      <>
        <div className="post-media single-media">
          {renderMediaPreview(files[0], 0)}
        </div>

        <Modal
          show={showModal}
          onHide={handleCloseModal}
          centered
          className="media-modal"
        >
          <Modal.Header className="border-0 pb-0">
            <Button
              variant="light"
              onClick={handleCloseModal}
              className="rounded-circle"
              size="sm"
            >
              <X size={20} />
            </Button>
          </Modal.Header>
          <Modal.Body className="pt-0">{renderModalContent()}</Modal.Body>
        </Modal>
      </>
    );
  }

  // Grid layout for multiple files
  const getGridClass = () => {
    const totalMedia = images.length + videos.length;
    if (totalMedia === 2) return "grid-2";
    if (totalMedia === 3) return "grid-3";
    if (totalMedia >= 4) return "grid-4";
    return "";
  };

  return (
    <>
      <div className="post-media multiple-media">
        {/* Hiển thị hình ảnh và video trong grid */}
        {(images.length > 0 || videos.length > 0) && (
          <div className={`media-grid ${getGridClass()} mb-3`}>
            {images.map((file, index) => (
              <div key={`img-${index}`} className="media-grid-item">
                {renderMediaPreview(file, index)}
              </div>
            ))}
            {videos.map((file, index) => (
              <div key={`vid-${index}`} className="media-grid-item">
                {renderMediaPreview(file, images.length + index)}
              </div>
            ))}
          </div>
        )}

        {/* Hiển thị audio files */}
        {audios.length > 0 && (
          <div className="audio-files mb-3">
            {audios.map((file, index) =>
              renderMediaPreview(file, images.length + videos.length + index)
            )}
          </div>
        )}

        {/* Hiển thị other files */}
        {otherFiles.length > 0 && (
          <div className="file-attachments">
            <h6 className="mb-2">
              <FileText size={16} className="me-2" />
              Tệp đính kèm ({otherFiles.length})
            </h6>
            <div className="row g-2">
              {otherFiles.map((file, index) => (
                <div key={`file-${index}`} className="col-12">
                  {renderMediaPreview(
                    file,
                    images.length + videos.length + audios.length + index
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal xem media */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        centered
        className="media-modal"
        dialogClassName={
          mediaType === "image" ? "modal-fullscreen-md-down" : ""
        }
      >
        <Modal.Header className="border-0 pb-0 position-absolute top-0 end-0 z-3">
          <Button
            variant="dark"
            onClick={handleCloseModal}
            className="rounded-circle opacity-75"
            size="sm"
          >
            <X size={20} />
          </Button>
        </Modal.Header>
        <Modal.Body className="d-flex align-items-center justify-content-center">
          {renderModalContent()}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default PostMedia;
