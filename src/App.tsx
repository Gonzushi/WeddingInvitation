import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";

const DEBUG_MODE = false;
const API_URL = "https://rest.trip-nus.com";
// const API_URL = "http://localhost:3000";

type Guest = {
  id: string;
  full_name: string;
  nickname?: string;
  address?: string;
  phone_number?: string;
  invitation_link?: string;
  is_attending?: boolean;
  num_attendees?: number;
  wish?: string;
  photo_url?: string;
  additional_names?: string[];
  wedding_id?: string;
  rsvp_at?: string;
  attendance_confirmed?: boolean;
};

const images = [
  { src: "/assets/gal1.jpg", span: 8, animation: "left" },
  { src: "/assets/gal2.jpg", span: 3, animation: "left" },
  { src: "/assets/gal3.jpg", span: 5, animation: "right" },
  { src: "/assets/gal4.jpg", span: 8, animation: "left" },
  { src: "/assets/gal5.jpg", span: 4, animation: "left" },
  { src: "/assets/gal6.jpg", span: 4, animation: "right" },
];

type FormData = {
  name: string;
  wish: string;
  is_attending: boolean;
  num_attendees_confirmed: number;
};

type Section5Props = {
  currentSection: number;
  form: FormData;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleSubmit: () => void;
  numberOfGuests: number;
  recipient: Guest | null;
};

