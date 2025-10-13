import React from "react";
import { Play, FileText, Download } from "lucide-react";
import "./PostMedia.css";

const PostMedia = ({ files }) => {
  const renderMedia = (file, index) => {
    switch (file.type) {
      case "image":
        return (
          <div key={index} className="media-item image-media">
            <img
              src={file.fileUrl}
              alt={file.fileName}
              className="media-image"
              loading="lazy"
            />
          </div>
        );

      case "video":
        return (
          <div key={index} className="media-item video-media">
            <video
              controls
              preload="metadata"
              playsInline
              className="media-video"
              style={{ maxWidth: "100%", height: "auto" }}
            >
              <source src={file.fileUrl} type={file.mimeType || "video/mp4"} />
              Trình duyệt của bạn không hỗ trợ phần tử video.
            </video>
          </div>
        );

      case "audio":
        return (
          <div key={index} className="media-item audio-media">
            <audio src={file.fileUrl} controls className="media-audio" />
          </div>
        );

      default:
        return (
          <div key={index} className="media-item file-media">
            <div className="file-icon">
              <FileText size={24} />
            </div>
            <div className="file-info">
              <div className="file-name">{file.fileName}</div>
              <div className="file-size">
                {file.fileSize
                  ? (file.fileSize / 1024 / 1024).toFixed(2) + " MB"
                  : ""}
              </div>
            </div>
            <a href={file.fileUrl} download className="download-btn">
              <Download size={16} />
            </a>
          </div>
        );
    }
  };

  if (!files || files.length === 0) return null;

  if (files.length === 1) {
    return (
      <div className="post-media single-media">{renderMedia(files[0], 0)}</div>
    );
  }

  // Grid layout for multiple files
  const gridClass = `media-grid grid-${Math.min(files.length, 4)}`;

  return (
    <div className="post-media multiple-media">
      <div className={gridClass}>
        {files.map((file, index) => (
          <div key={index} className="media-grid-item">
            {renderMedia(file, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostMedia;
