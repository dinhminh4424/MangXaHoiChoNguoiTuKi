import React, { useId } from "react";
import PropTypes from "prop-types";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

/**
 * TooltipWrapper
 * - title: nội dung tooltip
 * - placement: "top" | "bottom" | "left" | "right"
 * - delay: { show, hide } in ms
 * - children: element được bọc (single child recommended)
 */
export default function TooltipWrapper({
  title,
  placement = "top",
  delay = { show: 100, hide: 50 },
  children,
}) {
  const id = useId();
  if (!title) return children;

  return (
    <OverlayTrigger
      placement={placement}
      delay={delay}
      overlay={<Tooltip id={id}>{title}</Tooltip>}
    >
      {children}
    </OverlayTrigger>
  );
}

TooltipWrapper.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  placement: PropTypes.string,
  delay: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  children: PropTypes.node.isRequired,
};
