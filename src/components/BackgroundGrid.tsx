import React from "react";
import { TimelineItem } from "../types";

interface BackgroundGridProps {
  items: TimelineItem[][];
  timelineStartDate: string;
  pixelsPerDay: number;
  calculateWidth: (start: string, end: string) => number;
  getDiffStartDate: (start: string, dateToCompare: string) => number;
  calculateBackgroundHeight: () => number;
  draggedItem: {
    item: TimelineItem;
    itemIndex: number;
    laneIndex: number;
  } | null;
}

const BackgroundGrid: React.FC<BackgroundGridProps> = ({
  items,
  timelineStartDate,
  pixelsPerDay,
  calculateWidth,
  getDiffStartDate,
  calculateBackgroundHeight,
  draggedItem,
}) => {
  const maxLinePosition = Math.ceil(
    Math.max(
      ...items.flatMap((lane) =>
        lane.map(
          (item) =>
            getDiffStartDate(item.start, timelineStartDate) +
            calculateWidth(item.start, item.end)
        )
      )
    ) /
      pixelsPerDay +
      10
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      {Array.from({ length: maxLinePosition }, (_, i) => {
        const linePosition = i * pixelsPerDay;
        const matchingItem = items
          .flatMap((lane) => lane)
          .find(
            (item) =>
              Math.abs(
                getDiffStartDate(item.start, timelineStartDate) - linePosition
              ) < 2
          );
        const isItemStart = !!matchingItem;

        return (
          <div
            key={linePosition}
            className={`timeline-background-line-vertical ${
              isItemStart ? "start" : ""
            } ${
              draggedItem &&
              linePosition ===
                getDiffStartDate(draggedItem.item.start, timelineStartDate)
                ? "dragging-target"
                : ""
            }`}
            style={{
              left: linePosition,
              backgroundColor: (() => {
                if (draggedItem) {
                  // Highlight lines when dragging - show where the item will land
                  const draggedItemStart = getDiffStartDate(
                    draggedItem.item.start,
                    timelineStartDate
                  );
                  const isAtStartDate = linePosition === draggedItemStart;

                  if (isAtStartDate) {
                    return "white"; // Gold color for lines under dragged item
                  }
                }
                return isItemStart ? "white" : "#555";
              })(),
              borderTop: (() => {
                if (draggedItem) {
                  const draggedItemStart = getDiffStartDate(
                    draggedItem.item.start,
                    timelineStartDate
                  );
                  const isAtStartDate = linePosition === draggedItemStart;

                  if (isAtStartDate) {
                    return "1px solid white";
                  }
                }
                return "1px solid #555";
              })(),
              width: calculateBackgroundHeight(),
            }}
          >
            {isItemStart && (
              <div className="timeline-background-line-label">
                {matchingItem
                  ? new Date(matchingItem.start).toLocaleDateString()
                  : ""}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BackgroundGrid;
