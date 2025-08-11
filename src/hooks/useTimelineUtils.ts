import { TimelineItem } from "../types";
import { ROW_HEIGHT, colors, borderColors } from "../constants";

interface UseTimelineUtilsProps {
  items: TimelineItem[][];
}

export const useTimelineUtils = ({ items }: UseTimelineUtilsProps) => {
  const getDiffStartDate = (
    start: string,
    dateToCompare: string,
    pixelsPerDay: number
  ): number => {
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

  return {
    getDiffStartDate,
    getItemColor,
    getItemBorderColor,
    calculateBackgroundHeight,
  };
};
