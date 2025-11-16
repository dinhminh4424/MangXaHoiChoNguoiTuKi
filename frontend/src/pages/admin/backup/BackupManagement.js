// // src/pages/admin/backup/BackupManagement.js
// import React, { useState, useEffect } from "react";
// import {
//   Container,
//   Row,
//   Col,
//   Card,
//   Button,
//   Table,
//   Alert,
//   Modal,
//   ProgressBar,
//   Badge,
//   Spinner,
// } from "react-bootstrap";
// import { backupService } from "../../../services/adminService";
// import { formatBytes, formatDate } from "../../../utils/helpers";

// const BackupManagement = () => {
//   const [backups, setBackups] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [actionLoading, setActionLoading] = useState(null);
//   const [alert, setAlert] = useState({ show: false, message: "", type: "" });
//   const [restoreModal, setRestoreModal] = useState({ show: false, file: null });
//   const [restoreProgress, setRestoreProgress] = useState({});
//   const [selectedFile, setSelectedFile] = useState(null);

//   useEffect(() => {
//     loadBackups();
//   }, []);

//   const loadBackups = async () => {
//     setLoading(true);
//     try {
//       const response = await backupService.getBackupList();
//       if (response.success) {
//         setBackups(response.backups);
//       }
//     } catch (error) {
//       showAlert("Lỗi khi tải danh sách backup: " + error.message, "danger");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const showAlert = (message, type = "info") => {
//     setAlert({ show: true, message, type });
//     setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
//   };

//   const handleBackup = async (type) => {
//     setActionLoading(type);
//     try {
//       let response;
//       switch (type) {
//         case "database":
//           response = await backupService.backupDatabase();
//           break;
//         case "files":
//           response = await backupService.backupSystemFiles();
//           break;
//         case "full":
//           response = await backupService.backupFull();
//           break;
//         default:
//           return;
//       }

