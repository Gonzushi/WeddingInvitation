import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useAnimationFrame,
  useMotionValue,
} from "framer-motion";

import QRCode from "react-qr-code";

const API_URL = "https://rest.trip-nus.com"; // adjust if needed

// Minimum loading duration (ms)
const MIN_LOADING_DURATION_MS = 3000;

// Keep the pulsing animation in sync between circle, HF text, and line
export const LOADER_PULSE_DURATION = 1.8;

// Auto-scroll delay after opening invitation (ms)
const AUTO_SCROLL_DELAY = 5000;

// Frame duration for scroll 4 dance animation
const FRAME_DURATION = 300; // ms per frame

// =========================
// Music
// =========================

const MUSIC_SRC = "/assets/Lana Del Rey - Chemtrails Over The Country Club.mp3";

// =========================
// Types
// =========================

type GuestApi = {
  id: string;
  full_name: string;
  nickname?: string;
  additional_names?: string[];
  num_attendees?: number; // maximum
  num_attendees_confirmed?: number; // confirmed after RSVP
  is_attending?: boolean | null; // coming? yes/no/null (no RSVP yet)
  attendance_confirmed?: boolean | null; // not used in FE logic anymore
  wish?: string;
};

type RecipientMode = "default" | "backend" | "custom";

type Recipient = {
  mode: RecipientMode;
  id?: string;
  displayName: string;
  maxGuests: number;

  // RSVP state (using only isAttending for coming/not coming)
  isAttending?: boolean | null; // null = no RSVP; true/false = yes/no
  numAttendeesConfirmed?: number; // confirmed guests
  wish?: string;
};

type RsvpForm = {
  name: string;
  wish: string;
  isAttending: boolean | null; // yes/no
  numAttendeesConfirmed: number;
};

type ScrollDanceAnimationProps = {
  hasOpened: boolean;
};

type OurMomentsGalleryProps = {
  onModalChange?: (open: boolean) => void; // to hide music + arrows
};

type OurMomentImageWithIndex = {
  src: string;
  span?: number;
  animation?: string;
  index: number;
};

type RowTickerProps = {
  rowImages: OurMomentImageWithIndex[];
  rowIdx: number;
  onImageClick: (idx: number) => void;
};

// =========================
// Wedding Constants
// =========================

const COUPLE = {
  bride: {
    fullName: "Finna Widyanti",
    shortName: "Finna",
    fatherName: "Mr. Peng Cheong",
    motherName: "Mrs. Mariyani Lie",
    instagram: "finnawidy",
    norek: "7310838955",
  },
  groom: {
    fullName: "Haryanto Kartawijaya",
    shortName: "Haryanto",
    fatherName: "Mr. Liauw Sui Kian †",
    motherName: "Mrs. Tan Siok Mei",
    instagram: "haryantokartawijaya",
    norek: "5271037539",
  },
};

const EVENTS = {
  blessing: {
    label: "Holy Matrimony",
    dateText: "Saturday, 07 February 2026",
    timeText: "10.00 - 11.30 WIB",
    venueName: "Aston Bogor Hotel & Resort",
    locationText: "Bogor, Jawa Barat",
    mapsUrl:
      "https://www.google.com/maps/place/Aston+Bogor+Hotel+%26+Resort/@-6.6385245,106.7945357,16.61z/data=!4m9!3m8!1s0x2e69c5ee5f871091:0xc58549234bdf7d7c!5m2!4m1!1i2!8m2!3d-6.6363857!4d106.7955387!16s%2Fg%2F1jkwh91z1?entry=ttu&g_ep=EgoyMDI1MTIwMi4wIKXMDSoASAFQAw%3D%3D",
  },
  reception: {
    label: "Wedding Reception",
    dateText: "Saturday, 07 February 2026",
    timeText: "18.00 - 20.00 WIB",
    venueName: "Aston Bogor Hotel & Resort",
    locationText: "Bogor, Jawa Barat",
    mapsUrl:
      "https://www.google.com/maps/place/Aston+Bogor+Hotel+%26+Resort/@-6.6385245,106.7945357,16.61z/data=!4m9!3m8!1s0x2e69c5ee5f871091:0xc58549234bdf7d7c!5m2!4m1!1i2!8m2!3d-6.6363857!4d106.7955387!16s%2Fg%2F1jkwh91z1?entry=ttu&g_ep=EgoyMDI1MTIwMi4wIKXMDSoASAFQAw%3D%3D",
  },
};

const RSVP_CONFIG = {
  defaultMaxGuests: 2,
  rsvpEnabled: true,
  rsvpDeadlineText: "",
};

// Fonts
const fonts = {
  coupleName: "'Dancing Script', cursive", // NEW – bride/groom names
  heading: "'Dancing Script', cursive", // main names / big titles
  subheading: "'Cormorant Garamond', serif", // “The Wedding of”, date, etc.
  recipient: "'Cormorant Garamond', serif",
  button: "'Cormorant Garamond', serif",
  body: "'Cormorant Garamond', serif",
};

// Images to preload (add more as you use more assets)
const IMAGE_URLS = [
  "/assets/main.jpg",
  "/assets/scrollDance-bg.jpg",
  "/assets/scroll1-bg.jpg",
  "/assets/scroll1-bg.jpg",
  "/assets/scroll1-couple.png",
  "/assets/scroll23-bg.jpg",
  "/assets/scroll23-couple.png",
  "/assets/scroll6-bg.jpg",
  "/assets/scroll6-couple.png",
  "/assets/scroll4-bg.jpg",
  "/assets/scrollRSVP-bg.jpg",
  "/assets/gal1.jpeg",
  "/assets/gal2.jpeg",
  "/assets/gal3.jpeg",
  "/assets/gal4.jpeg",
  "/assets/gal5.jpeg",
  "/assets/gal6.jpeg",
  "/assets/gal7.jpeg",
  "/assets/gal8.jpeg",
  "/assets/gal9.jpeg",
  "/assets/gal10.jpeg",
  "/assets/gal11.jpeg",
  "/assets/gal12.jpeg",
  "/assets/gal13.jpeg",
  "/assets/gal14.jpeg",
  "/assets/gal15.jpeg",
  "/assets/gal16.jpeg",
  "/assets/gal17.jpeg",
  "/assets/gal18.jpeg",
  "/assets/gal19.jpeg",
];

const SCROLL_DANCE_FRAMES = [
  "/assets/scroll-dance1.png",
  "/assets/scroll-dance2.png",
  "/assets/scroll-dance3.png",
  "/assets/scroll-dance4.png",
  "/assets/scroll-dance5.png",
  "/assets/scroll-dance6.png",
  "/assets/scroll-dance7.png",
  "/assets/scroll-dance8.png",
];

const ourMomentsImages = [
  { src: "/assets/gal1.jpeg", span: 8, animation: "left" },
  { src: "/assets/gal2.jpeg", span: 3, animation: "left" },
  { src: "/assets/gal3.jpeg", span: 5, animation: "right" },
  { src: "/assets/gal4.jpeg", span: 8, animation: "left" },
  { src: "/assets/gal5.jpeg", span: 4, animation: "left" },
  { src: "/assets/gal6.jpeg", span: 4, animation: "right" },
  { src: "/assets/gal7.jpeg", span: 5, animation: "right" },
  { src: "/assets/gal8.jpeg", span: 3, animation: "left" },
  { src: "/assets/gal9.jpeg", span: 7, animation: "right" },
  { src: "/assets/gal10.jpeg", span: 4, animation: "left" },
  { src: "/assets/gal11.jpeg", span: 6, animation: "right" },
  { src: "/assets/gal12.jpeg", span: 3, animation: "left" },
  { src: "/assets/gal13.jpeg", span: 5, animation: "right" },
  { src: "/assets/gal14.jpeg", span: 4, animation: "left" },
  { src: "/assets/gal15.jpeg", span: 7, animation: "right" },
  { src: "/assets/gal16.jpeg", span: 3, animation: "left" },
  { src: "/assets/gal17.jpeg", span: 6, animation: "right" },
  { src: "/assets/gal18.jpeg", span: 4, animation: "left" },
  { src: "/assets/gal19.jpeg", span: 5, animation: "right" },
];

const PRELOAD_URLS = [...IMAGE_URLS, ...SCROLL_DANCE_FRAMES];

// =========================
// Helpers
// =========================

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string | null): value is string {
  return !!value && UUID_REGEX.test(value);
}

