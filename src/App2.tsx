import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";

const API_URL = "https://rest.trip-nus.com"; // adjust if needed

// Minimum loading duration (ms)
const MIN_LOADING_DURATION_MS = 3000;

// Keep the pulsing animation in sync between circle, HF text, and line
export const LOADER_PULSE_DURATION = 1.8;

// Frame duration for scroll 4 dance animation
const FRAME_DURATION = 200; // ms per frame

// =========================
// Music
// =========================

const MUSIC_SRC = "/assets/you-are-the-reason.mp3";

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

type Scroll4DanceAnimationProps = {
  hasOpened: boolean;
};

type OurMomentsGalleryProps = {
  onModalChange?: (open: boolean) => void; // to hide music + arrows
};

// =========================
// Wedding Constants
// =========================

const COUPLE = {
  bride: {
    fullName: "Finna Widyanti",
    shortName: "Finna",
    fatherName: "Mr. Peng Cheong",
    motherName: "Mrs. Marijani",
    instagram: "finnawidy",
  },
  groom: {
    fullName: "Haryanto Kartawijaya",
    shortName: "Haryanto",
    fatherName: "Mr. Liauw Sui Kian",
    motherName: "Mrs. Tan Siok Mei",
    instagram: "haryantokartawijaya",
  },
};

