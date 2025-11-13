// components/AppealModal.js
import React, { useState } from "react";
import { Modal, Form, Button, Alert, Row, Col } from "react-bootstrap";
import { violationService } from "../../services/violationService";

const AppealModal = ({ show, onHide, violation, onSuccess }) => {
  const [appealReason, setAppealReason] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!appealReason.trim()) {
      setError("Vui lòng nhập lý do kháng cáo");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await violationService.createAppeal(
        violation._id,
        { appealReason },
        files
      );

      setAppealReason("");
      setFiles([]);
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || "Lỗi khi gửi kháng cáo");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleClose = () => {
    setAppealReason("");
    setFiles([]);
    setError("");
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Gửi kháng cáo</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>Lý do kháng cáo *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder="Trình bày lý do bạn cho rằng vi phạm này không chính xác..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>File đính kèm (tùy chọn)</Form.Label>
            <Form.Control
              type="file"
              multiple
              onChange={handleFileChange}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            />
            <Form.Text className="text-muted">
              Hỗ trợ: hình ảnh, video, audio, PDF, Word. Tối đa 10MB/file
            </Form.Text>
          </Form.Group>

          {files.length > 0 && (
            <div className="mt-2">
              <strong>File đã chọn:</strong>
              <ul className="small">
                {files.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Hủy
          </Button>
          <Button variant="warning" type="submit" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi kháng cáo"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AppealModal;
