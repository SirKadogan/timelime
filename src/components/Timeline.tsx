import React, { useRef, useState } from "react";
import { TimelineItem } from "../types";

interface TimelineProps {
  items: TimelineItem[][];
  timelineStartDate: string;
}

const PIXELS_PER_DAY = 15;
const ROW_HEIGHT = 60;
const colors = [
  "#39FF14", // Neon Green
  "#FF073A", // Neon Red
  "#F5F500", // Neon Yellow
  "#00FFFF", // Neon Cyan
  "#FF61F6", // Neon Pink
  "#FF9900", // Neon Orange
  "#0AFFEF", // Neon Aqua
  "#B967FF", // Neon Purple
];

const borderColors = [
  "#2ABF0E", // Dark Neon Green
  "#CC0530", // Dark Neon Red
  "#B8B800", // Dark Neon Yellow
  "#00CCCC", // Dark Neon Cyan
  "#CC4EC5", // Dark Neon Pink
  "#CC7A00", // Dark Neon Orange
  "#08CCB7", // Dark Neon Aqua
  "#8B4FCC", // Dark Neon Purple
];

const Timeline = ({ items, timelineStartDate }: TimelineProps): JSX.Element => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [pixelsPerDay, setPixelsPerDay] = useState(PIXELS_PER_DAY);

  const calculateWidth = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * pixelsPerDay || pixelsPerDay;
  };

  const getDiffStartDate = (start: string, dateToCompare: string): number => {
    const startDate = new Date(start);
    const timelineStart = new Date(dateToCompare);
    const diffTime = Math.abs(startDate.getTime() - timelineStart.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * pixelsPerDay;
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Only zoom when Ctrl/Cmd key is pressed
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setPixelsPerDay((prev) => Math.max(5, Math.min(100, prev * zoomFactor)));
    }
    // Otherwise, allow normal scrolling
  };

  const getItemColor = (itemIndex: number, laneIndex: number): string => {
    return colors[(itemIndex + laneIndex * 2) % colors.length];
  };

  const getItemBorderColor = (itemIndex: number, laneIndex: number): string => {
    return borderColors[(itemIndex + laneIndex * 2) % borderColors.length];
  };

  const calculateBackgroundHeight = (): number => {
    return items.length * ROW_HEIGHT + (items.length - 1) * 3;
  };

  const screenWidth = window.innerWidth;

  return (
    <div>
      <h2>Timeline</h2>
      <div
        style={{
          backgroundColor: "#333",
          height: calculateBackgroundHeight(),
          position: "relative",
          borderRadius: "10px",
          overflow: "scroll",
          width: "100%",
          padding: "20px",
        }}
        ref={timelineRef}
      >
        <div
          style={{
            position: "relative",
            marginBottom: "30px",
          }}
          onWheel={handleWheel}
        >
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {items.map((lane, index) => (
              <li
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginTop: "3px",
                  position: "relative",
                  height: ROW_HEIGHT,
                }}
              >
                {lane.map((item, itemIndex) => (
                  <React.Fragment key={item.id}>
                    <div
                      style={{
                        width: calculateWidth(item.start, item.end),
                        backgroundColor: getItemColor(itemIndex, index),
                        height: ROW_HEIGHT,
                        borderRadius: "5px",
                        boxSizing: "border-box",
                        position: "absolute",
                        left: getDiffStartDate(item.start, timelineStartDate),
                        border: `2px solid ${getItemBorderColor(
                          itemIndex,
                          index
                        )}`,
                        zIndex: 10,
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        const target = e.currentTarget;
                        if (target.scrollWidth > target.clientWidth) {
                          target.style.width = `${Math.max(
                            calculateWidth(item.start, item.end),
                            target.scrollWidth + 20
                          )}px`;
                          target.style.zIndex = "100";
                        }
                      }}
                      onMouseLeave={(e) => {
                        const target = e.currentTarget;
                        target.style.width = `${calculateWidth(
                          item.start,
                          item.end
                        )}px`;
                        target.style.zIndex = "10";
                      }}
                    >
                      {item.name}
                    </div>
                  </React.Fragment>
                ))}
              </li>
            ))}
          </ul>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            {Array.from(
              {
                length: Math.ceil(
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
                ),
              },
              (_, i) => {
                const linePosition = i * pixelsPerDay;
                const matchingItem = items
                  .flatMap((lane) => lane)
                  .find(
                    (item) =>
                      Math.abs(
                        getDiffStartDate(item.start, timelineStartDate) -
                          linePosition
                      ) < 2
                  );
                const isItemStart = !!matchingItem;

                return (
                  <div
                    key={linePosition}
                    style={{
                      position: "absolute",
                      left: linePosition,
                      height: isItemStart ? "1px" : "1px",
                      backgroundColor: isItemStart ? "white" : "#555",
                      transform: "rotate(90deg)",
                      transformOrigin: "left center",
                      borderTop: "1px solid #555",
                      width: calculateBackgroundHeight(),
                    }}
                  >
                    {isItemStart && (
                      <div
                        style={{
                          fontSize: "11px",
                          letterSpacing: "0.05em",
                          color: "white",
                          whiteSpace: "nowrap",
                          textAlign: "end",
                          paddingTop: "2px",
                        }}
                      >
                        {matchingItem
                          ? new Date(matchingItem.start).toLocaleDateString()
                          : ""}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