const EVENTS = {
  reception: {
    label: "Reception",
    dateText: "Saturday, 07 February 2026",
    timeText: "18.00 WIB",
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
  heading: "'Dancing Script', cursive", // main names / big titles
  subheading: "'Cormorant Garamond', serif", // “The Wedding of”, date, etc.
  recipient: "'Cormorant Garamond', serif",
  button: "'Cormorant Garamond', serif",
  body: "'Cormorant Garamond', serif",
};

// Images to preload (add more as you use more assets)
const IMAGE_URLS = [
  "/assets/main.jpg",
  "/assets/scroll1-bg.jpg",
  "/assets/scroll1-couple.png",
  "/assets/scroll23-bg.jpg",
  "/assets/scroll23-couple.png",
  "/assets/scroll5-bg.jpg",
  "/assets/scroll5-couple.png",
  "/assets/scroll6-bg.jpg",
  "/assets/gal1.jpg",
  "/assets/gal2.jpg",
  "/assets/gal3.jpg",
  "/assets/gal4.jpg",
  "/assets/gal5.jpg",
  "/assets/gal6.jpg",
];

const SCROLL4_FRAMES = [
  "/assets/scroll4-dance1.png",
  "/assets/scroll4-dance2.png",
  "/assets/scroll4-dance3.png",
  "/assets/scroll4-dance4.png",
  "/assets/scroll4-dance5.png",
  "/assets/scroll4-dance6.png",
  "/assets/scroll4-dance7.png",
  "/assets/scroll4-dance8.png",
];

const ourMomentsImages = [
  { src: "/assets/gal1.jpg", span: 8, animation: "left" },
  { src: "/assets/gal2.jpg", span: 3, animation: "left" },
  { src: "/assets/gal3.jpg", span: 5, animation: "right" },
  { src: "/assets/gal4.jpg", span: 8, animation: "left" },
  { src: "/assets/gal5.jpg", span: 4, animation: "left" },
  { src: "/assets/gal6.jpg", span: 4, animation: "right" },
];

const PRELOAD_URLS = [...IMAGE_URLS, ...SCROLL4_FRAMES];

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

const Scroll4DanceAnimation: React.FC<Scroll4DanceAnimationProps> = ({
  hasOpened,
}) => {
  const [frameIndex, setFrameIndex] = React.useState(0);
  const [direction, setDirection] = React.useState<1 | -1>(1);

  React.useEffect(() => {
    if (!hasOpened) return;

    const last = SCROLL4_FRAMES.length - 1;

    const interval = window.setInterval(() => {
      setFrameIndex((prev) => {
        // right edge → go backward
        if (direction === 1 && prev === last) {
          setDirection(-1);
          return last - 1;
        }

        // left edge → go forward
        if (direction === -1 && prev === 0) {
          setDirection(1);
          return 1;
        }

        return prev + direction;
      });
    }, FRAME_DURATION);

    return () => window.clearInterval(interval);
  }, [hasOpened, direction]);

  return (
    <div className="absolute inset-0 flex items-end justify-center z-20 pb-6">
      {/* 1) Subject entrance motion (from your scroll4SubjectVariants) */}
      <motion.div
        variants={scroll4SubjectVariants}
        initial="initial"
        animate={hasOpened ? "enter" : "initial"}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        {/* 2) Looping float / sway motion */}
        <motion.div
          animate={{ y: [0, 0, 0] }} // subtle float
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        >
          {/* 3) Actual frame animation (no motion here, just image swap) */}
          <img
            src={SCROLL4_FRAMES[frameIndex]}
            alt="Dancing couple"
            className="h-[70vh] w-auto object-contain"
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

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

  const getSpanClass = (span: number = 8) => `col-span-${span}`;

  return (
    <>
      {/* grid only, no second "Our Moments" title */}
      <section className="space-y-4">
        <div className="grid grid-cols-8 gap-2">
          {ourMomentsImages.map((img, idx) => {
            const spanClass = getSpanClass(img.span);
            const fromX = img.animation === "left" ? -80 : 80;

            return (
              <div
                key={img.src}
                className={`${spanClass} overflow-hidden rounded-xl`}
              >
                <motion.div
                  initial={{ opacity: 0, x: fromX }}
                  whileInView={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.04 }}
                  transition={{ duration: 0.4 }}
                  viewport={{ once: true, amount: 0.2 }}
                  className="cursor-pointer"
                  onClick={() => openModal(idx)}
                >
                  <img
                    src={img.src}
                    alt={`Our moment ${idx + 1}`}
                    className="w-full h-32 sm:h-40 object-cover grayscale-[20%]"
                  />
                </motion.div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center touch-none w-screen h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 text-white text-3xl z-50"
            >
              ✕
            </button>

            {/* DESKTOP: left / right side arrows (middle vertically) */}
            <button
              onClick={prev}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer items-center justify-center px-2 py-2"
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

            <button
              onClick={next}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer items-center justify-center px-2 py-2"
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
            <div className="flex justify-center items-center w-full h-dvh px-4">
              <motion.img
                key={ourMomentsImages[activeIndex].src}
                src={ourMomentsImages[activeIndex].src}
                alt="Fullscreen"
                className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl mx-auto object-contain"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -100) next();
                  else if (info.offset.x > 100) prev();
                }}
                onDrag={(_, info) => {
                  if (info.offset.y > 100) closeModal();
                }}
              />
            </div>

            {/* MOBILE: bottom arrows only (no circle, double arrow style) */}
            <div className="absolute inset-x-0 bottom-16 flex flex-col items-center md:hidden">
              {/* optional text */}
              {/* <p className="text-[11px] text-white/90 mb-2 tracking-[0.18em] uppercase">
                Swipe or tap arrows
              </p> */}
              <div className="flex items-center gap-10">
                {/* Left side (tap to previous) */}
                <button
                  type="button"
                  onClick={prev}
                  className="flex items-center gap-1 active:scale-95"
                >
                  {[0, 1].map((i) => (
                    <div
                      key={`mobile-left-${i}`}
                      className={i === 0 ? "" : "-ml-2"}
                    >
                      <svg
                        className="w-7 h-7 animate-bounce"
                        style={{
                          animationDelay: `${i * 120}ms`,
                          filter: "drop-shadow(0 0 4px rgba(0,0,0,0.9))",
                        }}
                        viewBox="0 0 24 24"
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
                    </div>
                  ))}
                </button>

                {/* Right side (tap to next) */}
                <button
                  type="button"
                  onClick={next}
                  className="flex items-center gap-1 active:scale-95"
                >
                  {[0, 1].map((i) => (
                    <div
                      key={`mobile-right-${i}`}
                      className={i === 0 ? "" : "-ml-2"}
                    >
                      <svg
                        className="w-7 h-7 animate-bounce"
                        style={{
                          animationDelay: `${i * 120}ms`,
                          filter: "drop-shadow(0 0 4px rgba(0,0,0,0.9))",
                        }}
                        viewBox="0 0 24 24"
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
                    </div>
                  ))}
                </button>
              </div>
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
// Motion variants – Scroll 2 (Bride)
// =========================

// BG: smooth, slight zoom + slide in, but NO fade from black
const scroll2BgVariants = {
  initial: { scale: 2, x: -120, y: 80, opacity: 1 },
  enter: { scale: 1.5, x: 0, y: -160, opacity: 1 },
};

// =========================
// Shared couple variants – Sections 2 & 3
// =========================

const couple23Variants = {
  hidden: {
    opacity: 1,
    x: -300, // left
    y: 200, // bottom
    scale: 2,
  },
  bride: {
    opacity: 1,
    x: -70, // right side
    y: -150,
    scale: 2,
  },
  groom: {
    opacity: 1,
    x: -250, // left side
    y: -150,
    scale: 2,
  },
};

// =========================
// Motion variants – Scroll 4 (Reception)
// =========================

const scroll4BgVariants = {
  initial: { scale: 2, x: -120, y: 80, opacity: 1 },
  enter: { scale: 1.5, x: 0, y: -160, opacity: 1 },
};

const scroll4SubjectVariants = {
  initial: { opacity: 1, x: -200, y: 80, scale: 2 },
  enter: { opacity: 1, x: -35, y: -190, scale: 2 },
};

// =========================
// Motion variants – Scroll 5 (Reception)
// =========================

const scroll5BgVariants = {
  initial: { scale: 2, x: 120, y: 80, opacity: 1 },
  enter: { scale: 1, x: 0, y: 0, opacity: 1 },
};

const scroll5SubjectVariants = {
  initial: { opacity: 0, x: 220, y: 80, scale: 2 },
  enter: { opacity: 1, x: 0, y: 0, scale: 1.35 },
};

// =========================
// Motion variants – Scroll 6 (Save the Date / Countdown)
// =========================

const scroll6BgVariants = {
  initial: { scale: 2, x: -40, y: 120, opacity: 1 },
  enter: { scale: 1.5, x: -40, y: -180, opacity: 1 },
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
  const totalSections = 8;

  // Modal
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

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
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Dancing+Script&display=swap";
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
    const loadWishesForGuest = (id: string, displayName: string) => {
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
                : 1,
          });

          // Load wishes list for this guest (this guest prioritized by backend)
          if (guest.id) {
            loadWishesForGuest(guest.id, displayName);
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
      const currentY = e.touches[0].clientY;
      const diffY = currentY - touchStartY; // positive when swiping down

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
      setForm((prev) => ({
        ...prev,
        isAttending: value === "yes" ? true : value === "no" ? false : null,
      }));
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

    if (!form.name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (form.isAttending === null) {
      alert("Please let us know if you will attend.");
      return;
    }

    if (!form.wish.trim()) {
      alert("Please write your best wishes.");
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

    // Update wishes list locally:
    // - For backend guests: remove old wish for this guest.id, then prepend new wish
    // - For non-backend: just prepend with a local id
    if (form.wish.trim()) {
      if (recipient.mode === "backend" && recipient.id) {
        const guestId = recipient.id;
        setWishes((prev) => {
          const filtered = prev.filter((w) => w.id !== guestId);
          return [
            {
              id: guestId,
              name: form.name.trim(),
              wish: form.wish.trim(),
            },
            ...filtered,
          ];
        });
      } else {
        const localId = `local-${Date.now()}`;
        setWishes((prev) => [
          {
            id: localId,
            name: form.name.trim(),
            wish: form.wish.trim(),
          },
          ...prev,
        ]);
      }
    }

    // Update local recipient state
    setRecipient((prev) => ({
      ...prev,
      isAttending: form.isAttending,
      numAttendeesConfirmed: numAttendeesForSubmit,
      wish: form.wish.trim(),
    }));

    // Send to backend if backend guest
    if (recipient.mode === "backend" && recipient.id) {
      fetch(`${API_URL}/guests/${recipient.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_attending: form.isAttending, // yes/no/null
          num_attendees_confirmed: numAttendeesForSubmit,
          wish: form.wish.trim(),
          name: form.name.trim(),
        }),
      }).catch((err) => {
        console.error("Failed to submit RSVP to backend", err);
      });
    }

    alert("Thank you! Your RSVP has been recorded.");
    setIsEditingRsvp(false);
  };

  // -------------------------
  // Render
  // -------------------------

  const maxGuestsOptions = Array.from(
    { length: recipient.maxGuests },
    (_, i) => i + 1
  );

  // show QR only if backend guest + isAttending === true
  const canShowQr =
    recipient.mode === "backend" &&
    !!recipient.id &&
    recipient.isAttending === true;

  const qrValue =
    recipient.mode === "backend" && recipient.id ? recipient.id : "";

  return (
    <div className="w-full h-dvh flex items-center justify-center bg-black/5 relative">
      {/* Loader overlay with fade-out */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key="loader"
            className="absolute inset-0 z-50 flex items-center justify-center bg-black"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <div className="flex flex-col items-center gap-6">
              <motion.div
                className="w-28 h-28 md:w-32 md:h-32 rounded-full border border-white/40 flex items-center justify-center"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{
                  duration: LOADER_PULSE_DURATION,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <motion.span
                  className="text-4xl md:text-5xl font-bold text-white"
                  style={{ fontFamily: fonts.heading, letterSpacing: "0.08em" }}
                  animate={{
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    duration: LOADER_PULSE_DURATION,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  HF
                </motion.span>
              </motion.div>
              <div className="flex flex-col items-center gap-1">
                <span
                  className="text-m md:text-base tracking-[0.25em] uppercase text-white/80 font-bold"
                  style={{ fontFamily: fonts.subheading }}
                >
                  LOADING
                </span>
                <span
                  className="text-m md:text-base tracking-[0.25em] uppercase text-white/80 font-bold"
                  style={{ fontFamily: fonts.subheading }}
                >
                  INVITATION
                </span>
                <motion.div
                  className="h-px w-24 bg-white/30 mt-2"
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
            </div>
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
                        className="text-xs tracking-[0.25em] uppercase text-white/70 mb-3"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        Our Journey
                      </p>
                      <p
                        className="text-sm md:text-[17px] leading-snug text-white/90"
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
                      variants={scroll2BgVariants}
                      initial="initial"
                      animate={hasOpened ? "enter" : "initial"}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />

                    {/* Soft gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/80 z-10 pointer-events-none" />

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
                          key="bride-text"
                          className="absolute top-10 left-6 right-28 z-30 text-left"
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{
                            duration: 0.4,
                            ease: "easeOut",
                          }}
                        >
                          <p
                            className="text-xs tracking-[0.25em] uppercase text-white/70 mb-2"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            The Bride
                          </p>

                          <p
                            className="text-3xl md:text-4xl text-white mb-2"
                            style={{ fontFamily: fonts.heading }}
                          >
                            {COUPLE.bride.fullName}
                          </p>

                          <p
                            className="text-sm md:text-base text-white/80 mb-2"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            Daughter of{" "}
                            <span className="font-semibold">
                              {COUPLE.bride.fatherName}
                            </span>{" "}
                            &amp;{" "}
                            <span className="font-semibold">
                              {COUPLE.bride.motherName}
                            </span>
                          </p>

                          <p
                            className="text-sm md:text-base text-white/70"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            Instagram:{" "}
                            <a
                              href={`https://instagram.com/${COUPLE.bride.instagram}`}
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-2"
                            >
                              @{COUPLE.bride.instagram}
                            </a>
                          </p>
                        </motion.div>
                      )}

                      {currentSection === 2 && (
                        <motion.div
                          key="groom-text"
                          className="absolute top-10 left-28 right-6 z-30 text-right"
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{
                            duration: 0.4,
                            ease: "easeOut",
                          }}
                        >
                          <p
                            className="text-xs tracking-[0.25em] uppercase text-white/70 mb-2"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            The Groom
                          </p>

                          <p
                            className="text-3xl md:text-4xl text-white mb-2"
                            style={{ fontFamily: fonts.heading }}
                          >
                            {COUPLE.groom.fullName}
                          </p>

                          <p
                            className="text-sm md:text-base text-white/80 mb-2"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            Son of{" "}
                            <span className="font-semibold">
                              {COUPLE.groom.fatherName}
                            </span>{" "}
                            &amp;{" "}
                            <span className="font-semibold">
                              {COUPLE.groom.motherName}
                            </span>
                          </p>

                          <p
                            className="text-sm md:text-base text-white/70"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            Instagram:{" "}
                            <a
                              href={`https://instagram.com/${COUPLE.groom.instagram}`}
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-2"
                            >
                              @{COUPLE.groom.instagram}
                            </a>
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.section>
                )}

                {/* =========================
                    SECTION 4 – RECEPTION INFO
                   ========================= */}
                {currentSection === 3 && (
                  <motion.section
                    key="section-3"
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
                        backgroundImage: "url('/assets/scroll4-bg.jpg')",
                      }}
                      variants={scroll4BgVariants}
                      initial="initial"
                      animate={hasOpened ? "enter" : "initial"}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />

                    {/* Light gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-black/10 to-black/20 z-10 pointer-events-none" />

                    {/* Couple “GIF” – centered */}
                    <Scroll4DanceAnimation hasOpened={hasOpened} />

                    {/* Reception text – top left, DARK text */}
                    <motion.div
                      className="absolute top-10 left-6 right-10 z-30 text-left"
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
                      <p
                        className="text-2xl md:text-3xl text-slate-900 mb-2"
                        style={{ fontFamily: fonts.heading }}
                      >
                        Wedding Reception
                      </p>

                      <div className="space-y-1 mb-3">
                        <p
                          className="text-sm md:text-base text-slate-800"
                          style={{ fontFamily: fonts.subheading }}
                        >
                          {EVENTS.reception.dateText}
                        </p>
                        {EVENTS.reception.timeText && (
                          <p
                            className="text-sm md:text-base text-slate-700"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            {EVENTS.reception.timeText}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1 mb-4">
                        <p
                          className="text-sm md:text-base text-slate-900 font-semibold"
                          style={{ fontFamily: fonts.subheading }}
                        >
                          {EVENTS.reception.venueName}
                        </p>
                        <p
                          className="text-xs md:text-sm text-slate-700"
                          style={{ fontFamily: fonts.body }}
                        >
                          {EVENTS.reception.locationText}
                        </p>
                      </div>

                      {/* Google Maps button – light/outlined */}
                      <a
                        href={EVENTS.reception.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 border border-slate-900/60 text-slate-900 text-xs md:text-sm font-semibold shadow-md backdrop-blur-sm hover:bg-white hover:border-slate-900 transition-colors"
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
                          <circle cx="12" cy="10" r="2.5" />
                        </svg>
                        <span>Open in Google Maps</span>
                      </a>
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
                    {/* Background image with scroll5 animation */}
                    <motion.div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: "url('/assets/scroll5-bg.jpg')",
                      }}
                      variants={scroll5BgVariants}
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
                        className="text-xs tracking-[0.25em] uppercase text-white/70 mb-3"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        With Love &amp; Gratitude
                      </p>

                      <p
                        className="text-sm md:text-[17px] leading-snug text-white/90"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        “Your presence is our greatest gift,
                        <br />
                        and your prayers our greatest blessing.”
                      </p>
                    </motion.div>

                    {/* Couple with scroll5 subject animation */}
                    <div className="absolute inset-0 flex justify-center items-center">
                      <motion.img
                        src="/assets/scroll5-couple.png"
                        alt="Bride and Groom"
                        className="max-h-[75vh] w-auto object-contain"
                        variants={scroll5SubjectVariants}
                        initial="initial"
                        animate={hasOpened ? "enter" : "initial"}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                  </motion.section>
                )}

                {/* =========================
                    SECTION 6 – SAVE THE DATE + COUNTDOWN
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
                    {/* Background from bottom */}
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

                    {/* Soft dark gradient for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-black/20 to-black/40" />

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
                      <p
                        className="text-xs tracking-[0.25em] uppercase text-white/70 mb-2"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        Save the Date
                      </p>

                      <p
                        className="text-sm md:text-[16px] text-white/90 mb-2"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        Countdown to our wedding reception
                      </p>

                      <p
                        className="text-xs md:text-sm text-white/70 mb-5"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        {EVENTS.reception.dateText} ·{" "}
                        {EVENTS.reception.timeText}
                      </p>

                      {/* Countdown timer */}
                      <div className="flex justify-center gap-3 md:gap-4">
                        {[
                          { label: "Days", value: timeLeft.days },
                          { label: "Hours", value: timeLeft.hours },
                          { label: "Minutes", value: timeLeft.minutes },
                          { label: "Seconds", value: timeLeft.seconds },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="w-16 md:w-18 bg-white/10 border border-white/30 rounded-xl py-2"
                          >
                            <div
                              className="text-lg md:text-xl font-semibold text-white"
                              style={{ fontFamily: fonts.subheading }}
                            >
                              {String(item.value).padStart(2, "0")}
                            </div>
                            <div
                              className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-white/70 mt-1"
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
                    SECTION 7 – RSVP
                   ========================= */}
                {currentSection === 6 && (
                  <motion.section
                    key="section-7"
                    className="absolute inset-0 h-dvh overflow-hidden bg-black"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    {/* Dynamic black & white moving background */}
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 15% 0%, rgba(255,255,255,0.16), transparent 55%), radial-gradient(circle at 85% 100%, rgba(255,255,255,0.10), transparent 60%), linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(0,0,0,0.85))",
                        backgroundSize: "140% 140%, 140% 140%, 100% 100%",
                      }}
                      initial={{
                        backgroundPosition: "0% 0%, 100% 100%, 50% 0%",
                      }}
                      animate={{
                        backgroundPosition: [
                          "0% 0%, 100% 100%, 50% 0%",
                          "100% 100%, 0% 0%, 50% 100%",
                        ],
                      }}
                      transition={{
                        duration: 18,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                      }}
                    />

                    <div className="relative z-10 flex items-center justify-center h-full px-4">
                      <div className="bg-white/96 backdrop-blur-sm border border-black/10 rounded-2xl p-4 md:p-5 max-w-md w-full shadow-2xl">
                        <h3
                          className="text-[22px] font-bold text-center mb-3 tracking-[0.18em] uppercase text-black"
                          style={{ fontFamily: fonts.subheading }}
                        >
                          RSVP
                        </h3>

                        {/* Loading / error */}
                        {isLoadingGuest && (
                          <p
                            className="text-[12px] text-neutral-500 mb-2 text-center"
                            style={{ fontFamily: fonts.body }}
                          >
                            Loading guest info...
                          </p>
                        )}

                        {guestError && (
                          <p
                            className="text-[12px] text-red-600 mb-3 text-center"
                            style={{ fontFamily: fonts.body }}
                          >
                            {guestError}
                          </p>
                        )}

                        {/* Invitee info */}
                        <div className="mb-3 text-center">
                          <p
                            className="text-[14px]"
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
                              className="text-[11px] text-neutral-500 mt-1"
                              style={{ fontFamily: fonts.body }}
                            >
                              Confirmed guests:{" "}
                              {recipient.numAttendeesConfirmed}
                            </p>
                          ) : (
                            <p
                              className="text-[11px] text-neutral-500 mt-1"
                              style={{ fontFamily: fonts.body }}
                            >
                              Maximum guests: {recipient.maxGuests}
                            </p>
                          )}
                        </div>

                        {/* IF RSVP FILLED OR EDITING */}
                        {!isEditingRsvp && recipient.isAttending === true ? (
                          // CASE 1: Confirmed attending → QR / pass + Edit button
                          <div className="mb-4">
                            <p
                              className="text-[13px] text-center text-neutral-700 leading-snug"
                              style={{ fontFamily: fonts.body }}
                            >
                              Thank you for confirming your attendance.
                              <br />
                              {canShowQr
                                ? "Please show this QR code at the reception."
                                : "We look forward to celebrating with you."}
                            </p>

                            {canShowQr && qrValue && (
                              <div className="mt-3 flex justify-center">
                                <div className="bg-white border border-black/60 rounded-xl px-4 py-3 inline-flex flex-col items-center gap-1.5">
                                  <p
                                    className="text-[11px] tracking-[0.18em] uppercase text-neutral-500"
                                    style={{ fontFamily: fonts.subheading }}
                                  >
                                    Admission Pass
                                  </p>

                                  {/* QR Code based on id (same as admin app) */}
                                  <div className="bg-white p-2 rounded-md">
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
                            )}

                            {/* Edit button */}
                            <div className="mt-4 flex justify-center">
                              <button
                                onClick={startEditRsvp}
                                className="px-4 py-1.5 rounded-full border border-neutral-400 text-[12px] text-neutral-700 hover:bg-neutral-100 transition-colors"
                                style={{ fontFamily: fonts.body }}
                              >
                                Edit RSVP
                              </button>
                            </div>
                          </div>
                        ) : !isEditingRsvp &&
                          recipient.isAttending === false ? (
                          // CASE 2: RSVP filled but not attending + Edit button
                          <div className="mb-4">
                            <p
                              className="text-[13px] text-center text-neutral-700 leading-snug"
                              style={{ fontFamily: fonts.body }}
                            >
                              Thank you for letting us know.
                              <br />
                              We understand you cannot attend, and we truly
                              appreciate your wishes and prayers.
                            </p>

                            {/* Edit button */}
                            <div className="mt-4 flex justify-center">
                              <button
                                onClick={startEditRsvp}
                                className="px-4 py-1.5 rounded-full border border-neutral-400 text-[12px] text-neutral-700 hover:bg-neutral-100 transition-colors"
                                style={{ fontFamily: fonts.body }}
                              >
                                Edit RSVP
                              </button>
                            </div>
                          </div>
                        ) : (
                          // CASE 3: RSVP not filled OR editing → show form
                          <div className="space-y-3 mb-4">
                            <div className="space-y-1.5">
                              <label
                                className="text-[12px] text-neutral-700"
                                style={{ fontFamily: fonts.body }}
                              >
                                Your Name
                              </label>
                              <input
                                type="text"
                                name="name"
                                placeholder="Your Name"
                                className="w-full px-3 py-2 rounded-md border border-neutral-300 text-[14px] focus:outline-none focus:ring-1 focus:ring-black/70"
                                style={{ fontFamily: fonts.body }}
                                value={form.name}
                                onChange={handleChange}
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label
                                className="text-[12px] text-neutral-700"
                                style={{ fontFamily: fonts.body }}
                              >
                                Your Best Wishes
                              </label>
                              <textarea
                                name="wish"
                                placeholder="Write your best wishes"
                                className="w-full px-3 py-2 rounded-md border border-neutral-300 text-[13px] focus:outline-none focus:ring-1 focus:ring-black/70"
                                style={{ fontFamily: fonts.body }}
                                rows={3}
                                value={form.wish}
                                onChange={handleChange}
                              />
                            </div>

                            {/* Will you attend? – inline radio */}
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span
                                className="text-[12px] text-neutral-700"
                                style={{ fontFamily: fonts.body }}
                              >
                                Will you attend?
                              </span>
                              <div className="flex gap-4 text-[13px]">
                                <label
                                  className="flex items-center gap-1.5"
                                  style={{ fontFamily: fonts.body }}
                                >
                                  <input
                                    type="radio"
                                    name="isAttending"
                                    value="yes"
                                    checked={form.isAttending === true}
                                    onChange={handleChange}
                                  />
                                  Yes
                                </label>
                                <label
                                  className="flex items-center gap-1.5"
                                  style={{ fontFamily: fonts.body }}
                                >
                                  <input
                                    type="radio"
                                    name="isAttending"
                                    value="no"
                                    checked={form.isAttending === false}
                                    onChange={handleChange}
                                  />
                                  No
                                </label>
                              </div>
                            </div>

                            {/* Number of guests – inline options */}
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span
                                className="text-[12px] text-neutral-700"
                                style={{ fontFamily: fonts.body }}
                              >
                                Number of Guests
                              </span>
                              <div className="flex flex-wrap gap-3 text-[13px]">
                                {maxGuestsOptions.map((num) => (
                                  <label
                                    key={num}
                                    className="flex items-center gap-1.5"
                                    style={{ fontFamily: fonts.body }}
                                  >
                                    <input
                                      type="radio"
                                      name="numAttendeesConfirmed"
                                      value={num}
                                      checked={
                                        form.numAttendeesConfirmed === num
                                      }
                                      onChange={handleChange}
                                      disabled={form.isAttending === false}
                                    />
                                    {num}
                                  </label>
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={handleSubmit}
                              className="w-full bg-black text-white py-2.5 rounded-full text-[13px] font-semibold tracking-[0.08em] uppercase hover:bg-neutral-900 transition-colors"
                              style={{ fontFamily: fonts.button }}
                            >
                              Submit RSVP
                            </button>
                          </div>
                        )}

                        {/* Wishes (always visible) */}
                        <div className="mt-3">
                          <h4
                            className="text-[14px] font-bold mb-2 text-neutral-900"
                            style={{ fontFamily: fonts.subheading }}
                          >
                            Wishes
                          </h4>
                          {wishes.length === 0 ? (
                            <p
                              className="text-[12px] text-neutral-500 italic"
                              style={{ fontFamily: fonts.body }}
                            >
                              Be the first to leave a wish. 💌
                            </p>
                          ) : (
                            <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                              {wishes.map((w) => (
                                <li
                                  key={w.id}
                                  className="bg-white border border-neutral-200 p-2 rounded-md"
                                >
                                  <p
                                    className="text-[12px] italic text-neutral-800"
                                    style={{ fontFamily: fonts.body }}
                                  >
                                    "{w.wish}"
                                  </p>
                                  <p
                                    className="text-[10px] text-right text-neutral-500 mt-1"
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
                  </motion.section>
                )}

                {/* =========================
                    SECTION 8 – Gallery
                   ========================= */}
                {currentSection === 7 && (
                  <motion.section
                    key="section-7"
                    className="absolute inset-0 h-dvh overflow-hidden bg-black"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    <div className="relative flex flex-col h-full">
                      {/* Dynamic black & white moving background */}
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          backgroundImage:
                            "radial-gradient(circle at 15% 0%, rgba(255,255,255,0.16), transparent 55%), radial-gradient(circle at 85% 100%, rgba(255,255,255,0.10), transparent 60%), linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(0,0,0,0.85))",
                          backgroundSize: "140% 140%, 140% 140%, 100% 100%",
                        }}
                        initial={{
                          backgroundPosition: "0% 0%, 100% 100%, 50% 0%",
                        }}
                        animate={{
                          backgroundPosition: [
                            "0% 0%, 100% 100%, 50% 0%",
                            "100% 100%, 0% 0%, 50% 100%",
                          ],
                        }}
                        transition={{
                          duration: 18,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut",
                        }}
                      />
                      {/* title area */}
                      <div className="pt-8 pb-8 flex flex-col items-center">
                        {/* small label changed, no 'Section 8' */}

                        <h2
                          className="text-3xl text-white"
                          style={{ fontFamily: "'Dancing Script', cursive" }}
                        >
                          Our Moments
                        </h2>
                      </div>

                      {/* gallery body */}
                      <div className="flex-1 overflow-y-auto px-4 pb-6">
                        <div className="max-w-md mx-auto">
                          <OurMomentsGallery
                            onModalChange={setIsGalleryModalOpen}
                          />
                        </div>
                      </div>
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
                className="absolute inset-0 z-40 flex items-end justify-center"
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
                {canShowQr && qrValue && (
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
                                className="w-4 h-4"
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
                              <div className="bg-white border border-black/60 rounded-xl px-4 py-3 inline-flex flex-col items-center gap-1.5">
                                <p
                                  className="text-[11px] tracking-[0.18em] uppercase text-neutral-500"
                                  style={{ fontFamily: fonts.subheading }}
                                >
                                  Admission Pass
                                </p>

                                <div className="bg-white p-2 rounded-md">
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
                <div className="relative z-10 w-full px-6 pb-12 text-center">
                  <p
                    className="text-lg font-light mb-1"
                    style={{ fontFamily: fonts.subheading }}
                  >
                    The Wedding of
                  </p>
                  <h1
                    className="text-5xl mb-1"
                    style={{ fontFamily: fonts.heading }}
                  >
                    {COUPLE.groom.shortName} &amp; {COUPLE.bride.shortName}
                  </h1>
                  <p
                    className="text-md font-light mb-4"
                    style={{ fontFamily: fonts.subheading }}
                  >
                    {EVENTS.reception.dateText}
                  </p>

                  <p
                    className="text-sm mb-1"
                    style={{ fontFamily: fonts.recipient }}
                  >
                    Kepada Yth. Bapak/Ibu/Saudara/i
                  </p>
                  <p
                    className="text-lg font-semibold mb-6"
                    style={{ fontFamily: fonts.recipient }}
                  >
                    {recipient.displayName}
                  </p>

                  <motion.button
                    onClick={handleOpen}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-8 py-3 bg-black text-white rounded-full shadow-lg text-base tracking-wide mx-auto flex items-center justify-center font-bold"
                    style={{
                      fontFamily: fonts.button,
                      letterSpacing: "0.03em",
                    }}
                  >
                    <span className="leading-none">OPEN INVITATION</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Global overlay for music button + scroll-down arrows aligned to phone */}
      {isLoaded && hasOpened && !isGalleryModalOpen && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative max-w-[480px] w-full h-dvh pointer-events-none">
            {/* Music button (always visible once opened, including last section) */}
            <div className="absolute inset-x-0 bottom-2.5 flex justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <MusicToggle
                  isPlaying={isMusicPlaying}
                  onToggle={toggleMusic}
                />
              </div>
            </div>

            {/* Scroll-down arrows (hidden on last section) */}
            {currentSection !== totalSections - 1 && (
              <div className="absolute inset-x-0 bottom-6 flex flex-col items-center pointer-events-none">
                {[0, 1].map((i) => (
                  <div key={i} className={i === 0 ? "" : "-mt-3"}>
                    <svg
                      className="w-8 h-8 animate-bounce"
                      style={{ animationDelay: `${i * 120}ms` }}
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M4 16l8-8 8 8"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
