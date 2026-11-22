"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Maximize2,
  Minus,
  Play,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";

type ProductGalleryProduct = {
  name: string;
  image: string | null;
  image_1: string | null;
  image_2: string | null;
  image_3: string | null;
  /** Optional until the admin upload and database changes are installed. */
  video_url?: string | null;
};

type ProductGalleryProps = {
  product: ProductGalleryProduct;
};

type MediaItem =
  | { type: "image"; src: string }
  | { type: "video"; src: string };

type Position = { x: number; y: number };

const SWIPE_THRESHOLD = 45;
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.5;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function ProductGallery({ product }: ProductGalleryProps) {
  const media = useMemo<MediaItem[]>(() => {
    const images = Array.from(
      new Set(
        [product.image, product.image_1, product.image_2, product.image_3]
          .map((src) => src?.trim() ?? "")
          .filter(Boolean)
      )
    );

    const items: MediaItem[] = images.map((src) => ({ type: "image", src }));
    const videoUrl = product.video_url?.trim();
    if (videoUrl) items.push({ type: "video", src: videoUrl });
    return items;
  }, [product.image, product.image_1, product.image_2, product.image_3, product.video_url]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  const viewerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const pointersRef = useRef(new Map<number, Position>());
  const gestureRef = useRef<{
    startX: number;
    startY: number;
    initialDistance: number;
    initialScale: number;
    lastPoint: Position;
    didPinch: boolean;
    didPan: boolean;
  } | null>(null);
  const lastTapRef = useRef(0);
  const scaleRef = useRef(scale);
  const positionRef = useRef(position);

  const current = media[selectedIndex] ?? null;
  const hasMultipleMedia = media.length > 1;

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const resetZoom = useCallback(() => {
    scaleRef.current = 1;
    positionRef.current = { x: 0, y: 0 };
    setScale(1);
    setPosition({ x: 0, y: 0 });
    pointersRef.current.clear();
    gestureRef.current = null;
  }, []);

  const constrainPosition = useCallback((next: Position, nextScale: number): Position => {
    const rect = viewerRef.current?.getBoundingClientRect();
    if (!rect || nextScale <= 1) return { x: 0, y: 0 };
    // Prevent dragging the image completely away from the viewport.
    const maxX = (rect.width * (nextScale - 1)) / 2;
    const maxY = (rect.height * (nextScale - 1)) / 2;
    return {
      x: clamp(next.x, -maxX, maxX),
      y: clamp(next.y, -maxY, maxY),
    };
  }, []);

  const changeZoom = useCallback(
    (nextScale: number) => {
      const bounded = clamp(nextScale, MIN_ZOOM, MAX_ZOOM);
      scaleRef.current = bounded;
      setScale(bounded);
      const nextPosition = constrainPosition(positionRef.current, bounded);
      positionRef.current = nextPosition;
      setPosition(nextPosition);
    },
    [constrainPosition]
  );

  const showIndex = useCallback(
    (index: number) => {
      if (!media.length) return;
      const nextIndex = (index + media.length) % media.length;
      if (media[nextIndex]?.type === "video") setViewerOpen(false);
      resetZoom();
      setSelectedIndex(nextIndex);
    },
    [media.length, resetZoom]
  );

  const showPrevious = useCallback(() => {
    if (hasMultipleMedia) showIndex(selectedIndex - 1);
  }, [hasMultipleMedia, selectedIndex, showIndex]);

  const showNext = useCallback(() => {
    if (hasMultipleMedia) showIndex(selectedIndex + 1);
  }, [hasMultipleMedia, selectedIndex, showIndex]);

  const openViewer = useCallback(() => {
    if (!current || current.type !== "image") return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    resetZoom();
    setViewerOpen(true);
  }, [current, resetZoom]);

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    resetZoom();
    window.requestAnimationFrame(() => previousFocusRef.current?.focus());
  }, [resetZoom]);

  useEffect(() => {
    if (selectedIndex >= media.length && selectedIndex !== 0) setSelectedIndex(0);
  }, [selectedIndex, media.length]);

  useEffect(() => {
    if (!viewerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeys = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeViewer();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        if (current?.type === "image") changeZoom(scaleRef.current + ZOOM_STEP);
      } else if (event.key === "-") {
        event.preventDefault();
        if (current?.type === "image") changeZoom(scaleRef.current - ZOOM_STEP);
      } else if (event.key === "Tab") {
        // Keep keyboard focus inside the modal.
        const modal = viewerRef.current?.closest('[role="dialog"]');
        const elements = modal?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), video[controls], [tabindex="0"]'
        );
        if (!elements?.length) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeys);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeys);
    };
  }, [viewerOpen, closeViewer, showPrevious, showNext, changeZoom, current?.type]);

  useEffect(() => {
    if (!viewerOpen || current?.type !== "image") return;
    const element = viewerRef.current;
    if (!element) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const direction = event.deltaY > 0 ? -1 : 1;
      changeZoom(scaleRef.current + direction * 0.2);
    };
    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, [viewerOpen, current?.type, changeZoom]);

  function handleStagePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (current?.type !== "image" || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pointers = [...pointersRef.current.values()];
    if (pointers.length === 1) {
      gestureRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        initialDistance: 0,
        initialScale: scaleRef.current,
        lastPoint: { x: event.clientX, y: event.clientY },
        didPinch: false,
        didPan: false,
      };
    } else if (pointers.length === 2) {
      const distance = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
      gestureRef.current = {
        startX: pointers[0].x,
        startY: pointers[0].y,
        initialDistance: Math.max(distance, 1),
        initialScale: scaleRef.current,
        lastPoint: pointers[0],
        didPinch: true,
        didPan: false,
      };
    }
  }

  function handleStagePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pointers = [...pointersRef.current.values()];
    const gesture = gestureRef.current;
    if (!gesture) return;

    if (pointers.length >= 2 && gesture.initialDistance > 0) {
      const distance = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
      changeZoom(gesture.initialScale * (distance / gesture.initialDistance));
      gesture.didPinch = true;
    } else if (pointers.length === 1 && scaleRef.current > 1 && !gesture.didPinch) {
      const deltaX = event.clientX - gesture.lastPoint.x;
      const deltaY = event.clientY - gesture.lastPoint.y;
      if (Math.abs(event.clientX - gesture.startX) > 5 || Math.abs(event.clientY - gesture.startY) > 5) {
        gesture.didPan = true;
      }
      const next = constrainPosition(
        { x: positionRef.current.x + deltaX, y: positionRef.current.y + deltaY },
        scaleRef.current
      );
      positionRef.current = next;
      setPosition(next);
      gesture.lastPoint = { x: event.clientX, y: event.clientY };
    }
  }

  function handleStagePointerEnd(event: PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size > 0) return;
    gestureRef.current = null;
    if (!gesture || gesture.didPinch || gesture.didPan) return;

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (scaleRef.current === 1 && Math.abs(deltaX) >= SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) showNext();
      else showPrevious();
      return;
    }
    if (event.pointerType === "touch" && Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        changeZoom(scaleRef.current > 1 ? 1 : 2.5);
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    }
  }

  function handleInlineKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    } else if (event.key === "Enter" && current?.type === "image") {
      event.preventDefault();
      openViewer();
    }
  }

  const inlineSwipeStart = useRef<number | null>(null);

  return (
    <section aria-label={`${product.name} media gallery`} className="w-full">
      <div
        role="region"
        tabIndex={0}
        onKeyDown={handleInlineKeys}
        onTouchStart={(event) => {
          inlineSwipeStart.current = event.touches.length === 1 ? event.touches[0].clientX : null;
        }}
        onTouchEnd={(event) => {
          if (inlineSwipeStart.current === null || !event.changedTouches.length || event.touches.length) return;
          const deltaX = event.changedTouches[0].clientX - inlineSwipeStart.current;
          inlineSwipeStart.current = null;
          if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
          if (deltaX < 0) showNext();
          else showPrevious();
        }}
        className="group relative aspect-square w-full touch-pan-y overflow-hidden rounded-[32px] border border-[#E8DDD3] bg-white shadow-sm outline-none focus:ring-2 focus:ring-[#5A2D2D]/30"
      >
        {current?.type === "image" ? (
          <button type="button" onClick={openViewer} aria-label={`Expand ${product.name} photo ${selectedIndex + 1}`} className="absolute inset-0 block h-full w-full cursor-zoom-in">
            <Image
              key={current.src}
              src={current.src}
              alt={`${product.name} — image ${selectedIndex + 1}`}
              fill
              priority={selectedIndex === 0}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="pointer-events-none select-none object-cover transition duration-500"
              draggable={false}
              unoptimized
            />
            <span className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#4B2E2E] shadow backdrop-blur" aria-hidden="true">
              <Maximize2 size={18} />
            </span>
          </button>
        ) : current?.type === "video" ? (
          <video
            key={current.src}
            src={current.src}
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full bg-black object-contain"
            aria-label={`${product.name} product video`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#F4EEE8] px-6 text-center text-[#8B6B5B]">
            <ImageIcon className="h-12 w-12" strokeWidth={1.4} />
            <p className="text-sm">Product image unavailable</p>
          </div>
        )}

        {hasMultipleMedia && (
          <>
            <button type="button" onClick={showPrevious} aria-label="Show previous product media" className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#4B2E2E] shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A2D2D]/30">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={showNext} aria-label="Show next product media" className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#4B2E2E] shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A2D2D]/30">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#2D1818]/55 px-4 py-2 backdrop-blur">
              {media.map((item, index) => (
                <button key={`${item.type}-${item.src}`} type="button" onClick={() => showIndex(index)} aria-label={`Show product ${item.type} ${index + 1}`} aria-current={index === selectedIndex ? "true" : undefined} className={`rounded-full transition-all ${index === selectedIndex ? "h-2.5 w-6 bg-white" : "h-2.5 w-2.5 bg-white/55 hover:bg-white/80"}`} />
              ))}
            </div>
            <div className="absolute right-4 top-4 z-10 rounded-full bg-[#2D1818]/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
              {selectedIndex + 1} / {media.length}
            </div>
          </>
        )}
      </div>

      {hasMultipleMedia && (
        <div className="mt-5 grid grid-cols-4 gap-3">
          {media.map((item, index) => (
            <button key={`${item.type}-${item.src}`} type="button" onClick={() => showIndex(index)} aria-label={`Select product ${item.type} ${index + 1}`} aria-current={index === selectedIndex ? "true" : undefined} className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-white transition ${index === selectedIndex ? "border-[#5A2D2D] shadow-md" : "border-transparent opacity-75 hover:border-[#CDB7A7] hover:opacity-100"}`}>
              {item.type === "image" ? (
                <Image src={item.src} alt={`${product.name} thumbnail ${index + 1}`} fill sizes="(max-width: 640px) 25vw, 140px" className="object-cover" draggable={false} unoptimized />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#F4EEE8] text-[#5A2D2D]">
                  <Play size={24} fill="currentColor" aria-hidden="true" />
                  <span className="text-[10px] font-medium">Video</span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {hasMultipleMedia && (
        <p className="mt-4 text-center text-xs text-[#8B6B5B] sm:hidden">Swipe left or right to view more</p>
      )}

      {viewerOpen && current?.type === "image" && (
        <div role="dialog" aria-modal="true" aria-label={`${product.name} full-screen photo viewer`} className="fixed inset-0 z-[100] flex flex-col bg-[#120D0D]/95 text-white">
          <div className="z-20 flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <span className="min-w-0 truncate text-sm">{product.name} · {selectedIndex + 1} / {media.length}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => changeZoom(scaleRef.current - ZOOM_STEP)} aria-label="Zoom out" disabled={scale <= MIN_ZOOM} className="rounded-full p-2 hover:bg-white/15 disabled:opacity-40"><Minus size={21} /></button>
              <span aria-live="polite" className="w-12 text-center text-xs tabular-nums">{Math.round(scale * 100)}%</span>
              <button type="button" onClick={() => changeZoom(scaleRef.current + ZOOM_STEP)} aria-label="Zoom in" disabled={scale >= MAX_ZOOM} className="rounded-full p-2 hover:bg-white/15 disabled:opacity-40"><Plus size={21} /></button>
              <button type="button" onClick={resetZoom} aria-label="Reset zoom" className="rounded-full p-2 hover:bg-white/15"><RotateCcw size={19} /></button>
              <button ref={closeButtonRef} type="button" onClick={closeViewer} aria-label="Close full-screen gallery" className="ml-1 rounded-full p-2 hover:bg-white/15"><X size={24} /></button>
            </div>
          </div>

          <div
            ref={viewerRef}
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={handleStagePointerEnd}
            onPointerCancel={(event) => { pointersRef.current.delete(event.pointerId); gestureRef.current = null; }}
            onDoubleClick={() => changeZoom(scaleRef.current > 1 ? 1 : 2.5)}
            className="relative min-h-0 flex-1 overflow-hidden touch-none select-none"
            style={{ cursor: scale > 1 ? "grab" : "zoom-in" }}
          >
            <div className="pointer-events-none absolute inset-0" style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`, transformOrigin: "center center" }}>
              <Image key={current.src} src={current.src} alt={`${product.name} enlarged photo`} fill sizes="100vw" className="object-contain" draggable={false} unoptimized />
            </div>
          </div>

          {hasMultipleMedia && (
            <>
              <button type="button" onClick={showPrevious} aria-label="Previous product media" className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 hover:bg-black/80 sm:left-5"><ChevronLeft /></button>
              <button type="button" onClick={showNext} aria-label="Next product media" className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 hover:bg-black/80 sm:right-5"><ChevronRight /></button>
            </>
          )}
          <p className="shrink-0 px-4 pb-4 pt-2 text-center text-xs text-white/65">Pinch, double tap, or use zoom controls to inspect details</p>
        </div>
      )}
    </section>
  );
}