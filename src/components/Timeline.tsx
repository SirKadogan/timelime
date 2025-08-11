import React, { useRef, useState } from "react";
import { TimelineItem } from "../types";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { useZoom } from "../hooks/useZoom";
import { useEdit } from "../hooks/useEdit";
import { PIXELS_PER_DAY, ROW_HEIGHT, colors, borderColors } from "../constants";
import DragPreview from "./DragPreview";
import BackgroundGrid from "./BackgroundGrid";

interface TimelineProps {
  items: TimelineItem[][];
  timelineStartDate: string;
}

const Timeline = ({
  items: initialItems,
  timelineStartDate,
}: TimelineProps): JSX.Element => {
  const [items, setItems] = useState(initialItems);

  // Use the custom zoom hook
  const { pixelsPerDay, handleWheel } = useZoom({
    initialPixelsPerDay: PIXELS_PER_DAY,
  });

  // Use the custom edit hook
  const {
    editingItem,
    editValue,
    startEditing,
    saveEdit,
    cancelEdit,
    updateEditValue,
  } = useEdit({
    onSave: (itemId: number, newName: string) => {
      setItems((prevItems) =>
        prevItems.map((lane) =>
          lane.map((item) =>
            item.id === itemId ? { ...item, name: newName } : item
          )
        )
      );
    },
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
        className="timeline-container"
        style={{ height: calculateBackgroundHeight() }}
        ref={timelineRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Visual indicator for hovering between lanes */}
        {isHoveringBetweenLanes && draggedItem && (
          <div
            className="timeline-between-lanes-indicator"
            style={{
              top: (draggedItem.laneIndex + 1) * (ROW_HEIGHT + 3) + 20,
            }}
          />
        )}
        <div className="timeline-scroll" onWheel={handleWheel}>
          <ul className="timeline-list">
            {items.map((lane, index) => (
              <li
                key={index}
                className="timeline-lane"
                style={{ height: ROW_HEIGHT }}
              >
                {lane.map((item, itemIndex) => (
                  <React.Fragment key={item.id}>
                    <div
                      className={`timeline-item ${
                        draggedItem?.item.id === item.id ? "dragging" : ""
                      }`}
                      style={{
                        width: calculateWidth(item.start, item.end),
                        backgroundColor: getItemColor(itemIndex, index),
                        height: ROW_HEIGHT,
                        left: getDiffStartDate(item.start, timelineStartDate),
                        border: `2px solid ${getItemBorderColor(
                          itemIndex,
                          index
                        )}`,
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
                        <div className="timeline-item-edit-container">
                          <input
                            type="text"
                            className="timeline-item-edit-input"
                            value={editValue}
                            onChange={(e) => updateEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                saveEdit(item.id);
                              } else if (e.key === "Escape") {
                                cancelEdit();
                              }
                            }}
                            onBlur={() => saveEdit(item.id)}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div
                          className="timeline-item-name"
                          onClick={() => startEditing(item.id, item.name)}
                          title="Click to edit, drag to move"
                        >
                          {item.name}
                        </div>
                      )}
                      <div className="timeline-item-dates">
                        {new Date(item.start).toLocaleDateString()} -{" "}
                        {new Date(item.end).toLocaleDateString()}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </li>
            ))}
          </ul>
          <BackgroundGrid
            items={items}
            timelineStartDate={timelineStartDate}
            pixelsPerDay={pixelsPerDay}
            calculateWidth={calculateWidth}
            getDiffStartDate={getDiffStartDate}
            calculateBackgroundHeight={calculateBackgroundHeight}
            draggedItem={draggedItem}
          />
        </div>
      </div>

      {/* Drag Preview - positioned outside the timeline container */}
      {draggedItem && (
        <DragPreview
          draggedItem={draggedItem}
          timelineRef={timelineRef}
          timelineStartDate={timelineStartDate}
          calculateWidth={calculateWidth}
          getItemColor={getItemColor}
          getItemBorderColor={getItemBorderColor}
          getDiffStartDate={getDiffStartDate}
          ROW_HEIGHT={ROW_HEIGHT}
        />
      )}
    </>
  );
};

export default Timeline;
