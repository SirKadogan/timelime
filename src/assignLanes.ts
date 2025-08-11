import { TimelineItem } from "./types";

/**
 * Takes an array of items and assigns them to lanes based on start/end dates.
 * @param items Array of timeline items to be assigned to lanes
 * @returns An array of arrays containing items, where each sub-array represents a lane
 */
function assignLanes(items: TimelineItem[]): TimelineItem[][] {
  const sortedItems = items.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
  const lanes: TimelineItem[][] = [];

  function assignItemToLane(item: TimelineItem): void {
    for (const lane of lanes) {
      if (
        new Date(lane[lane.length - 1].end).getTime() <
        new Date(item.start).getTime()
      ) {
        lane.push(item);
        return;
      }
    }
    lanes.push([item]);
  }

  for (const item of sortedItems) {
    assignItemToLane(item);
  }
  return lanes;
}

export default assignLanes;
