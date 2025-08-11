import { useState } from "react";

interface UseZoomProps {
  initialPixelsPerDay?: number;
  minPixelsPerDay?: number;
  maxPixelsPerDay?: number;
  zoomFactor?: number;
}

export const useZoom = ({
  initialPixelsPerDay = 15,
  minPixelsPerDay = 5,
  maxPixelsPerDay = 100,
  zoomFactor = 0.1,
}: UseZoomProps = {}) => {
  const [pixelsPerDay, setPixelsPerDay] = useState(initialPixelsPerDay);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDirection = e.deltaY > 0 ? -1 : 1;
      const newZoomFactor = 1 + zoomDirection * zoomFactor;

      setPixelsPerDay((prev) => {
        const newValue = prev * newZoomFactor;
        return Math.max(minPixelsPerDay, Math.min(maxPixelsPerDay, newValue));
      });
    }
  };

  const zoomIn = () => {
    setPixelsPerDay((prev) => {
      const newValue = prev * (1 + zoomFactor);
      return Math.min(maxPixelsPerDay, newValue);
    });
  };

  const zoomOut = () => {
    setPixelsPerDay((prev) => {
      const newValue = prev * (1 - zoomFactor);
      return Math.max(minPixelsPerDay, newValue);
    });
  };

  const resetZoom = () => {
    setPixelsPerDay(initialPixelsPerDay);
  };

  const setZoom = (value: number) => {
    setPixelsPerDay(
      Math.max(minPixelsPerDay, Math.min(maxPixelsPerDay, value))
    );
  };

  return {
    pixelsPerDay,
    handleWheel,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
  };
};
