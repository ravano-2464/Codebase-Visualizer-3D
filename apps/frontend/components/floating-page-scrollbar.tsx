"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";
import { cn } from "../lib/utils";

const MIN_THUMB_SIZE = 72;
const SCROLL_OVERFLOW_THRESHOLD_PX = 2;

type ScrollMetrics = {
  canScrollY: boolean;
  thumbHeight: number;
  thumbOffset: number;
};

const defaultMetrics: ScrollMetrics = {
  canScrollY: false,
  thumbHeight: MIN_THUMB_SIZE,
  thumbOffset: 0
};

function isSameMetrics(current: ScrollMetrics, next: ScrollMetrics) {
  return (
    current.canScrollY === next.canScrollY &&
    Math.abs(current.thumbHeight - next.thumbHeight) < 0.5 &&
    Math.abs(current.thumbOffset - next.thumbOffset) < 0.5
  );
}

export function FloatingPageScrollbar() {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({
    startPointerY: 0,
    startScrollTop: 0
  });
  const metricsRef = useRef<ScrollMetrics>(defaultMetrics);
  const [metrics, setMetrics] = useState<ScrollMetrics>(defaultMetrics);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const setNextMetrics = useCallback((nextMetrics: ScrollMetrics) => {
    metricsRef.current = nextMetrics;
    setMetrics((currentMetrics) =>
      isSameMetrics(currentMetrics, nextMetrics) ? currentMetrics : nextMetrics
    );
  }, []);

  const updateMetrics = useCallback(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const root = document.documentElement;
    const maxScrollTop = root.scrollHeight - window.innerHeight;
    const trackHeight = track.clientHeight;

    if (maxScrollTop <= SCROLL_OVERFLOW_THRESHOLD_PX || trackHeight <= 0) {
      setNextMetrics(defaultMetrics);
      return;
    }

    const nextThumbHeight = Math.max(
      MIN_THUMB_SIZE,
      (window.innerHeight / root.scrollHeight) * trackHeight
    );
    const maxThumbOffset = Math.max(trackHeight - nextThumbHeight, 0);
    const scrollTop = window.scrollY || root.scrollTop;
    const nextThumbOffset =
      maxThumbOffset === 0 ? 0 : (scrollTop / maxScrollTop) * maxThumbOffset;

    setNextMetrics({
      canScrollY: true,
      thumbHeight: nextThumbHeight,
      thumbOffset: nextThumbOffset
    });
  }, [setNextMetrics]);

  const scrollToThumbOffset = useCallback((thumbOffset: number, behavior: ScrollBehavior) => {
    const track = trackRef.current;
    const currentMetrics = metricsRef.current;

    if (!track || !currentMetrics.canScrollY) {
      return;
    }

    const root = document.documentElement;
    const maxScrollTop = root.scrollHeight - window.innerHeight;
    const maxThumbOffset = Math.max(track.clientHeight - currentMetrics.thumbHeight, 0);
    const clampedThumbOffset = Math.min(Math.max(thumbOffset, 0), maxThumbOffset);
    const nextScrollTop =
      maxThumbOffset === 0 ? 0 : (clampedThumbOffset / maxThumbOffset) * maxScrollTop;

    window.scrollTo({
      top: nextScrollTop,
      behavior
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (!body) {
      return;
    }

    const handleViewportChange = () => {
      updateMetrics();
    };

    const resizeObserver = new ResizeObserver(handleViewportChange);
    const mutationObserver = new MutationObserver(handleViewportChange);
    const frameId = window.requestAnimationFrame(handleViewportChange);

    resizeObserver.observe(root);
    resizeObserver.observe(body);
    mutationObserver.observe(body, {
      childList: true,
      subtree: true
    });

    window.addEventListener("scroll", handleViewportChange, { passive: true });
    window.addEventListener("resize", handleViewportChange);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [updateMetrics]);

  function handleThumbPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!metrics.canScrollY) {
      return;
    }

    event.preventDefault();

    dragStateRef.current = {
      startPointerY: event.clientY,
      startScrollTop: window.scrollY || document.documentElement.scrollTop
    };

    setIsDragging(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const track = trackRef.current;
      const currentMetrics = metricsRef.current;

      if (!track || !currentMetrics.canScrollY) {
        return;
      }

      const root = document.documentElement;
      const maxScrollTop = root.scrollHeight - window.innerHeight;
      const maxThumbOffset = Math.max(track.clientHeight - currentMetrics.thumbHeight, 0);

      if (maxScrollTop <= 0 || maxThumbOffset <= 0) {
        return;
      }

      const pointerDeltaY = moveEvent.clientY - dragStateRef.current.startPointerY;
      const scrollDelta = (pointerDeltaY / maxThumbOffset) * maxScrollTop;

      window.scrollTo({
        top: dragStateRef.current.startScrollTop + scrollDelta
      });
    };

    const stopDragging = () => {
      setIsDragging(false);
      setIsHovering(false);
      updateMetrics();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
  }

  function handleTrackPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!metrics.canScrollY || event.target !== event.currentTarget) {
      return;
    }

    const track = trackRef.current;

    if (!track) {
      return;
    }

    const trackRect = track.getBoundingClientRect();
    const clickOffset = event.clientY - trackRect.top;

    scrollToThumbOffset(clickOffset - metrics.thumbHeight / 2, "smooth");
  }

  return (
    <div
      aria-hidden={!metrics.canScrollY}
      className={cn(
        "floating-page-scrollbar",
        metrics.canScrollY && "is-visible",
        (isHovering || isDragging) && "is-active",
        isDragging && "is-dragging"
      )}
    >
      <div
        className="floating-page-scrollbar__track"
        onPointerEnter={() => setIsHovering(true)}
        onPointerLeave={() => {
          if (!isDragging) {
            setIsHovering(false);
          }
        }}
        onPointerDown={handleTrackPointerDown}
        ref={trackRef}
      >
        <div
          className="floating-page-scrollbar__thumb"
          onPointerDown={handleThumbPointerDown}
          style={{
            height: `${metrics.thumbHeight}px`,
            transform: `translateY(${metrics.thumbOffset}px)`
          }}
        />
      </div>
    </div>
  );
}
