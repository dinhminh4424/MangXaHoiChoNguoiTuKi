// MediaPreview.react-bootstrap.js
import React, { useState } from "react";
import { Image as ImageIcon, Video, File, Download } from "lucide-react";
import Modal from "react-bootstrap/Modal";

const MediaPreview = ({ mediaList = [] }) => {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [show, setShow] = useState(false);

  const isImage = (url) => !!url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isVideo = (url) => !!url?.match(/\.(mp4|mov|avi|wmv|mkv)$/i);

  const open = (e, url) => {
    e.stopPropagation();
    setSelectedMedia(url);
    setShow(true);
  };
  const close = () => {
    setShow(false);
    // small delay optional if you want to clear after modal fully closed
    setSelectedMedia(null);
  };

  return (
    <div className="mt-4">
      <h6 className="fw-semibold mb-3">File đính kèm:</h6>
      <div className="row">
        {mediaList.map((mediaUrl, index) => {
          const filename = mediaUrl.split("/").pop();
          const fileTypeIcon = isImage(mediaUrl) ? (
            <ImageIcon size={28} className="text-primary mb-2" />
          ) : isVideo(mediaUrl) ? (
            <Video size={28} className="text-success mb-2" />
          ) : (
            <File size={28} className="text-secondary mb-2" />
          );

          return (
            <div key={index} className="col-6 col-md-4 col-lg-3 mb-3">
              <div
                className="card h-100 shadow-sm border-0"
                style={{ cursor: "pointer" }}
                onClick={(e) => open(e, mediaUrl)}
              >
                <div className="card-body p-2 text-center">
                  {isImage(mediaUrl) ? (
                    <img
                      src={mediaUrl}
                      alt={filename}
                      className="img-fluid rounded"
                      style={{ height: 100, objectFit: "cover" }}
                    />
                  ) : isVideo(mediaUrl) ? (
                    <video
                      src={mediaUrl}
                      className="img-fluid rounded"
                      style={{ height: 100, objectFit: "cover" }}
                      controls={false}
                    />
                  ) : (
                    fileTypeIcon
                  )}

                  <small className="d-block text-truncate mt-1">
                    {filename}
                  </small>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        show={show}
        onHide={close}
        size="xl"
        centered
        dialogClassName="modal-xl"
        backdrop="static" // optional: prevents closing by clicking backdrop
      >
        <Modal.Header closeButton className="bg-dark text-white border-0">
          <Modal.Title>Xem chi tiết</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center bg-dark text-white">
          {selectedMedia &&
            (isImage(selectedMedia) ? (
              <img
                src={selectedMedia}
                alt=""
                className="img-fluid rounded shadow"
                style={{ maxHeight: "85vh" }}
              />
            ) : isVideo(selectedMedia) ? (
              <video
                src={selectedMedia}
                controls
                autoPlay
                className="img-fluid rounded shadow"
                style={{ maxHeight: "85vh", width: "100%" }}
              />
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center py-5">
                <File size={64} className="text-secondary mb-3" />
                <p className="mb-3">Đây là tệp không xem được trực tiếp.</p>
                <a
                  href={selectedMedia}
                  download
                  className="btn btn-primary d-flex align-items-center gap-2"
                >
                  <Download size={18} /> Tải xuống
                </a>
              </div>
            ))}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default MediaPreview;
