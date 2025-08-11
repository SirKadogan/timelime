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
  "#00CCCC", // Neon Cyan
  "#CC4EC5", // Dark Neon Pink
  "#CC7A00", // Dark Neon Orange
  "#08CCB7", // Dark Neon Aqua
  "#8B4FCC", // Dark Neon Purple
];

const Timeline = ({
  items: initialItems,
  timelineStartDate,
}: TimelineProps): JSX.Element => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [pixelsPerDay, setPixelsPerDay] = useState(PIXELS_PER_DAY);
  const [items, setItems] = useState(initialItems);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

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

  const startEditing = (itemId: number, currentName: string) => {
    setEditingItem(itemId);
    setEditValue(currentName);
  };

  const saveEdit = (itemId: number) => {
    if (editValue.trim()) {
      setItems((prevItems) =>
        prevItems.map((lane) =>
          lane.map((item) =>
            item.id === itemId ? { ...item, name: editValue.trim() } : item
          )
        )
      );
    }
    setEditingItem(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditValue("");
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
    <div
      style={{
        margin: "60px",
        backgroundColor: "#333",
        height: calculateBackgroundHeight(),
        position: "relative",
        borderRadius: "10px",
        overflowX: "auto",
        overflowY: "hidden",
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
                      padding: "4px 2px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                    onMouseEnter={(e) => {
                      const target = e.currentTarget;
                      const itemWidth = calculateWidth(item.start, item.end);
                      const textWidth = item.name.length * 8; // Approximate character width
                      const totalTextWidth = textWidth + 40; // 40px for padding and buffer

                      if (totalTextWidth > itemWidth) {
                        target.style.width = `${Math.max(
                          itemWidth,
                          totalTextWidth
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
                    {editingItem === item.id ? (
                      <div style={{ marginBottom: "4px" }}>
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              saveEdit(item.id);
                            } else if (e.key === "Escape") {
                              cancelEdit();
                            }
                          }}
                          onBlur={() => saveEdit(item.id)}
                          style={{
                            width: "100%",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#1a1a1a",
                            backgroundColor: "white",
                            border: "1px solid #666",
                            borderRadius: "3px",
                            padding: "2px 4px",
                            outline: "none",
                          }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#1a1a1a",
                          textShadow: "1px 1px 2px rgba(255,255,255,0.3)",
                          lineHeight: "1.2",
                          marginBottom: "4px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          cursor: "pointer",
                        }}
                        onClick={() => startEditing(item.id, item.name)}
                        title="Click to edit"
                      >
                        {item.name}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#333",
                        fontFamily: "monospace",
                        fontWeight: "500",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                      }}
                    >
                      {new Date(item.start).toLocaleDateString()} -{" "}
                      {new Date(item.end).toLocaleDateString()}
                    </div>
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
  );
};

export default Timeline;
