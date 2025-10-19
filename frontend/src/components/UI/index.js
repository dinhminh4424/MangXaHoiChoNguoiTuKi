// components/UI/index.js
// Import và re-export các component
import Loader from "./Loader";
import Alert from "./Alert";
import EmptyState from "./EmptyState";
import ConfirmModal from "./ConfirmModal";

// Named exports
export { Loader, Alert, EmptyState, ConfirmModal };

// Hoặc có thể export default
export default {
  Loader,
  Alert,
  EmptyState,
  ConfirmModal,
};
