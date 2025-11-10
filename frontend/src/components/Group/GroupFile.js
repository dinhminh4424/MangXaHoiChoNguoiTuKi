import { useCallback, useEffect, useRef, useState } from "react";
import { usePost } from "../../contexts/PostContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  Download,
  File,
  FileText,
  Image,
  Video,
  Archive,
  FileCode,
  FileSpreadsheet,
} from "lucide-react";

const FileGroup = ({ groupId }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const isFetchingRef = useRef(false);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const limit = 12; // Tăng limit để load nhiều file hơn

  const { fetchImagesPost } = usePost();
  const { user: currentUser } = useAuth();

  // Hàm lấy icon theo loại file
  const getFileIcon = (fileName, fileType) => {
    const extension = fileName?.split(".").pop()?.toLowerCase();

    if (fileType === "image")
      return <Image size={24} className="text-primary" />;
    if (fileType === "video")
      return <Video size={24} className="text-danger" />;

    switch (extension) {
      case "pdf":
        return <FileText size={24} className="text-danger" />;
      case "doc":
      case "docx":
        return <FileText size={24} className="text-primary" />;
      case "xls":
      case "xlsx":
        return <FileSpreadsheet size={24} className="text-success" />;
      case "zip":
      case "rar":
      case "7z":
        return <Archive size={24} className="text-warning" />;
      case "txt":
        return <FileText size={24} className="text-secondary" />;
      case "js":
      case "html":
      case "css":
      case "php":
        return <FileCode size={24} className="text-info" />;
      default:
        return <File size={24} className="text-muted" />;
    }
  };

  // Hàm định dạng kích thước file
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Hàm rút gọn tên file
  const truncateFileName = (name, maxLength = 25) => {
    if (!name) return "Không có tên";
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  // Load files
  const loadingFiles = useCallback(
    async (pageToFetch = 1) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        if (pageToFetch === 1) {
          setLoading(true);
          setFiles([]);
        } else {
          setLoadingMore(true);
        }
        setError("");

        const params = {
          groupId: groupId,
          page: pageToFetch,
          limit,
          type: "file",
        };

        const res = await fetchImagesPost(params);
        const newFiles = Array.isArray(res?.images) ? res.images : [];

        if (res && res.success) {
          if (pageToFetch === 1) {
            setFiles(newFiles);
            setTotalFiles(res.totalImages || 0);
          } else {
            setFiles((prev) => [...prev, ...newFiles]);
          }

          // Kiểm tra còn file không
          const totalImages = res.totalImages || res.total || 0;
          const loadedCount = (pageToFetch - 1) * limit + newFiles.length;
          setHasMore(loadedCount < totalImages && newFiles.length > 0);
        } else {
          const msg = res?.message || "Lỗi khi tải file";
          setError(msg);
        }
      } catch (err) {
        console.error("Error loading files:", err);
        setError(err?.message || String(err));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [fetchImagesPost, groupId, limit]
  );

  // Reset khi groupId thay đổi
  useEffect(() => {
    setCurrentPage(1);
    setFiles([]);
    setHasMore(true);
    setError("");
    loadingFiles(1);
  }, [groupId, loadingFiles]);

  // Intersection Observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loadingMore || loading) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          loadingFiles(nextPage);
        }
      },
      { root: null, rootMargin: "100px", threshold: 0.1 }
    );

    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadingFiles, hasMore, loadingMore, loading, currentPage]);

  return (
    <div className="container-fluid">
      {/* Header với thống kê */}
      {!loading && files.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <File className="me-2" size={20} />
                Tệp nhóm ({totalFiles} files)
              </h5>
              <span className="badge bg-primary fs-6">{totalFiles}</span>
            </div>
            <hr className="mt-2" />
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
                <p className="mt-2 text-muted">Đang tải danh sách file...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5 text-danger">
                <File size={48} className="mb-3 opacity-50" />
                <p className="mb-0">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Files Grid */}
      <div className="row g-3">
        {files.length > 0
          ? files.map((file, index) => {
              const key = `${file.post?._id || "file"}-${
                file.imageUrl
              }-${index}`;
              const fileName = file.imageName || file.fileName || "unknown";
              const fileSize = file.imageSize || 0;
              const fileType = file.type || "file";

              return (
                <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6" key={key}>
                  <div className="card file-card h-100 border-0 shadow-sm hover-shadow transition-all">
                    <div className="card-body">
                      {/* File Icon */}
                      <a href={file.imageUrl} download={fileName}>
                        <div className="text-center mb-3">
                          <div className="file-icon-wrapper bg-light rounded-circle p-3 d-inline-flex">
                            {getFileIcon(fileName, fileType)}
                          </div>
                        </div>
                      </a>

                      {/* File Info */}
                      <div className=" text-center">
                        <h6
                          className="file-name mb-2 fw-semibold"
                          title={fileName}
                        >
                          {truncateFileName(fileName)}
                        </h6>

                        {/* File Meta */}
                        <div className="file-meta text-muted small mb-3">
                          <div className="file-size mb-1">
                            {formatFileSize(fileSize)}
                          </div>
                          {file.post?.createdAt && (
                            <div className="file-date">
                              {new Date(file.post.createdAt).toLocaleDateString(
                                "vi-VN"
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Download Button */}
                    <div className="file-actions">
                      <a
                        href={file.imageUrl}
                        download={fileName}
                        className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download size={16} className="me-2" />
                        Tải xuống
                      </a>
                    </div>

                    {/* Hover Effect Border */}
                    <div className="card-hover-border"></div>
                  </div>
                </div>
              );
            })
          : !loading && (
              <div className="col-12">
                <div className="text-center py-5 text-muted">
                  <File size={64} className="mb-3 opacity-25" />
                  <h4 className="mb-2">Chưa có tệp nào</h4>
                  <p className="mb-0">Nhóm chưa có file được chia sẻ</p>
                </div>
              </div>
            )}
      </div>

      {/* Loading More */}
      {loadingMore && (
        <div className="row mt-4">
          <div className="col-12 text-center">
            <div
              className="spinner-border spinner-border-sm text-primary"
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <span className="text-muted ms-2">Đang tải thêm file...</span>
          </div>
        </div>
      )}

      {/* Sentinel */}
      <div ref={sentinelRef} style={{ height: "1px", marginTop: "20px" }} />
    </div>
  );
};

export default FileGroup;
