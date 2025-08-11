import React, { useRef, useState } from "react";
import { TimelineItem } from "../types";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { useZoom } from "../hooks/useZoom";
import { PIXELS_PER_DAY, ROW_HEIGHT, colors, borderColors } from "../constants";

interface TimelineProps {
  items: TimelineItem[][];
  timelineStartDate: string;
}

const Timeline = ({
  items: initialItems,
  timelineStartDate,
}: TimelineProps): JSX.Element => {
  const [items, setItems] = useState(initialItems);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Use the custom zoom hook
  const { pixelsPerDay, handleWheel } = useZoom({
    initialPixelsPerDay: PIXELS_PER_DAY,
  });

  // Use the custom drag and drop hook
  const {
    draggedItem,
    isHoveringBetweenLanes,
    timelineRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useDragAndDrop({
    items,
    timelineStartDate,
    pixelsPerDay,
    ROW_HEIGHT,
    onItemsChange: setItems,
  });

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
    return (items.length + 1) * ROW_HEIGHT + (items.length - 1) * 3;
  };

  return (
    <>
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
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Visual indicator for hovering between lanes */}
        {isHoveringBetweenLanes && draggedItem && (
          <div
            style={{
              position: "absolute",
              left: "20px",
              right: "20px",
              top: (draggedItem.laneIndex + 1) * (ROW_HEIGHT + 3) + 20,
              height: "3px",
              backgroundColor: "#FFD700",
              borderRadius: "2px",
              zIndex: 999,
              pointerEvents: "none",
            }}
          />
        )}
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
                        zIndex: draggedItem?.item.id === item.id ? 1000 : 10,
                        transition:
                          draggedItem?.item.id === item.id
                            ? "none"
                            : "all 0.3s ease",
                        cursor:
                          draggedItem?.item.id === item.id
                            ? "grabbing"
                            : "grab",
                        overflow: "hidden",
                        padding: "4px 2px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        opacity: draggedItem?.item.id === item.id ? 0.7 : 1,
                        transform:
                          draggedItem?.item.id === item.id
                            ? "scale(1.05)"
                            : "scale(1)",
                      }}
                      onMouseDown={(e) =>
                        handleMouseDown(e, item, index, itemIndex, editingItem)
                      }
                      onMouseMove={(e) => {
                        if (draggedItem?.item.id === item.id) return;
                        const target = e.currentTarget;
                        const rect = target.getBoundingClientRect();
                        const mouseX = e.clientX - rect.left;
                        const itemWidth = calculateWidth(item.start, item.end);

                        // Change cursor to resize when near right edge
                        if (mouseX > itemWidth - 10) {
                          target.style.cursor = "ew-resize";
                        } else {
                          target.style.cursor = "grab";
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (draggedItem?.item.id === item.id) return;
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
                        if (draggedItem?.item.id === item.id) return;
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
                          title="Click to edit, drag to move"
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
                      backgroundColor: (() => {
                        if (draggedItem) {
                          // Highlight lines when dragging - show where the item will land
                          const draggedItemStart = getDiffStartDate(
                            draggedItem.item.start,
                            timelineStartDate
                          );
                          const isAtStartDate =
                            linePosition === draggedItemStart;

                          if (isAtStartDate) {
                            return "white"; // Gold color for lines under dragged item
                          }
                        }
                        return isItemStart ? "white" : "#555";
                      })(),
                      transform: "rotate(90deg)",
                      transformOrigin: "left center",
                      borderTop: (() => {
                        if (draggedItem) {
                          const draggedItemStart = getDiffStartDate(
                            draggedItem.item.start,
                            timelineStartDate
                          );
                          const isAtStartDate =
                            linePosition === draggedItemStart;

                          if (isAtStartDate) {
                            return "1px solid white";
                          }
                        }
                        return "1px solid #555";
                      })(),
                      width: calculateBackgroundHeight(),
                      transition: "all 0.2s ease",
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

      {/* Drag Preview - positioned outside the timeline container */}
      {draggedItem && (
        <div
          style={{
            position: "fixed",
            width: calculateWidth(draggedItem.item.start, draggedItem.item.end),
            backgroundColor: getItemColor(
              draggedItem.itemIndex,
              draggedItem.laneIndex
            ),
            height: ROW_HEIGHT,
            borderRadius: "5px",
            boxSizing: "border-box",
            left: (() => {
              const rect = timelineRef.current?.getBoundingClientRect();
              if (!rect) return 0;
              return (
                rect.left +
                getDiffStartDate(draggedItem.item.start, timelineStartDate) +
                20
              ); // 20px for padding
            })(),
            top: (() => {
              const rect = timelineRef.current?.getBoundingClientRect();
              if (!rect) return 0;
              return rect.top + draggedItem.laneIndex * (ROW_HEIGHT + 3) + 20; // 20px for padding
            })(),
            border: `2px solid ${getItemBorderColor(
              draggedItem.itemIndex,
              draggedItem.laneIndex
            )}`,
            zIndex: 10000,
            cursor: "grabbing",
            overflow: "hidden",
            padding: "4px 2px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            opacity: 0.8,
            transform: "scale(1.05)",
            pointerEvents: "none",
          }}
        >
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
            }}
          >
            {draggedItem.item.name}
          </div>
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
            {new Date(draggedItem.item.start).toLocaleDateString()} -{" "}
            {new Date(draggedItem.item.end).toLocaleDateString()}
          </div>
        </div>
      )}
    </>
  );
};

export default Timeline;
