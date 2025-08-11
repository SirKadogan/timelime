import React from "react";
import { TimelineItem } from "../types";

interface DragPreviewProps {
  draggedItem: {
    item: TimelineItem;
    itemIndex: number;
    laneIndex: number;
  };
  timelineRef: React.RefObject<HTMLDivElement>;
  timelineStartDate: string;
  pixelsPerDay: number;
  calculateWidth: (start: string, end: string) => number;
  getItemColor: (itemIndex: number, laneIndex: number) => string;
  getItemBorderColor: (itemIndex: number, laneIndex: number) => string;
  getDiffStartDate: (
    start: string,
    dateToCompare: string,
    pixelsPerDay: number
  ) => number;
  ROW_HEIGHT: number;
}

const DragPreview: React.FC<DragPreviewProps> = ({
  draggedItem,
  timelineRef,
  timelineStartDate,
  pixelsPerDay,
  calculateWidth,
  getItemColor,
  getItemBorderColor,
  getDiffStartDate,
  ROW_HEIGHT,
}) => {
  const rect = timelineRef.current?.getBoundingClientRect();
  if (!rect) return null;

  const left =
    rect.left +
    getDiffStartDate(draggedItem.item.start, timelineStartDate, pixelsPerDay) +
    20;
  const top = rect.top + draggedItem.laneIndex * (ROW_HEIGHT + 3) + 20;

  return (
    <div
      className="timeline-drag-preview"
      style={{
        width: calculateWidth(draggedItem.item.start, draggedItem.item.end),
        backgroundColor: getItemColor(
          draggedItem.itemIndex,
          draggedItem.laneIndex
        ),
        left,
        top,
        border: `2px solid ${getItemBorderColor(
          draggedItem.itemIndex,
          draggedItem.laneIndex
        )}`,
      }}
    >
      <div className="timeline-drag-preview-name">{draggedItem.item.name}</div>
      <div className="timeline-drag-preview-dates">
        {new Date(draggedItem.item.start).toLocaleDateString()} -{" "}
        {new Date(draggedItem.item.end).toLocaleDateString()}
      </div>
    </div>
  );
};

export default DragPreview;