//       if (response.success) {
//         showAlert(`Backup ${type} thành công!`, "success");
//         loadBackups();
//       }
//     } catch (error) {
//       showAlert(`Backup ${type} thất bại: ` + error.message, "danger");
//       console.log(error);
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   const handleDownload = async (backup) => {
//     setActionLoading(`download-${backup.name}`);
//     try {
//       const response = await backupService.downloadBackup(backup.name);

//       // Tạo URL từ blob và trigger download
//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement("a");
//       link.href = url;
//       link.setAttribute("download", backup.name);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);

//       showAlert(`Đang tải xuống: ${backup.name}`, "success");
//     } catch (error) {
//       showAlert("Tải xuống thất bại: " + error.message, "danger");
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   const handleDelete = async (backup) => {
//     if (!window.confirm(`Bạn có chắc chắn muốn xóa backup "${backup.name}"?`)) {
//       return;
//     }

//     setActionLoading(`delete-${backup.name}`);
//     try {
//       const response = await backupService.deleteBackup(backup.name);
//       if (response.success) {
//         showAlert("Xóa backup thành công!", "success");
//         loadBackups();
//       }
//     } catch (error) {
//       showAlert("Xóa thất bại: " + error.message, "danger");
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   const handleRestore = async () => {
//     if (!selectedFile) {
//       showAlert("Vui lòng chọn file backup", "warning");
//       return;
//     }

//     setActionLoading("restore");
//     try {
//       const response = await backupService.restoreSystem(selectedFile);

//       if (response.success) {
//         showAlert(
//           "Quá trình khôi phục đã bắt đầu. Theo dõi tiến trình...",
//           "info"
//         );
//         setRestoreModal({ show: false, file: null });
//         setSelectedFile(null);

//         // Start polling for progress
//         pollRestoreProgress(response.logId);
//       }
//     } catch (error) {
//       showAlert("Khôi phục thất bại: " + error.message, "danger");
//       setActionLoading(null);
//     }
//   };

//   const pollRestoreProgress = async (logId) => {
//     const interval = setInterval(async () => {
//       try {
//         const response = await backupService.getRestoreProgress(logId);
//         setRestoreProgress(response);

//         if (response.status === "success" || response.status === "failed") {
//           clearInterval(interval);
//           setActionLoading(null);

//           if (response.status === "success") {
//             showAlert("Khôi phục thành công!", "success");
//           } else {
//             showAlert("Khôi phục thất bại: " + response.message, "danger");
//           }
//         }
//       } catch (error) {
//         console.error("Error polling progress:", error);
//         clearInterval(interval);
//         setActionLoading(null);
//       }
//     }, 2000);
//   };

//   const getTypeBadge = (type) => {
//     const variants = {
//       database: "primary",
//       system: "success",
//       full: "warning",
//     };
//     return <Badge bg={variants[type] || "secondary"}>{type}</Badge>;
//   };

//   return (
//     <Container className="py-4">
//       {alert.show && (
//         <Alert
//           variant={alert.type}
//           dismissible
//           onClose={() => setAlert({ show: false, message: "", type: "" })}
//         >
//           {alert.message}
//         </Alert>
//       )}

//       <Row>
//         <Col>
//           <h2 className="mb-4">Quản lý Backup & Restore</h2>
//         </Col>
//       </Row>

//       {/* Backup Actions */}
//       <Row className="mb-4">
//         <Col md={4}>
//           <Card className="h-100">
//             <Card.Body className="text-center">
//               <Card.Title>Backup Database</Card.Title>
//               <Card.Text className="text-muted">
//                 Sao lưu toàn bộ cơ sở dữ liệu
//               </Card.Text>
//               <Button
//                 variant="primary"
//                 onClick={() => handleBackup("database")}
//                 disabled={actionLoading === "database"}
//               >
//                 {actionLoading === "database" ? (
//                   <Spinner size="sm" />
//                 ) : (
//                   "Backup Database"
//                 )}
//               </Button>
//             </Card.Body>
//           </Card>
//         </Col>

//         <Col md={4}>
//           <Card className="h-100">
//             <Card.Body className="text-center">
//               <Card.Title>Backup Files</Card.Title>
//               <Card.Text className="text-muted">
//                 Sao lưu file hệ thống và uploads
//               </Card.Text>
//               <Button
//                 variant="success"
//                 onClick={() => handleBackup("files")}
//                 disabled={actionLoading === "files"}
//               >
//                 {actionLoading === "files" ? (
//                   <Spinner size="sm" />
//                 ) : (
//                   "Backup Files"
//                 )}
//               </Button>
//             </Card.Body>
//           </Card>
//         </Col>

//         <Col md={4}>
//           <Card className="h-100">
//             <Card.Body className="text-center">
//               <Card.Title>Full Backup</Card.Title>
//               <Card.Text className="text-muted">
//                 Sao lưu toàn bộ hệ thống
//               </Card.Text>
//               <Button
//                 variant="warning"
//                 onClick={() => handleBackup("full")}
//                 disabled={actionLoading === "full"}
//               >
//                 {actionLoading === "full" ? (
//                   <Spinner size="sm" />
//                 ) : (
//                   "Full Backup"
//                 )}
//               </Button>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       {/* Restore Section */}
//       <Row className="mb-4">
//         <Col>
//           <Card>
//             <Card.Body>
//               <Card.Title>Khôi phục hệ thống</Card.Title>
//               <Row>
//                 <Col md={8}>
//                   <input
//                     type="file"
//                     className="form-control"
//                     accept=".zip,.gz,.sql,.json,.bak"
//                     onChange={(e) => setSelectedFile(e.target.files[0])}
//                   />
//                   <small className="text-muted">
//                     Chỉ chấp nhận file backup: .zip, .gz, .sql, .json, .bak
//                   </small>
//                 </Col>
//                 <Col md={4}>
//                   <Button
//                     variant="danger"
//                     onClick={() =>
//                       setRestoreModal({ show: true, file: selectedFile })
//                     }
//                     disabled={!selectedFile || actionLoading === "restore"}
//                   >
//                     {actionLoading === "restore" ? (
//                       <Spinner size="sm" />
//                     ) : (
//                       "Khôi phục"
//                     )}
//                   </Button>
//                 </Col>
//               </Row>

//               {restoreProgress.status === "in_progress" && (
//                 <div className="mt-3">
//                   <ProgressBar
//                     now={restoreProgress.progress || 0}
//                     label={`${restoreProgress.progress || 0}%`}
//                     animated
//                   />
//                   <small className="text-muted">
//                     {restoreProgress.message}
//                   </small>
//                 </div>
//               )}
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       {/* Backup List */}
//       <Row>
//         <Col>
//           <Card>
//             <Card.Header>
//               <h5 className="mb-0">Danh sách Backup</h5>
//             </Card.Header>
//             <Card.Body>
//               {loading ? (
//                 <div className="text-center py-4">
//                   <Spinner animation="border" />
//                 </div>
//               ) : (
//                 <Table responsive striped>
//                   <thead>
//                     <tr>
//                       <th>Tên file</th>
//                       <th>Loại</th>
//                       <th>Kích thước</th>
//                       <th>Ngày tạo</th>
//                       <th>Thao tác</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {backups.map((backup) => (
//                       <tr key={backup.name}>
//                         <td>{backup.name}</td>
//                         <td>{getTypeBadge(backup.type)}</td>
//                         <td>{formatBytes(backup.size)}</td>
//                         <td>{formatDate(backup.createdAt)}</td>
//                         <td>
//                           <Button
//                             variant="outline-primary"
//                             size="sm"
//                             className="me-2"
//                             onClick={() => handleDownload(backup)}
//                             disabled={
//                               actionLoading === `download-${backup.name}`
//                             }
//                           >
//                             {actionLoading === `download-${backup.name}` ? (
//                               <Spinner size="sm" />
//                             ) : (
//                               "Tải xuống"
//                             )}
//                           </Button>
//                           <Button
//                             variant="outline-danger"
//                             size="sm"
//                             onClick={() => handleDelete(backup)}
//                             disabled={actionLoading === `delete-${backup.name}`}
//                           >
//                             {actionLoading === `delete-${backup.name}` ? (
//                               <Spinner size="sm" />
//                             ) : (
//                               "Xóa"
//                             )}
//                           </Button>
//                         </td>
//                       </tr>
//                     ))}
//                     {backups.length === 0 && (
//                       <tr>
//                         <td colSpan="5" className="text-center text-muted py-3">
//                           Chưa có backup nào
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </Table>
//               )}
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       {/* Restore Confirmation Modal */}
//       <Modal
//         show={restoreModal.show}
//         onHide={() => setRestoreModal({ show: false, file: null })}
//       >
//         <Modal.Header closeButton>
//           <Modal.Title>Xác nhận khôi phục</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Alert variant="danger">
//             <strong>CẢNH BÁO:</strong> Hành động này sẽ ghi đè toàn bộ dữ liệu
//             hiện tại. Bạn có chắc chắn muốn tiếp tục?
//           </Alert>
//           <p>
//             File: <strong>{selectedFile?.name}</strong>
//           </p>
//           <p>
//             Kích thước: <strong>{formatBytes(selectedFile?.size)}</strong>
//           </p>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button
//             variant="secondary"
//             onClick={() => setRestoreModal({ show: false, file: null })}
//           >
//             Hủy
//           </Button>
//           <Button variant="danger" onClick={handleRestore}>
//             {actionLoading === "restore" ? (
//               <Spinner size="sm" />
//             ) : (
//               "Tiếp tục khôi phục"
//             )}
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// };

// export default BackupManagement;

// src/pages/admin/backup/BackupManagement.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Alert,
  Modal,
  ProgressBar,
  Badge,
  Spinner,
  Form,
} from "react-bootstrap";
import { backupService } from "../../../services/adminService";
import { formatBytes, formatDate } from "../../../utils/helpers";

const BackupManagement = () => {
  const [backups, setBackups] = useState([]);
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [restoreModal, setRestoreModal] = useState({
    show: false,
    file: null,
    options: {
      targetDatabase: "",
      sourceDatabase: "",
      dropExisting: true,
    },
  });
  const [restoreProgress, setRestoreProgress] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [restoreOptions, setRestoreOptions] = useState({
    targetDatabase: "",
    sourceDatabase: "",
    dropExisting: true,
  });

  useEffect(() => {
    loadBackups();
    loadDatabases();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const response = await backupService.getBackupList();
      if (response.success) {
        setBackups(response.backups);
      }
    } catch (error) {
      showAlert("Lỗi khi tải danh sách backup: " + error.message, "danger");
    } finally {
      setLoading(false);
    }
  };

  const loadDatabases = async () => {
    try {
      const response = await backupService.getDatabases();
      if (response.success) {
        setDatabases(response.databases);
      }
    } catch (error) {
      console.error("Error loading databases:", error);
    }
  };

  const showAlert = (message, type = "info") => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
  };

  const handleBackup = async (type) => {
    setActionLoading(type);
    try {
      let response;
      switch (type) {
        case "database":
          response = await backupService.backupDatabase();
          break;
        case "files":
          response = await backupService.backupSystemFiles();
          break;
        case "full":
          response = await backupService.backupFull();
          break;
        default:
          return;
      }

      if (response.success) {
        showAlert(`Backup ${type} thành công!`, "success");
        loadBackups();
      }
    } catch (error) {
      showAlert(`Backup ${type} thất bại: ` + error.message, "danger");
      console.log(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async (backup) => {
    setActionLoading(`download-${backup.name}`);
    try {
      const response = await backupService.downloadBackup(backup.name);

      // Tạo URL từ blob và trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", backup.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showAlert(`Đang tải xuống: ${backup.name}`, "success");
    } catch (error) {
      showAlert("Tải xuống thất bại: " + error.message, "danger");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (backup) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa backup "${backup.name}"?`)) {
      return;
    }

    setActionLoading(`delete-${backup.name}`);
    try {
      const response = await backupService.deleteBackup(backup.name);
      if (response.success) {
        showAlert("Xóa backup thành công!", "success");
        loadBackups();
      }
    } catch (error) {
      showAlert("Xóa thất bại: " + error.message, "danger");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) {
      showAlert("Vui lòng chọn file backup", "warning");
      return;
    }

    setActionLoading("restore");
    try {
      const response = await backupService.restoreSystem(
        selectedFile,
        restoreOptions
      );

      if (response.success) {
        showAlert(
          "Quá trình khôi phục đã bắt đầu. Theo dõi tiến trình...",
          "info"
        );
        setRestoreModal({ show: false, file: null, options: {} });
        setSelectedFile(null);
        setRestoreOptions({
          targetDatabase: "",
          sourceDatabase: "",
          dropExisting: true,
        });

        // Start polling for progress
        pollRestoreProgress(response.logId);
      }
    } catch (error) {
      showAlert("Khôi phục thất bại: " + error.message, "danger");
      setActionLoading(null);
    }
  };

  const pollRestoreProgress = async (logId) => {
    const interval = setInterval(async () => {
      try {
        const response = await backupService.getRestoreProgress(logId);
        setRestoreProgress(response);

        if (response.status === "success" || response.status === "failed") {
          clearInterval(interval);
          setActionLoading(null);

          if (response.status === "success") {
            showAlert("Khôi phục thành công!", "success");
            loadDatabases(); // Reload databases list after restore
          } else {
            showAlert("Khôi phục thất bại: " + response.message, "danger");
          }
        }
      } catch (error) {
        console.error("Error polling progress:", error);
        clearInterval(interval);
        setActionLoading(null);
      }
    }, 2000);
  };

  const getTypeBadge = (type) => {
    const variants = {
      database: "primary",
      system: "success",
      full: "warning",
    };
    return <Badge bg={variants[type] || "secondary"}>{type}</Badge>;
  };

  const handleRestoreOptionChange = (key, value) => {
    setRestoreOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getRestoreDescription = () => {
    const { targetDatabase, sourceDatabase, dropExisting } = restoreOptions;

    if (!targetDatabase) {
      return "Khôi phục vào database gốc (database trong file backup)";
    }

    let description = `Khôi phục vào database: ${targetDatabase}`;

    if (sourceDatabase) {
      description += ` (từ ${sourceDatabase})`;
    }

    if (dropExisting) {
      description += " - GHI ĐÈ toàn bộ dữ liệu hiện có";
    } else {
      description += " - THÊM VÀO dữ liệu hiện có";
    }

    return description;
  };

  return (
    <Container className="py-4">
      {alert.show && (
        <Alert
          variant={alert.type}
          dismissible
          onClose={() => setAlert({ show: false, message: "", type: "" })}
        >
          {alert.message}
        </Alert>
      )}

      <Row>
        <Col>
          <h2 className="mb-4">Quản lý Backup & Restore</h2>
        </Col>
      </Row>

      {/* Backup Actions */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <Card.Title>Backup Database</Card.Title>
              <Card.Text className="text-muted">
                Sao lưu toàn bộ cơ sở dữ liệu
              </Card.Text>
              <Button
                variant="primary"
                onClick={() => handleBackup("database")}
                disabled={actionLoading === "database"}
              >
                {actionLoading === "database" ? (
                  <Spinner size="sm" />
                ) : (
                  "Backup Database"
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <Card.Title>Backup Files</Card.Title>
              <Card.Text className="text-muted">
                Sao lưu file hệ thống và uploads
              </Card.Text>
              <Button
                variant="success"
                onClick={() => handleBackup("files")}
                disabled={actionLoading === "files"}
              >
                {actionLoading === "files" ? (
                  <Spinner size="sm" />
                ) : (
                  "Backup Files"
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <Card.Title>Full Backup</Card.Title>
              <Card.Text className="text-muted">
                Sao lưu toàn bộ hệ thống
              </Card.Text>
              <Button
                variant="warning"
                onClick={() => handleBackup("full")}
                disabled={actionLoading === "full"}
              >
                {actionLoading === "full" ? (
                  <Spinner size="sm" />
                ) : (
                  "Full Backup"
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Restore Section */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Khôi phục hệ thống</Card.Title>
              <Row className="mb-3">
                <Col md={8}>
                  <Form.Group>
                    <Form.Label>Chọn file backup</Form.Label>
                    <Form.Control
                      type="file"
                      accept=".zip,.gz,.json"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                    />
                    <Form.Text className="text-muted">
                      Chỉ chấp nhận file backup: .zip, .gz, .json
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <Button
                    variant="danger"
                    onClick={() =>
                      setRestoreModal({
                        show: true,
                        file: selectedFile,
                        options: restoreOptions,
                      })
                    }
                    disabled={!selectedFile || actionLoading === "restore"}
                    className="w-100"
                  >
                    {actionLoading === "restore" ? (
                      <Spinner size="sm" />
                    ) : (
                      "Khôi phục"
                    )}
                  </Button>
                </Col>
              </Row>

              {/* Restore Options */}
              <Row>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Database đích</Form.Label>
                    <Form.Select
                      value={restoreOptions.targetDatabase}
                      onChange={(e) =>
                        handleRestoreOptionChange(
                          "targetDatabase",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Database gốc (từ backup)</option>
                      {databases.map((db) => (
                        <option key={db} value={db}>
                          {db}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Chọn database để khôi phục vào
                    </Form.Text>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Database nguồn (tuỳ chọn)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="autism_support"
                      value={restoreOptions.sourceDatabase}
                      onChange={(e) =>
                        handleRestoreOptionChange(
                          "sourceDatabase",
                          e.target.value
                        )
                      }
                    />
                    <Form.Text className="text-muted">
                      Tên database trong file backup
                    </Form.Text>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Hành động</Form.Label>
                    <div>
                      <Form.Check
                        type="radio"
                        id="drop-existing"
                        label="Ghi đè database đích"
                        checked={restoreOptions.dropExisting}
                        onChange={() =>
                          handleRestoreOptionChange("dropExisting", true)
                        }
                        className="mb-1"
                      />
                      <Form.Check
                        type="radio"
                        id="keep-existing"
                        label="Thêm vào database đích"
                        checked={!restoreOptions.dropExisting}
                        onChange={() =>
                          handleRestoreOptionChange("dropExisting", false)
                        }
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              {/* Restore Description */}
              {selectedFile && (
                <Alert variant="info" className="mt-3">
                  <strong>Mô tả:</strong> {getRestoreDescription()}
                </Alert>
              )}

              {/* Progress Bar */}
              {restoreProgress.status === "in_progress" && (
                <div className="mt-3">
                  <ProgressBar
                    now={restoreProgress.progress || 0}
                    label={`${restoreProgress.progress || 0}%`}
                    animated
                  />
                  <small className="text-muted d-block mt-1">
                    {restoreProgress.message}
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Backup List */}
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Danh sách Backup</h5>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={loadBackups}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : "Làm mới"}
              </Button>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                </div>
              ) : (
                <Table responsive striped>
                  <thead>
                    <tr>
                      <th>Tên file</th>
                      <th>Loại</th>
                      <th>Kích thước</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((backup) => (
                      <tr key={backup.name}>
                        <td>{backup.name}</td>
                        <td>{getTypeBadge(backup.type)}</td>
                        <td>{formatBytes(backup.size)}</td>
                        <td>{formatDate(backup.createdAt)}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleDownload(backup)}
                            disabled={
                              actionLoading === `download-${backup.name}`
                            }
                          >
                            {actionLoading === `download-${backup.name}` ? (
                              <Spinner size="sm" />
                            ) : (
                              "Tải xuống"
                            )}
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(backup)}
                            disabled={actionLoading === `delete-${backup.name}`}
                          >
                            {actionLoading === `delete-${backup.name}` ? (
                              <Spinner size="sm" />
                            ) : (
                              "Xóa"
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {backups.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-3">
                          Chưa có backup nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Restore Confirmation Modal */}
      <Modal
        show={restoreModal.show}
        onHide={() => setRestoreModal({ show: false, file: null, options: {} })}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận khôi phục</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>THÔNG TIN KHÔI PHỤC:</strong>
          </Alert>

          <Row className="mb-3">
            <Col md={6}>
              <strong>File backup:</strong>
              <div>{selectedFile?.name}</div>
            </Col>
            <Col md={6}>
              <strong>Kích thước:</strong>
              <div>{formatBytes(selectedFile?.size)}</div>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <strong>Database đích:</strong>
              <div>
                {restoreOptions.targetDatabase || "Database gốc (từ backup)"}
              </div>
            </Col>
            <Col md={6}>
              <strong>Database nguồn:</strong>
              <div>{restoreOptions.sourceDatabase || "Tự động detect"}</div>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <strong>Hành động:</strong>
              <div>
                {restoreOptions.dropExisting ? (
                  <Badge bg="danger">GHI ĐÈ toàn bộ dữ liệu hiện có</Badge>
                ) : (
                  <Badge bg="warning">THÊM VÀO dữ liệu hiện có</Badge>
                )}
              </div>
            </Col>
          </Row>

          {restoreOptions.dropExisting && (
            <Alert variant="danger">
              <strong>CẢNH BÁO:</strong> Hành động này sẽ{" "}
              {restoreOptions.targetDatabase
                ? `GHI ĐÈ toàn bộ dữ liệu trong database "${restoreOptions.targetDatabase}"`
                : "GHI ĐÈ toàn bộ dữ liệu hiện tại"}
              . Bạn có chắc chắn muốn tiếp tục?
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() =>
              setRestoreModal({ show: false, file: null, options: {} })
            }
          >
            Hủy
          </Button>
          <Button variant="danger" onClick={handleRestore}>
            {actionLoading === "restore" ? (
              <Spinner size="sm" />
            ) : (
              "Xác nhận khôi phục"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BackupManagement;
