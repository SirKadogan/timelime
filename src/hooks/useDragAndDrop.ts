import { useState, useRef, useEffect } from "react";
import { TimelineItem } from "../types";

interface DragState {
  item: TimelineItem;
  laneIndex: number;
  itemIndex: number;
  originalLaneIndex: number;
  originalStart: string;
  originalEnd: string;
}

interface DragOffset {
  x: number;
  y: number;
}

interface UseDragAndDropProps {
  items: TimelineItem[][];
  timelineStartDate: string;
  pixelsPerDay: number;
  ROW_HEIGHT: number;
  onItemsChange: (newItems: TimelineItem[][]) => void;
}

export const useDragAndDrop = ({
  items,
  timelineStartDate,
  pixelsPerDay,
  ROW_HEIGHT,
  onItemsChange,
}: UseDragAndDropProps) => {
  const [draggedItem, setDraggedItem] = useState<DragState | null>(null);
  const [dragOffset, setDragOffset] = useState<DragOffset>({ x: 0, y: 0 });
  const [isHoveringBetweenLanes, setIsHoveringBetweenLanes] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Parse date string as local date to avoid timezone issues
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed in Date constructor
  };

  // Check if two date ranges overlap
  const doDatesOverlap = (
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean => {
    const start1Date = parseLocalDate(start1);
    const end1Date = parseLocalDate(end1);
    const start2Date = parseLocalDate(start2);
    const end2Date = parseLocalDate(end2);

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

  const handleMouseDown = (
    e: React.MouseEvent,
    item: TimelineItem,
    laneIndex: number,
    itemIndex: number,
    editingItem?: number | null
  ) => {
    // Don't drag while editing
    if (editingItem === item.id) return;

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

  const calculateWidth = (start: string, end: string): number => {
    const startDate = parseLocalDate(start);
    const endDate = parseLocalDate(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * pixelsPerDay || pixelsPerDay;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedItem || !timelineRef.current) return;

    if (isResizing) {
      // Handle resizing - only change the end date
      const deltaX = e.clientX - resizeStartX;
      const deltaDays = Math.round(deltaX / pixelsPerDay);

      const originalEndDate = parseLocalDate(draggedItem.originalEnd);
      const newEndDate = new Date(
        originalEndDate.getTime() + deltaDays * 24 * 60 * 60 * 1000
      );

      // Ensure minimum duration of 1 day
      if (newEndDate > parseLocalDate(draggedItem.originalStart)) {
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
    const newStartDate = parseLocalDate(timelineStartDate);
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
      parseLocalDate(draggedItem.originalEnd).getTime() -
      parseLocalDate(draggedItem.originalStart).getTime();
    const newEndDate = new Date(newStartDate.getTime() + originalDuration);

    // Create a preview item to check for overlaps
    const previewItem = {
      ...draggedItem.item,
      start: newStartDate.toISOString().split("T")[0],
      end: newEndDate.toISOString().split("T")[0],
    };

    // Check if the item would overlap in the target lane
    // Only check for overlaps if NOT hovering between lanes
    if (
      !isBetweenLanes &&
      wouldOverlapInLane(previewItem, newLaneIndex, draggedItem.item.id)
    ) {
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
        const newItems = [...items];

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
        const finalItems = newItems.filter(
          (lane, index) => lane.length > 0 || index === draggedItem.laneIndex
        );

        onItemsChange(finalItems);
      } else {
        // Handle moving (existing logic)
        const newItems = [...items];

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
        const finalItems = newItems.filter(
          (lane, index) => lane.length > 0 || index === draggedItem.laneIndex
        );

        onItemsChange(finalItems);
      }
    }

    setDraggedItem(null);
    setDragOffset({ x: 0, y: 0 });
    setIsHoveringBetweenLanes(false);
    setIsResizing(false);
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (draggedItem) {
      document.addEventListener("mousemove", handleMouseMove as any);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove as any);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggedItem]);

  return {
    draggedItem,
    isHoveringBetweenLanes,
    timelineRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};