const ReceptionCountdown = () => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    mins: 0,
    secs: 0,
  });

  useEffect(() => {
    const target = new Date("2026-02-07T00:00:00").getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
        secs: Math.floor((diff / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const unit = (value: number, label: string) => (
    <div className="flex flex-col items-center w-16">
      <div
        className="text-4xl font-bold text-[#E2725B]"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        {pad(value)}
      </div>
      <div
        className="text-xl text-[#E2725B]"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        {label}
      </div>
    </div>
  );

  return (
    <div className="flex justify-center gap-4 mt-4">
      {unit(timeLeft.days, "Days")}
      {unit(timeLeft.hours, "Hours")}
      {unit(timeLeft.mins, "Minutes")}
      {unit(timeLeft.secs, "Seconds")}
    </div>
  );
};

function GallerySection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const closeModal = () => setActiveIndex(null);
  const prev = () =>
    setActiveIndex((i) => (i! - 1 + images.length) % images.length);
  const next = () => setActiveIndex((i) => (i! + 1) % images.length);

  const getSpanClass = (span: number = 8) => {
    return `col-span-${span}`;
  };

  return (
    <>
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-white text-center">Gallery</h3>
        <div className="grid grid-cols-8 gap-2">
          {images.map((img, idx) => {
            const spanClass = getSpanClass(img.span);
            const fromX = img.animation === "left" ? -100 : 100;

            return (
              <div
                key={img.src}
                className={`${spanClass} overflow-hidden rounded-lg`}
              >
                <motion.div
                  initial={{ opacity: 0, x: fromX }}
                  whileInView={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true, amount: 0.3 }}
                  className="cursor-pointer"
                  onClick={() => setActiveIndex(idx)}
                >
                  <img
                    src={img.src}
                    alt={`Gallery ${idx}`}
                    className="w-full h-48 object-cover"
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
            className="fixed inset-0 z-50 bg-white/90 flex flex-col items-center justify-center touch-none w-screen h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-black text-3xl z-50"
            >
              ✕
            </button>

            {/* Fullscreen Image Centered */}
            <div className="flex justify-center items-center w-full h-dvh -mt-20">
              <motion.img
                key={images[activeIndex].src}
                src={images[activeIndex].src}
                alt="Fullscreen"
                className="max-w-4xl max-h-[90vh] rounded-xl shadow-xl mx-auto"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0 }}
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ScrollSection({
  currentSection,
  form,
  handleChange,
  handleSubmit,
  numberOfGuests = 2,
  recipient,
}: Section5Props) {
  const wishes = [
    { name: "Alice", wish: "Wishing you a lifetime of love and happiness!" },
    { name: "Bob", wish: "So excited for your big day. Congrats!" },
  ];

  return (
    <motion.div
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: currentSection === 5 ? "0%" : "100%", opacity: 1 }}
      transition={{
        delay: currentSection === 5 ? 1 : 0,
        duration: 1,
        ease: "easeInOut",
      }}
      data-section="5"
      className="h-dvh w-full overflow-y-auto overflow-x-hidden relative z-30"
    >
      {/* Full Overlay */}
      <div className="absolute left-0 top-0 w-full bg-white/90 backdrop-blur-sxs z-0">
        {/* Top Flower */}
        <motion.img
          src="/assets/flower_top.png"
          alt="flower_top"
          initial={{ opacity: 0, scale: 0.9, x: "-30%", y: "-25%" }}
          animate={{
            opacity: currentSection === 5 ? 1 : 0,
            scale: currentSection === 5 ? 0.9 : 0.9,
            x: currentSection === 5 ? "-18%" : "-30%",
            y: currentSection === 5 ? "-25%" : "-25%",
          }}
          transition={{ duration: 2 }}
          className="absolute z-40"
          style={{ left: "1%", top: "1%" }}
        />

        <motion.p
          className="text-xl font-bold text-[#E2725B]"
          style={{ fontFamily: "'Dancing Script', cursive" }}
          initial={{ scale: 1, x: "0%", opacity: 1 }}
          animate={{
            scale: currentSection === 5 ? 2.5 : 1,
            x: currentSection === 5 ? "110%" : "0%",
            y: currentSection === 5 ? "600%" : "600%",
          }}
          transition={{ delay: 2 }}
        >
          Save
        </motion.p>

        <motion.p
          className="text-xl font-bold text-[#E2725B]"
          style={{ fontFamily: "'Dancing Script', cursive" }}
          initial={{ scale: 1, x: "240%", opacity: 1 }}
          animate={{
            scale: currentSection === 5 ? 2.5 : 1,
            x: currentSection === 5 ? "120%" : "240%",
            y: currentSection === 5 ? "700%" : "700%",
          }}
          transition={{ delay: 2 }}
        >
          The
        </motion.p>

        <motion.p
          className="text-xl font-bold text-[#E2725B]"
          style={{ fontFamily: "'Dancing Script', cursive" }}
          initial={{ scale: 1, x: "240%", opacity: 1 }}
          animate={{
            scale: currentSection === 5 ? 2.5 : 1,
            x: currentSection === 5 ? "130%" : "240%",
            y: currentSection === 5 ? "800%" : "800%",
          }}
          transition={{ delay: 2 }}
        >
          Date
        </motion.p>

        {/* Countdown Timer */}
        <div className="mt-72">
          <ReceptionCountdown />
        </div>

        <div className=" mt-10 max-w-xl mx-auto px-4 pb-8 space-y-10 relative z-30">
          {/* RSVP Form */}
          <section className="bg-white/90 rounded-xl p-4 shadow space-y-4 border border-[#E2725B]">
            <h3 className="text-xl font-bold text-[#E2725B] text-center">
              RSVP
            </h3>

            {!recipient?.is_attending ? (
              <div className="space-y-2">
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  className="w-full p-2 rounded border border-[#E2725B]"
                  value={form.name}
                  onChange={handleChange}
                />
                <textarea
                  name="wish"
                  placeholder="Write your best wishes"
                  className="w-full p-2 rounded border border-[#E2725B]"
                  rows={3}
                  value={form.wish}
                  onChange={handleChange}
                />

                {/* Will you attend? */}
                <div className="flex items-center gap-4 mb-3">
                  <label className="text-sm font-medium min-w-[150px]">
                    Will you attend?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="is_attending"
                        value="yes"
                        checked={(form.is_attending ? "yes" : "no") == "yes"}
                        onChange={handleChange}
                        className="accent-[#E2725B]"
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="is_attending"
                        value="no"
                        checked={(form.is_attending ? "yes" : "no") == "no"}
                        onChange={handleChange}
                        className="accent-[#E2725B]"
                      />
                      No
                    </label>
                  </div>
                </div>

                {/* Number of Guests */}
                <div className="flex items-center gap-4 flex-wrap mb-3">
                  <label className="text-sm font-medium min-w-[150px]">
                    Number of Guests?
                  </label>
                  <div className="flex gap-3">
                    {Array.from(
                      { length: numberOfGuests ?? 2 },
                      (_, i) => i + 1
                    ).map((num) => (
                      <label key={num} className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="num_attendees_confirmed"
                          value={num.toString()}
                          checked={form.num_attendees_confirmed == num}
                          onChange={(e) => {
                            handleChange(e);
                          }}
                          className="accent-[#E2725B]"
                        />
                        {num}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full bg-[#E2725B] text-white py-2 rounded shadow font-semibold mb-4"
                >
                  Submit
                </button>
              </div>
            ) : (
              <div
                className="relative bg-white p-6 rounded-lg  flex flex-col items-center"
                onDoubleClick={(e) => e.stopPropagation()} // Prevent double-click inside from closing
              >
                <QRCode value={recipient.id ? recipient.id : "542a4062-bece-4d6b-b6d8-c5011ef55667"} size={256} />
                <p className="text-center text-sm max-w-xs text-[#E2725B] mt-8">
                  Please present this QR code when attending the wedding. It
                  helps us confirm your attendance quickly at the venue.
                </p>
              </div>
            )}

            {/* Wishes List */}
            <div className="">
              <h4 className="text-md font-bold text-[#E2725B]">Wishes</h4>
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {wishes.map((w, idx) => (
                  <li
                    key={idx}
                    className="bg-white border border-[#E2725B] p-2 rounded shadow-sm"
                  >
                    <p className="text-sm text-gray-700 italic">"{w.wish}"</p>
                    <p className="text-xs text-gray-500 text-right">
                      — {w.name}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Love Story Timeline */}
          <section className="bg-white/90 text-black px-4 py-6 rounded-2xl shadow-lg space-y-6 max-w-xl mx-auto border border-[#E2725B]">
            <h2 className="text-2xl font-bold text-center text-[#E2725B]">
              Our Love Story
            </h2>
            <div className="relative border-l-2 border-[#E2725B] pl-6 space-y-6">
              {[
                {
                  year: "2019",
                  text: "We met for the first time at a campus event.",
                },
                {
                  year: "2020",
                  text: "Our friendship grew deeper during the pandemic.",
                },
                {
                  year: "2022",
                  text: "We took our first trip together to Bali.",
                },
                {
                  year: "2023",
                  text: "Engaged with love and blessings from our families.",
                },
                {
                  year: "2026",
                  text: "And now, we’re getting married!",
                },
              ].map((item, i) => (
                <div key={i} className="relative pl-4">
                  <div className="absolute left-[-10px] top-1 w-4 h-4 bg-[#E2725B] rounded-full border-2 border-white" />
                  <div className="font-bold text-[#E2725B]">{item.year}</div>
                  <div className="text-sm">{item.text}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Gallery */}
          <GallerySection />
        </div>
      </div>
    </motion.div>
  );
}

export default function ScrollSections() {
  const [recipient, setRecipient] = useState<Guest | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [currentSection, setCurrentSection] = useState(0);

  const isLockedRef = useRef(false);
  const [scrollTop, setScrollTop] = useState(0);

  const sectionLastRef = useRef<HTMLDivElement | null>(null);
  const [sectionLastScrollTop, setSectionLastScrollTop] = useState(0);

  const [form, setForm] = useState<FormData>({
    name: "",
    wish: "",
    is_attending: true,
    num_attendees_confirmed: 2,
  });

  // Get Recipient Data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get("to");

    if (param) {
      // Fetch guest data by ID
      fetch(`${API_URL}/guests/${param}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Guest not found");
          }
          return res.json();
        })
        .then((data) => {
          console.log(data.data);
          setRecipient(data?.data); // assuming your API wraps data under `data`
        })
        .catch((err) => {
          console.error("Failed to fetch guest", err);
        });
    }
  }, []);

  // Download fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Dancing+Script&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const fonts = {
    heading: "'Dancing Script', cursive", // Main title font
    subheading: "'Cormorant Garamond', serif", // Subtitle font
    recipient: "'Cormorant Garamond', serif", // For guest names
    button: "'Cormorant Garamond', serif", // Button text
    body: "'Cormorant Garamond', serif", // For general text
    title: "'Dancing Script', cursive", // Optional alias for section titles
  };

  // Preload images
  useEffect(() => {
    const imageUrls = [
      "/assets/couple2.jpg",
      "/assets/background.jpeg",
      "/assets/stage.png",
      "/assets/couple.png",
      "/assets/textarea.png",
      "/assets/cloud1.webp",
      "/assets/flower2.png",
      "/assets/flowers.png",
      "/assets/vases.png",
      "/assets/lamps.png",
      "/assets/arch.png",
      "/assets/gal1.jpg",
      "/assets/gal2.jpg",
      "/assets/gal3.jpg",
      "/assets/gal4.jpg",
      "/assets/gal5.jpg",
      "/assets/gal6.jpg",
    ];

    let loadedCount = 0;

    imageUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === imageUrls.length) {
          setTimeout(() => {
            setIsLoaded(true);
          }, 0);
        }
      };
    });
  }, []);

  // Handle scroll and wheel events
  useEffect(() => {
    const container = scrollContainerRef.current;
    const sectionHeight = window.innerHeight;

    const handleScroll = () => {
      if (!container || isLockedRef.current) return;

      const newScrollTop = container.scrollTop;
      const newSection = Math.round(newScrollTop / sectionHeight);

      setScrollTop(newScrollTop);

      if (newSection !== currentSection) {
        setCurrentSection(newSection);

        // Lock scrolling and manually scroll to target
        isLockedRef.current = true;
        container.scrollTo({
          top: newSection * sectionHeight,
          behavior: "smooth",
        });

        // Unlock after animation
        setTimeout(() => {
          isLockedRef.current = false;
        }, 500);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (currentSection !== 5 || !container) return;

      const sectionLast = sectionLastRef.current;
      if (!sectionLast) return;

      const atTop = sectionLast.scrollTop <= 5;
      const scrollingUp = e.deltaY < 0;

      if (scrollingUp && atTop && !isLockedRef.current) {
        e.preventDefault();

        isLockedRef.current = true;

        // Cancel momentum
        sectionLast.scrollTop = 0;

        container.scrollTo({
          top: 4 * sectionHeight,
          behavior: "smooth",
        });
        setCurrentSection(4);

        setTimeout(() => {
          isLockedRef.current = false;
        }, 500);
      }
    };

    if (container) {
      container.addEventListener("scroll", handleScroll);
      container.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      container?.removeEventListener("scroll", handleScroll);
      container?.removeEventListener("wheel", handleWheel);
    };
  }, [currentSection]);

  // Handle scroll position for section 5
  useEffect(() => {
    const sectionLast = sectionLastRef.current;
    if (currentSection === 5 && sectionLast) {
      const updateScrollTop = () => {
        setSectionLastScrollTop(sectionLast.scrollTop);
      };
      sectionLast.addEventListener("scroll", updateScrollTop);
      return () => sectionLast.removeEventListener("scroll", updateScrollTop);
    }
  }, [currentSection]);

  // Handle opening the invitation
  const handleOpen = () => {
    scrollContainerRef.current?.scrollTo({
      top: window.innerHeight * 1,
      behavior: "smooth",
    });
  };

  // Update form state
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name == "is_attending") {
      setForm((prev) => ({
        ...prev,
        is_attending: value == "yes" ? true : false,
      }));
    } else if (name == "num_attendees_confirmed") {
      setForm((prev) => ({
        ...prev,
        num_attendees_confirmed: Number(value),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  //  Handle form submission
  const handleSubmit = () => {
    if (!form.name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!form.wish.trim()) {
      alert("Please write your best wishes.");
      return;
    }

    if (
      form.num_attendees_confirmed != 1 &&
      form.num_attendees_confirmed != 2 &&
      form.num_attendees_confirmed != 3 &&
      form.num_attendees_confirmed != 4 &&
      form.num_attendees_confirmed != 5
    ) {
      alert("Number of guests must be 1 or 2.");
      return;
    }
    console.log(form);
    setRecipient({ ...recipient, is_attending: true } as Guest);
    alert("RSVP Submitted!");
  };

  // Render sections based on currentSection
  const renderSection = (index: number) => {
    if (index >= 0 && index <= 5) {
      return (
        <div
          data-section="1"
          className="relative w-full h-full overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {index === 0 && (
              <motion.div
                key="cover"
                data-section="0"
                className="absolute inset-0 z-50 w-full h-dvh bg-cover bg-center"
                style={{
                  backgroundImage: `url('/assets/couple2.jpg')`,
                  backgroundSize: "180%",
                  backgroundPosition: "45% 100%",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
              >
                {/* gradient */}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-white/100 via-white/30 to-transparent" />

                {!isLoaded && (
                  <div>
                    <div className="absolute inset-0 z-50 bg-[#E2725B]/60 backdrop-blur-sm" />
                    <div className="absolute inset-0 flex items-center justify-center z-50">
                      <div className="w-24 h-24 bg-white/70 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-5xl font-bold text-[#E2725B] animate-pulse">
                          U
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 z-20 w-full text-center px-6 pb-12 flex flex-col items-center justify-end h-1/2">
                  {/* Texts + Button */}
                  <motion.p
                    className="text-lg font-light mb-1"
                    style={{ fontFamily: fonts.subheading }}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    The Wedding of
                  </motion.p>
                  <motion.h1
                    className="text-5xl mb-1"
                    style={{ fontFamily: fonts.heading }}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    Hary & Finna
                  </motion.h1>
                  <motion.p
                    className="text-md font-light mb-2"
                    style={{ fontFamily: fonts.subheading }}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    Saturday, 07 February 2026
                  </motion.p>

                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="w-full"
                  >
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
                      {(recipient?.full_name ||
                        recipient?.nickname ||
                        "Nama Undangan") +
                        (recipient?.additional_names?.length
                          ? " & " + recipient.additional_names.join(" & ")
                          : "")}
                    </p>
                    <motion.button
                      onClick={handleOpen}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      className="px-8 py-3 bg-[#E2725B] text-white rounded-full shadow-lg text-base tracking-wide transition-all duration-300 hover:shadow-2xl hover:bg-[#d0654f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E2725B] flex items-center justify-center mx-auto"
                      style={{
                        fontFamily: fonts.button,
                        letterSpacing: "0.03em",
                      }}
                    >
                      <span className="text-xl mr-2 leading-none">💌</span>
                      <span className="leading-none">Open Invitation</span>
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Background stays constant */}
          {index > 0 && (
            <motion.img
              src="/assets/background.jpeg"
              alt="Background"
              initial={{ scale: 1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          )}

          {/* Stage */}
          {index > 0 && (
            <motion.img
              src="/assets/stage.png"
              alt="Stage"
              initial={{ opacity: 0, scale: 1.8, x: 0 }}
              animate={{
                opacity: 1,
                scale:
                  currentSection === 1
                    ? 1.8
                    : currentSection === 2
                    ? 7
                    : currentSection === 3
                    ? 7
                    : currentSection === 4
                    ? 3.5
                    : 1.8,
                x:
                  currentSection === 1
                    ? "0%"
                    : currentSection === 2
                    ? "-21%"
                    : currentSection === 3
                    ? "20%"
                    : currentSection === 4
                    ? "0%"
                    : "0%",
                y:
                  currentSection === 1
                    ? "0%"
                    : currentSection === 2
                    ? "115%"
                    : currentSection === 3
                    ? "115%"
                    : currentSection === 4
                    ? "120%"
                    : "0%",
              }}
              transition={{ duration: 2 }}
              className="absolute z-1"
              style={{ bottom: "15%", left: "0%", width: "150%" }}
            />
          )}

          {/* Couple */}
          {index > 0 && (
            <motion.img
              src="/assets/couple.png"
              alt="Couple"
              initial={{ opacity: 1, scale: 4, x: 0 }}
              animate={{
                opacity: currentSection === 1 ? 1 : 1,
                scale:
                  currentSection === 1
                    ? 0.9
                    : currentSection === 2
                    ? 3.5
                    : currentSection === 3
                    ? 3.5
                    : currentSection === 4
                    ? 1.5
                    : 0.9,
                x:
                  currentSection === 1
                    ? "0%"
                    : currentSection === 2
                    ? "-60%"
                    : currentSection === 3
                    ? "95%"
                    : currentSection === 4
                    ? "0%"
                    : "0%",
                y:
                  currentSection === 1
                    ? "0%"
                    : currentSection === 2
                    ? "15%"
                    : currentSection === 3
                    ? "15%"
                    : currentSection === 4
                    ? "200%"
                    : "0%",
              }}
              transition={{ duration: 2 }}
              className="absolute z-14 image-sharp"
              style={{
                bottom: "42%",
                left: "33%",
                width: "32%",
              }}
            />
          )}

          {/* Bride Details */}
          <motion.img
            src="/assets/textarea.png"
            alt="Text Area"
            initial={{ opacity: 0, scale: 0.9, x: 0 }}
            animate={{
              opacity: currentSection === 2 ? 1 : 0,
              scale: currentSection === 2 ? 3.5 : 0,
              x: currentSection === 2 ? "120%" : "200%",
              y: currentSection === 2 ? "30%" : "0%",
            }}
            transition={{ duration: 2 }}
            className="absolute z-4"
            style={{ bottom: "42%", left: "33%", width: "32%" }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 0 }}
            animate={{
              opacity: currentSection === 2 ? 1 : 0,
              scale: currentSection === 2 ? 1 : 0,
              x: currentSection === 2 ? "120%" : "300%",
              y: currentSection === 2 ? "48%" : "48%",
            }}
            transition={{ duration: 2 }}
            className="absolute z-21 text-center text-black"
            style={{
              bottom: "46%",
              left: "36%",
              width: "26%",
            }}
          >
            <p
              className="text-xl text-[#4B2E2E] leading-snug mb-1"
              style={{ fontFamily: fonts.heading, fontWeight: 600 }}
            >
              Finna Widyanti
            </p>

            <p
              className="text-sm text-gray-700 leading-tight mb-1"
              style={{ fontFamily: fonts.recipient }}
            >
              Daughter of
            </p>
            <p
              className="text-sm text-gray-800 mb-0 leading-tight whitespace-nowrap"
              style={{ fontFamily: fonts.recipient, fontWeight: 600 }}
            >
              Mr. Peng Cheong
            </p>
            <p
              className="text-sm text-gray-800 mb-2 leading-tight whitespace-nowrap"
              style={{ fontFamily: fonts.recipient, fontWeight: 600 }}
            >
              Mrs. Marijani
            </p>

            <a
              href="https://instagram.com/finnawidy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-sm text-gray-500 leading-none overflow-visible mt-1"
              style={{ fontFamily: fonts.recipient, fontStyle: "italic" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                className="w-4 h-4"
              >
                <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h10zm-5 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm4.5-1.75a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
              </svg>
              @finnawidy
            </a>
          </motion.div>

          {/* Groom Details */}
          <motion.img
            src="/assets/textarea.png"
            alt="Text Area"
            initial={{ opacity: 0, scale: 0.9, x: 0 }}
            animate={{
              opacity: currentSection === 3 ? 1 : 0,
              scale: currentSection === 3 ? 4 : 0,
              x: currentSection === 3 ? "-85%" : "-200%",
              y: currentSection === 3 ? "90%" : "0%",
            }}
            transition={{ duration: 2 }}
            className="absolute z-4"
            style={{ bottom: "42%", left: "33%", width: "32%" }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 0 }}
            animate={{
              opacity: currentSection === 3 ? 1 : 0,
              scale: currentSection === 3 ? 1 : 0,
              x: currentSection === 3 ? "-105%" : "-300%",
              y: currentSection === 3 ? "92%" : "50%",
            }}
            transition={{ duration: 2 }}
            className="absolute z-21 text-center text-black"
            style={{
              bottom: "46%",
              left: "36%",
              width: "26%",
            }}
          >
            <p
              className="text-xl text-[#4B2E2E] leading-snug mb-1"
              style={{ fontFamily: fonts.heading, fontWeight: 600 }}
            >
              Haryanto Kartawijaya
            </p>

            <p
              className="text-sm text-gray-700 leading-tight mb-1"
              style={{ fontFamily: fonts.recipient }}
            >
              Son of
            </p>
            <p
              className="text-sm text-gray-800 mb-0 leading-tight"
              style={{ fontFamily: fonts.recipient, fontWeight: 600 }}
            >
              Mr. Peng Cheong
            </p>
            <p
              className="text-sm text-gray-800 mb-2 leading-tight"
              style={{ fontFamily: fonts.recipient, fontWeight: 600 }}
            >
              Mrs. Marijani
            </p>

            <div className="flex justify-center w-full">
              <a
                href="https://instagram.com/haryantokartawijaya"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-gray-500 leading-none mt-1"
                style={{
                  fontFamily: fonts.recipient,
                  fontStyle: "italic",
                  whiteSpace: "nowrap", // ensures no line break
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-4 h-4 flex-shrink-0"
                >
                  <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h10zm-5 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm4.5-1.75a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
                </svg>
                <span>@haryantokartawijaya</span>
              </a>
            </div>
          </motion.div>

          {/* Cloud */}
          <motion.img
            src="/assets/cloud1.webp"
            alt="Cloud 1"
            initial={{ opacity: 0, y: "-300%" }}
            animate={{
              opacity: currentSection === 4 ? 1 : 0,
              scale: 6,
              y: currentSection === 4 ? "0%" : "-300%",
            }}
            transition={{ duration: 2 }}
            className="absolute z-10"
            style={{ bottom: "65%", left: "33%", width: "35%" }}
          />

          <motion.div
            animate={
              currentSection === 4 ? { rotate: [-5, 5, -5] } : { rotate: 0 }
            }
            transition={{
              duration: 4,
              ease: "easeInOut",
              repeat: currentSection === 4 ? Infinity : 0,
            }}
            className="absolute z-10"
            style={{ bottom: "83%", left: "75%", width: "35%" }}
          >
            <motion.img
              src="/assets/flower2.png"
              alt="Flower"
              initial={{ opacity: 0 }}
              animate={{
                opacity: currentSection === 4 ? 1 : 0,
                scale: 1.3,
                y: currentSection === 4 ? "0%" : "-300%",
              }}
              transition={{ duration: 2 }}
              className="w-full h-auto"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: "-300%" }}
            animate={{
              opacity: currentSection === 4 ? 1 : 0,
              y: currentSection === 4 ? "0%" : "-300%",
            }}
            transition={{ duration: 2 }}
            className="absolute z-20 text-center text-black"
            style={{ bottom: "65%", left: "5%", width: "35%" }}
          >
            <p
              className="text-2xl font-bold mb-1 tracking-wide"
              style={{ fontFamily: fonts.title || "Georgia, serif" }}
            >
              Blessing
            </p>

            <p
              className="text-lg font-medium mb-1"
              style={{ fontFamily: fonts.body || "Cormorant Garamond, serif" }}
            >
              Saturday, 07 February 2026
            </p>

            <p
              className="text-sm mb-3 px-1"
              style={{ fontFamily: fonts.body || "Cormorant Garamond, serif" }}
            >
              Novotel Bogor Golf Resort
            </p>

            <a
              href="https://www.google.com/maps/place/Novotel+Bogor+Golf+Resort+and+Convention+Center/@-6.6044585,106.8385092,17z/data=!3m1!4b1!4m9!3m8!1s0x2e69c66c000aaa3d:0xf01576df7f835a0!5m2!4m1!1i2!8m2!3d-6.6044585!4d106.8385092!16s%2Fg%2F1v0bw1cf?entry=ttu&g_ep=EgoyMDI1MDcxNi4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-3 py-1 mt-2 text-sm text-white rounded-full transition-all"
              style={{
                fontFamily: fonts.button,
                backgroundColor: "#E2725B", // Terracotta
              }}
            >
              📍 Get Directions
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: "-300%" }}
            animate={{
              opacity: currentSection === 4 ? 1 : 0,
              y: currentSection === 4 ? "0%" : "-300%",
            }}
            transition={{ duration: 2 }}
            className="absolute z-20 text-center text-black"
            style={{ bottom: "55%", left: "53%", width: "35%" }}
          >
            <p
              className="text-2xl font-bold mb-1 tracking-wide"
              style={{ fontFamily: fonts.title || "Georgia, serif" }}
            >
              Reception
            </p>

            <p
              className="text-lg font-medium mb-1"
              style={{ fontFamily: fonts.body || "Cormorant Garamond, serif" }}
            >
              Saturday, 07 February 2026
            </p>

            <p
              className="text-sm mb-3 px-1"
              style={{ fontFamily: fonts.body || "Cormorant Garamond, serif" }}
            >
              Aston Bogor Hotel & Resort
            </p>

            <a
              href="https://www.google.com/maps/place/Aston+Bogor+Hotel+%26+Resort/@-6.6363804,106.7929638,17z/data=!3m1!4b1!4m9!3m8!1s0x2e69c5ee5f871091:0xc58549234bdf7d7c!5m2!4m1!1i2!8m2!3d-6.6363857!4d106.7955387!16s%2Fg%2F1jkwh91z1?entry=ttu&g_ep=EgoyMDI1MDcxNi4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-3 py-1 mt-2 text-sm text-white rounded-full transition-all"
              style={{
                fontFamily: fonts.button,
                backgroundColor: "#E2725B", // Terracotta
              }}
            >
              📍 Get Directions
            </a>
          </motion.div>

          {/* Flowers */}
          <motion.img
            src="/assets/flowers.png"
            alt="Flowers"
            initial={{ opacity: 0, scale: 4 }}
            animate={{
              opacity: currentSection === 1 || currentSection === 5 ? 1 : 0,
              scale: currentSection === 1 || currentSection === 5 ? 1 : 4,
              y: currentSection === 1 || currentSection === 5 ? "0%" : "1200%",
              x: currentSection === 1 || currentSection === 5 ? "0%" : "-60%",
            }}
            transition={{ duration: currentSection === 1 ? 2 : 2 }}
            className="absolute z-10"
            style={{ bottom: "34%", left: "33%", width: "35%" }}
          />

          {/* Vases */}
          <motion.img
            src="/assets/vases.png"
            alt="Vases"
            initial={{ opacity: 0, scale: 4 }}
            animate={{
              opacity: currentSection === 1 || currentSection === 5 ? 1 : 0,
              scale: currentSection === 1 || currentSection === 5 ? 1 : 4,
              y: currentSection === 1 || currentSection === 5 ? "0%" : "400%",
              x: currentSection === 1 || currentSection === 5 ? "0%" : "-60%",
            }}
            transition={{ duration: currentSection === 1 ? 2 : 2 }}
            className="absolute z-11"
            style={{ bottom: "28%", left: "25%", width: "50%" }}
          />

          {/* Lamps */}
          <motion.img
            src="/assets/lamps.png"
            alt="Lamps"
            initial={{ opacity: 0, scale: 4, y: "50%" }}
            animate={{
              opacity: currentSection === 1 || currentSection === 5 ? 1 : 0,
              scale: currentSection === 1 || currentSection === 5 ? 1 : 4,
              y: currentSection === 1 || currentSection === 5 ? "0%" : "400%",
              x: currentSection === 1 || currentSection === 5 ? "0%" : "-60%",
            }}
            transition={{ duration: currentSection === 1 ? 2 : 2 }}
            className="absolute z-12"
            style={{ bottom: "22%", left: "18%", width: "65%" }}
          />

          {/* Arch (optional slight zoom) */}
          <motion.img
            src="/assets/arch.png"
            alt="Arch"
            initial={{ scale: 4, opacity: 0 }}
            animate={{
              scale: currentSection === 1 || currentSection === 5 ? 1.2 : 7,
              opacity: currentSection === 1 || currentSection === 5 ? 1 : 0,
              y: currentSection === 1 || currentSection === 5 ? "0%" : "115%",
              x: currentSection === 1 || currentSection === 5 ? "0%" : "-60%",
            }}
            transition={{ duration: currentSection === 1 ? 2 : 2 }}
            className="absolute z-13 transform -translate-x-1/2"
            style={{ bottom: "15%", left: "50%", width: "100%" }}
          />

          {/* Content */}
          <ScrollSection
            currentSection={index}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            form={form}
            numberOfGuests={4}
            recipient={recipient}
          />
        </div>
      );
    }
  };

  // Total sections (0 to 5)
  const totalSections = 6;

  return (
    <div className="w-full flex justify-center">
      <div
        ref={scrollContainerRef}
        className="max-w-[480px] w-full overflow-y-scroll scroll-smooth h-dvh"
      >
        <div
          className="relative"
          style={{ height: `${totalSections * 100}dvh` }}
        >
          <div className="sticky top-0 h-dvh w-full">
            {renderSection(currentSection)}
          </div>
        </div>

        {DEBUG_MODE && (
          <div className="fixed top-2 right-2 z-50 bg-black/80 text-white text-xs p-3 rounded-xl shadow space-y-1 font-mono">
            <div>
              <span className="font-bold">Section:</span> {currentSection}
            </div>
            <div>
              <span className="font-bold">ScrollTop:</span>{" "}
              {Math.round(scrollTop)}
            </div>
            <div>
              <span className="font-bold">Section 5 ScrollTop:</span>{" "}
              {Math.round(sectionLastScrollTop)}
            </div>
            <div>
              <span className="font-bold">Section Height:</span>{" "}
              {window.innerHeight}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
