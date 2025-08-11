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

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<{
    item: TimelineItem;
    laneIndex: number;
    itemIndex: number;
    originalLaneIndex: number;
    originalStart: string;
    originalEnd: string;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isHoveringBetweenLanes, setIsHoveringBetweenLanes] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);

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

  // Check if two date ranges overlap
  const doDatesOverlap = (
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean => {
    const start1Date = new Date(start1);
    const end1Date = new Date(end1);
    const start2Date = new Date(start2);
    const end2Date = new Date(end2);

    return start1Date < end2Date && start2Date < end1Date;
  };

  // Check if an item would overlap with any existing items in a lane
  const wouldOverlapInLane = (
    item: TimelineItem,
    laneIndex: number,
    excludeItemId?: number
  ): boolean => {
    if (laneIndex < 0 || laneIndex >= items.length) return false;

    const lane = items[laneIndex];
    return lane.some(
      (existingItem) =>
        existingItem.id !== excludeItemId &&
        doDatesOverlap(
          item.start,
          item.end,
          existingItem.start,
          existingItem.end
        )
    );
  };

  // Drag and drop handlers
  const handleMouseDown = (
    e: React.MouseEvent,
    item: TimelineItem,
    laneIndex: number,
    itemIndex: number
  ) => {
    if (editingItem === item.id) return; // Don't drag while editing

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const itemWidth = calculateWidth(item.start, item.end);

    // Check if clicking near the right edge (within 10px)
    const isNearRightEdge = offsetX > itemWidth - 10;

    if (isNearRightEdge) {
      // Start resizing
      setIsResizing(true);
      setResizeStartX(e.clientX);
      setDraggedItem({
        item,
        laneIndex,
        itemIndex,
        originalLaneIndex: laneIndex,
        originalStart: item.start,
        originalEnd: item.end,
      });
    } else {
      // Start moving
      setIsResizing(false);
      setDragOffset({ x: offsetX, y: offsetY });
      setDraggedItem({
        item,
        laneIndex,
        itemIndex,
        originalLaneIndex: laneIndex,
        originalStart: item.start,
        originalEnd: item.end,
      });
    }

    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedItem || !timelineRef.current) return;

    if (isResizing) {
      // Handle resizing - only change the end date
      const deltaX = e.clientX - resizeStartX;
      const deltaDays = Math.round(deltaX / pixelsPerDay);

      const originalEndDate = new Date(draggedItem.originalEnd);
      const newEndDate = new Date(
        originalEndDate.getTime() + deltaDays * 24 * 60 * 60 * 1000
      );

      // Ensure minimum duration of 1 day
      if (newEndDate > new Date(draggedItem.originalStart)) {
        const resizedItem = {
          ...draggedItem.item,
          end: newEndDate.toISOString().split("T")[0],
        };

        // Check if resizing would cause overlaps in the current lane
        if (
          wouldOverlapInLane(
            resizedItem,
            draggedItem.laneIndex,
            draggedItem.item.id
          )
        ) {
          // Find a non-overlapping lane or create a new one
          let newLaneIndex = draggedItem.laneIndex;
          let foundLane = false;

          // First, try to find an existing lane without overlaps
          for (let i = 0; i < items.length; i++) {
            if (!wouldOverlapInLane(resizedItem, i, draggedItem.item.id)) {
              newLaneIndex = i;
              foundLane = true;
              break;
            }
          }

          // If no existing lane works, we'll create a new one
          if (!foundLane) {
            newLaneIndex = items.length; // This will trigger new lane creation
          }

          setDraggedItem({
            ...draggedItem,
            laneIndex: newLaneIndex,
            item: resizedItem,
          });
        } else {
          setDraggedItem({
            ...draggedItem,
            item: resizedItem,
          });
        }
      }
      return;
    }

    // Handle moving (existing logic)
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    // Calculate new start date based on x position
    const newStartDays = Math.round(x / pixelsPerDay);
    const newStartDate = new Date(timelineStartDate);
    newStartDate.setDate(newStartDate.getDate() + newStartDays);

    // Calculate new lane based on y position
    const laneHeight = ROW_HEIGHT + 3;
    const exactLaneIndex = y / laneHeight;
    let newLaneIndex = Math.max(
      0,
      Math.min(items.length - 1, Math.floor(exactLaneIndex))
    );

    // Check if hovering between lanes (within a smaller threshold of lane boundary)
    const distanceFromLaneCenter = Math.abs(
      exactLaneIndex - Math.round(exactLaneIndex)
    );
    const isBetweenLanes = distanceFromLaneCenter < 0.15; // Smaller threshold for more precise between-lane detection

    setIsHoveringBetweenLanes(isBetweenLanes);

    // Only update the dragged item reference for preview, don't modify the actual items yet
    const originalDuration =
      new Date(draggedItem.originalEnd).getTime() -
      new Date(draggedItem.originalStart).getTime();
    const newEndDate = new Date(newStartDate.getTime() + originalDuration);

    // Create a preview item to check for overlaps
    const previewItem = {
      ...draggedItem.item,
      start: newStartDate.toISOString().split("T")[0],
      end: newEndDate.toISOString().split("T")[0],
    };

    // Check if the item would overlap in the target lane
    if (wouldOverlapInLane(previewItem, newLaneIndex, draggedItem.item.id)) {
      // If overlapping, try to find a non-overlapping lane or create a new one
      let foundLane = false;

      // First, try to find an existing lane without overlaps
      for (let i = 0; i < items.length; i++) {
        if (!wouldOverlapInLane(previewItem, i, draggedItem.item.id)) {
          newLaneIndex = i;
          foundLane = true;
          break;
        }
      }

      // If no existing lane works, we'll create a new one
      if (!foundLane) {
        newLaneIndex = items.length; // This will trigger new lane creation
      }
    }

    setDraggedItem({
      ...draggedItem,
      laneIndex: newLaneIndex,
      item: previewItem,
    });
  };

  const handleMouseUp = () => {
    if (draggedItem) {
      if (isResizing) {
        // Handle resizing - update the item in place or move to new lane if needed
        setItems((prevItems) => {
          let newItems = [...prevItems];

          // Remove from original lane
          newItems[draggedItem.originalLaneIndex] = newItems[
            draggedItem.originalLaneIndex
          ].filter((_, index) => index !== draggedItem.itemIndex);

          // If the target lane index is beyond existing lanes, create a new lane
          if (draggedItem.laneIndex >= newItems.length) {
            newItems.push([]);
          }

          // Add to the target lane (either existing or new)
          const updatedItem = {
            ...draggedItem.item,
            start: draggedItem.item.start,
            end: draggedItem.item.end,
          };

          if (!newItems[draggedItem.laneIndex]) {
            newItems[draggedItem.laneIndex] = [];
          }
          newItems[draggedItem.laneIndex].push(updatedItem);

          // Remove empty lanes (but keep the new lane we just created)
          return newItems.filter(
            (lane, index) => lane.length > 0 || index === draggedItem.laneIndex
          );
        });
      } else {
        // Handle moving (existing logic)
        setItems((prevItems) => {
          let newItems = [...prevItems];

          // Remove from original lane
          newItems[draggedItem.originalLaneIndex] = newItems[
            draggedItem.originalLaneIndex
          ].filter((_, index) => index !== draggedItem.itemIndex);

          // If hovering between lanes, insert a new lane
          if (isHoveringBetweenLanes) {
            const insertIndex = Math.min(
              draggedItem.laneIndex + 1,
              newItems.length
            );
            newItems.splice(insertIndex, 0, []);
            // Update the lane index to the new lane
            draggedItem.laneIndex = insertIndex;
          }

          // If the target lane index is beyond existing lanes, create a new lane
          if (draggedItem.laneIndex >= newItems.length) {
            newItems.push([]);
          }

          // Add to new lane with updated dates (duration is preserved from original item)
          const updatedItem = {
            ...draggedItem.item,
            start: draggedItem.item.start,
            end: draggedItem.item.end,
          };

          if (!newItems[draggedItem.laneIndex]) {
            newItems[draggedItem.laneIndex] = [];
          }
          newItems[draggedItem.laneIndex].push(updatedItem);

          // Remove empty lanes (but keep the new lane we just created)
          return newItems.filter(
            (lane, index) => lane.length > 0 || index === draggedItem.laneIndex
          );
        });
      }
    }

    setDraggedItem(null);
    setDragOffset({ x: 0, y: 0 });
    setIsHoveringBetweenLanes(false);
    setIsResizing(false);
  };

  // Add global mouse event listeners
  React.useEffect(() => {
    if (draggedItem) {
      document.addEventListener("mousemove", handleMouseMove as any);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove as any);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggedItem]);

  const screenWidth = window.innerWidth;

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
                        handleMouseDown(e, item, index, itemIndex)
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
