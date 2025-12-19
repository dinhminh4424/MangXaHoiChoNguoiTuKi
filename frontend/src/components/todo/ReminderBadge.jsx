// components/todo/ReminderBadge.jsx
import React from "react";
import { Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Clock, Bell, BellOff } from "lucide-react";

const ReminderBadge = ({ todo, size = "sm" }) => {
  if (!todo) return null;

  const getReminderText = () => {
    if (!todo.reminderEnabled) {
      return "Không nhắc nhở";
    }

    if (!todo.start) {
      return "Chưa đặt thời gian";
    }

    const startTime = new Date(todo.start);
    const now = new Date();
    const minutesLeft = Math.floor((startTime - now) / (1000 * 60));

    if (minutesLeft <= 0) {
      return "Đã qua thời gian";
    }

    return `Nhắc ${todo.reminderMinutes || 5} phút trước`;
  };

  const getReminderIcon = () => {
    if (!todo.reminderEnabled) {
      return <BellOff size={14} />;
    }

    if (!todo.start || new Date(todo.start) <= new Date()) {
      return <Clock size={14} />;
    }

    return <Bell size={14} />;
  };

  const getBadgeVariant = () => {
    if (!todo.reminderEnabled) return "secondary";
    if (!todo.start) return "warning";

    const startTime = new Date(todo.start);
    const now = new Date();

    if (startTime <= now) return "dark";

    // Nếu đã gửi reminder
    if (todo.reminderSent) return "success";

    return "primary";
  };

  return (
    <OverlayTrigger
      placement="top"
      overlay={
        <Tooltip id={`reminder-tooltip-${todo._id}`}>
          <div className="text-start">
            <strong>Nhắc nhở:</strong> {getReminderText()}
            {todo.start && todo.reminderEnabled && (
              <>
                <br />
                <small>
                  Bắt đầu: {new Date(todo.start).toLocaleString("vi-VN")}
                </small>
                <br />
                <small>
                  Nhắc lúc:{" "}
                  {new Date(
                    new Date(todo.start).getTime() -
                      (todo.reminderMinutes || 5) * 60000
                  ).toLocaleString("vi-VN")}
                </small>
              </>
            )}
          </div>
        </Tooltip>
      }
    >
      <Badge
        bg={getBadgeVariant()}
        className={`d-inline-flex align-items-center gap-1 reminder-badge-${size}`}
        style={{ cursor: "pointer" }}
      >
        {getReminderIcon()}
        <span>
          {todo.reminderEnabled ? `${todo.reminderMinutes || 5}p` : "Off"}
        </span>
      </Badge>
    </OverlayTrigger>
  );
};

// CSS thêm vào
const styles = `
.reminder-badge-sm {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}
.reminder-badge-md {
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
}
.reminder-badge-lg {
  font-size: 1rem;
  padding: 0.5rem 1rem;
}
`;

export default ReminderBadge;
