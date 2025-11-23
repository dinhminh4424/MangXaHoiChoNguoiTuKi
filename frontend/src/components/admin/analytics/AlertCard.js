// src/components/admin/analytics/AlertCard.js
import React from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { AlertTriangle, Info, AlertCircle, ExternalLink } from "lucide-react";

const AlertCard = ({ alert }) => {
  const getSeverityIcon = () => {
    switch (alert.severity) {
      case "high":
        return <AlertCircle size={20} className="text-danger" />;
      case "medium":
        return <AlertTriangle size={20} className="text-warning" />;
      case "warning":
        return <Info size={20} className="text-info" />;
      default:
        return <Info size={20} className="text-info" />;
    }
  };

  const getSeverityVariant = () => {
    switch (alert.severity) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "warning":
        return "info";
      default:
        return "info";
    }
  };

  return (
    <Card className="border-0 shadow-sm mb-2">
      <Card.Body>
        <div className="d-flex align-items-start">
          <div className="me-3">{getSeverityIcon()}</div>
          <div className="flex-grow-1">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h6 className="mb-0">{alert.message}</h6>
              <Badge bg={getSeverityVariant()} className="text-capitalize">
                {alert.severity}
              </Badge>
            </div>

            {alert.users && alert.users.length > 0 && (
              <div className="mb-2">
                <small className="text-muted d-block mb-1">
                  Người dùng liên quan:
                </small>
                <div className="d-flex flex-wrap gap-1">
                  {alert.users.slice(0, 3).map((user, index) => (
                    <Badge
                      key={index}
                      bg="light"
                      text="dark"
                      className="fw-normal"
                    >
                      {user.username || user.userId}
                    </Badge>
                  ))}
                  {alert.users.length > 3 && (
                    <Badge bg="light" text="dark" className="fw-normal">
                      +{alert.users.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {alert.date && (
              <small className="text-muted">
                Ngày: {new Date(alert.date).toLocaleDateString("vi-VN")}
              </small>
            )}
          </div>
        </div>

        <div className="mt-2 text-end">
          <Button variant="outline-primary" size="sm">
            Xem chi tiết <ExternalLink size={14} className="ms-1" />
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default AlertCard;
