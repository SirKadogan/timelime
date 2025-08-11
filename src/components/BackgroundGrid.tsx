import React from "react";
import { TimelineItem } from "../types";

interface BackgroundGridProps {
  items: TimelineItem[][];
  timelineStartDate: string;
  pixelsPerDay: number;
  calculateWidth: (start: string, end: string) => number;
  getDiffStartDate: (
    start: string,
    dateToCompare: string,
    pixelsPerDay: number
  ) => number;
  formatDateForDisplay: (dateString: string) => string;
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
  formatDateForDisplay,
  calculateBackgroundHeight,
  draggedItem,
}) => {
  // Calculate the maximum line position for the grid
  const calculateMaxLinePosition = (): number => {
    return Math.ceil(
      Math.max(
        ...items.flatMap((lane) =>
          lane.map(
            (item) =>
              getDiffStartDate(item.start, timelineStartDate, pixelsPerDay) +
              calculateWidth(item.start, item.end)
          )
        )
      ) /
        pixelsPerDay +
        10
    );
  };

  // Find matching item for a given line position
  const findMatchingItem = (linePosition: number): TimelineItem | undefined => {
    return items
      .flatMap((lane) => lane)
      .find(
        (item) =>
          Math.abs(
            getDiffStartDate(item.start, timelineStartDate, pixelsPerDay) -
              linePosition
          ) < 2
      );
  };

  // Check if a line position matches the dragged item start position
  const isDraggedItemStart = (linePosition: number): boolean => {
    if (!draggedItem) return false;
    return (
      linePosition ===
      getDiffStartDate(draggedItem.item.start, timelineStartDate, pixelsPerDay)
    );
  };

  // Get background color for a line
  const getLineBackgroundColor = (
    linePosition: number,
    isItemStart: boolean
  ): string => {
    if (draggedItem && isDraggedItemStart(linePosition)) {
      return "white"; // White color for lines under dragged item
    }
    return isItemStart ? "white" : "#555";
  };

  // Get border style for a line
  const getLineBorderStyle = (linePosition: number): string => {
    if (draggedItem && isDraggedItemStart(linePosition)) {
      return "1px solid white";
    }
    return "1px solid #555";
  };

  const maxLinePosition = calculateMaxLinePosition();

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
        const matchingItem = findMatchingItem(linePosition);
        const isItemStart = !!matchingItem;

        return (
          <div
            key={linePosition}
            className={`timeline-background-line-vertical ${
              isItemStart ? "start" : ""
            } ${isDraggedItemStart(linePosition) ? "dragging-target" : ""}`}
            style={{
              left: linePosition,
              backgroundColor: getLineBackgroundColor(
                linePosition,
                isItemStart
              ),
              borderTop: getLineBorderStyle(linePosition),
              width: calculateBackgroundHeight(),
            }}
          >
            {isItemStart && (
              <div className="timeline-background-line-label">
                {matchingItem ? formatDateForDisplay(matchingItem.start) : ""}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BackgroundGrid;
