// components/ViolationStats.js
import React from "react";
import { Row, Col, Card } from "react-bootstrap";

const ViolationStats = ({ stats }) => {
  return (
    <Row className="mb-4">
      <Col md={4}>
        <Card className="text-center">
          <Card.Body>
            <h3 className="text-primary">{stats.total}</h3>
            <p className="text-muted mb-0">Tổng vi phạm</p>
          </Card.Body>
        </Card>
      </Col>

      <Col md={4}>
        <Card className="text-center">
          <Card.Body>
            <h3 className="text-danger">{stats.approved}</h3>
            <p className="text-muted mb-0">Đã phê duyệt</p>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="text-center">
          <Card.Body>
            <h3 className="text-success">{stats.appeals?.approved || 0}</h3>
            <p className="text-muted mb-0">Kháng cáo thành công</p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default ViolationStats;
