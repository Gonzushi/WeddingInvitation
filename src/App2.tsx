import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  num_attendees?: number;
  is_attending?: boolean;
  wish?: string;
};

type RecipientMode = "default" | "backend" | "custom";

type Recipient = {
  mode: RecipientMode;
  id?: string;
  displayName: string;
  maxGuests: number;
  isAttending?: boolean;
  numAttendeesConfirmed?: number;
  wish?: string;
};

type RsvpForm = {
  name: string;
  wish: string;
  isAttending: boolean | null;
  numAttendeesConfirmed: number;
};

type Scroll4DanceAnimationProps = {
  hasOpened: boolean;
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
  blessing: {
    label: "Blessing",
    dateText: "Saturday, 07 February 2026",
    timeText: "",
    venueName: "Novotel Bogor Golf Resort",
    locationText: "Bogor, Jawa Barat",
    mapsUrl:
      "https://www.google.com/maps/place/Novotel+Bogor+Golf+Resort+and+Convention+Center/@-6.6044585,106.8385092,17z",
  },
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
  "/assets/scroll4-bg.jpg",
  "/assets/scroll4-couple.png",
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
          animate={{ y: [0, 0, 0] }} // up/down
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
            className="h-[70vh] w-auto object-contain" // ← SIZE HERE
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

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

// hidden: start from bottom-left (when entering from section 1)
// bride:  final position on the right
// groom:  final position on the left
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

// Similar to Bride: bg & couple from LEFT
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

// BG: slide/zoom in from RIGHT
const scroll5BgVariants = {
  initial: { scale: 2, x: 120, y: 80, opacity: 1 },
  enter: { scale: 1, x: 0, y: 0, opacity: 1 },
};

// Couple photo: comes from RIGHT, ends slightly to the left
const scroll5SubjectVariants = {
  initial: { opacity: 0, x: 220, y: 80, scale: 2 },
  enter: { opacity: 1, x: 0, y: 0, scale: 1.35 },
};

// =========================
// Main Component
// =========================

export default function Invitation() {
  // global loading state (for images + minimum loading duration)
  const [isLoaded, setIsLoaded] = useState(false);

  // cover / open state
  const [hasOpened, setHasOpened] = useState(false);

  // scrolling / snapping state
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const isLockedRef = useRef(false);
  const totalSections = 5;

  // recipient & RSVP state
  const [recipient, setRecipient] = useState<Recipient>({
    mode: "default",
    displayName: "Nama Undangan",
    maxGuests: RSVP_CONFIG.defaultMaxGuests,
    isAttending: undefined,
    numAttendeesConfirmed: 1,
    wish: "",
  });

  const [form, setForm] = useState<RsvpForm>({
    name: "Nama Undangan",
    wish: "",
    isAttending: null,
    numAttendeesConfirmed: 1,
  });

  const [wishes, setWishes] = useState<{ name: string; wish: string }[]>([
    {
      name: "Alice",
      wish: "Wishing you a lifetime of love and happiness!",
    },
    {
      name: "Bob",
      wish: "So excited for your big day. Congrats!",
    },
  ]);

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

    // CASE 1: no `to` -> default mode
    if (!to) {
      const defaultRecipient: Recipient = {
        mode: "default",
        displayName: "Nama Undangan",
        maxGuests: RSVP_CONFIG.defaultMaxGuests,
        isAttending: undefined,
        numAttendeesConfirmed: 1,
        wish: "",
      };
      setRecipient(defaultRecipient);
      setForm((prev) => ({
        ...prev,
        name: defaultRecipient.displayName,
        numAttendeesConfirmed: 1,
      }));
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

          const backendRecipient: Recipient = {
            mode: "backend",
            id: guest.id,
            displayName,
            maxGuests,
            isAttending: guest.is_attending,
            numAttendeesConfirmed: guest.num_attendees || 1,
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
              guest.num_attendees && guest.num_attendees > 0
                ? guest.num_attendees
                : 1,
          });

          if (guest.wish) {
            setWishes((prev) => [
              { name: displayName, wish: guest.wish! },
              ...prev,
            ]);
          }
        })
        .catch((err: unknown) => {
          console.error("Failed to fetch guest", err);
          setGuestError("Guest not found. Using default invitee.");
          const fallbackRecipient: Recipient = {
            mode: "default",
            displayName: "Nama Undangan",
            maxGuests: RSVP_CONFIG.defaultMaxGuests,
            isAttending: undefined,
            numAttendeesConfirmed: 1,
            wish: "",
          };
          setRecipient(fallbackRecipient);
          setForm((prev) => ({
            ...prev,
            name: fallbackRecipient.displayName,
            numAttendeesConfirmed: 1,
          }));
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
      isAttending: undefined,
      numAttendeesConfirmed: 1,
      wish: "",
    };
    setRecipient(customRecipient);
    setForm((prev) => ({
      ...prev,
      name: displayName,
      numAttendeesConfirmed: 1,
    }));
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
  // Handlers: open cover
  // -------------------------

  const handleOpen = () => {
    setHasOpened(true);

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

    if (
      form.numAttendeesConfirmed < 1 ||
      form.numAttendeesConfirmed > recipient.maxGuests
    ) {
      alert(`Number of guests must be between 1 and ${recipient.maxGuests}.`);
      return;
    }

    setWishes((prev) => [
      { name: form.name.trim(), wish: form.wish.trim() },
      ...prev,
    ]);

    setRecipient((prev) => ({
      ...prev,
      isAttending: form.isAttending ?? undefined,
      numAttendeesConfirmed: form.numAttendeesConfirmed,
      wish: form.wish.trim(),
    }));

    if (recipient.mode === "backend" && recipient.id) {
      fetch(`${API_URL}/guests/${recipient.id}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_attending: form.isAttending,
          num_attendees: form.numAttendeesConfirmed,
          wish: form.wish.trim(),
          name: form.name.trim(),
        }),
      }).catch((err) => {
        console.error("Failed to submit RSVP to backend", err);
      });
    }

    alert("Thank you! Your RSVP has been recorded.");
  };

  // -------------------------
  // Render
  // -------------------------

  const maxGuestsOptions = Array.from(
    { length: recipient.maxGuests },
    (_, i) => i + 1
  );

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

                    {/* Shared couple photo – 
                        1 -> 2: hidden (bottom-left) -> bride (right)
                        2 -> 3: bride (right) -> groom (left)
                    */}
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
                      {/* NEW label */}
                      <p
                        className="text-xs tracking-[0.25em] uppercase text-white/70 mb-3"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        With Love &amp; Gratitude
                      </p>

                      {/* NEW quote */}
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
                        className="max-h-[75vh] w-auto object-contain" // no cropping
                        variants={scroll5SubjectVariants}
                        initial="initial"
                        animate={hasOpened ? "enter" : "initial"}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                  </motion.section>
                )}

                {/* =========================
                    SECTION 6 – RSVP
                   ========================= */}
                {currentSection === 5 && (
                  <motion.section
                    key="section-4"
                    className="absolute inset-0 h-dvh flex items-center justify-center bg-purple-200 px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    <div className="bg-white/90 rounded-xl p-4 shadow max-w-md w-full">
                      <h3
                        className="text-xl font-bold text-center mb-2"
                        style={{ fontFamily: fonts.subheading }}
                      >
                        RSVP
                      </h3>

                      {isLoadingGuest && (
                        <p
                          className="text-sm text-gray-500 mb-2"
                          style={{ fontFamily: fonts.body }}
                        >
                          Loading guest info...
                        </p>
                      )}

                      {guestError && (
                        <p
                          className="text-xs text-red-600 mb-2"
                          style={{ fontFamily: fonts.body }}
                        >
                          {guestError}
                        </p>
                      )}

                      <p
                        className="text-sm mb-2"
                        style={{ fontFamily: fonts.body }}
                      >
                        Invitee:{" "}
                        <span className="font-semibold">
                          {recipient.displayName}
                        </span>
                      </p>
                      <p
                        className="text-xs mb-4 text-gray-600"
                        style={{ fontFamily: fonts.body }}
                      >
                        Mode: {recipient.mode.toUpperCase()} • Max guests:{" "}
                        {recipient.maxGuests}
                      </p>

                      <div className="space-y-2">
                        <input
                          type="text"
                          name="name"
                          placeholder="Your Name"
                          className="w-full p-2 rounded border border-gray-300 text-sm"
                          style={{ fontFamily: fonts.body }}
                          value={form.name}
                          onChange={handleChange}
                        />

                        <textarea
                          name="wish"
                          placeholder="Write your best wishes"
                          className="w-full p-2 rounded border border-gray-300 text-sm"
                          style={{ fontFamily: fonts.body }}
                          rows={3}
                          value={form.wish}
                          onChange={handleChange}
                        />

                        <div className="flex items-center gap-4 mb-1 text-sm">
                          <span
                            className="min-w-[120px]"
                            style={{ fontFamily: fonts.body }}
                          >
                            Will you attend?
                          </span>
                          <div className="flex gap-4">
                            <label
                              className="flex items-center gap-1"
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
                              className="flex items-center gap-1"
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

                        <div className="flex items-center gap-4 flex-wrap mb-2 text-sm">
                          <span
                            className="min-w-[120px]"
                            style={{ fontFamily: fonts.body }}
                          >
                            Number of Guests
                          </span>
                          <div className="flex gap-3 flex-wrap">
                            {maxGuestsOptions.map((num) => (
                              <label
                                key={num}
                                className="flex items-center gap-1"
                                style={{ fontFamily: fonts.body }}
                              >
                                <input
                                  type="radio"
                                  name="numAttendeesConfirmed"
                                  value={num}
                                  checked={form.numAttendeesConfirmed === num}
                                  onChange={handleChange}
                                />
                                {num}
                              </label>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleSubmit}
                          className="w-full bg-[#E2725B] text-white py-2 rounded text-sm font-semibold"
                          style={{ fontFamily: fonts.button }}
                        >
                          Submit
                        </button>
                      </div>

                      <div className="mt-4">
                        <h4
                          className="text-sm font-bold mb-1"
                          style={{ fontFamily: fonts.subheading }}
                        >
                          Wishes
                        </h4>
                        <ul className="space-y-1 max-h-32 overflow-y-auto">
                          {wishes.map((w, idx) => (
                            <li
                              key={`${w.name}-${idx}`}
                              className="bg-white border border-gray-200 p-2 rounded"
                            >
                              <p
                                className="text-xs italic"
                                style={{ fontFamily: fonts.body }}
                              >
                                "{w.wish}"
                              </p>
                              <p
                                className="text-[10px] text-right text-gray-500"
                                style={{ fontFamily: fonts.body }}
                              >
                                — {w.name}
                              </p>
                            </li>
                          ))}
                        </ul>
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
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: "url('/assets/main.jpg')",
                    backgroundSize: "100%",
                    backgroundPosition: "0% 0%",
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />

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
      {isLoaded && hasOpened && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative max-w-[480px] w-full h-dvh pointer-events-none">
            <div className="absolute inset-x-0 bottom-2.5 flex justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <MusicToggle
                  isPlaying={isMusicPlaying}
                  onToggle={toggleMusic}
                />
              </div>
            </div>

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
          </div>
        </div>
      )}
    </div>
  );
}
