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

// 安全的集合获取函数
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

// --- 3. 页面组件 (Slideshow, Works, About) ---

const HeroSlideshow = ({ slides, onIndexChange }) => {
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

  return (
    <div className="absolute inset-0 w-full h-full bg-neutral-900">
      {slides.map((slide, index) => (
        <div
          key={index}
          onClick={() => slide.link && window.open(slide.link, "_blank")}
          className={`absolute inset-0 w-full h-full transition-opacity duration-[2000ms] ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          } ${slide.link ? "cursor-pointer" : ""}`}
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
      </div>
    </div>
  );
};

const ImmersiveLightbox = ({ initialIndex, images, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showSplash, setShowSplash] = useState(true);
  const currentImage = images[currentIndex];

  const changeImage = (direction) => {
    let nextIndex;
    if (direction === "next") nextIndex = (currentIndex + 1) % images.length;
    else nextIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(nextIndex);
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
          {currentImage.project || currentImage.title}
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
          alt={currentImage.title}
          className={`${imgClassName} object-contain shadow-2xl transition-opacity duration-300`}
        />
      </div>
      <div className="absolute bottom-8 left-8 z-30 pointer-events-none">
        <div className="bg-black/0 backdrop-blur-none p-4 rounded-sm">
          <div className="text-white/40 font-serif font-thin text-xs tracking-widest mb-1">
            {currentImage.year} — {currentImage.project}
          </div>
          <div className="text-white text-xl font-serif tracking-wide">
            {currentImage.title}
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
            onClick={() => onImageClick(photo)}
          >
            <img
              src={photo.url}
              alt={photo.title}
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

// 4.1 个人资料
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

// 4.2 轮播图管理
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

// 4.3 照片管理
const PhotosManager = ({ photos, onAddPhoto, onDeletePhoto }) => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadYear, setUploadYear] = useState(
    new Date().getFullYear().toString()
  );
  const [uploadProject, setUploadProject] = useState("");

  const grouped = photos.reduce((acc, p) => {
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
          order: 9999,
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

  return (
    <div className="space-y-12">
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
        {Object.keys(grouped)
          .sort((a, b) => b - a)
          .map((year) => (
            <div key={year} className="space-y-6">
              <h4 className="text-neutral-500 font-serif text-2xl border-b border-neutral-800 pb-2">
                {year}
              </h4>
              {Object.keys(grouped[year]).map((proj) => (
                <div
                  key={proj}
                  className="bg-neutral-900/30 p-6 rounded-xl border border-neutral-800"
                >
                  <h5 className="text-white font-bold mb-4 flex items-center gap-2">
                    <FolderOpen size={16} /> {proj}
                  </h5>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {grouped[year][proj].map((p) => (
                      <div
                        key={p.id}
                        className="aspect-square relative group bg-black rounded border border-neutral-700 overflow-hidden"
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
}) => {
  const [tab, setTab] = useState("photos");
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-200 font-sans flex">
      <div className="w-64 border-r border-neutral-800 p-6 flex flex-col bg-neutral-950 flex-shrink-0">
        <h1 className="text-xl font-bold text-white mb-8 flex items-center gap-2 font-serif">
          <Settings className="w-5 h-5" /> T8DAY CMS
        </h1>
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
        <button
          onClick={onLogout}
          className="mt-auto flex items-center gap-2 text-red-500 hover:text-red-400 text-sm"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
      <div className="flex-1 p-8 overflow-y-auto">
        {tab === "photos" && (
          <PhotosManager
            photos={photos}
            onAddPhoto={onAddPhoto}
            onDeletePhoto={onDeletePhoto}
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
  );
};

const MainView = ({ photos, settings, onLoginClick, isOffline }) => {
  const [view, setView] = useState("home");
  const [showAbout, setShowAbout] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialLightboxIndex, setInitialLightboxIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [lang, setLang] = useState("en");

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

  const handleNavClick = (target) => {
    setMobileMenuOpen(false);
    if (target === "home") {
      setView("home");
      setShowAbout(false);
    } else if (target === "works") {
      setView("works");
      setShowAbout(false);
    } else if (target === "about") {
      setShowAbout(true);
    }
  };

  const handleImageClick = (item) => {
    const index = visiblePhotos.findIndex((p) => p.id === item.id);
    if (index !== -1) {
      setInitialLightboxIndex(index);
      setLightboxOpen(true);
    }
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
          <HeroSlideshow slides={slides} onIndexChange={setCurrentSlideIndex} />
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
        <AboutPage
          profile={profile}
          lang={lang}
          onClose={() => setShowAbout(false)}
        />
      )}
      {lightboxOpen && (
        <ImmersiveLightbox
          initialIndex={initialLightboxIndex}
          images={visiblePhotos}
          onClose={() => setLightboxOpen(false)}
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
          setPhotos([]); // Start with empty if timed out
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