function capitalizeWords(text: string): string {
  return text
    .split(" ")
    .map((word) => {
      if (!word) return "";
      if (word === "&") return "&";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ")
    .trim();
}

// Helper to format JS Date -> ICS datetime (UTC, e.g. 20250308T120000Z)
const formatDateForICS = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

const handleSaveTheDate = () => {
  // 🔧 Change these to your real values
  const title = "Haryanto & Finna – Wedding Reception";
  const location = "Aston Bogor Hotel & Resort, Bogor, Jawa Barat";
  const description =
    "We would be honored to have you celebrate our wedding reception with us.";

  // Example date/time (Jakarta, UTC+7) – change to your actual date/time
  const startLocal = new Date("2025-03-08T18:00:00+07:00"); // reception start
  const endLocal = new Date("2025-03-08T20:00:00+07:00"); // reception end

  const dtStart = formatDateForICS(startLocal);
  const dtEnd = formatDateForICS(endLocal);
  const dtStamp = formatDateForICS(new Date());

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HF Wedding//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    // ⏰ Reminder 1 day before
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "hf-wedding-save-the-date.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const ScrollDanceAnimation: React.FC<ScrollDanceAnimationProps> = ({
  hasOpened,
}) => {
  const [frameIndex, setFrameIndex] = React.useState(0);

  React.useEffect(() => {
    if (!hasOpened) return;

    const last = SCROLL_DANCE_FRAMES.length - 1;

    const interval = window.setInterval(() => {
      setFrameIndex((prev) => {
        // just go forward, then loop back to 0
        if (prev === last) {
          return 0;
        }
        return prev + 1;
      });
    }, FRAME_DURATION);

    return () => window.clearInterval(interval);
  }, [hasOpened]);

  return (
    <div className="absolute inset-0 flex items-end justify-center z-20 pb-6">
      {/* 1) Subject entrance motion */}
      <motion.div
        variants={scrollDanceSubjectVariants}
        initial="initial"
        animate={hasOpened ? "enter" : "initial"}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        {/* 2) Subtle float */}
        <motion.div
          animate={{ y: [0, 0, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        >
          {/* 3) Frame animation */}
          <img
            src={SCROLL_DANCE_FRAMES[frameIndex]}
            alt="Dancing couple"
            className="h-[70vh] w-auto object-contain"
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

function RowTicker({ rowImages, rowIdx, onImageClick }: RowTickerProps) {
  const x = useMotionValue(0);
  const [isPaused, setIsPaused] = useState(false);
  const [rowWidth, setRowWidth] = useState(0);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const direction = rowIdx === 1 ? "right" : "left";
  const speed = rowIdx === 2 ? 22 : 16; // px/sec

  const doubled = [...rowImages, ...rowImages];

  // Measure width of a single row (half of doubled content)
  useEffect(() => {
    if (contentRef.current) {
      const fullWidth = contentRef.current.scrollWidth;
      setRowWidth(fullWidth / 2);
      x.set(-fullWidth / 4); // start somewhere in the middle
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowImages.length]);

  // Continuous marquee animation
  useAnimationFrame((_, delta) => {
    if (isPaused || rowWidth === 0) return;

    const dirMultiplier = direction === "left" ? -1 : 1;
    const moveBy = (speed * dirMultiplier * delta) / 1000;

    let nextX = x.get() + moveBy;

    // Keep x wrapped in [-rowWidth, 0]
    if (nextX <= -rowWidth) {
      nextX += rowWidth;
    } else if (nextX >= 0) {
      nextX -= rowWidth;
    }

    x.set(nextX);
  });

  const normalizeX = () => {
    if (!rowWidth) return;
    let current = x.get();

    // Wrap current into [-rowWidth, 0]
    while (current > 0) current -= rowWidth;
    while (current < -rowWidth) current += rowWidth;

    x.set(current);
  };

  const resumeAfterTouch = () => {
    // small delay so it doesn't feel jumpy
    setTimeout(() => setIsPaused(false), 80);
  };

  return (
    <div className="relative w-full flex-1 overflow-hidden rounded-xl">
      <motion.div
        ref={contentRef}
        className="absolute inset-y-0 left-0 flex gap-2 will-change-transform"
        style={{
          x,
          touchAction: "pan-y",
          cursor: "grab",
        }}
        drag="x"
        dragElastic={0.25}
        dragMomentum={false}
        whileTap={{ cursor: "grabbing" }}
        // 👉 Touch / press = pause
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => {
          normalizeX();
          resumeAfterTouch();
        }}
        onPointerCancel={resumeAfterTouch}
        onPointerLeave={resumeAfterTouch}
        // Extra safety: drag events also pause
        onDragStart={() => setIsPaused(true)}
        onDragEnd={() => {
          normalizeX();
          resumeAfterTouch();
        }}
      >
        {doubled.map((img, idx) => (
          <button
            key={`${img.src}-${idx}`}
            type="button"
            className="relative h-full w-32 sm:w-40 md:w-44 flex-shrink-0 overflow-hidden rounded-xl group"
            onClick={() => onImageClick(img.index)}
          >
            <img
              src={img.src}
              alt={`Our moment ${img.index + 1}`}
              className="w-full h-full object-cover grayscale-[20%] group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </motion.div>
    </div>
  );
}

function OurMomentsGallery({ onModalChange }: OurMomentsGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const openModal = (idx: number) => {
    setActiveIndex(idx);
    onModalChange?.(true);
  };

  const closeModal = () => {
    setActiveIndex(null);
    onModalChange?.(false);
  };

  const prev = () =>
    setActiveIndex((i) =>
      i === null
        ? 0
        : (i - 1 + ourMomentsImages.length) % ourMomentsImages.length
    );

  const next = () =>
    setActiveIndex((i) => (i === null ? 0 : (i + 1) % ourMomentsImages.length));

  // keep a stable global index for each image
  const imagesWithIndex = ourMomentsImages.map((img, index) => ({
    ...img,
    index,
  }));

  const ROW_COUNT = 3;
  const perRow = Math.ceil(imagesWithIndex.length / ROW_COUNT);

  // Split into up to 3 rows: [0..perRow-1], [perRow..2*perRow-1], ...
  const rows: (typeof imagesWithIndex)[] = Array.from(
    { length: ROW_COUNT },
    (_, row) => {
      const start = row * perRow;
      const end = start + perRow;
      return imagesWithIndex.slice(start, end);
    }
  );

  return (
    <>
      {/* Collage view */}
      <section className="h-full flex flex-col">
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex-1 flex flex-col gap-2">
            {rows.map((rowImages, rowIdx) => {
              if (rowImages.length === 0) return null;

              return (
                <RowTicker
                  key={rowIdx}
                  rowImages={rowImages}
                  rowIdx={rowIdx}
                  onImageClick={openModal}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Close Button (top-right) */}
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 text-white text-3xl z-50"
            >
              ✕
            </button>

            {/* Left arrow – desktop + mobile */}
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center px-3 py-3 z-40"
            >
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                style={{
                  filter: "drop-shadow(0 0 4px rgba(0,0,0,0.9))",
                }}
              >
                <path
                  d="M16 4L8 12l8 8"
                  stroke="white"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>

            {/* Right arrow – desktop + mobile */}
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center px-3 py-3 z-40"
            >
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                style={{
                  filter: "drop-shadow(0 0 4px rgba(0,0,0,0.9))",
                }}
              >
                <path
                  d="M8 4l8 8-8 8"
                  stroke="white"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>

            {/* Centered Image */}
            <div className="absolute inset-0 flex items-center justify-center">
              {ourMomentsImages[activeIndex] && (
                <div className="relative w-full h-full overflow-hidden">
                  {/* Blurred background to eliminate side bars */}
                  <img
                    src={ourMomentsImages[activeIndex].src}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-60"
                    aria-hidden="true"
                  />

                  {/* Main image: always fully visible, no crop */}
                  <motion.img
                    key={ourMomentsImages[activeIndex].src}
                    src={ourMomentsImages[activeIndex].src}
                    alt="Fullscreen"
                    className="relative z-10 w-full h-full object-contain"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1.05 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_, info) => {
                      const { offset } = info;
                      if (offset.x < -100) return next();
                      if (offset.x > 100) return prev();
                      if (offset.y > 100) return closeModal();
                    }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Transform custom `to` param like:
 *  - "hendry-widyanto-and-finna-widyanti"
 * to:
 *  - "Hendry Widyanto & Finna Widyanti"
 */
function formatCustomInvitee(raw: string): string {
  let value = raw.trim().toLowerCase();
  value = value.replace(/-/g, " "); // hyphens -> spaces
  value = value.replace(/\sand\s/gi, " & "); // " and " -> " & "
  value = value.replace(/\s+/g, " "); // collapse multiple spaces
  value = capitalizeWords(value);
  return value;
}

/**
 * Build a display name from backend guest data:
 * - full_name OR nickname
 * - plus any additional_names joined with " & "
 */
function buildBackendDisplayName(guest: GuestApi): string {
  const base = guest.full_name || guest.nickname || "Nama Undangan";
  const extras =
    guest.additional_names && guest.additional_names.length > 0
      ? " & " + guest.additional_names.join(" & ")
      : "";
  return `${base}${extras}`;
}

// =========================
// Music Toggle Icon
// =========================

const MusicToggle: React.FC<{
  isPlaying: boolean;
  onToggle: () => void;
}> = ({ isPlaying, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="absolute bottom-4 right-4 z-50 rounded-full bg-black/60 backdrop-blur-sm border border-white/40 shadow-lg p-2.5 flex items-center justify-center active:scale-95 transition-transform"
      aria-label={isPlaying ? "Pause music" : "Play music"}
    >
      <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Equalizer bars */}
          <motion.rect
            x="4"
            y="6"
            width="3"
            height="12"
            rx="1.5"
            fill="white"
            style={{ originY: 1 }}
            animate={
              isPlaying ? { scaleY: [0.7, 1.4, 0.9, 1.2, 0.7] } : { scaleY: 1 }
            }
            transition={
              isPlaying
                ? {
                    repeat: Infinity,
                    duration: 1.2,
                    ease: "easeInOut",
                  }
                : { duration: 0.2 }
            }
          />
          <motion.rect
            x="10.5"
            y="4"
            width="3"
            height="14"
            rx="1.5"
            fill="white"
            style={{ originY: 1 }}
            animate={
              isPlaying ? { scaleY: [1.2, 0.8, 1.5, 0.9, 1.2] } : { scaleY: 1 }
            }
            transition={
              isPlaying
                ? {
                    repeat: Infinity,
                    duration: 1.2,
                    ease: "easeInOut",
                    delay: 0.15,
                  }
                : { duration: 0.2 }
            }
          />
          <motion.rect
            x="17"
            y="7"
            width="3"
            height="11"
            rx="1.5"
            fill="white"
            style={{ originY: 1 }}
            animate={
              isPlaying ? { scaleY: [0.9, 1.3, 0.8, 1.4, 0.9] } : { scaleY: 1 }
            }
            transition={
              isPlaying
                ? {
                    repeat: Infinity,
                    duration: 1.2,
                    ease: "easeInOut",
                    delay: 0.3,
                  }
                : { duration: 0.2 }
            }
          />
        </svg>
      </div>
    </button>
  );
};

// =========================
// Motion variants – Scroll 1 (Hero)
// =========================

const scroll1BgVariants = {
  initial: { scale: 2, y: 0, opacity: 0 },
  enter: { scale: 1, y: 0, opacity: 1 },
};

const scroll1SubjectVariants = {
  initial: { opacity: 0, y: 40, scale: 1.75 },
  enter: { opacity: 1, y: -40, scale: 1.25 },
};

// =========================
// Shared couple variants – Sections 2 & 3
// =========================

// BG: smooth, slight zoom + slide in, but NO fade from black
const scroll23BgVariants = {
  initial: { scale: 2, x: -120, y: 80, opacity: 1 },
  enter: { scale: 1.5, x: 0, y: -160, opacity: 1 },
};

const couple23Variants = {
  hidden: {
    opacity: 1,
    x: -300, // left
    y: 200, // bottom
    scale: 2,
  },
  groom: {
    opacity: 1,
    x: -70, // right side
    y: -150,
    scale: 2,
  },
  bride: {
    opacity: 1,
    x: -250, // left side
    y: -150,
    scale: 2,
  },
};

// =========================
// Motion variants – Scroll 4 (Save the Date / Countdown)
// =========================

const scroll4BgVariants = {
  initial: { scale: 2, x: -40, y: 120, opacity: 1 },
  enter: { scale: 1, x: 0, y: 0, opacity: 1 },
};

// =========================
// Motion variants – Scroll 5 (Reception)
// =========================

const scroll5BgVariants = {
  initial: { scale: 2, x: -120, y: 80, opacity: 1 },
  enter: { scale: 1.5, x: -40, y: 80, opacity: 1 },
};

// const scroll5SubjectVariants = {
//   initial: { opacity: 1, x: -200, y: 80, scale: 2 },
//   enter: { opacity: 1, x: -35, y: -190, scale: 2 },
// };

// =========================
// Motion variants – Scroll 6 (Verse and Couple)
// =========================

const scroll6BgVariants = {
  initial: { scale: 2, x: 120, y: 80, opacity: 1 },
  enter: { scale: 1, x: 0, y: 0, opacity: 1 },
};

const scroll6SubjectVariants = {
  initial: { opacity: 1, x: 220, y: 80, scale: 2 },
  enter: { opacity: 1, x: -5, y: -10, scale: 1.35 },
};

// =========================
// Motion variants – Scroll 7 (Dance)
// =========================

const scrollDanceBgVariants = {
  initial: { scale: 2, x: 120, y: 80, opacity: 1 },
  enter: { scale: 1, x: 0, y: 0, opacity: 1 },
};

const scrollDanceSubjectVariants = {
  // from bottom-left, bigger, and faded
  initial: { opacity: 1, x: -160, y: 220, scale: 1.9 },
  // end near center-ish
  enter: { opacity: 1, x: -20, y: -60, scale: 1.35 },
};

// =========================
// Main Component
// =========================

export default function Invitation() {
  // global loading state (for images + minimum loading duration)
  const [isLoaded, setIsLoaded] = useState(false);

  // cover / open state
  const [hasOpened, setHasOpened] = useState(false);

  // QR popup on cover
  const [showCoverQr, setShowCoverQr] = useState(false);

  // scrolling / snapping state
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const isLockedRef = useRef(false);
  const totalSections = 10;

  // Section Menut State
  const [isSectionMenuOpen, setIsSectionMenuOpen] = useState(false);
  const sectionLabels = [
    { index: 0, label: "Our Journey" },
    { index: 1, label: "The Groom" },
    { index: 2, label: "The Bride" },
    { index: 3, label: "Save the Date" },
    { index: 4, label: "Schedule" },
    { index: 5, label: "Joyful & Whimsical" },
    { index: 6, label: "RSVP" },
    { index: 7, label: "Wedding Gift" },
    { index: 8, label: "Gallery" },
    { index: 9, label: "Thank You" },
  ];

  const scrollToSection = (targetIndex: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Disable auto-scroll once user uses manual navigation
    autoScrollDisabledRef.current = true;
    if (autoScrollTimeoutRef.current !== null) {
      window.clearTimeout(autoScrollTimeoutRef.current);
      autoScrollTimeoutRef.current = null;
    }

    const clamped = Math.max(0, Math.min(totalSections - 1, targetIndex));

    isLockedRef.current = true;
    setCurrentSection(clamped);

    container.scrollTo({
      top: clamped * window.innerHeight,
      behavior: "smooth",
    });

    window.setTimeout(() => {
      isLockedRef.current = false;
    }, 500);
  };

  // Auto-scroll state
  const autoScrollTimeoutRef = useRef<number | null>(null);
  const autoScrollDisabledRef = useRef(false);

  const isAutoScrollOn =
    hasOpened && !autoScrollDisabledRef.current && currentSection < 6;

  // Modal
  // const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  // recipient & RSVP state
  const [isEditingRsvp, setIsEditingRsvp] = useState(false);
  const [recipient, setRecipient] = useState<Recipient>({
    mode: "default",
    displayName: "Nama Undangan",
    maxGuests: RSVP_CONFIG.defaultMaxGuests,
    isAttending: null,
    numAttendeesConfirmed: 1,
    wish: "",
  });

  const [form, setForm] = useState<RsvpForm>({
    name: "Nama Undangan",
    wish: "",
    isAttending: null,
    numAttendeesConfirmed: 1,
  });

  const [wishes, setWishes] = useState<
    { id: string; name: string; wish: string }[]
  >([]);

  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [rsvpModalMessage, setRsvpModalMessage] = useState<string>("");

  const startEditRsvp = () => {
    setForm({
      name: recipient.displayName,
      wish: recipient.wish || "",
      isAttending:
        typeof recipient.isAttending === "boolean"
          ? recipient.isAttending
          : null,
      numAttendeesConfirmed:
        recipient.numAttendeesConfirmed && recipient.numAttendeesConfirmed > 0
          ? recipient.numAttendeesConfirmed
          : 1,
    });
    setIsEditingRsvp(true);
  };

  const [isLoadingGuest, setIsLoadingGuest] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  // -------------------------
  // Music player state
  // -------------------------

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // -------------------------
  // Load custom fonts
  // -------------------------
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?" +
      "family=Cormorant+Garamond:wght@400;600&" +
      "family=Dancing+Script&" +
      "family=Italianno&" +
      "family=Great+Vibes&" +
      "family=Allura&" +
      "family=Parisienne&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // -------------------------
  // Setup audio element
  // -------------------------
  useEffect(() => {
    const audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // -------------------------
  // Autoplay music once loading done (if browser allows)
  // -------------------------
  const wasPlayingBeforeHideRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !audioRef.current) return;

    audioRef.current
      .play()
      .then(() => {
        setIsMusicPlaying(true);
      })
      .catch((err) => {
        console.warn("Autoplay blocked by browser", err);
        // if blocked, we'll also try again on "OPEN INVITATION" click
      });
  }, [isLoaded]); // only run once when loading finishes

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMusicPlaying) {
      audio.pause();
      setIsMusicPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsMusicPlaying(true))
        .catch((err) => {
          console.warn("Failed to play audio", err);
        });
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const pauseForBackground = () => {
      // remember if it was playing
      wasPlayingBeforeHideRef.current = !audio.paused;
      audio.pause();
      setIsMusicPlaying(false);
    };

    const resumeIfNeeded = () => {
      // Only resume if it was playing before the page got hidden
      if (!wasPlayingBeforeHideRef.current) return;

      audio
        .play()
        .then(() => setIsMusicPlaying(true))
        .catch(() => {
          // Autoplay may be blocked when returning; keep it paused
          setIsMusicPlaying(false);
        })
        .finally(() => {
          wasPlayingBeforeHideRef.current = false;
        });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) pauseForBackground();
      else resumeIfNeeded();
    };

    // iOS/Safari reliability extras
    const handlePageHide = () => pauseForBackground();
    const handleFocus = () => resumeIfNeeded();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // countdown to reception
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // -------------------------
  // Preload images + minimum loader duration
  // -------------------------
  useEffect(() => {
    let isCancelled = false;
    let timeoutId: number | undefined;
    const startTime = Date.now();

    const markLoadedWhenReady = () => {
      if (isCancelled) return;
      const elapsed = Date.now() - startTime;
      const remaining = MIN_LOADING_DURATION_MS - elapsed;
      const delay = Math.max(0, remaining);

      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        if (!isCancelled) setIsLoaded(true);
      }, delay);
    };

    if (PRELOAD_URLS.length === 0) {
      markLoadedWhenReady();
      return () => {
        if (timeoutId) window.clearTimeout(timeoutId);
      };
    }

    let loadedCount = 0;

    const onImgDone = () => {
      if (isCancelled) return;
      loadedCount += 1;
      if (loadedCount === PRELOAD_URLS.length) {
        markLoadedWhenReady();
      }
    };

    PRELOAD_URLS.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = onImgDone;
      img.onerror = onImgDone;
    });

    return () => {
      isCancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  // -------------------------
  // Load recipient based on URL ?to=
  // -------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const to = params.get("to");

    // helper: load wishes for this guest id
    const loadWishesForGuest = (id: string) => {
      fetch(`${API_URL}/guests/${id}/wishes`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch wishes");
          }
          return res.json();
        })
        .then((data) => {
          const list: GuestApi[] = data?.data || [];
          const mapped = list
            .filter((g) => g.wish && g.wish.trim().length > 0)
            .map((g) => ({
              id: g.id,
              name: buildBackendDisplayName(g),
              wish: g.wish!.trim(),
            }));
          setWishes(mapped);
        })
        .catch((err) => {
          console.error("Failed to load wishes", err);
          setWishes([]);
        });
    };

    // CASE 1: no `to` -> default mode
    if (!to) {
      const defaultRecipient: Recipient = {
        mode: "default",
        displayName: "Nama Undangan",
        maxGuests: RSVP_CONFIG.defaultMaxGuests,
        isAttending: null,
        numAttendeesConfirmed: 1,
        wish: "",
      };
      setRecipient(defaultRecipient);
      setForm((prev) => ({
        ...prev,
        name: defaultRecipient.displayName,
        numAttendeesConfirmed: 1,
        isAttending: null,
      }));
      setWishes([]);
      return;
    }

    // CASE 2: `to` is UUID -> backend mode
    if (isUuid(to)) {
      setIsLoadingGuest(true);
      setGuestError(null);

      fetch(`${API_URL}/guests/${to}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Guest not found");
          }
          return res.json();
        })
        .then((data) => {
          const guest: GuestApi = data?.data;
          const displayName = buildBackendDisplayName(guest);

          const maxGuests = guest.num_attendees || RSVP_CONFIG.defaultMaxGuests;
          const confirmedGuests = guest.num_attendees_confirmed;

          const backendRecipient: Recipient = {
            mode: "backend",
            id: guest.id,
            displayName,
            maxGuests,
            isAttending:
              typeof guest.is_attending === "boolean"
                ? guest.is_attending
                : null,
            numAttendeesConfirmed:
              typeof confirmedGuests === "number" ? confirmedGuests : undefined,
            wish: guest.wish || "",
          };

          setRecipient(backendRecipient);

          setForm({
            name: displayName,
            wish: guest.wish || "",
            isAttending:
              typeof guest.is_attending === "boolean"
                ? guest.is_attending
                : null,
            numAttendeesConfirmed:
              typeof confirmedGuests === "number" && confirmedGuests > 0
                ? confirmedGuests
                : backendRecipient.maxGuests,
          });

          // Load wishes list for this guest (this guest prioritized by backend)
          if (guest.id) {
            loadWishesForGuest(guest.id);
          } else {
            setWishes([]);
          }
        })
        .catch((err: unknown) => {
          console.error("Failed to fetch guest", err);
          setGuestError("Guest not found. Using default invitee.");
          const fallbackRecipient: Recipient = {
            mode: "default",
            displayName: "Nama Undangan",
            maxGuests: RSVP_CONFIG.defaultMaxGuests,
            isAttending: null,
            numAttendeesConfirmed: 1,
            wish: "",
          };
          setRecipient(fallbackRecipient);
          setForm((prev) => ({
            ...prev,
            name: fallbackRecipient.displayName,
            numAttendeesConfirmed: 1,
            isAttending: null,
          }));
          setWishes([]);
        })
        .finally(() => {
          setIsLoadingGuest(false);
        });

      return;
    }

    // CASE 3: custom string -> e.g. hendry-widyanto-and-finna-widyanti
    const displayName = formatCustomInvitee(to);
    const customRecipient: Recipient = {
      mode: "custom",
      displayName,
      maxGuests: RSVP_CONFIG.defaultMaxGuests,
      isAttending: null,
      numAttendeesConfirmed: 1,
      wish: "",
    };
    setRecipient(customRecipient);
    setForm((prev) => ({
      ...prev,
      name: displayName,
      numAttendeesConfirmed: 1,
      isAttending: null,
    }));
    setWishes([]);
  }, []);

  // -------------------------
  // Smooth section-by-section scroll
  // + go back to cover when scrolling/swiping UP from section 0
  // -------------------------
  useEffect(() => {
    if (!hasOpened) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const sectionHeight = window.innerHeight;
    let touchStartY = 0;

    const handleScroll = () => {
      if (isLockedRef.current) return;

      const newScrollTop = container.scrollTop;
      const newSection = Math.round(newScrollTop / sectionHeight);

      if (newSection !== currentSection) {
        isLockedRef.current = true;
        const clampedSection = Math.max(
          0,
          Math.min(totalSections - 1, newSection)
        );
        setCurrentSection(clampedSection);

        container.scrollTo({
          top: clampedSection * sectionHeight,
          behavior: "smooth",
        });

        setTimeout(() => {
          isLockedRef.current = false;
        }, 500);
      }
    };

    const goBackToCover = () => {
      isLockedRef.current = false;
      setHasOpened(false);
      setCurrentSection(0);
      container.scrollTo({ top: 0, behavior: "auto" });
    };

    const handleWheel = (e: WheelEvent) => {
      // user interacted → disable auto-scroll forever
      autoScrollDisabledRef.current = true;
      if (autoScrollTimeoutRef.current !== null) {
        window.clearTimeout(autoScrollTimeoutRef.current);
        autoScrollTimeoutRef.current = null;
      }

      if (currentSection === 0 && container.scrollTop <= 0 && e.deltaY < 0) {
        e.preventDefault();
        goBackToCover();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;

      // user interacted → disable auto-scroll forever
      autoScrollDisabledRef.current = true;
      if (autoScrollTimeoutRef.current !== null) {
        window.clearTimeout(autoScrollTimeoutRef.current);
        autoScrollTimeoutRef.current = null;
      }

      const currentY = e.touches[0].clientY;
      const diffY = currentY - touchStartY;

      if (currentSection === 0 && container.scrollTop <= 0 && diffY > 40) {
        e.preventDefault();
        goBackToCover();
      }
    };

    container.addEventListener("scroll", handleScroll);
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [hasOpened, currentSection, totalSections]);

  // ----------------------------------
  // AUTO SCROLL — advance after 3 seconds (if user did not scroll)
  // ----------------------------------
  useEffect(() => {
    if (!hasOpened) return;
    if (autoScrollDisabledRef.current) return; // user has interacted → stop forever

    // ⛔ Stop auto-scroll starting from RSVP (section 6)
    if (currentSection >= 6) return;

    // clear existing timer
    if (autoScrollTimeoutRef.current !== null) {
      window.clearTimeout(autoScrollTimeoutRef.current);
      autoScrollTimeoutRef.current = null;
    }

    // set new timer
    autoScrollTimeoutRef.current = window.setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const next = Math.min(totalSections - 1, currentSection + 1);

      isLockedRef.current = true;

      setCurrentSection(next);
      container.scrollTo({
        top: next * window.innerHeight,
        behavior: "smooth",
      });

      setTimeout(() => {
        isLockedRef.current = false;
      }, 500);
    }, AUTO_SCROLL_DELAY);

    return () => {
      if (autoScrollTimeoutRef.current !== null) {
        window.clearTimeout(autoScrollTimeoutRef.current);
        autoScrollTimeoutRef.current = null;
      }
    };
  }, [hasOpened, currentSection, totalSections]);

  // -------------------------
  // Countdown to reception (Save the Date)
  // -------------------------
  useEffect(() => {
    // Using the reception date/time from the const
    const target = new Date("2026-02-07T18:00:00+07:00").getTime();

    const update = () => {
      const now = Date.now();
      let diff = target - now;

      if (diff < 0) diff = 0;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    update(); // initial
    const id = window.setInterval(update, 1000);

    return () => window.clearInterval(id);
  }, []);

  // -------------------------
  // Handlers: open cover
  // -------------------------

  const handleOpen = () => {
    setHasOpened(true);
    setShowCoverQr(false); // ensure popup closed when leaving cover

    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: 0, behavior: "auto" });
    }

    const audio = audioRef.current;
    if (audio && !isMusicPlaying) {
      audio
        .play()
        .then(() => setIsMusicPlaying(true))
        .catch((err) => {
          console.warn("Failed to play audio on open", err);
        });
    }
  };

  // -------------------------
  // Handlers: RSVP form
  // -------------------------

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "isAttending") {
      setForm((prev) => {
        const newIsAttending =
          value === "yes" ? true : value === "no" ? false : null;

        let newGuests = prev.numAttendeesConfirmed;

        if (newIsAttending === true) {
          // Only consider "first time Yes" when it was never answered before
          const firstTimeYes = prev.isAttending === null;

          const numericGuests = Number(newGuests || 0);

          // First time switching to Yes, and guest count not meaningful yet:
          // -> default to maxGuests (e.g. 3)
          if (firstTimeYes && numericGuests <= 1) {
            newGuests = recipient.maxGuests;
          }

          // Safety clamp in case something weird comes from backend
          const clamped = Number(newGuests || 0);
          if (clamped > recipient.maxGuests) {
            newGuests = recipient.maxGuests;
          }
        }

        if (newIsAttending === false) {
          // When "No", guest count is irrelevant; keep a harmless baseline
          const numericGuests = Number(newGuests || 0);
          if (numericGuests < 1) {
            newGuests = 1;
          }
        }

        return {
          ...prev,
          isAttending: newIsAttending,
          numAttendeesConfirmed: newGuests,
        };
      });
    } else if (name === "numAttendeesConfirmed") {
      setForm((prev) => ({
        ...prev,
        numAttendeesConfirmed: Number(value),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = () => {
    if (!RSVP_CONFIG.rsvpEnabled) {
      alert("RSVP is currently closed.");
      return;
    }

    const trimmedName = form.name.trim();
    const trimmedWish = form.wish.trim();
    const hasWish = trimmedWish.length > 0;

    if (!trimmedName) {
      alert("Please enter your name.");
      return;
    }

    if (form.isAttending === null) {
      alert("Please let us know if you will attend.");
      return;
    }

    // Only validate guest count when attending
    if (form.isAttending === true) {
      if (
        form.numAttendeesConfirmed < 1 ||
        form.numAttendeesConfirmed > recipient.maxGuests
      ) {
        alert(`Number of guests must be between 1 and ${recipient.maxGuests}.`);
        return;
      }
    }

    const numAttendeesForSubmit =
      form.isAttending === true ? form.numAttendeesConfirmed : 0;

    // =========================
    // Wishes list UI behavior
    // =========================
    if (recipient.mode === "backend" && recipient.id) {
      const guestId = recipient.id;

      if (hasWish) {
        // add / replace this guest's wish
        setWishes((prev) => {
          const filtered = prev.filter((w) => w.id !== guestId);
          return [
            {
              id: guestId,
              name: trimmedName,
              wish: trimmedWish,
            },
            ...filtered,
          ];
        });
      } else {
        // wish cleared -> remove this guest from wishes list
        setWishes((prev) => prev.filter((w) => w.id !== guestId));
      }
    } else {
      // non-backend / default / custom mode
      if (hasWish) {
        const localId = `local-${Date.now()}`;
        setWishes((prev) => [
          {
            id: localId,
            name: trimmedName,
            wish: trimmedWish,
          },
          ...prev,
        ]);
      } else {
        // optional: clear any previous local wish for this name
        setWishes((prev) => prev.filter((w) => w.name !== trimmedName));
      }
    }

    // Update local recipient state – ALWAYS set wish, even if ""
    setRecipient((prev) => ({
      ...prev,
      isAttending: form.isAttending,
      numAttendeesConfirmed: numAttendeesForSubmit,
      wish: trimmedWish, // can be ""
    }));

    // Send to backend if backend guest
    if (recipient.mode === "backend" && recipient.id) {
      const payload: Record<string, unknown> = {
        is_attending: form.isAttending,
        num_attendees_confirmed: numAttendeesForSubmit,
        name: trimmedName,
        wish: trimmedWish, // always send, even ""
      };

      fetch(`${API_URL}/guests/${recipient.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.error("Failed to submit RSVP to backend", err);
      });
    }

    // Modal message
    setRsvpModalMessage(
      form.isAttending === true
        ? "Thank you! Your RSVP has been recorded. We look forward to celebrating with you."
        : "Thank you for your response. We truly appreciate your wishes and prayers."
    );
    setShowRsvpModal(true);
    setIsEditingRsvp(false);
  };

  const isSubmitDisabled =
    // 1) Must choose yes/no
    form.isAttending === null ||
    // 2) If "Yes", number of guests must be valid (1..maxGuests)
    (form.isAttending === true &&
      (!form.numAttendeesConfirmed ||
        form.numAttendeesConfirmed < 1 ||
        form.numAttendeesConfirmed > recipient.maxGuests));

  const handleCopy = (text: string) => {
    const raw = text.replace(/\D/g, ""); // ensure digits only

    // Fallback using a hidden textarea + execCommand
    const fallbackCopy = (value: string) => {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        // Avoid scrolling to bottom on iOS
        textarea.style.position = "fixed";
        textarea.style.top = "0";
        textarea.style.left = "0";
        textarea.style.opacity = "0";
        textarea.style.pointerEvents = "none";

        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (successful) {
          setRsvpModalMessage("Account number copied to clipboard.");
          setShowRsvpModal(true);
        } else {
          alert("Failed to copy account number.");
        }
      } catch (err) {
        console.error("Fallback copy failed", err);
        alert("Failed to copy account number.");
      }
    };

    // Modern API path (desktop, some mobile, HTTPS)
    if (
      typeof navigator !== "undefined" &&
      "clipboard" in navigator &&
      window.isSecureContext
    ) {
      (navigator as Navigator & { clipboard: Clipboard }).clipboard
        .writeText(raw)
        .then(() => {
          setRsvpModalMessage("Account number copied to clipboard.");
          setShowRsvpModal(true);
        })
        .catch((err) => {
          console.warn("navigator.clipboard failed, using fallback", err);
          fallbackCopy(raw);
        });
      return;
    }

    // No navigator.clipboard or not secure → fallback
    fallbackCopy(raw);
  };

  const formatNorek = (norek: string): string => {
    const digits = norek.replace(/\D/g, "");

    // Example: '1672821872' -> '167-282-1872'
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    // Fallback: if length is different, just return as-is or do a generic grouping
    return digits;
  };

  // -------------------------
  // Render
  // -------------------------

  const maxGuestsOptions = Array.from(
    { length: recipient.maxGuests },
    (_, i) => i + 1
  );

  // show QR for all backend guests who have an id
  const canShowQr = recipient.mode === "backend" && !!recipient.id;

  const qrValue =
    recipient.mode === "backend" && recipient.id ? recipient.id : "";

  return (
    <div className="w-full h-dvh flex items-center justify-center bg-black/5 relative">
      {/* Loader overlay with fade-out */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key="loader"
            className="absolute inset-0 z-50 flex items-center justify-center bg-white overflow-hidden"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            {/* subtle background texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.04),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(0,0,0,0.04),_transparent_55%)]" />

            <motion.div
              className="relative z-10 flex flex-col items-center gap-6 px-6"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {/* Envelope */}
              <div className="relative w-64 md:w-72 aspect-[4/3]">
                {/* Envelope body (glassy) */}
                <div
                  className="absolute inset-x-4 top-3 bottom-7 rounded-3xl
                       border border-black/70
                       bg-white/20 backdrop-blur-xl
                       shadow-[0_18px_50px_rgba(0,0,0,0.16)]
                       overflow-hidden"
                >
                  {/* Inner paper */}
                  <div className="absolute inset-3 rounded-2xl border border-black/10 bg-white/30" />

                  {/* HF stamp perfectly centered, with transparent fill */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{
                      duration: LOADER_PULSE_DURATION,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <div
                      className="relative w-12 h-12 md:w-14 md:h-14
                           rounded-full 
                           border border-black/80
                           bg-transparent      
                           flex items-center justify-center
                           "
                    >
                      <motion.span
                        className="text-base md:text-lg font-bold text-black tracking-[0.18em]"
                        style={{ fontFamily: fonts.heading }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{
                          duration: LOADER_PULSE_DURATION,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        HF
                      </motion.span>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Text under envelope */}
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className="text-m md:text-base tracking-[0.25em] uppercase text-black/80 font-bold"
                  style={{ fontFamily: fonts.subheading }}
                >
                  YOU ARE
                </span>
                <span
                  className="text-m md:text-base tracking-[0.25em] uppercase text-black/80 font-bold"
                  style={{ fontFamily: fonts.subheading }}
                >
                  INVITED
                </span>

                <motion.div
                  className="h-px w-24 bg-black/40 mt-3 rounded-full"
                  initial={{ opacity: 0.4, scaleX: 0.6 }}
                  animate={{
                    opacity: [0.4, 1, 0.4],
                    scaleX: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: LOADER_PULSE_DURATION,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content fades in when loaded */}
      <motion.div
        className="w-full flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {/* Phone frame – same width everywhere (desktop & phones) */}
        <div
          ref={scrollContainerRef}
          className={`relative max-w-[480px] w-full h-dvh ${
            hasOpened ? "overflow-y-scroll" : "overflow-hidden"
          }`}
        >
          {/* Scrollable sections (phone-only content) */}
          <div
            className="relative"
            style={{ height: `${totalSections * 100}dvh` }}
          >
            {/* Sticky viewport area inside phone */}
            <div className="sticky top-0 h-dvh w-full overflow-hidden bg-black relative">
              <AnimatePresence mode="sync">
                {/* =========================
                    SECTION 1 – HERO / OUR JOURNEY
                   ========================= */}
                {currentSection === 0 && (
                  <motion.section
                    key="section-0"
                    className="absolute inset-0 h-dvh overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    {/* Background image with soft pop-in */}
                    <motion.div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: "url('/assets/scroll1-bg.jpg')",
                      }}
                      variants={scroll1BgVariants}
                      initial="initial"
                      animate={hasOpened ? "enter" : "initial"}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />

                    {/* Soft gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/20 to-black/80" />

                    {/* Verse at top center */}
                    <motion.div
                      className="absolute top-10 inset-x-0 px-6 text-center"
                      initial={{ opacity: 0, y: -20 }}
                      animate={
                        hasOpened
                          ? { opacity: 1, y: 0 }
                          : { opacity: 0, y: -20 }
                      }
                      transition={{
                        duration: 1.1,
                        ease: "easeOut",
                        delay: 0.3,
                      }}
                    >
                      <p
                        className="text-lg tracking-[0.25em] uppercase text-white/70 mb-3"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        Our Journey
                      </p>
                      <p
                        className="text-m md:text-[17px] leading-snug text-white/90"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        “When two souls find home in each other,
                        <br />
                        they become inseparable.”
                      </p>
                    </motion.div>

                    {/* Couple */}
                    <div className="absolute inset-0 flex justify-center">
                      <motion.img
                        src="/assets/scroll1-couple.png"
                        alt="Bride and Groom"
                        className="w-full max-w-xs object-cover"
                        variants={scroll1SubjectVariants}
                        initial="initial"
                        animate={hasOpened ? "enter" : "initial"}
                        transition={{
                          duration: 1.5,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                  </motion.section>
                )}

                {/* =========================
                    SECTION 2 & 3 – BRIDE & GROOM SHARED SCENE
                  ========================= */}
                {(currentSection === 1 || currentSection === 2) && (
                  <motion.section
                    key="section-1-2"
                    className="absolute inset-0 h-dvh overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    {/* Background image – same for both Bride & Groom */}
                    <motion.div
                      className="absolute inset-0 bg-cover bg-center z-0"
                      style={{
                        backgroundImage: "url('/assets/scroll23-bg.jpg')",
                      }}
                      variants={scroll23BgVariants}
                      initial="initial"
                      animate={hasOpened ? "enter" : "initial"}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />

                    {/* Soft gradient overlay */}
                    <motion.div
                      className="absolute inset-0 bg-cover bg-center z-0"
                      variants={scroll23BgVariants}
                      initial="initial"
                      animate={hasOpened ? "enter" : "initial"}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/50 to-black/80 z-10 pointer-events-none" />
                    </motion.div>

                    {/* Shared couple photo */}
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <motion.img
                        src="/assets/scroll23-couple.png"
                        alt="Bride and Groom"
                        className="max-h-[80%] w-auto object-contain"
                        variants={couple23Variants}
                        initial="hidden"
                        animate={currentSection === 1 ? "bride" : "groom"}
                        transition={{
                          duration: 1.5,
                          ease: "easeInOut",
                        }}
                      />
                    </div>

                    {/* Text blocks – Bride (left) fades out, Groom (right) fades in */}
                    <AnimatePresence mode="wait">
                      {currentSection === 1 && (
                        <motion.div
                          key="groom-text"
                          className="absolute top-10 left-28 right-6 z-30 text-right"
                          initial={{ opacity: 0, y: -60 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 2, // 👈 groom info ENTER (1 → 2)
                              ease: "easeOut",
                            },
                          }}
                          exit={{
                            opacity: 0,
                            y: -20,
                            transition: {
                              duration: 0.4, // 👈 groom info EXIT (2 → 3)
                              ease: "easeInOut",
                            },
                          }}
                        >
                          {/* Title */}
                          <p
                            className="text-lg tracking-[0.25em] uppercase text-white/70 mb-3"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            The Groom
                          </p>

                          {/* Name */}
                          <p
                            className="text-4xl md:text-4xl text-white mb-3"
                            style={{ fontFamily: fonts.coupleName }}
                          >
                            {COUPLE.groom.fullName}
                          </p>

                          {/* Parents – 3 lines */}
                          <p
                            className="text-m md:text-base text-white/80 mb-3 leading-relaxed"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            Son of
                            <br />
                            <span className="font-semibold">
                              {COUPLE.groom.fatherName}
                            </span>
                            <br />
                            <span className="font-semibold">
                              {COUPLE.groom.motherName}
                            </span>
                          </p>

                          {/* IG icon + handle */}
                          <p
                            className="text-m md:text-base text-white/70"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            <a
                              href={`https://instagram.com/${COUPLE.groom.instagram}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 justify-end hover:text-white transition-colors"
                            >
                              <span>@{COUPLE.groom.instagram}</span>
                              <svg
                                className="w-5 h-5"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <rect
                                  x="3"
                                  y="3"
                                  width="18"
                                  height="18"
                                  rx="5"
                                  ry="5"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  fill="none"
                                />
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="5"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  fill="none"
                                />
                                <circle
                                  cx="17"
                                  cy="7"
                                  r="1.2"
                                  stroke="currentColor"
                                  strokeWidth="1.3"
                                  fill="none"
                                />
                              </svg>
                            </a>
                          </p>
                        </motion.div>
                      )}

                      {currentSection === 2 && (
                        <motion.div
                          key="bride-text"
                          className="absolute top-10 left-6 right-28 z-30 text-left"
                          initial={{ opacity: 0, y: -60 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 2, // 👈 bride info ENTER (1) – slower
                              ease: "easeOut",
                            },
                          }}
                          exit={{
                            opacity: 0,
                            y: -20,
                            transition: {
                              duration: 0.5, // 👈 bride info EXIT (1 → 2)
                              ease: "easeInOut",
                            },
                          }}
                        >
                          {/* Title */}
                          <p
                            className="text-lg tracking-[0.25em] uppercase text-white/70 mb-3"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            The Bride
                          </p>

                          {/* Name */}
                          <p
                            className="text-4xl md:text-4xl text-white mb-3"
                            style={{ fontFamily: fonts.coupleName }}
                          >
                            {COUPLE.bride.fullName}
                          </p>

                          {/* Parents – 3 lines */}
                          <p
                            className="text-m md:text-base text-white/80 mb-3 leading-relaxed"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            Daughter of
                            <br />
                            <span className="font-semibold">
                              {COUPLE.bride.fatherName}
                            </span>
                            <br />
                            <span className="font-semibold">
                              {COUPLE.bride.motherName}
                            </span>
                          </p>

                          {/* IG icon + handle */}
                          <p
                            className="text-m md:text-base text-white/70"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            <a
                              href={`https://instagram.com/${COUPLE.bride.instagram}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 hover:text-white transition-colors"
                            >
                              <svg
                                className="w-5 h-5"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                {/* Outer rounded square */}
                                <rect
                                  x="3"
                                  y="3"
                                  width="18"
                                  height="18"
                                  rx="5"
                                  ry="5"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  fill="none"
                                />
                                {/* Inner circle */}
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="5"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  fill="none"
                                />
                                {/* Small circle (flash) – outline only, no fill */}
                                <circle
                                  cx="17"
                                  cy="7"
                                  r="1.2"
                                  stroke="currentColor"
                                  strokeWidth="1.3"
                                  fill="none"
                                />
                              </svg>
                              <span>@{COUPLE.bride.instagram}</span>
                            </a>
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.section>
                )}

                {/* =========================
                    SECTION 4 – SAVE THE DATE + COUNTDOWN
                   ========================= */}
                {currentSection === 3 && (
                  <motion.section
                    key="section-4"
                    className="absolute inset-0 h-dvh overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    {/* Background from bottom */}
                    <motion.div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: "url('/assets/scroll4-bg.jpg')",
                      }}
                      variants={scroll4BgVariants}
                      initial="initial"
                      animate={hasOpened ? "enter" : "initial"}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />

                    {/* Soft light overlay for readability on light BG */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/10 to-white/20" />

                    {/* Text + countdown at top */}
                    <motion.div
                      className="absolute top-10 inset-x-0 px-6 text-center z-20"
                      initial={{ opacity: 0, y: -20 }}
                      animate={
                        hasOpened
                          ? { opacity: 1, y: 0 }
                          : { opacity: 0, y: -20 }
                      }
                      transition={{
                        duration: 0.8,
                        ease: "easeOut",
                        delay: 0.2,
                      }}
                    >
                      {/* Save the Date */}
                      <p
                        className="text-lg md:text-lg tracking-[0.28em] uppercase text-black/80 mb-3"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        Save the Date
                      </p>

                      {/* Subtitle */}
                      <p
                        className="text-m md:text-2xl text-black mb-3"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        Countdown to our wedding reception
                      </p>

                      {/* Date & time */}
                      {/* <p
                        className="text-m md:text-lg text-black/80 mb-6"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        {EVENTS.reception.dateText} ·{" "}
                        {EVENTS.reception.timeText}
                      </p> */}

                      {/* Save to Calendar button */}
                      <motion.button
                        type="button"
                        onClick={handleSaveTheDate}
                        className="inline-flex items-center justify-center rounded-full border border-black/60 bg-white/80 px-7 py-3 text-sm md:text-sm uppercase tracking-[0.2em] text-black/90 backdrop-blur-sm shadow-md hover:bg-white hover:border-black transition"
                        whileTap={{ scale: 0.96 }}
                      >
                        Save to Calendar
                      </motion.button>

                      {/* Countdown timer */}
                      <div className="mt-7 flex justify-center gap-3 md:gap-4">
                        {[
                          { label: "Days", value: timeLeft.days },
                          { label: "Hours", value: timeLeft.hours },
                          { label: "Minutes", value: timeLeft.minutes },
                          { label: "Seconds", value: timeLeft.seconds },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="w-16 md:w-20 rounded-2xl border border-black/10 bg-white/85 backdrop-blur-sm px-3 py-3 shadow-sm flex flex-col items-center justify-center"
                          >
                            <div
                              className="text-xl md:text-2xl font-semibold text-black leading-none"
                              style={{ fontFamily: fonts.subheading }}
                            >
                              {String(item.value).padStart(2, "0")}
                            </div>
                            <div
                              className="mt-1 text-[10px] md:text-xs uppercase tracking-[0.18em] text-black/70"
                              style={{ fontFamily: fonts.subheading }}
                            >
                              {item.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.section>
                )}

                {/* =========================
                    SECTION 5 – RECEPTION INFO
                   ========================= */}
                {currentSection === 4 && (
                  <motion.section
                    key="section-5"
                    className="absolute inset-0 h-dvh overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    {/* Background – from left */}
                    <motion.div
                      className="absolute inset-0 bg-cover bg-center z-0"
                      style={{
                        backgroundImage: "url('/assets/scroll5-bg.jpg')",
                      }}
                      variants={scroll5BgVariants}
                      initial="initial"
                      animate={hasOpened ? "enter" : "initial"}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />

                    {/* Lighter overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-black/0 to-black/0 z-10 pointer-events-none" />

                    {/* Wedding Day Schedule – centered */}
                    <motion.div
                      className="absolute top-10 inset-x-0 px-6 z-30 text-center flex flex-col items-center"
                      initial={{ opacity: 0, y: -20 }}
                      animate={
                        hasOpened
                          ? { opacity: 1, y: 0 }
                          : { opacity: 0, y: -20 }
                      }
                      transition={{
                        duration: 0.6,
                        ease: "easeOut",
                        delay: 0.15,
                      }}
                    >
                      {/* Title: lg */}
                      <p
                        className="text-lg tracking-[0.25em] uppercase text-white/80 mb-4"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        Wedding Day Schedule
                      </p>

                      <div className="space-y-4 w-full max-w-sm">
                        {/* Holy Matrimony */}
                        <div className="space-y-1">
                          {/* Subheading: m */}
                          <p
                            className="text-m md:text-base font-semibold text-white"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            {EVENTS.blessing.label}
                          </p>

                          {/* Everything else: m */}
                          <p
                            className="text-m md:text-base text-white/90"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            {EVENTS.blessing.dateText}
                          </p>

                          {EVENTS.blessing.timeText && (
                            <p
                              className="text-m md:text-base text-white/80"
                              style={{ fontFamily: fonts.subheading }}
                            >
                              {EVENTS.blessing.timeText}
                            </p>
                          )}

                          <p
                            className="text-m md:text-base text-white font-semibold mt-1"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            {EVENTS.blessing.venueName}
                          </p>

                          {/* Glass button */}
                          <a
                            href={EVENTS.blessing.mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 mt-2 px-4 py-2 rounded-full border border-white/60 bg-white/10 text-white text-m md:text-base font-semibold shadow-[0_10px_35px_rgba(0,0,0,0.35)] backdrop-blur-md hover:bg-white/20 transition-colors"
                            style={{ fontFamily: fonts.button }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z" />
                              <circle cx="12" cy="10" r="2.4" />
                            </svg>
                            <span>Holy Matrimony Location</span>
                          </a>
                        </div>

                        {/* Divider line */}
                        <div className="h-px w-16 mx-auto bg-white/40" />

                        {/* Reception */}
                        <div className="space-y-1">
                          {/* Subheading: m */}
                          <p
                            className="text-m md:text-base font-semibold text-white"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            {EVENTS.reception.label}
                          </p>

                          {/* Everything else: m */}
                          <p
                            className="text-m md:text-base text-white/90"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            {EVENTS.reception.dateText}
                          </p>

                          {EVENTS.reception.timeText && (
                            <p
                              className="text-m md:text-base text-white/80"
                              style={{ fontFamily: fonts.subheading }}
                            >
                              {EVENTS.reception.timeText}
                            </p>
                          )}

                          <p
                            className="text-m md:text-base text-white font-semibold mt-1"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            {EVENTS.reception.venueName}
                          </p>

                          {/* Glass button */}
                          <a
                            href={EVENTS.reception.mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 mt-2 px-4 py-2 rounded-full border border-white/60 bg-white/10 text-white text-m md:text-base font-semibold shadow-[0_10px_35px_rgba(0,0,0,0.35)] backdrop-blur-md hover:bg-white/20 transition-colors"
                            style={{ fontFamily: fonts.button }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z" />
                              <circle cx="12" cy="10" r="2.4" />
                            </svg>
                            <span>Reception Location</span>
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  </motion.section>
                )}

                {/* =========================
                    SECTION 6 – Dance
                    ========================= */}

                {currentSection === 5 && (
                  <motion.section
                    key="section-6"
                    className="absolute inset-0 h-dvh overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    {/* Background image – dance */}
                    <motion.div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: "url('/assets/scrollDance-bg.jpg')",
                      }}
                      variants={scrollDanceBgVariants}
                      initial="initial"
                      animate={hasOpened ? "enter" : "initial"}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />

                    {/* Soft gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/20 to-black/70" />

                    {/* Verse at top center */}
                    <motion.div
                      className="absolute top-10 inset-x-0 px-6 text-center z-30"
                      initial={{ opacity: 0, y: -20 }}
                      animate={
                        hasOpened
                          ? { opacity: 1, y: 0 }
                          : { opacity: 0, y: -20 }
                      }
                      transition={{
                        duration: 1.1,
                        ease: "easeOut",
                        delay: 0.3,
                      }}
                    >
                      <p
                        className="text-lg tracking-[0.25em] uppercase text-white/70 mb-3"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        Joyful &amp; Whimsical
                      </p>

                      <p
                        className="text-m md:text-[17px] leading-snug text-white/90"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        “Come dance with us as we begin
                        <br />a lifetime filled with love and laughter.”
                      </p>
                    </motion.div>

                    {/* Dancing couple – frame animation */}
                    <ScrollDanceAnimation hasOpened={hasOpened} />
                  </motion.section>
                )}

                {/* =========================
                      SECTION 7 – RSVP
                    ========================= */}
                {currentSection === 6 && (
                  <motion.section
                    key="section-7"
                    className="absolute inset-0 h-dvh overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    {/* Full-screen background image */}
                    <motion.div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: "url('/assets/scrollRSVP-bg.jpg')",
                      }}
                      initial={{ scale: 1.1, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />

                    {/* Black overlay for readability */}
                    <div className="absolute inset-0 bg-black/20" />

                    {/* Content – card centered, with extra bottom space for music button */}
                    <div className="relative z-10 flex items-center justify-center h-full px-4 pt-6 pb-24">
                      <div
                        className="w-full max-w-md max-h-full
                                  rounded-3xl
                                  border border-white/10
                                  bg-black/30
                                  backdrop-blur-sm
                                  shadow-[0_14px_40px_rgba(0,0,0,0.7)]
                                  p-5 md:p-6
                                  text-white
                                  flex flex-col
                                  overflow-y-auto"
                      >
                        {/* Title (text-lg) */}
                        <h3
                          className="text-lg md:text-xl font-semibold text-center mb-4 tracking-[0.18em] uppercase flex-shrink-0"
                          style={{ fontFamily: fonts.subheading }}
                        >
                          RSVP
                        </h3>

                        {/* Loading / error */}
                        {isLoadingGuest && (
                          <p
                            className="text-m md:text-base text-white/70 mb-2 text-center flex-shrink-0"
                            style={{ fontFamily: fonts.body }}
                          >
                            Loading guest info...
                          </p>
                        )}

                        {guestError && (
                          <p
                            className="text-m md:text-base text-red-300 mb-3 text-center flex-shrink-0"
                            style={{ fontFamily: fonts.body }}
                          >
                            {guestError}
                          </p>
                        )}

                        {/* MAIN CONTENT + WISHES share the vertical space */}
                        <div className="flex-1 flex flex-col min-h-0">
                          {/* Invitee info */}
                          <div className="mb-4 text-center flex-shrink-0">
                            <p
                              className="text-m md:text-base"
                              style={{ fontFamily: fonts.body }}
                            >
                              Invitee:{" "}
                              <span className="font-semibold">
                                {recipient.displayName}
                              </span>
                            </p>
                            {recipient.isAttending === true &&
                            recipient.numAttendeesConfirmed !== undefined ? (
                              <p
                                className="text-m md:text-base text-white/60 mt-1"
                                style={{ fontFamily: fonts.body }}
                              >
                                Confirmed guests:{" "}
                                {recipient.numAttendeesConfirmed}
                              </p>
                            ) : (
                              <p
                                className="text-m md:text-base text-white/60 mt-1"
                                style={{ fontFamily: fonts.body }}
                              >
                                Maximum guests: {recipient.maxGuests}
                              </p>
                            )}
                          </div>

                          {/* IF RSVP FILLED OR EDITING */}
                          {!isEditingRsvp && recipient.isAttending === true ? (
                            // CASE 1: Confirmed attending → thank you + (optional QR) + Edit
                            <div className="mb-4 flex-shrink-0">
                              <p
                                className="text-m md:text-base text-center text-white/80 leading-snug"
                                style={{ fontFamily: fonts.body }}
                              >
                                Thank you for confirming your attendance.
                                <br />
                                {false && canShowQr
                                  ? "Please show this QR code at the reception."
                                  : "We look forward to celebrating with you."}
                              </p>

                              {false && canShowQr && qrValue && (
                                <div className="mt-4 flex justify-center">
                                  <div className="bg-black/50 border border-white/40 rounded-2xl px-3 py-2 inline-flex flex-col items-center gap-1.5 backdrop-blur-md">
                                    <p
                                      className="text-m md:text-base tracking-[0.18em] uppercase text-white/70"
                                      style={{ fontFamily: fonts.subheading }}
                                    >
                                      Wedding Pass
                                    </p>
                                    <div className="bg-white p-1.5 rounded-md">
                                      <QRCode value={qrValue} size={160} />
                                    </div>
                                    <p
                                      className="text-m md:text-base text-white/70 mt-1"
                                      style={{ fontFamily: fonts.body }}
                                    >
                                      {recipient.displayName}
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div className="mt-5 flex justify-center">
                                <button
                                  onClick={startEditRsvp}
                                  className="px-5 py-2 rounded-full border border-white/50 text-m md:text-base text-white hover:bg-white/10 transition-colors"
                                  style={{ fontFamily: fonts.body }}
                                >
                                  Edit RSVP
                                </button>
                              </div>
                            </div>
                          ) : !isEditingRsvp &&
                            recipient.isAttending === false ? (
                            // CASE 2: RSVP filled but not attending + Edit
                            <div className="mb-4 flex-shrink-0">
                              <p
                                className="text-m md:text-base text-center text-white/80 leading-snug"
                                style={{ fontFamily: fonts.body }}
                              >
                                Thank you for letting us know.
                                <br />
                                We understand you cannot attend, and we truly
                                appreciate your wishes and prayers.
                              </p>

                              <div className="mt-5 flex justify-center">
                                <button
                                  onClick={startEditRsvp}
                                  className="px-5 py-2 rounded-full border border-white/50 text-m md:text-base text-white hover:bg-white/10 transition-colors"
                                  style={{ fontFamily: fonts.body }}
                                >
                                  Edit RSVP
                                </button>
                              </div>
                            </div>
                          ) : (
                            // CASE 3: RSVP not filled OR editing → form
                            <div className="space-y-3 mb-4 flex-shrink-0">
                              {/* Wishes (optional) */}
                              <div className="space-y-1.5">
                                <label
                                  className="text-m md:text-base text-white/80"
                                  style={{ fontFamily: fonts.body }}
                                >
                                  Your Best Wishes
                                </label>
                                <textarea
                                  name="wish"
                                  placeholder="Write your best wishes (optional)"
                                  className="w-full px-3 py-2.5 rounded-lg border border-white/30 bg-black/30 text-m md:text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/80"
                                  style={{ fontFamily: fonts.body }}
                                  rows={3}
                                  value={form.wish}
                                  onChange={handleChange}
                                />
                              </div>

                              {/* Will you attend? – pill buttons */}
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span
                                  className="text-m md:text-base text-white/80"
                                  style={{ fontFamily: fonts.body }}
                                >
                                  Will you attend?
                                </span>
                                <div className="flex gap-2 text-m md:text-base">
                                  <label
                                    className={
                                      "inline-flex items-center justify-center px-4 py-1.5 rounded-full border text-sm md:text-sm cursor-pointer transition-colors " +
                                      (form.isAttending === true
                                        ? "bg-white text-black border-white"
                                        : "border-white/40 text-white/80 bg-white/5")
                                    }
                                    style={{ fontFamily: fonts.body }}
                                  >
                                    <input
                                      type="radio"
                                      name="isAttending"
                                      value="yes"
                                      checked={form.isAttending === true}
                                      onChange={handleChange}
                                      className="sr-only"
                                    />
                                    <span>Yes</span>
                                  </label>
                                  <label
                                    className={
                                      "inline-flex items-center justify-center px-4 py-1.5 rounded-full border text-xs md:text-sm cursor-pointer transition-colors " +
                                      (form.isAttending === false
                                        ? "bg-white text-black border-white"
                                        : "border-white/40 text-white/80 bg-white/5")
                                    }
                                    style={{ fontFamily: fonts.body }}
                                  >
                                    <input
                                      type="radio"
                                      name="isAttending"
                                      value="no"
                                      checked={form.isAttending === false}
                                      onChange={handleChange}
                                      className="sr-only"
                                    />
                                    <span>No</span>
                                  </label>
                                </div>
                              </div>

                              {/* Number of guests – ONLY when attending = yes */}
                              {form.isAttending === true && (
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <span
                                    className="text-m md:text-base text-white/80"
                                    style={{ fontFamily: fonts.body }}
                                  >
                                    Number of Guests
                                  </span>
                                  <div className="flex flex-wrap gap-2 text-m md:text-base">
                                    {maxGuestsOptions.map((num) => {
                                      const selected =
                                        form.numAttendeesConfirmed === num;
                                      return (
                                        <label
                                          key={num}
                                          className={
                                            "inline-flex items-center justify-center min-w-[44px] h-9 px-3 pb-1 rounded-full border text-xl md:text-base cursor-pointer transition-colors " +
                                            (selected
                                              ? "bg-white text-black border-white"
                                              : "border-white/40 text-white/80 bg-white/5")
                                          }
                                          style={{ fontFamily: fonts.body }}
                                        >
                                          <input
                                            type="radio"
                                            name="numAttendeesConfirmed"
                                            value={num}
                                            checked={selected}
                                            onChange={handleChange}
                                            className="sr-only"
                                          />
                                          <span>{num}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <button
                                onClick={handleSubmit}
                                disabled={isSubmitDisabled}
                                className={
                                  "w-full mt-3 py-2.5 rounded-full text-m md:text-base font-semibold tracking-[0.08em] uppercase transition-colors " +
                                  (isSubmitDisabled
                                    ? "bg-white/30 text-black/40 cursor-not-allowed"
                                    : "bg-white text-black hover:bg-neutral-200")
                                }
                                style={{ fontFamily: fonts.button }}
                              >
                                Submit RSVP
                              </button>
                            </div>
                          )}

                          {/* Wishes – fills the rest of the card and scrolls if needed */}
                          <div className="mt-3 flex-1 min-h-0 flex flex-col">
                            <h4
                              className="text-lg md:text-lg font-semibold mb-2 text-white flex-shrink-0"
                              style={{ fontFamily: fonts.subheading }}
                            >
                              Wishes
                            </h4>
                            {wishes.length === 0 ? (
                              <p
                                className="text-m md:text-base text-white/70 italic flex-shrink-0"
                                style={{ fontFamily: fonts.body }}
                              >
                                💌 Be the first to send a wish
                              </p>
                            ) : (
                              <ul className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                                {wishes.map((w) => (
                                  <li
                                    key={w.id}
                                    className="bg-white/5 border border-white/15 p-2.5 rounded-lg"
                                  >
                                    <p
                                      className="text-m md:text-base italic text-white/90"
                                      style={{ fontFamily: fonts.body }}
                                    >
                                      "{w.wish}"
                                    </p>
                                    <p
                                      className="text-m md:text-base text-right text-white/60 mt-1"
                                      style={{ fontFamily: fonts.body }}
                                    >
                                      — {w.name}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.section>
                )}

                {/* =========================
                    SECTION 8 – Wedding Gift
                  ========================= */}
                {currentSection === 7 && (
                  <motion.section
                    key="section-8"
                    className="absolute inset-0 h-dvh overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    {/* Full-screen background image – SAME as RSVP */}
                    <motion.div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: "url('/assets/scrollRSVP-bg.jpg')",
                      }}
                      initial={{ scale: 1.1, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />

                    {/* Black overlay for readability */}
                    <div className="absolute inset-0 bg-black/20" />

                    {/* Content – same layout as RSVP card, above music button */}
                    <div className="relative z-10 flex items-center justify-center h-full px-4 pt-6 pb-24">
                      <div
                        className="w-full max-w-md max-h-full
                                  rounded-3xl
                                  border border-white/10
                                  bg-black/30
                                  backdrop-blur-sm
                                  shadow-[0_14px_40px_rgba(0,0,0,0.7)]
                                  p-5 md:p-6
                                  text-white
                                  flex flex-col
                                  overflow-y-auto"
                      >
                        {/* Title */}
                        <h3
                          className="text-lg md:text-xl font-semibold text-center mb-4 tracking-[0.18em] uppercase flex-shrink-0"
                          style={{ fontFamily: fonts.subheading }}
                        >
                          Wedding Gift
                        </h3>

                        {/* Intro text */}
                        <div className="mb-4 text-center flex-shrink-0">
                          <p
                            className="text-m md:text-base text-white/80 leading-relaxed"
                            style={{ fontFamily: fonts.body }}
                          >
                            Your presence at our wedding is the greatest gift.
                            <br />
                            However, if you would like to share a blessing in
                            the form of a gift, you may send it through the
                            account details below.
                          </p>
                        </div>

                        {/* Main content – accounts inside the glass card */}
                        <div className="flex-1 flex flex-col gap-3 min-h-0">
                          {/* Bride account */}
                          <div
                            className="rounded-2xl border border-white/15 bg-white/5
                       px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                          >
                            <p
                              className="text-lg md:text-xl text-white mb-1"
                              style={{ fontFamily: fonts.coupleName }}
                            >
                              {COUPLE.bride.fullName}
                            </p>
                            <p
                              className="text-m md:text-base text-white/80"
                              style={{ fontFamily: fonts.body }}
                            >
                              Bank: <span className="font-semibold">BCA</span>
                            </p>

                            {/* Account + copy button */}
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <span
                                className="text-m md:text-base text-white/80"
                                style={{ fontFamily: fonts.body }}
                              >
                                Account No:{" "}
                                <span className="font-mono tracking-[0.18em] text-white">
                                  {formatNorek(COUPLE.bride.norek)}
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(COUPLE.bride.norek)}
                                className="shrink-0 inline-flex items-center justify-center px-3 py-1.5 rounded-full border border-white/50 bg-white/10 text-[11px] md:text-xs uppercase tracking-[0.16em] hover:bg-white/20 transition-colors"
                                style={{ fontFamily: fonts.button }}
                              >
                                Copy
                              </button>
                            </div>
                          </div>

                          {/* Groom account */}
                          <div
                            className="rounded-2xl border border-white/15 bg-white/5
                       px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                          >
                            <p
                              className="text-lg md:text-xl text-white mb-1"
                              style={{ fontFamily: fonts.coupleName }}
                            >
                              {COUPLE.groom.fullName}
                            </p>
                            <p
                              className="text-m md:text-base text-white/80"
                              style={{ fontFamily: fonts.body }}
                            >
                              Bank: <span className="font-semibold">BCA</span>
                            </p>

                            {/* Account + copy button */}
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <span
                                className="text-m md:text-base text-white/80"
                                style={{ fontFamily: fonts.body }}
                              >
                                Account No:{" "}
                                <span className="font-mono tracking-[0.18em] text-white">
                                  {formatNorek(COUPLE.groom.norek)}
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(COUPLE.groom.norek)}
                                className="shrink-0 inline-flex items-center justify-center px-3 py-1.5 rounded-full border border-white/50 bg-white/10 text-[11px] md:text-xs uppercase tracking-[0.16em] hover:bg-white/20 transition-colors"
                                style={{ fontFamily: fonts.button }}
                              >
                                Copy
                              </button>
                            </div>
                          </div>

                          {/* Small note at bottom of card */}
                          <p
                            className="mt-2 text-center text-[11px] md:text-xs text-white/60 flex-shrink-0"
                            style={{ fontFamily: fonts.body }}
                          >
                            Thank you for sharing your love, prayers, and
                            kindness as we begin this new journey together.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.section>
                )}

                {/* =========================
                    SECTION 9 – Gallery
                   ========================= */}
                {currentSection === 8 && (
                  <motion.section
                    key="section-9"
                    className="absolute inset-0 h-dvh overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    {/* Full-screen background image for gallery */}
                    <motion.div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: "url('/assets/scrollGallery-bg.jpg')",
                      }}
                      initial={{ scale: 1.1, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />

                    {/* Dark overlay for readability */}
                    <div className="absolute inset-0 bg-black/35" />

                    <div className="relative flex flex-col h-full z-10">
                      {/* Title area */}
                      <div className="pt-8 pb-4 flex flex-col items-center">
                        <h2
                          className="text-3xl text-white"
                          style={{ fontFamily: "'Dancing Script', cursive" }}
                        >
                          Our Moments
                        </h2>
                      </div>

                      {/* Glassy collage card */}
                      <div className="flex-1 px-4 pb-24 flex items-stretch">
                        <div
                          className="w-full max-w-md mx-auto rounded-3xl
                                    border border-white/10
                                    bg-black/30
                                    backdrop-blur-sm
                                    shadow-[0_14px_40px_rgba(0,0,0,0.7)]
                                    p-3 md:p-4 overflow-hidden
                                    flex flex-col h-full" // ⬅️ added flex + h-full
                        >
                          <OurMomentsGallery
                          // onModalChange={setIsGalleryModalOpen}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.section>
                )}

                {/* =========================
                    SECTION 10 – Verse & Couple
                    ========================= */}
                {currentSection === 9 && (
                  <motion.section
                    key="section-10"
                    className="absolute inset-0 h-dvh overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    {/* Background image with scroll5 animation */}
                    <motion.div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: "url('/assets/scroll6-bg.jpg')",
                      }}
                      variants={scroll6BgVariants}
                      initial="initial"
                      animate={hasOpened ? "enter" : "initial"}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />

                    {/* Soft gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/20 to-black/80" />

                    {/* Verse at top center */}
                    <motion.div
                      className="absolute top-10 inset-x-0 px-6 text-center"
                      initial={{ opacity: 0, y: -20 }}
                      animate={
                        hasOpened
                          ? { opacity: 1, y: 0 }
                          : { opacity: 0, y: -20 }
                      }
                      transition={{
                        duration: 1.1,
                        ease: "easeOut",
                        delay: 0.3,
                      }}
                    >
                      <p
                        className="text-lg tracking-[0.25em] uppercase text-white/70 mb-3"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        Thank You
                      </p>

                      <p
                        className="text-m md:text-[17px] leading-snug text-white/90"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        “Your presence is our greatest gift,
                        <br />
                        and your prayers are our greatest blessing.”
                      </p>
                    </motion.div>

                    {/* Couple with scroll5 subject animation */}
                    <div className="absolute inset-0 flex justify-center items-center">
                      <motion.img
                        src="/assets/scroll6-couple.png"
                        alt="Bride and Groom"
                        className="max-h-[75vh] w-auto object-contain"
                        variants={scroll6SubjectVariants}
                        initial="initial"
                        animate={hasOpened ? "enter" : "initial"}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* COVER overlay - phone-only, must click to open */}
          <AnimatePresence>
            {!hasOpened && (
              <motion.div
                key="cover"
                className="absolute inset-0 z-40 flex items-stretch justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              >
                {/* Background */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: "url('/assets/main.jpg')",
                    backgroundSize: "100%",
                    backgroundPosition: "0% 0%",
                  }}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />

                {/* QR shortcut button – ONLY on cover, top-right */}
                {true && canShowQr && qrValue && (
                  <>
                    <button
                      onClick={() => setShowCoverQr(true)}
                      className="absolute top-6 right-6 z-50 rounded-full bg-black/70 backdrop-blur-sm border border-white/40 shadow-lg p-2.5 flex items-center justify-center active:scale-95 transition-transform"
                      aria-label="Show RSVP QR code"
                    >
                      <div className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-5 h-5"
                          fill="none"
                          stroke="white"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="3" width="7" height="7" rx="1.5" />
                          <rect x="14" y="3" width="7" height="7" rx="1.5" />
                          <rect x="3" y="14" width="7" height="7" rx="1.5" />
                          <path d="M14 14h3v3h-3z" />
                          <path d="M18 18h3v3" />
                          <path d="M14 21v-2" />
                        </svg>
                      </div>
                    </button>

                    {/* QR Modal on cover */}
                    <AnimatePresence>
                      {showCoverQr && (
                        <motion.div
                          className="absolute inset-0 z-50 flex items-center justify-center bg-black/60"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          onClick={() => setShowCoverQr(false)}
                        >
                          <motion.div
                            className="bg-white rounded-2xl px-5 py-4 max-w-xs w-[85%] shadow-2xl relative"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setShowCoverQr(false)}
                              className="absolute top-2 right-2 text-neutral-400 hover:text-neutral-700"
                              aria-label="Close"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>

                            <p
                              className="text-[13px] text-center text-neutral-700 mb-3 leading-snug"
                              style={{ fontFamily: fonts.body }}
                            >
                              Please show this QR code at the reception.
                            </p>

                            <div className="flex justify-center">
                              <div className="bg-white border border-black/60 rounded-xl px-3 py-2 inline-flex flex-col items-center gap-1.5">
                                <p
                                  className="text-[11px] tracking-[0.18em] uppercase text-neutral-500"
                                  style={{ fontFamily: fonts.subheading }}
                                >
                                  Wedding Pass
                                </p>

                                <div className="bg-white p-1.5 rounded-md">
                                  <QRCode value={qrValue} size={160} />
                                </div>

                                <p
                                  className="text-[10px] text-neutral-500 mt-1"
                                  style={{ fontFamily: fonts.body }}
                                >
                                  {recipient.displayName}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {/* Main cover content */}
                <div className="relative z-10 w-full h-full px-6 pt-18 pb-12 text-center flex flex-col justify-between">
                  {/* TOP: Wedding of + names + date */}
                  <div>
                    <p
                      className="text-sm md:text-base tracking-[0.28em] uppercase text-black/70 mb-2"
                      style={{ fontFamily: fonts.subheading }}
                    >
                      The Wedding of
                    </p>
                    <h1
                      className="text-5xl mb-2 text-black"
                      style={{ fontFamily: fonts.coupleName }}
                    >
                      {COUPLE.groom.shortName} &amp; {COUPLE.bride.shortName}
                    </h1>
                    <p
                      className="text-sm md:text-base text-black/80"
                      style={{ fontFamily: fonts.subheading }}
                    >
                      {EVENTS.reception.dateText}
                    </p>
                  </div>

                  {/* BOTTOM: recipient + button */}
                  <div>
                    <p
                      className="text-[11px] md:text-xs tracking-[0.26em] uppercase text-black/70 mb-1"
                      style={{ fontFamily: fonts.recipient }}
                    >
                      Kepada Yth. Bapak/Ibu/Saudara/i
                    </p>
                    <p
                      className="text-xl md:text-2xl text-black mb-6"
                      style={{ fontFamily: fonts.recipient }}
                    >
                      {recipient.displayName}
                    </p>

                    {/* Glass-like button only (same vibe as QR shortcut) */}
                    <motion.button
                      onClick={handleOpen}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      className="mx-auto inline-flex items-center justify-center rounded-full bg-black/70 backdrop-blur-sm border border-white/40 shadow-lg px-8 py-3 text-[11px] md:text-sm tracking-[0.22em] uppercase text-white font-bold"
                      style={{ fontFamily: fonts.button }}
                    >
                      <span className="leading-none">Open Invitation</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* RSVP Success Modal */}
      <AnimatePresence>
        {showRsvpModal && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            onClick={() => setShowRsvpModal(false)}
          >
            <motion.div
              className="bg-black/70 border border-white/20 rounded-2xl px-5 py-4 max-w-xs w-[85%] shadow-2xl text-center text-white backdrop-blur-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <p
                className="text-m md:text-base mb-3 leading-snug"
                style={{ fontFamily: fonts.body }}
              >
                {rsvpModalMessage || "Thank you! Your RSVP has been recorded."}
              </p>
              <button
                onClick={() => setShowRsvpModal(false)}
                className="mt-1 px-5 py-2 rounded-full border border-white/50 text-m md:text-base text-white hover:bg-white/10 transition-colors"
                style={{ fontFamily: fonts.body }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global overlay for music button + scroll-down arrows aligned to phone */}
      {isLoaded && hasOpened && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative max-w-[480px] w-full h-dvh pointer-events-none">
            {/* Bottom-left: Section navigation icon button */}
            <div className="absolute left-4 bottom-6.5 pointer-events-auto z-50">
              <button
                type="button"
                onClick={() => setIsSectionMenuOpen((open) => !open)}
                className="w-13 h-13 rounded-full bg-black/70 border border-white/40 shadow-lg backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
                aria-label="Open section navigation"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="white"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                >
                  <line x1="3" y1="7" x2="21" y2="7" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="17" x2="21" y2="17" />
                </svg>
              </button>
            </div>

            {/* Section menu overlay – closes when clicking outside */}
            <AnimatePresence>
              {isSectionMenuOpen && (
                <motion.div
                  key="section-menu-overlay"
                  className="absolute inset-0 pointer-events-auto z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  onClick={() => setIsSectionMenuOpen(false)}
                >
                  {/* Menu card, positioned above the nav button */}
                  <motion.div
                    className="absolute left-4 bottom-21"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    onClick={(e) => e.stopPropagation()} // don't close when clicking inside card
                  >
                    <div className="max-h w-48 rounded-2xl border border-white/25 bg-black/75 backdrop-blur-md shadow-[0_14px_40px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col">
                      {sectionLabels.map((sec) => {
                        const isActive = sec.index === currentSection;
                        return (
                          <button
                            key={sec.index}
                            type="button"
                            onClick={() => {
                              setIsSectionMenuOpen(false);
                              scrollToSection(sec.index);
                            }}
                            className={
                              "w-full text-left px-3.5 py-2.5 text-[11px] md:text-xs flex items-center gap-2 border-b border-white/10 last:border-b-0 transition-colors " +
                              (isActive
                                ? "bg-white/15 text-white"
                                : "bg-transparent text-white/80 hover:bg-white/10")
                            }
                            style={{ fontFamily: fonts.body }}
                          >
                            <span className="inline-flex items-center justify-center w-5 h-5 pb-0.5 rounded-full border border-white/40 text-[10px] leading-none">
                              {sec.index + 1}
                            </span>

                            <span className="truncate">{sec.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Music button (always visible once opened, including last section) */}
            <div className="absolute inset-x-0 bottom-2.5 flex justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <MusicToggle
                  isPlaying={isMusicPlaying}
                  onToggle={toggleMusic}
                />
              </div>
            </div>

            {/* Arrows OR credit (depending on section) */}
            {currentSection !== totalSections - 1 ? (
              // Not last section → show arrows + auto-scroll pill
              <div
                className={
                  "absolute inset-x-0 flex flex-col items-center pointer-events-none " +
                  (isAutoScrollOn ? "bottom-4" : "bottom-7")
                }
              >
                {/* Arrows */}
                {[0, 1].map((i) => (
                  <div key={i} className={i === 0 ? "" : "-mt-3"}>
                    <svg
                      className="w-7 h-7 animate-bounce"
                      style={{ animationDelay: `${i * 120}ms` }}
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M4 16l8-8 8 8"
                        stroke="white"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </div>
                ))}

                {/* Small auto-scroll pill under the arrows */}
                {isAutoScrollOn && (
                  <div className="mt-1 pointer-events-none">
                    <span
                      className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full border border-white/40 bg-black/60 text-[9px] md:text-[10px] uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm"
                      style={{ fontFamily: fonts.button }}
                    >
                      Auto scroll
                    </span>
                  </div>
                )}
              </div>
            ) : (
              // Last section → show credit pill instead of arrows
              <div className="absolute inset-x-0 bottom-9 flex justify-center pointer-events-none">
                <a
                  href="https://wa.me/6282124480308?text=Hi%20Hendry"
                  target="_blank"
                  rel="noreferrer"
                  className="pointer-events-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/35 bg-black/65 text-[9px] md:text-[10px] uppercase tracking-[0.18em] text-white/85 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:bg-black/80 transition-colors"
                  style={{ fontFamily: fonts.button }}
                >
                  <span className="text-[10px]">Crafted by</span>
                  <span className="font-semibold">HW</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
