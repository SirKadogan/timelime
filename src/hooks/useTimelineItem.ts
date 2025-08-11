import { TimelineItem } from "../types";

interface UseTimelineItemProps {
  pixelsPerDay: number;
}

export const useTimelineItem = ({ pixelsPerDay }: UseTimelineItemProps) => {
  // Parse date string as local date to avoid timezone issues
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed in Date constructor
  };

  const calculateWidth = (start: string, end: string): number => {
    const startDate = parseLocalDate(start);
    const endDate = parseLocalDate(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * pixelsPerDay || pixelsPerDay;
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    item: TimelineItem,
    draggedItemId?: number | null
  ) => {
    if (draggedItemId === item.id) return;

    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const itemWidth = calculateWidth(item.start, item.end);

    // Change cursor to resize when near right edge
    if (mouseX > itemWidth - 10) {
      target.style.cursor = "ew-resize";
    } else {
      target.style.cursor = "grab";
    }
  };

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    item: TimelineItem,
    draggedItemId?: number | null
  ) => {
    if (draggedItemId === item.id) return;

    const target = e.currentTarget as HTMLDivElement;
    const itemWidth = calculateWidth(item.start, item.end);
    const textWidth = item.name.length * 8; // Approximate character width
    const totalTextWidth = textWidth + 40; // 40px for padding and buffer

    if (totalTextWidth > itemWidth) {
      target.style.width = `${Math.max(itemWidth, totalTextWidth)}px`;
      target.style.zIndex = "100";
    }
  };

  const handleMouseLeave = (
    e: React.MouseEvent<HTMLDivElement>,
    item: TimelineItem,
    draggedItemId?: number | null
  ) => {
    if (draggedItemId === item.id) return;

    const target = e.currentTarget as HTMLDivElement;
    target.style.width = `${calculateWidth(item.start, item.end)}px`;
    target.style.zIndex = "10";
  };

  return {
    calculateWidth,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
  };
};
