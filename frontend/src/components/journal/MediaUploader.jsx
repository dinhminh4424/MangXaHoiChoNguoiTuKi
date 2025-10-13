// components/journal/MediaUploader.jsx
import React, { useRef } from "react";
import { X, Upload, Image, Video, File } from "lucide-react";

export const MediaUploader = ({ files, onFilesSelect, onFileRemove }) => {
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 5) {
      alert("Chỉ có thể upload tối đa 5 files");
      return;
    }
    onFilesSelect(selectedFiles);
    e.target.value = "";
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith("image/"))
      return <Image size={20} className="text-primary" />;
    if (file.type.startsWith("video/"))
      return <Video size={20} className="text-success" />;
    return <File size={20} className="text-secondary" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="media-uploader">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        className="d-none"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="btn btn-outline-primary d-flex align-items-center gap-2 mb-3"
      >
        <Upload size={18} />
        Thêm file đính kèm ({files.length}/5)
      </button>

      {files.length > 0 && (
        <div>
          <small className="text-muted">Files đã chọn:</small>
          <div className="mt-2">
            {files.map((file, index) => (
              <div key={index} className="card mb-2">
                <div className="card-body py-2 px-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      {getFileIcon(file)}
                      <div>
                        <div
                          className="fw-medium text-truncate"
                          style={{ maxWidth: "200px" }}
                        >
                          {file.name}
                        </div>
                        <div className="small text-muted">
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm d-flex align-items-center"
                      onClick={() => onFileRemove(index)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
