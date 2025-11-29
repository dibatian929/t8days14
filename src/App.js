import React, { useState, useEffect, useRef, Component } from "react";
import {
  Camera,
  Instagram,
  Mail,
  X,
  Menu,
  ChevronRight,
  MapPin,
  Aperture,
  User,
  Settings,
  Plus,
  Trash2,
  Save,
  LogOut,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Lock,
  Loader2,
  WifiOff,
  UploadCloud,
  Play,
  Pause,
  Edit2,
  Globe,
  Music2,
  ArrowLeft,
  ChevronLeft,
  Move,
  Eye,
  EyeOff,
  ChevronDown,
  FolderOpen,
  Calendar,
  Layout,
  Type,
  Link as LinkIcon,
  ExternalLink,
  Twitter,
  Youtube,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- 0. 系统初始化 ---

console.log("System initializing...");

const MANUAL_CONFIG = {
  apiKey: "AIzaSyCE-gHGrVGjGLDdBgOj_KSlH5rZqBtQrXM",
  authDomain: "my-t8day.firebaseapp.com",
  projectId: "my-t8day",
  storageBucket: "my-t8day.firebasestorage.app",
  messagingSenderId: "12397695094",
  appId: "1:12397695094:web:785bb4030b40f685754f57",
  measurementId: "G-FLLBH5DTNV",
};

let app, auth, db, storage;
let isFirebaseInitialized = false;

try {
  let firebaseConfig = MANUAL_CONFIG;
  if (typeof __firebase_config !== "undefined") {
    firebaseConfig = JSON.parse(__firebase_config);
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  isFirebaseInitialized = true;
  console.log("Firebase initialized");
} catch (e) {
  console.error("Firebase Init Error:", e);
}

const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

const getPublicCollection = (colName) => {
  if (!db) throw new Error("Database not initialized");
  return collection(db, "artifacts", appId, "public", "data", colName);
};
const getPublicDoc = (colName, docId) => {
  if (!db) throw new Error("Database not initialized");
  return doc(db, "artifacts", appId, "public", "data", colName, docId);
};

const uploadFileToStorage = async (file, path) => {
  if (!storage) throw new Error("Storage not initialized");
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

// --- 1. 样式与默认配置 ---
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@300;400;600&display=swap');
  :root { --font-heading: 'Cinzel', serif; --font-body: 'Inter', sans-serif; }
  body { font-family: var(--font-body); }
  h1, h2, h3, .font-serif { font-family: var(--font-heading); }
  .noise-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; opacity: 0.04; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E"); }
  .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;
document.head.appendChild(styleSheet);

const APP_CONFIG = { adminPasscode: "8888" };

const UI_TEXT = {
  cn: { works: "作品", about: "关于", language: "语言" },
  en: { works: "WORKS", about: "ABOUT", language: "LANGUAGE" },
  th: { works: "ผลงาน", about: "เกี่ยวกับ", language: "ภาษา" },
};

const DEFAULT_SLIDES = [
  {
    type: "image",
    title: "Serenity",
    url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2000",
    link: "",
  },
];

const DEFAULT_PROFILE = {
  brandName: "T8DAYS",
  logoUrl: "",
  email: "contact@t8days.com",
  location: "Bangkok",
  heroImage:
    "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=800&q=80",
  social: { instagram: "", tiktok: "", rednote: "" },
  heroSlides: DEFAULT_SLIDES,
  content: {
    cn: {
      title: "以光为墨，记录世界。",
      bio: "这里不只是照片，而是时间的切片。",
      aboutText: "你好，我是 T8DAY...",
    },
    en: {
      title: "Painting with light.",
      bio: "Slices of time.",
      aboutText: "Hi, I am T8DAY...",
    },
    th: {
      title: "วาดด้วยแสง",
      bio: "ชิ้นส่วนของเวลา",
      aboutText: "สวัสดี ฉันคือ T8DAY...",
    },
  },
};

const DEFAULT_SETTINGS = {
  themeColor: "stone",
  categories: [],
  profile: DEFAULT_PROFILE,
};

// --- 2. 基础组件 (Modal, Nav) ---

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [passcode, setPasscode] = useState("");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in-up">
        <Lock className="w-8 h-8 text-neutral-500 mx-auto mb-4" />
        <h3 className="text-white text-lg font-light tracking-widest uppercase mb-6">
          Admin Access
        </h3>
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
          className="w-full bg-black border border-neutral-700 rounded px-4 py-3 text-white text-center tracking-[0.5em] mb-6 focus:outline-none focus:border-white transition-colors"
          autoFocus
        />
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-neutral-500 hover:text-white text-sm uppercase"
          >
            Cancel
          </button>
          <button
            onClick={() => onLogin(passcode)}
            className="flex-1 py-3 bg-white text-black font-bold rounded text-sm uppercase hover:bg-neutral-200"
          >
            Enter
          </button>
        </div>
      </div>
    </div>
  );
};

const GlobalNav = ({
  profile,
  ui,
  onNavClick,
  lang,
  setLang,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 py-8 px-6 md:px-12 flex justify-between items-center transition-all duration-500 bg-gradient-to-b from-neutral-950/80 to-transparent backdrop-blur-[2px]">
        <div
          className="cursor-pointer flex items-center gap-2 hover:opacity-80 transition-opacity"
          onClick={() => onNavClick("home")}
        >
          {profile.logoUrl ? (
            <img
              src={profile.logoUrl}
              alt="Logo"
              className="h-8 md:h-10 w-auto object-contain"
            />
          ) : (
            <>
              <Aperture className="w-4 h-4 text-white/40" />
              <span className="text-white/40 font-medium tracking-widest text-sm font-serif">
                {profile.brandName}
              </span>
            </>
          )}
        </div>
        <div className="hidden md:flex items-center gap-12">
          <div className="flex gap-8 text-xs font-bold tracking-[0.15em] uppercase text-neutral-400 font-sans">
            <button
              onClick={() => onNavClick("works")}
              className="hover:text-white transition-colors pb-1"
            >
              {ui.works}
            </button>
            <button
              onClick={() => onNavClick("about")}
              className="hover:text-white transition-colors pb-1"
            >
              {ui.about}
            </button>
          </div>
          <div
            className="relative group"
            onMouseEnter={() => setLangDropdownOpen(true)}
            onMouseLeave={() => setLangDropdownOpen(false)}
          >
            <button className="flex items-center gap-1 text-[10px] font-bold text-neutral-600 hover:text-white uppercase tracking-widest transition-colors">
              <Globe className="w-3 h-3 mr-1" /> {ui.language}{" "}
              <ChevronDown className="w-3 h-3" />
            </button>
            <div
              className={`absolute top-full right-0 pt-4 transition-opacity duration-300 ${
                langDropdownOpen ? "opacity-100 visible" : "opacity-0 invisible"
              }`}
            >
              <div className="bg-neutral-900 border border-neutral-800 p-2 rounded flex flex-col gap-2 min-w-[80px] shadow-xl">
                {["en", "cn", "th"].map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLang(l);
                      setLangDropdownOpen(false);
                    }}
                    className={`text-[10px] font-bold uppercase text-left px-2 py-1 rounded ${
                      lang === l
                        ? "text-white"
                        : "text-neutral-500 hover:bg-neutral-800"
                    }`}
                  >
                    {l === "cn" ? "中文" : l === "en" ? "English" : "ไทย"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="md:hidden flex items-center gap-4">
          <button
            onClick={() =>
              setLang(lang === "en" ? "cn" : lang === "cn" ? "th" : "en")
            }
            className="text-[10px] font-bold uppercase text-neutral-400 border border-neutral-800 px-2 py-1 rounded"
          >
            {lang}
          </button>
          <button
            className="text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-neutral-950 flex flex-col items-center justify-center animate-fade-in-up">
          <div className="flex flex-col gap-12 text-3xl font-thin text-white tracking-widest items-center font-serif">
            <button onClick={() => onNavClick("works")}>{ui.works}</button>
            <button onClick={() => onNavClick("about")}>{ui.about}</button>
          </div>
        </div>
      )}
    </>
  );
};

