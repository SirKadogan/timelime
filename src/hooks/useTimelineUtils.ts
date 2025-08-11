import { TimelineItem } from "../types";
import { ROW_HEIGHT, colors, borderColors } from "../constants";

interface UseTimelineUtilsProps {
  items: TimelineItem[][];
}

export const useTimelineUtils = ({ items }: UseTimelineUtilsProps) => {
  // Parse date string as local date to avoid timezone issues
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed in Date constructor
  };

  // Format date for display without timezone issues
  const formatDateForDisplay = (dateString: string): string => {
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString();
  };

  const getDiffStartDate = (
    start: string,
    dateToCompare: string,
    pixelsPerDay: number
  ): number => {
    const startDate = parseLocalDate(start);
    const timelineStart = parseLocalDate(dateToCompare);
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

  return {
    parseLocalDate,
    formatDateForDisplay,
    getDiffStartDate,
    getItemColor,
    getItemBorderColor,
    calculateBackgroundHeight,
  };
};
