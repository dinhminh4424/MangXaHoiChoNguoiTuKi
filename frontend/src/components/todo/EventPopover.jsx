import React from "react";
import PropTypes from "prop-types";
import {
  Calendar,
  MapPin,
  Tag,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Target,
  X,
  Edit,
  Trash2,
  Check,
  Calendar as CalendarIcon,
  FileText,
  Folder,
  Star,
  Bell,
  Timer,
} from "lucide-react";
import "./EventPopover.css";

const EventPopover = ({
  event,
  onClose,
  onMarkComplete,
  onEdit,
  onDelete,
  loading = false,
}) => {
  console.log("EventPopover event.extendedProps:", event.extendedProps);

  const handleClose = (e) => {
    e.stopPropagation();
    onClose();
  };

  const handleMarkComplete = async (e) => {
    e.stopPropagation();
    if (onMarkComplete && event?.id) {
      await onMarkComplete(event.id);
      onClose();
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit && event) {
      onEdit();
      onClose();
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (onDelete && event?.id) {
      if (window.confirm("Bạn có chắc chắn muốn xóa công việc này?")) {
        await onDelete(event.id);
        onClose();
      }
    }
  };

  if (!event) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case "done":
        return <CheckCircle size={16} />;
      case "in-progress":
        return <Timer size={16} />;
      case "cancelled":
        return <XCircle size={16} />;
      default:
        return <Calendar size={16} />;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return <AlertCircle size={16} />;
      case "medium":
        return <Target size={16} />;
      case "low":
        return <Check size={16} />;
      default:
        return <Target size={16} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "done":
        return "Hoàn thành";
      case "in-progress":
        return "Đang thực hiện";
      case "cancelled":
        return "Đã hủy";
      case "scheduled":
        return "Đã lên lịch";
      default:
        return status;
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case "high":
        return "Cao";
      case "medium":
        return "Trung bình";
      case "low":
        return "Thấp";
      default:
        return priority;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Chưa đặt";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";

      return date.toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return "Chưa đặt";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";

      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const eventData = event.extendedProps || {};

  return (
    <div className="event-popover-overlay" onClick={handleClose}>
      <div className="event-popover-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="event-popover-header">
          <button
            className="event-popover-close-btn"
            onClick={handleClose}
            disabled={loading}
          >
            <X size={20} />
          </button>
          <h3 className="event-popover-title">{event.title}</h3>
        </div>

        {/* Body */}
        <div className="event-popover-body">
          {/* Mô tả */}
          {eventData.description && (
            <div className="event-section">
              <div className="section-title">
                <FileText size={16} />
                <span>Mô tả</span>
              </div>
              <div className="section-content">{eventData.description}</div>
            </div>
          )}

          {/* Thời gian */}
          <div className="event-section">
            <div className="section-title">
              <CalendarIcon size={16} />
              <span>Thời gian</span>
            </div>
            <div className="section-content">
              {formatDateTime(event.start)}
              {event.end && event.end !== event.start && (
                <>
                  <br />
                  Kết thúc: {formatDateTime(event.end)}
                </>
              )}
              {event.allDay && (
                <div className="mt-1">
                  <em>(Cả ngày)</em>
                </div>
              )}
            </div>
            {/* <div className="section-content">
              {formatDateTime(event.extendedProps.start)}
              {event.extendedProps.end &&
                event.end !== event.extendedProps.start && (
                  <>
                    <br />
                    Kết thúc: {formatDateTime(event.extendedProps.end)}
                  </>
                )}
              {event.extendedProps.allDay && (
                <div className="mt-1">
                  <em>(Cả ngày)</em>
                </div>
              )}
            </div> */}
          </div>

          {/* Hạn hoàn thành */}
          {eventData.dueDate && (
            <div className="event-section">
              <div className="section-title">
                <Clock size={16} />
                <span>Hạn hoàn thành</span>
              </div>
              <div className="section-content">
                {formatDateOnly(eventData.dueDate)}
              </div>
            </div>
          )}

          {/* Trạng thái & Ưu tiên */}
          <div className="event-section">
            <div className="section-title">
              <Target size={16} />
              <span>Trạng thái & Ưu tiên</span>
            </div>
            <div>
              <span
                className={`event-status-badge priority-${
                  eventData.priority || "medium"
                }`}
              >
                {getPriorityIcon(eventData.priority)}
                {getPriorityText(eventData.priority)}
              </span>

              <span
                className={`event-status-badge status-${
                  eventData.status || "scheduled"
                }`}
              >
                {getStatusIcon(eventData.status)}
                {getStatusText(eventData.status)}
              </span>

              {eventData.isImportant && (
                <span
                  className="event-status-badge"
                  style={{ background: "#fef3c7", color: "#92400e" }}
                >
                  <Star size={16} />
                  Quan trọng
                </span>
              )}
            </div>
          </div>

          {/* Địa điểm */}
          {eventData.location && (
            <div className="event-section">
              <div className="section-title">
                <MapPin size={16} />
                <span>Địa điểm</span>
              </div>
              <div className="section-content">{eventData.location}</div>
            </div>
          )}

          {/* Danh mục */}
          {eventData.category && (
            <div className="event-section">
              <div className="section-title">
                <Folder size={16} />
                <span>Danh mục</span>
              </div>
              <div className="section-content">{eventData.category}</div>
            </div>
          )}

          {/* Tags */}
          {eventData.tags && eventData.tags.length > 0 && (
            <div className="event-section">
              <div className="section-title">
                <Tag size={16} />
                <span>Tags</span>
              </div>
              <div className="event-tags-container">
                {eventData.tags.map((tag, index) => (
                  <span key={index} className="event-tag-item">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Attendees */}
          {eventData.attendees && eventData.attendees.length > 0 && (
            <div className="event-section">
              <div className="section-title">
                <Users size={16} />
                <span>Người tham gia</span>
              </div>
              <div className="section-content">
                {eventData.attendees.join(", ")}
              </div>
            </div>
          )}

          {/* Reminder */}
          {eventData.reminder && (
            <div className="event-section">
              <div className="section-title">
                <Bell size={16} />
                <span>Nhắc nhở</span>
              </div>
              <div className="section-content">
                {formatDateTime(eventData.reminder)}
              </div>
            </div>
          )}
        </div>

        {/* Footer với các nút action */}
        <div className="event-popover-footer">
          {eventData.status !== "done" && (
            <button
              className="popover-btn btn-success"
              onClick={handleMarkComplete}
              disabled={loading}
            >
              <Check size={16} />
              Hoàn thành
            </button>
          )}

          <button
            className="popover-btn btn-edit"
            onClick={handleEdit}
            disabled={loading}
          >
            <Edit size={16} />
            Chỉnh sửa
          </button>

          <button
            className="popover-btn btn-delete"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 size={16} />
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

EventPopover.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    start: PropTypes.string,
    end: PropTypes.string,
    allDay: PropTypes.bool,
    extendedProps: PropTypes.shape({
      description: PropTypes.string,
      location: PropTypes.string,
      category: PropTypes.string,
      tags: PropTypes.array,
      status: PropTypes.string,
      priority: PropTypes.string,
      isImportant: PropTypes.bool,
      dueDate: PropTypes.string,
      reminder: PropTypes.string,
      attendees: PropTypes.array,
      estimatedTime: PropTypes.object,
    }),
  }),
  onClose: PropTypes.func.isRequired,
  onMarkComplete: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  loading: PropTypes.bool,
};

export default EventPopover;