// --- 3. 页面组件 ---

const HeroSlideshow = ({ slides, onIndexChange, onLinkClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    if (!slides || slides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);

  useEffect(() => {
    onIndexChange && onIndexChange(currentIndex);
  }, [currentIndex, onIndexChange]);

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  const handleSlideClick = () => {
    if (currentSlide.link) {
      if (onLinkClick) {
        onLinkClick(currentSlide.link);
      } else {
        window.open(currentSlide.link, "_blank");
      }
    }
  };

  return (
    <div
      className="absolute inset-0 w-full h-full bg-neutral-900 cursor-pointer"
      onClick={handleSlideClick}
    >
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 w-full h-full transition-opacity duration-[2000ms] ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          {slide.type === "video" ? (
            <video
              src={slide.url}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full bg-cover bg-center transform transition-transform duration-[10000ms] hover:scale-105"
              style={{ backgroundImage: `url("${slide.url}")` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
        </div>
      ))}
    </div>
  );
};

const AboutPage = ({ profile, lang, onClose }) => {
  const content = {
    ...DEFAULT_PROFILE.content[lang],
    ...(profile.content?.[lang] || {}),
  };
  return (
    <div className="fixed inset-0 z-30 bg-neutral-950 overflow-y-auto animate-fade-in-up no-scrollbar">
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 container mx-auto px-6 md:px-12 pt-32 pb-12 max-w-5xl">
          <div className="flex flex-col md:flex-row gap-16 items-start">
            <div className="w-full md:w-5/12 sticky top-32">
              <div className="aspect-[4/5] bg-neutral-900 overflow-hidden grayscale hover:grayscale-0 transition-all duration-1000 ease-out shadow-2xl">
                <img
                  src={profile.heroImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="w-full md:w-7/12 pt-4">
              <h1 className="text-3xl md:text-5xl font-thin text-white mb-12 leading-tight font-serif">
                {content.title}
              </h1>
              <div className="prose prose-invert prose-lg max-w-none text-neutral-400 font-light leading-relaxed space-y-8 whitespace-pre-line text-sm md:text-base font-sans">
                {content.aboutText}
              </div>
              <div
                className="mt-24 pt-12 border-t border-neutral-900 grid grid-cols-1 gap-8"
                id="contact-info"
              >
                <div>
                  <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-4">
                    Contact
                  </h3>
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-white text-xl font-light hover:text-neutral-400 transition-colors block mb-2 font-serif"
                  >
                    {profile.email}
                  </a>
                  <p className="text-neutral-500 font-light">
                    {profile.location}
                  </p>
                </div>
                <div className="flex gap-6">
                  {profile.social?.instagram && (
                    <a
                      href={profile.social.instagram}
                      target="_blank"
                      className="text-neutral-500 hover:text-white transition-colors text-xs tracking-widest uppercase flex items-center gap-1"
                    >
                      <Instagram size={14} /> IG
                    </a>
                  )}
                  {profile.social?.tiktok && (
                    <a
                      href={profile.social.tiktok}
                      target="_blank"
                      className="text-neutral-500 hover:text-white transition-colors text-xs tracking-widest uppercase flex items-center gap-1"
                    >
                      <Music2 size={14} /> TK
                    </a>
                  )}
                  {profile.social?.rednote && (
                    <a
                      href={profile.social.rednote}
                      target="_blank"
                      className="text-neutral-500 hover:text-white transition-colors text-xs tracking-widest uppercase flex items-center gap-1"
                    >
                      <ExternalLink size={14} /> RED
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 text-neutral-500 hover:text-white transition-colors p-4"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

const ImmersiveLightbox = ({
  initialIndex,
  images,
  onClose,
  onIndexChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showSplash, setShowSplash] = useState(true);
  const currentImage = images[currentIndex];

  const changeImage = (direction) => {
    let nextIndex;
    if (direction === "next") {
      nextIndex = (currentIndex + 1) % images.length;
    } else {
      nextIndex = (currentIndex - 1 + images.length) % images.length;
    }
    setCurrentIndex(nextIndex);
    if (onIndexChange) onIndexChange(nextIndex);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") changeImage("next");
      if (e.key === "ArrowLeft") changeImage("prev");
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!currentImage) return null;
  const isHighRes = currentImage.width > 1920 && currentImage.height > 1080;
  const imgClassName = isHighRes ? "h-[75vh] w-auto" : "max-h-[75vh] w-auto";

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-fade-in">
      <div
        className={`absolute inset-0 z-[110] bg-black flex items-center justify-center pointer-events-none transition-opacity duration-1000 ${
          showSplash ? "opacity-100" : "opacity-0"
        }`}
      >
        <h2 className="text-2xl font-serif text-white tracking-[0.5em] uppercase">
          {currentImage.project}
        </h2>
      </div>
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-50 text-neutral-500 hover:text-white transition-colors p-4"
      >
        <X className="w-6 h-6" />
      </button>
      <div
        className="absolute top-0 left-0 w-1/3 h-full z-20 cursor-w-resize"
        onClick={() => changeImage("prev")}
      />
      <div
        className="absolute top-0 right-0 w-1/3 h-full z-20 cursor-e-resize"
        onClick={() => changeImage("next")}
      />
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4 pointer-events-none">
        <img
          src={currentImage.url}
          alt="Photo"
          className={`${imgClassName} object-contain shadow-2xl transition-opacity duration-300`}
        />
      </div>
      <div className="absolute bottom-8 left-8 z-30 pointer-events-none">
        <div className="bg-black/0 backdrop-blur-none p-4 rounded-sm">
          <div className="text-white/40 font-serif font-thin text-xs tracking-widest mb-1">
            {currentImage.year} — {currentImage.project}
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 right-8 z-30 text-white/30 font-mono text-xs tracking-widest pointer-events-none">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};

const ProjectRow = ({ projectTitle, photos, onImageClick }) => {
  const [isHovering, setIsHovering] = useState(false);
  const scrollContainerRef = useRef(null);
  const animationRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!scrollContainerRef.current) return;
    const { left, width } = scrollContainerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const stopScroll = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
    if (x > width * 0.8) {
      stopScroll();
      const scrollRight = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft += 5;
          animationRef.current = requestAnimationFrame(scrollRight);
        }
      };
      scrollRight();
    } else if (x < width * 0.2) {
      stopScroll();
      const scrollLeft = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft -= 5;
          animationRef.current = requestAnimationFrame(scrollLeft);
        }
      };
      scrollLeft();
    } else {
      stopScroll();
    }
  };

  const handleMouseEnter = () => {
    if (window.innerWidth >= 768) {
      setTimeout(() => setIsHovering(true), 1000);
    }
  };
  const handleMouseLeave = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsHovering(false);
  };
  const isProjectTitleVisible = isHovering && window.innerWidth >= 768;

  return (
    <div
      className="relative group/row mb-8 transition-all duration-1000"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <div
        className={`hidden md:flex absolute inset-0 z-10 items-center justify-start pl-4 pointer-events-none transition-opacity duration-700 ease-out ${
          isProjectTitleVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <h3 className="text-2xl md:text-3xl font-thin text-white/80 tracking-widest uppercase drop-shadow-2xl mix-blend-difference font-serif">
          {projectTitle}
        </h3>
      </div>
      <div
        ref={scrollContainerRef}
        className={`flex overflow-x-auto no-scrollbar gap-0.5 md:gap-1 transition-opacity duration-700 ease-out ${
          isProjectTitleVisible ? "opacity-30" : "opacity-100"
        }`}
        style={{ scrollBehavior: "auto" }}
      >
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="flex-shrink-0 aspect-square bg-neutral-900 overflow-hidden cursor-pointer w-[28vw] md:w-[9vw]"
            onClick={() => onImageClick(photo, photos)}
          >
            <img
              src={photo.url}
              alt="Work"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-110"
            />
          </div>
        ))}
        <div className="w-8 flex-shrink-0"></div>
      </div>
    </div>
  );
};

const WorksPage = ({ photos, profile, ui, onImageClick }) => {
  const groupedByYearAndProject = photos.reduce((acc, photo) => {
    const year = photo.year ? String(photo.year).trim() : "Unsorted";
    const project = photo.project
      ? String(photo.project).trim()
      : "Uncategorized";
    if (!acc[year]) acc[year] = {};
    if (!acc[year][project]) acc[year][project] = [];
    acc[year][project].push(photo);
    return acc;
  }, {});

  const sortedYears = Object.keys(groupedByYearAndProject).sort(
    (a, b) => b - a
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white animate-fade-in-up">
      <div className="pt-32 pb-32 px-4 md:px-12 container mx-auto max-w-[1920px]">
        {sortedYears.map((year) => (
          <div
            key={year}
            className="mb-12 flex flex-col md:flex-row gap-4 md:gap-8"
          >
            <div className="md:w-48 flex-shrink-0 sticky top-32 h-fit pointer-events-none">
              <span className="text-2xl font-serif font-thin text-white/50 tracking-widest block leading-none -ml-2 transition-all font-serif">
                {year}
              </span>
            </div>
            <div className="flex-grow flex flex-col gap-8 overflow-hidden">
              {Object.keys(groupedByYearAndProject[year]).map(
                (projectTitle) => (
                  <ProjectRow
                    key={projectTitle}
                    projectTitle={projectTitle}
                    photos={groupedByYearAndProject[year][projectTitle]}
                    onImageClick={onImageClick}
                  />
                )
              )}
            </div>
          </div>
        ))}
        {photos.length === 0 && (
          <div className="text-center py-40 text-neutral-700 font-thin tracking-widest uppercase">
            Collection Empty
          </div>
        )}
        <div className="text-center pt-20 border-t border-neutral-900">
          <p className="text-neutral-600 text-[10px] tracking-[0.3em] uppercase font-sans">
            © {new Date().getFullYear()} {profile.brandName}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- 4. 后台管理组件 ---

const ProfileSettings = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState(settings.profile);
  const [activeLangTab, setActiveLangTab] = useState("cn");
  const [uploading, setUploading] = useState(false);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));
  const handleSocialChange = (field, value) =>
    setFormData((prev) => ({
      ...prev,
      social: { ...prev.social, [field]: value },
    }));
  const handleContentChange = (lang, field, value) =>
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [lang]: { ...prev.content[lang], [field]: value },
      },
    }));

  const handleAvatarUpload = async (e) => {
    if (!e.target.files[0]) return;
    setUploading(true);
    try {
      const url = await uploadFileToStorage(
        e.target.files[0],
        `profile/avatar_${Date.now()}`
      );
      handleChange("heroImage", url);
    } catch (err) {
      alert(err.message);
    }
    setUploading(false);
  };

  const handleSave = () => {
    onUpdate({ ...settings, profile: formData });
    alert("Profile saved!");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 flex gap-8">
        <div className="w-1/3">
          <label className="block relative group cursor-pointer">
            <div className="aspect-[4/5] bg-black rounded overflow-hidden border border-neutral-700">
              <img
                src={formData.heroImage}
                className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                {uploading ? (
                  <Loader2 className="animate-spin text-white" />
                ) : (
                  <UploadCloud className="text-white" />
                )}
              </div>
            </div>
            <input
              type="file"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <span className="text-xs text-center block mt-2 text-neutral-500">
              Click to upload portrait
            </span>
          </label>
        </div>
        <div className="w-2/3 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5" /> Basic Info
          </h3>
          <input
            className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
            placeholder="Brand Name"
            value={formData.brandName}
            onChange={(e) => handleChange("brandName", e.target.value)}
          />
          <input
            className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />
          <input
            className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
            placeholder="Location"
            value={formData.location}
            onChange={(e) => handleChange("location", e.target.value)}
          />
        </div>
      </div>

      <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 space-y-4">
        <h3 className="text-lg font-bold text-white">Social Media</h3>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-2 bg-black p-2 rounded border border-neutral-700">
            <Instagram size={16} className="text-neutral-400" />
            <input
              className="bg-transparent w-full text-white outline-none text-sm"
              placeholder="Instagram URL"
              value={formData.social?.instagram || ""}
              onChange={(e) => handleSocialChange("instagram", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-black p-2 rounded border border-neutral-700">
            <Music2 size={16} className="text-neutral-400" />
            <input
              className="bg-transparent w-full text-white outline-none text-sm"
              placeholder="TikTok URL"
              value={formData.social?.tiktok || ""}
              onChange={(e) => handleSocialChange("tiktok", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-black p-2 rounded border border-neutral-700">
            <ExternalLink size={16} className="text-neutral-400" />
            <input
              className="bg-transparent w-full text-white outline-none text-sm"
              placeholder="RED (Little Red Book) URL"
              value={formData.social?.rednote || ""}
              onChange={(e) => handleSocialChange("rednote", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Type className="w-5 h-5" /> Biography (Multi-language)
          </h3>
          <div className="flex gap-2">
            {["cn", "en", "th"].map((l) => (
              <button
                key={l}
                onClick={() => setActiveLangTab(l)}
                className={`px-3 py-1 rounded text-xs uppercase font-bold ${
                  activeLangTab === l
                    ? "bg-white text-black"
                    : "bg-black text-neutral-500"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <input
            className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
            placeholder="Home Title"
            value={formData.content[activeLangTab].title}
            onChange={(e) =>
              handleContentChange(activeLangTab, "title", e.target.value)
            }
          />
          <input
            className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
            placeholder="Home Bio (Short)"
            value={formData.content[activeLangTab].bio}
            onChange={(e) =>
              handleContentChange(activeLangTab, "bio", e.target.value)
            }
          />
          <textarea
            className="w-full bg-black border border-neutral-700 rounded p-2 text-white h-48"
            placeholder="Full About Text"
            value={formData.content[activeLangTab].aboutText}
            onChange={(e) =>
              handleContentChange(activeLangTab, "aboutText", e.target.value)
            }
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-white text-black font-bold py-3 rounded hover:bg-neutral-200 transition-colors"
      >
        Save All Profile Settings
      </button>
    </div>
  );
};

const SlidesSettings = ({ settings, onUpdate }) => {
  const [slides, setSlides] = useState(settings.profile.heroSlides || []);
  const [form, setForm] = useState({ title: "", link: "", url: "" });
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    if (!e.target.files[0]) return;
    setUploading(true);
    try {
      const url = await uploadFileToStorage(
        e.target.files[0],
        `slides/slide_${Date.now()}`
      );
      setForm((prev) => ({ ...prev, url }));
    } catch (err) {
      alert(err.message);
    }
    setUploading(false);
  };

  const handleSaveSlide = () => {
    if (!form.url) return alert("Please upload an image");
    const newSlides = [...slides, { ...form, type: "image" }];
    setSlides(newSlides);
    setForm({ title: "", link: "", url: "" });
    onUpdate({
      ...settings,
      profile: { ...settings.profile, heroSlides: newSlides },
    });
  };

  const handleDelete = (idx) => {
    const newSlides = slides.filter((_, i) => i !== idx);
    setSlides(newSlides);
    onUpdate({
      ...settings,
      profile: { ...settings.profile, heroSlides: newSlides },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
        <h3 className="text-lg font-bold text-white mb-4">Add New Slide</h3>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3 aspect-video bg-black rounded border border-neutral-700 flex items-center justify-center relative overflow-hidden group">
            {form.url ? (
              <img src={form.url} className="w-full h-full object-cover" />
            ) : (
              <span className="text-neutral-600 text-xs">
                Click to Upload Image
              </span>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" />
              </div>
            )}
            <label className="absolute inset-0 cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
          <div className="w-full md:w-2/3 space-y-3">
            <input
              className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
              placeholder="Slide Title (Optional)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
              placeholder="Link URL (e.g., https://...)"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
            />
            <button
              onClick={handleSaveSlide}
              disabled={!form.url}
              className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-neutral-200 disabled:opacity-50"
            >
              Add Slide
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex gap-4 items-center"
          >
            <img
              src={slide.url}
              className="w-24 h-16 object-cover rounded bg-black"
            />
            <div className="flex-grow">
              <div className="font-bold text-white">
                {slide.title || "Untitled"}
              </div>
              <div className="text-xs text-neutral-500 truncate">
                {slide.link ? `Links to: ${slide.link}` : "No link"}
              </div>
            </div>
            <button
              onClick={() => handleDelete(idx)}
              className="p-2 bg-red-900/30 text-red-500 rounded hover:bg-red-900/50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const PhotosManager = ({
  photos,
  onAddPhoto,
  onDeletePhoto,
  onBatchUpdate,
}) => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadYear, setUploadYear] = useState(
    new Date().getFullYear().toString()
  );
  const [uploadProject, setUploadProject] = useState("");
  const [localPhotos, setLocalPhotos] = useState(photos);

  useEffect(() => {
    setLocalPhotos(photos);
  }, [photos]);

  const grouped = localPhotos.reduce((acc, p) => {
    const y = p.year ? String(p.year).trim() : "Unsorted";
    const proj = p.project ? String(p.project).trim() : "Uncategorized";
    if (!acc[y]) acc[y] = {};
    if (!acc[y][proj]) acc[y][proj] = [];
    acc[y][proj].push(p);
    return acc;
  }, {});

  const handleBatchUpload = async () => {
    if (files.length === 0) return;
    if (!uploadProject.trim())
      return alert(
        "Please enter a Project Name (e.g. 'Neon Rain') to organize these photos."
      );

    setUploading(true);
    try {
      const promises = Array.from(files).map(async (file, idx) => {
        const path = `photos/${uploadYear}/${uploadProject.trim()}/${Date.now()}_${idx}`;
        const url = await uploadFileToStorage(file, path);
        return onAddPhoto({
          title: file.name.split(".")[0],
          year: uploadYear.trim(),
          project: uploadProject.trim(),
          url: url,
          order: 9999, // New items at end
          isVisible: true,
        });
      });
      await Promise.all(promises);
      setFiles([]);
      alert("Upload Complete!");
    } catch (e) {
      alert(e.message);
    }
    setUploading(false);
  };

  const handleProjectUpload = async (e, year, project) => {
    const projectFiles = e.target.files;
    if (!projectFiles || projectFiles.length === 0) return;

    setUploading(true);
    try {
      const promises = Array.from(projectFiles).map(async (file, idx) => {
        const path = `photos/${year}/${project}/${Date.now()}_${idx}`;
        const url = await uploadFileToStorage(file, path);
        return onAddPhoto({
          title: file.name.split(".")[0],
          year: year,
          project: project,
          url: url,
          order: 9999,
          isVisible: true,
        });
      });
      await Promise.all(promises);
      alert("Added photos to " + project);
    } catch (e) {
      alert(e.message);
    }
    setUploading(false);
  };

  const handleRenameProject = async (oldName, year) => {
    const newName = prompt(`Rename project "${oldName}" to:`, oldName);
    if (!newName || newName === oldName) return;

    const photosToUpdate = photos.filter(
      (p) =>
        (p.year === year || (!p.year && year === "Unsorted")) &&
        (p.project === oldName || (!p.project && oldName === "Uncategorized"))
    );

    if (confirm(`Update ${photosToUpdate.length} photos to "${newName}"?`)) {
      onBatchUpdate(
        photosToUpdate.map((p) => ({ id: p.id, project: newName }))
      );
    }
  };

  const moveProject = (year, projectTitle, direction) => {
    const projectsInYear = Object.keys(grouped[year]);
    const currentIndex = projectsInYear.indexOf(projectTitle);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= projectsInYear.length) return;

    // Swap projects array
    const newProjectsOrder = [...projectsInYear];
    [newProjectsOrder[currentIndex], newProjectsOrder[newIndex]] = [
      newProjectsOrder[newIndex],
      newProjectsOrder[currentIndex],
    ];

    // Re-calculate order for ALL photos in this year based on new project sequence
    let currentOrderCounter = 1;
    const updates = [];
    const newLocalPhotos = [...localPhotos]; // Clone

    // For each project in the new order...
    newProjectsOrder.forEach((proj) => {
      // Find photos for this project
      const projectPhotos = grouped[year][proj];
      // Keep their internal relative order (sorted by current order)
      projectPhotos.sort((a, b) => (a.order || 0) - (b.order || 0));

      projectPhotos.forEach((p) => {
        // Find in local array and update
        const localIndex = newLocalPhotos.findIndex((lp) => lp.id === p.id);
        if (localIndex > -1) {
          newLocalPhotos[localIndex] = {
            ...newLocalPhotos[localIndex],
            order: currentOrderCounter,
          };
          updates.push({ id: p.id, order: currentOrderCounter });
        }
        currentOrderCounter++;
      });
    });

    setLocalPhotos(newLocalPhotos); // Immediate UI update
    // We don't auto-save to DB here to let user confirm, or we could.
    // Let's just update local state, user must click "Save Order"
  };

  // Drag Sorting Logic
  const [draggedItem, setDraggedItem] = useState(null);

  const onDragStart = (e, item) => {
    setDraggedItem(item);
  };

  const onDragOver = (e, targetItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) return;
    if (
      draggedItem.project !== targetItem.project ||
      draggedItem.year !== targetItem.year
    )
      return;

    const items = [...localPhotos];
    const fromIndex = items.findIndex((i) => i.id === draggedItem.id);
    const toIndex = items.findIndex((i) => i.id === targetItem.id);

    if (fromIndex < 0 || toIndex < 0) return;

    items.splice(fromIndex, 1);
    items.splice(toIndex, 0, draggedItem);
    setLocalPhotos(items);
  };

  const handleSaveOrder = () => {
    const updates = localPhotos.map((p, index) => ({
      id: p.id,
      order: index + 1,
    }));
    onBatchUpdate(updates);
    alert("Order saved!");
  };

  return (
    <div className="space-y-12">
      {/* 1. Upload Area */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl sticky top-0 z-20 shadow-xl">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <UploadCloud className="w-5 h-5" /> Batch Upload
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-neutral-500 uppercase block mb-1">
              Year
            </label>
            <input
              className="w-full bg-black border border-neutral-700 rounded p-3 text-white"
              value={uploadYear}
              onChange={(e) => setUploadYear(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 uppercase block mb-1">
              Project Name (Required)
            </label>
            <input
              className="w-full bg-black border border-neutral-700 rounded p-3 text-white"
              placeholder="e.g. Urban Life"
              value={uploadProject}
              onChange={(e) => setUploadProject(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 uppercase block mb-1">
              Photos
            </label>
            <div className="relative border-2 border-dashed border-neutral-700 bg-black rounded flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer h-[46px]">
              <span className="text-xs font-bold uppercase">
                {files.length > 0 ? `${files.length} files` : "Select Images"}
              </span>
              <input
                type="file"
                multiple
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => setFiles(e.target.files)}
              />
            </div>
          </div>
        </div>
        <button
          onClick={handleBatchUpload}
          disabled={uploading || files.length === 0}
          className="w-full bg-white text-black font-bold py-3 rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors"
        >
          {uploading ? "Uploading & Organizing..." : "Upload Photos"}
        </button>
      </div>

      <div className="space-y-12 pb-24">
        <div className="flex justify-end">
          <button
            onClick={handleSaveOrder}
            className="bg-white text-black px-4 py-2 rounded font-bold text-sm hover:bg-neutral-200"
          >
            Save Order
          </button>
        </div>
        {Object.keys(grouped)
          .sort((a, b) => b - a)
          .map((year) => (
            <div key={year} className="space-y-6">
              <h4 className="text-neutral-500 font-serif text-2xl border-b border-neutral-800 pb-2">
                {year}
              </h4>
              {Object.keys(grouped[year]).map((proj, projIndex) => (
                <div
                  key={proj}
                  className="bg-neutral-900/30 p-6 rounded-xl border border-neutral-800"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h5 className="text-white font-bold flex items-center gap-2">
                        <FolderOpen size={16} /> {proj}
                      </h5>
                      <button
                        onClick={() => handleRenameProject(proj, year)}
                        className="text-neutral-500 hover:text-white p-1 rounded"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveProject(year, proj, "up")}
                        className="p-1 bg-neutral-800 text-neutral-400 hover:text-white rounded"
                        title="Move Project Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => moveProject(year, proj, "down")}
                        className="p-1 bg-neutral-800 text-neutral-400 hover:text-white rounded"
                        title="Move Project Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {grouped[year][proj].map((p) => (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, p)}
                        onDragOver={(e) => onDragOver(e, p)}
                        className="aspect-square relative group bg-black rounded border border-neutral-700 overflow-hidden cursor-move"
                      >
                        <img
                          src={p.url}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        <button
                          onClick={() => {
                            if (confirm("Delete?")) onDeletePhoto(p.id);
                          }}
                          className="absolute top-1 right-1 bg-red-500 p-1 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {/* Add Photo Button for this project */}
                    <div className="aspect-square relative group bg-neutral-900 border-2 border-dashed border-neutral-700 rounded flex flex-col items-center justify-center cursor-pointer hover:border-white hover:text-white text-neutral-500 transition-colors">
                      <Plus size={24} />
                      <span className="text-[10px] uppercase font-bold mt-1">
                        Add
                      </span>
                      <input
                        type="file"
                        multiple
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleProjectUpload(e, year, proj)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
};

const AdminDashboard = ({
  photos,
  settings,
  onLogout,
  onAddPhoto,
  onDeletePhoto,
  onUpdateSettings,
  onBatchUpdate,
}) => {
  const [tab, setTab] = useState("photos");
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-200 font-sans flex flex-col">
      {/* Top Header for Admin */}
      <div className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-950">
        <h1 className="text-xl font-bold text-white flex items-center gap-2 font-serif">
          <Settings className="w-5 h-5" /> T8DAY CMS
        </h1>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-red-500 hover:text-red-400 text-sm font-bold bg-neutral-900 px-4 py-2 rounded"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-neutral-800 p-6 flex flex-col bg-neutral-950 flex-shrink-0">
          <div className="space-y-1 mb-8">
            <button
              onClick={() => setTab("photos")}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                tab === "photos"
                  ? "bg-white text-black font-bold"
                  : "text-neutral-500 hover:text-white"
              }`}
            >
              Photos & Projects
            </button>
            <button
              onClick={() => setTab("slides")}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                tab === "slides"
                  ? "bg-white text-black font-bold"
                  : "text-neutral-500 hover:text-white"
              }`}
            >
              Hero Slides
            </button>
            <button
              onClick={() => setTab("profile")}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                tab === "profile"
                  ? "bg-white text-black font-bold"
                  : "text-neutral-500 hover:text-white"
              }`}
            >
              Profile & Settings
            </button>
          </div>
        </div>
        <div className="flex-1 p-8 overflow-y-auto">
          {tab === "photos" && (
            <PhotosManager
              photos={photos}
              onAddPhoto={onAddPhoto}
              onDeletePhoto={onDeletePhoto}
              onBatchUpdate={onBatchUpdate}
            />
          )}
          {tab === "slides" && (
            <SlidesSettings settings={settings} onUpdate={onUpdateSettings} />
          )}
          {tab === "profile" && (
            <ProfileSettings settings={settings} onUpdate={onUpdateSettings} />
          )}
        </div>
      </div>
    </div>
  );
};

const MainView = ({ photos, settings, onLoginClick, isOffline }) => {
  // Helper to get initial state from URL
  const getInitialState = () => {
    const path = window.location.pathname;
    if (path === "/about") return { view: "home", showAbout: true };
    if (path === "/works") return { view: "works", showAbout: false };
    return { view: "home", showAbout: false };
  };

  const [state, setState] = useState(getInitialState);
  const { view, showAbout } = state;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialLightboxIndex, setInitialLightboxIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [lang, setLang] = useState("en");
  const [lightboxImages, setLightboxImages] = useState([]); // Isolated images for lightbox

  const rawProfile = settings?.profile || {};
  const profile = {
    ...DEFAULT_PROFILE,
    ...rawProfile,
    content: {
      cn: { ...DEFAULT_PROFILE.content.cn, ...(rawProfile.content?.cn || {}) },
      en: { ...DEFAULT_PROFILE.content.en, ...(rawProfile.content?.en || {}) },
      th: { ...DEFAULT_PROFILE.content.th, ...(rawProfile.content?.th || {}) },
    },
  };
  const slides =
    profile.heroSlides && profile.heroSlides.length > 0
      ? profile.heroSlides
      : DEFAULT_SLIDES;
  const content = profile.content[lang];
  const ui = UI_TEXT[lang];
  const currentSlideTitle =
    slides[currentSlideIndex]?.title || profile.brandName;
  const visiblePhotos = photos.filter((p) => p.isVisible !== false);

  // Sync state with URL on popstate
  useEffect(() => {
    const handlePopState = () => {
      setState(getInitialState());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Handle direct URL access to projects (e.g. /works/huahin-2024/01)
  useEffect(() => {
    if (visiblePhotos.length === 0) return;

    const pathParts = window.location.pathname.split("/").filter(Boolean);
    // Expecting /works/project-slug/image-index
    if (pathParts.length >= 2 && pathParts[0] === "works") {
      const projectSlug = pathParts[1]; // e.g. "huahin-2024"
      const imageIndexStr = pathParts[2] || "01"; // Default to 01 if missing

      // Find project photos matching slug
      const targetPhotos = visiblePhotos.filter((p) => {
        const pSlug = slugify(`${p.project} ${p.year}`);
        const pSlugSimple = slugify(p.project);
        return pSlug === projectSlug || pSlugSimple === projectSlug;
      });

      if (targetPhotos.length > 0) {
        // Sort
        targetPhotos.sort((a, b) => (a.order || 999) - (b.order || 999));

        // Find index
        const imageIndex = parseInt(imageIndexStr, 10) - 1; // 1-based to 0-based
        const safeIndex = isNaN(imageIndex)
          ? 0
          : Math.max(0, Math.min(imageIndex, targetPhotos.length - 1));

        setLightboxImages(targetPhotos);
        setInitialLightboxIndex(safeIndex);
        setLightboxOpen(true);
        // Ensure background is works
        setState({ view: "works", showAbout: false });
      }
    }
  }, [visiblePhotos]); // Run when photos loaded

  const navigate = (path, newView, newShowAbout) => {
    window.history.pushState({}, "", path);
    setState({ view: newView, showAbout: newShowAbout });
  };

  const handleNavClick = (target) => {
    setMobileMenuOpen(false);
    if (target === "home") {
      navigate("/", "home", false);
    } else if (target === "works") {
      navigate("/works", "works", false);
    } else if (target === "about") {
      navigate("/about", "home", true);
    }
  };

  const handleCloseAbout = () => {
    navigate("/", "home", false);
  };

  const handleLinkNavigation = (link) => {
    // Check if internal link by comparing origin
    try {
      const url = new URL(link, window.location.origin);
      if (url.origin === window.location.origin) {
        // It's internal
        window.history.pushState({}, "", url.pathname);

        // Trigger manual update
        const pathParts = url.pathname.split("/").filter(Boolean);
        if (pathParts[0] === "works") {
          setState({ view: "works", showAbout: false });
          // If deep link, useEffect will catch it if photos loaded,
          // but to be instant we might need to manually trigger logic if we wanted.
          // Since useEffect depends on visiblePhotos, it might not re-run just on pushState.
          // However, for this specific request, just changing URL and view is often enough if the useEffect logic
          // was tied to location change. Since we can't listen to location change in useEffect easily without a router,
          // we might need to trigger the checking logic manually here too.
          // But let's keep it simple: the user wants "control in website".
          // If it's a generic link like /works, setting view is enough.
          // If it's a specific project, we might need to rely on the popstate listener if we dispatch one,
          // or just manually set state.
          // Let's dispatch a popstate event to trigger our listener? No, pushState doesn't trigger it.
          // We'll just rely on the fact that if they click a link to a project,
          // they likely want to see that project.

          // Re-run the logic from useEffect for the new path
          const projectSlug = pathParts[1];
          if (projectSlug) {
            const targetPhotos = visiblePhotos.filter((p) => {
              const pSlug = slugify(`${p.project} ${p.year}`);
              const pSlugSimple = slugify(p.project);
              return pSlug === projectSlug || pSlugSimple === projectSlug;
            });
            if (targetPhotos.length > 0) {
              targetPhotos.sort((a, b) => (a.order || 999) - (b.order || 999));
              const imageIndexStr = pathParts[2] || "01";
              const idx = parseInt(imageIndexStr, 10) - 1;
              const safeIndex = isNaN(idx)
                ? 0
                : Math.max(0, Math.min(idx, targetPhotos.length - 1));
              setLightboxImages(targetPhotos);
              setInitialLightboxIndex(safeIndex);
              setLightboxOpen(true);
            }
          }
        } else if (pathParts[0] === "about") {
          setState({ view: "home", showAbout: true });
        } else {
          setState({ view: "home", showAbout: false });
        }
      } else {
        window.location.href = link;
      }
    } catch (e) {
      window.location.href = link;
    }
  };

  const handleImageClick = (item, projectPhotos) => {
    const index = projectPhotos.findIndex((p) => p.id === item.id);
    if (index !== -1) {
      setLightboxImages(projectPhotos);
      setInitialLightboxIndex(index);
      setLightboxOpen(true);

      // Update URL
      const slug = slugify(`${item.project} ${item.year}`);
      const newPath = `/works/${slug}/${(index + 1)
        .toString()
        .padStart(2, "0")}`;
      window.history.pushState({}, "", newPath);
    }
  };

  const handleLightboxIndexChange = (newIndex) => {
    if (lightboxImages.length > 0) {
      const item = lightboxImages[newIndex];
      const slug = slugify(`${item.project} ${item.year}`);
      const newPath = `/works/${slug}/${(newIndex + 1)
        .toString()
        .padStart(2, "0")}`;
      window.history.replaceState({}, "", newPath);
    }
  };

  const handleLightboxClose = () => {
    setLightboxOpen(false);
    window.history.pushState({}, "", "/works");
  };

  return (
    <div className="bg-neutral-950 text-neutral-200 font-sans selection:bg-white selection:text-black relative">
      <div className="noise-bg"></div>
      <button
        onClick={onLoginClick}
        className="fixed bottom-6 right-6 z-50 bg-neutral-900/50 hover:bg-white hover:text-black text-white/50 p-3 rounded-full transition-all duration-500 border border-white/10 hover:border-white shadow-lg backdrop-blur-md"
      >
        <Settings className="w-4 h-4" />
      </button>
      <GlobalNav
        profile={profile}
        ui={ui}
        onNavClick={handleNavClick}
        lang={lang}
        setLang={setLang}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      {view === "home" && !showAbout && (
        <div className="relative h-screen w-screen overflow-hidden">
          <HeroSlideshow
            slides={slides}
            onIndexChange={setCurrentSlideIndex}
            onLinkClick={handleLinkNavigation}
          />
          <div className="absolute bottom-0 left-0 z-10 px-6 md:px-12 pb-16 md:pb-24 max-w-5xl w-full">
            <h2
              className="text-white/70 tracking-[0.4em] mb-6 uppercase text-[10px] font-bold animate-fade-in-up font-serif"
              style={{ animationDelay: "0.1s" }}
            >
              {content.title}
            </h2>
            <div className="overflow-hidden min-h-[3rem] md:min-h-[5rem]">
              <h1
                key={currentSlideTitle}
                className="text-3xl sm:text-4xl md:text-6xl font-thin mb-6 text-white tracking-wide leading-none opacity-95 animate-fade-in-up font-serif"
              >
                {currentSlideTitle}
              </h1>
            </div>
            <p
              className="text-neutral-400 text-xs sm:text-sm font-light max-w-lg leading-relaxed border-l border-white/10 pl-4 opacity-80 animate-fade-in-up font-sans"
              style={{ animationDelay: "0.3s" }}
            >
              {content.bio}
            </p>
          </div>
        </div>
      )}
      {view === "works" && !showAbout && (
        <WorksPage
          photos={visiblePhotos}
          profile={profile}
          ui={ui}
          onImageClick={handleImageClick}
        />
      )}
      {showAbout && (
        <AboutPage profile={profile} lang={lang} onClose={handleCloseAbout} />
      )}
      {lightboxOpen && (
        <ImmersiveLightbox
          initialIndex={initialLightboxIndex}
          images={lightboxImages}
          onClose={handleLightboxClose}
          onIndexChange={handleLightboxIndexChange}
        />
      )}
    </div>
  );
};

// --- Main App Logic ---

class ErrorBoundaryWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-neutral-500 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-black px-4 py-2 rounded"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent = () => {
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState("public");
  const [photos, setPhotos] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading((prev) => {
        if (prev) {
          console.warn("Loading timed out, switching to offline mode");
          setIsOffline(true);
          setPhotos([]);
          return false;
        }
        return prev;
      });
    }, 2500);

    const initAuth = async () => {
      if (!isFirebaseInitialized) return;
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth Failed", e);
      }
    };
    initAuth();

    const unsubAuth = isFirebaseInitialized
      ? onAuthStateChanged(auth, setUser)
      : () => {};
    return () => {
      clearTimeout(timeout);
      unsubAuth();
    };
  }, []);

  useEffect(() => {
    if (!user || !isFirebaseInitialized) return;

    const unsubPhotos = onSnapshot(
      getPublicCollection("photos"),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (a.order || 9999) - (b.order || 9999));
        setPhotos(data);
        setIsLoading(false);
      },
      (err) => {
        console.error("Data Load Error", err);
        setIsOffline(true);
        setIsLoading(false);
      }
    );

    const unsubSettings = onSnapshot(
      getPublicDoc("settings", "global"),
      (snap) => {
        if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
      }
    );

    return () => {
      unsubPhotos();
      unsubSettings();
    };
  }, [user]);

  const handleLoginAttempt = (pass) => {
    if (pass === APP_CONFIG.adminPasscode) {
      setShowLogin(false);
      setViewMode("admin");
    } else {
      alert("Wrong Passcode");
    }
  };
  const handleAddPhoto = async (d) =>
    await addDoc(getPublicCollection("photos"), {
      ...d,
      createdAt: serverTimestamp(),
    });
  const handleDeletePhoto = async (id) =>
    await deleteDoc(getPublicDoc("photos", id));
  const handleUpdateSettings = async (s) =>
    await setDoc(getPublicDoc("settings", "global"), s, { merge: true });

  const handleBatchUpdate = async (updates) => {
    try {
      const promises = updates.map((u) => {
        const { id, ...data } = u;
        return updateDoc(getPublicDoc("photos", id), data);
      });
      await Promise.all(promises);
    } catch (e) {
      console.error("Batch update failed:", e);
      alert("Update failed: " + e.message);
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-white" />
        <p className="tracking-[0.2em] text-xs uppercase font-bold font-serif mb-8">
          Loading T8DAY...
        </p>
        <button
          onClick={() => {
            setIsOffline(true);
            setIsLoading(false);
          }}
          className="px-4 py-2 border border-neutral-700 rounded text-xs uppercase hover:bg-neutral-800 transition-colors"
        >
          Launch Demo Mode
        </button>
      </div>
    );

  return (
    <>
      {viewMode === "public" ? (
        <MainView
          photos={photos}
          settings={settings}
          onLoginClick={() => setShowLogin(true)}
          isOffline={isOffline}
        />
      ) : (
        <AdminDashboard
          photos={photos}
          settings={settings}
          onLogout={() => setViewMode("public")}
          onAddPhoto={handleAddPhoto}
          onDeletePhoto={handleDeletePhoto}
          onUpdateSettings={handleUpdateSettings}
          onBatchUpdate={handleBatchUpdate}
        />
      )}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLoginAttempt}
      />
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundaryWrapper>
      <AppContent />
    </ErrorBoundaryWrapper>
  );
}
