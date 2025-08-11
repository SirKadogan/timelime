import React, { useState } from "react";
import { TimelineItem } from "../types";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { useZoom } from "../hooks/useZoom";
import { useEdit } from "../hooks/useEdit";
import { useTimelineItem } from "../hooks/useTimelineItem";
import { useTimelineUtils } from "../hooks/useTimelineUtils";
import { PIXELS_PER_DAY, ROW_HEIGHT } from "../constants";
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
    handleKeyDown,
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

  // Use the custom timeline item hook
  const {
    calculateWidth,
    handleMouseMove: handleItemMouseMove,
    handleMouseEnter,
    handleMouseLeave,
  } = useTimelineItem({
    pixelsPerDay,
  });

  // Use the custom timeline utils hook
  const {
    parseLocalDate,
    formatDateForDisplay,
    getDiffStartDate,
    getItemColor,
    getItemBorderColor,
    calculateBackgroundHeight,
  } = useTimelineUtils({
    items,
  });

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
                        left: getDiffStartDate(
                          item.start,
                          timelineStartDate,
                          pixelsPerDay
                        ),
                        border: `2px solid ${getItemBorderColor(
                          itemIndex,
                          index
                        )}`,
                      }}
                      onMouseDown={(e) =>
                        handleMouseDown(e, item, index, itemIndex, editingItem)
                      }
                      onMouseMove={(e) =>
                        handleItemMouseMove(e, item, draggedItem?.item.id)
                      }
                      onMouseEnter={(e) =>
                        handleMouseEnter(e, item, draggedItem?.item.id)
                      }
                      onMouseLeave={(e) =>
                        handleMouseLeave(e, item, draggedItem?.item.id)
                      }
                    >
                      {editingItem === item.id ? (
                        <div className="timeline-item-edit-container">
                          <input
                            type="text"
                            className="timeline-item-edit-input"
                            value={editValue}
                            onChange={(e) => updateEditValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, item.id)}
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
                        {formatDateForDisplay(item.start)} -{" "}
                        {formatDateForDisplay(item.end)}
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
            formatDateForDisplay={formatDateForDisplay}
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
          pixelsPerDay={pixelsPerDay}
          calculateWidth={calculateWidth}
          getItemColor={getItemColor}
          getItemBorderColor={getItemBorderColor}
          getDiffStartDate={getDiffStartDate}
          formatDateForDisplay={formatDateForDisplay}
          ROW_HEIGHT={ROW_HEIGHT}
        />
      )}
    </>
  );
};

export default Timeline;
