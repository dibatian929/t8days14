import React, { useState, useEffect, useRef, Component } from "react";
import * as Tone from "tone";
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
  Link,
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

// --- 0. 环境配置适配 (System Config) ---

// 您之前提供的配置 (用于 CodeSandbox 或本地运行)
const MANUAL_CONFIG = {
  apiKey: "AIzaSyCE-gHGrVGjGLDdBgOj_KSlH5rZqBtQrXM",
  authDomain: "my-t8day.firebaseapp.com",
  projectId: "my-t8day",
  storageBucket: "my-t8day.firebasestorage.app",
  messagingSenderId: "12397695094",
  appId: "1:12397695094:web:785bb4030b40f685754f57",
  measurementId: "G-FLLBH5DTNV",
};

// 智能配置获取：优先使用环境注入（如果有），否则使用手动配置
let firebaseConfig;
try {
  // 尝试检查全局变量是否存在
  if (typeof __firebase_config !== "undefined") {
    firebaseConfig = JSON.parse(__firebase_config);
  } else {
    throw new Error("Env config missing");
  }
} catch (e) {
  console.warn("Using Manual Firebase Config");
  firebaseConfig = MANUAL_CONFIG;
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// App ID 处理：如果是外部环境，使用通用 ID
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// 定义符合环境规则的路径生成器
const getPublicCollection = (colName) =>
  collection(db, "artifacts", appId, "public", "data", colName);
const getPublicDoc = (colName, docId) =>
  doc(db, "artifacts", appId, "public", "data", colName, docId);

// --- 1. 错误边界 (防止白屏) ---
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Runtime Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">System Error</h2>
          <p className="text-neutral-500 text-xs font-mono bg-neutral-900 p-4 rounded mb-6 max-w-md mx-auto text-left overflow-auto whitespace-pre-wrap">
            {this.state.error?.message || "Unknown error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-black px-6 py-3 rounded font-bold text-sm hover:bg-neutral-200 transition-colors"
          >
            Reload T8DAY
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- 2. 配置区域 ---
const APP_CONFIG = {
  adminPasscode: "8888", // 默认后台密码
};

// --- 4. 样片数据 ---
const MOCK_DATA = [
  {
    id: "m1",
    year: "2025",
    project: "Neon Rain",
    title: "Tokyo Tower",
    url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?q=80&w=400&auto=format&fit=crop",
    width: 2000,
    height: 3000,
    order: 1,
  },
  {
    id: "m2",
    year: "2025",
    project: "Neon Rain",
    title: "Shinjuku",
    url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=400&auto=format&fit=crop",
    width: 2000,
    height: 3000,
    order: 2,
  },
  {
    id: "f1",
    year: "2025",
    project: "Forest Breath",
    title: "Deep Woods",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400&auto=format&fit=crop",
    width: 2000,
    height: 3000,
    order: 3,
  },
];

const DEFAULT_SLIDES = [
  {
    type: "image",
    title: "Serenity",
    url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2000&auto=format&fit=crop",
  },
  {
    type: "image",
    title: "Urban Pulse",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2000&auto=format&fit=crop",
  },
];

const UI_TEXT = {
  cn: { works: "作品", about: "关于", language: "语言" },
  en: { works: "WORKS", about: "ABOUT", language: "LANGUAGE" },
  th: { works: "ผลงาน", about: "เกี่ยวกับ", language: "ภาษา" },
};

const DEFAULT_PROFILE = {
  brandName: "T8DAYS",
  logoUrl: "",
  email: "contact@t8days.com",
  location: "Bangkok",
  heroImage:
    "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=800&q=80",
  social: { instagram: "", tiktok: "" },
  heroSlides: DEFAULT_SLIDES,
  content: {
    cn: {
      title: "以光为墨，记录世界。",
      bio: "这里不只是照片，而是时间的切片。",
      aboutText:
        "你好，我是 T8DAY...\n\n我是一名专注于捕捉城市光影与自然纹理的摄影师。在这个快节奏的时代，我试图通过镜头让时间慢下来。\n\n每一次按下快门，都是与世界的一次对话。",
    },
    en: {
      title: "Painting with light.",
      bio: "Slices of time.",
      aboutText:
        "Hi, I am T8DAY...\n\nI focus on urban lights and natural textures. In this fast-paced era, I try to slow down time through my lens.\n\nEvery shutter click is a dialogue with the world.",
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

// --- 6. 工具函数：快门声 ---
const playShutterSound = async () => {
  try {
    if (Tone.context.state !== "running") {
      await Tone.start();
    }
    const noise = new Tone.Noise("white").toDestination();
    const filter = new Tone.Filter(3000, "highpass").connect(noise.filter);
    const envelope = new Tone.Envelope(0.005, 0.01, 0, 0).chain(noise.envelope);
    noise.start();
    envelope.triggerAttackRelease(0.02);
    setTimeout(() => {
      noise.stop();
      noise.dispose();
      filter.dispose();
      envelope.dispose();
    }, 100);
  } catch (e) {
    // Silent fail
  }
};

// --- 样式注入 (Font & Noise) ---
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@300;400;600&display=swap');
  
  :root {
    --font-heading: 'Cinzel', serif;
    --font-body: 'Inter', sans-serif;
  }

  body {
    font-family: var(--font-body);
  }

  h1, h2, h3, .font-serif {
    font-family: var(--font-heading);
  }

  .noise-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  }

  @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .hover-underline { position: relative; display: inline-block; }
  .hover-underline::after {
    content: ''; position: absolute; width: 0; height: 1px; bottom: -2px; left: 0;
    background-color: currentColor; transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .hover-underline:hover::after { width: 100%; }
`;
document.head.appendChild(styleSheet);

// --- 7. 组件部分 ---

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [passcode, setPasscode] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 max-w-sm w-full text-center shadow-2xl">
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
            className="flex-1 py-3 text-neutral-500 hover:text-white transition-colors text-sm uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            onClick={() => onLogin(passcode)}
            className="flex-1 py-3 bg-white text-black font-bold rounded text-sm uppercase tracking-wider hover:bg-neutral-200 transition-colors"
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
              className="hover:text-white transition-colors hover:border-b border-transparent hover:border-white pb-1"
            >
              {ui.works}
            </button>
            <button
              onClick={() => onNavClick("about")}
              className="hover:text-white transition-colors hover:border-b border-transparent hover:border-white pb-1"
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
                    className={`text-[10px] font-bold uppercase tracking-widest text-left px-2 py-1 hover:bg-neutral-800 rounded ${
                      lang === l ? "text-white" : "text-neutral-500"
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

const HeroSlideshow = ({ slides, onIndexChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    if (!slides || slides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % slides.length;
        if (onIndexChange) onIndexChange(next);
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [slides, onIndexChange]);

  if (!slides || slides.length === 0) return null;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none bg-neutral-900">
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
  const ui = UI_TEXT[lang];

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
                      className="text-neutral-500 hover:text-white transition-colors text-xs tracking-widest uppercase hover-underline"
                    >
                      Instagram
                    </a>
                  )}
                  {profile.social?.tiktok && (
                    <a
                      href={profile.social.tiktok}
                      target="_blank"
                      className="text-neutral-500 hover:text-white transition-colors text-xs tracking-widest uppercase hover-underline"
                    >
                      TikTok
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
  const [isFading, setIsFading] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(initialIndex);
  const [showSplash, setShowSplash] = useState(true);
  const touchStartRef = useRef(null);

  const currentImage = images[displayIndex];
  const projectTitle = currentImage.project || currentImage.title;

  // 修复：无限循环逻辑
  const changeImage = (direction) => {
    if (isFading) return;

    // 播放快门声 (Tone.js)
    playShutterSound();

    setIsFading(true);
    setTimeout(() => {
      let nextIndex;
      if (direction === "next") {
        // 下一张：如果是最后一张，跳回 0
        nextIndex = (currentIndex + 1) % images.length;
      } else {
        // 上一张：如果是第 0 张，跳到最后一张 (length - 1)
        nextIndex = (currentIndex - 1 + images.length) % images.length;
      }
      setCurrentIndex(nextIndex);
      setDisplayIndex(nextIndex);
      setTimeout(() => {
        setIsFading(false);
      }, 50);
    }, 300);
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) changeImage("next");
      else changeImage("prev");
    }
    touchStartRef.current = null;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") changeImage("next");
      if (e.key === "ArrowLeft") changeImage("prev");
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isFading]);

  const isHighRes = currentImage.width > 1920 && currentImage.height > 1080;
  const imgClassName = isHighRes ? "h-[75vh] w-auto" : "max-h-[75vh] w-auto";

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-fade-in"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {showSplash && (
        <ProjectSplash
          title={projectTitle}
          onFinish={() => setShowSplash(false)}
        />
      )}

      {!showSplash && (
        <>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 text-neutral-500 hover:text-white transition-colors p-4"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="absolute top-0 left-0 w-1/2 h-full z-20 cursor-prev hover:bg-gradient-to-r from-black/10 to-transparent group hidden md:block"
            onClick={() => changeImage("prev")}
          />
          <div
            className="absolute top-0 right-0 w-1/2 h-full z-20 cursor-next hover:bg-gradient-to-l from-black/10 to-transparent group hidden md:block"
            onClick={() => changeImage("next")}
          />
        </>
      )}

      <div className="relative z-10 w-full h-full flex items-center justify-center p-4 pointer-events-none">
        <img
          src={currentImage.url}
          alt={currentImage.title}
          className={`${imgClassName} object-contain shadow-2xl transition-opacity duration-500 ease-in-out ${
            isFading || showSplash ? "opacity-0" : "opacity-100"
          }`}
        />
      </div>

      {!showSplash && (
        <>
          <div
            className={`absolute bottom-8 left-8 z-30 pointer-events-none transition-opacity duration-300 ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="bg-black/0 backdrop-blur-none p-4 rounded-sm">
              <div className="text-white/20 font-serif font-thin text-sm tracking-widest mb-1">
                {currentImage.year}
              </div>
              <div className="text-white text-lg font-thin tracking-wide">
                {currentImage.title}
              </div>
              {currentImage.exif && (
                <div className="text-neutral-500 text-[10px] mt-2 font-mono">
                  {currentImage.exif}
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-8 right-8 z-30 text-white/30 font-mono text-xs tracking-widest pointer-events-none">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

const ProjectSplash = ({ title, onFinish }) => {
  const [opacity, setOpacity] = useState(1);
  const [textOpacity, setTextOpacity] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setTextOpacity(1), 100);
    const t2 = setTimeout(() => setTextOpacity(0), 1600);
    const t3 = setTimeout(() => {
      setOpacity(0);
      setTimeout(onFinish, 500);
    }, 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return (
    <div
      className="absolute inset-0 z-[200] bg-black flex items-center justify-center transition-opacity duration-500 ease-out"
      style={{ opacity: opacity, pointerEvents: "none" }}
    >
      <h2
        className="text-xl md:text-2xl font-thin text-white/50 tracking-[0.3em] uppercase transition-opacity duration-500 ease-in-out font-serif"
        style={{ opacity: textOpacity }}
      >
        {title}
      </h2>
    </div>
  );
};

const ProjectRow = ({ projectTitle, photos, onImageClick }) => {
  const [isHovering, setIsHovering] = useState(false);
  const timerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const animationRef = useRef(null);

  // 边缘滚动逻辑
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
      timerRef.current = setTimeout(() => setIsHovering(true), 1000);
    }
  };
  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsHovering(false);
  };

  const isMobile = window.innerWidth < 768;
  const isProjectTitleVisible = isHovering && !isMobile;

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

      {/* 无限横向卷轴 */}
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
              className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-110"
            />
          </div>
        ))}
        <div className="w-8 flex-shrink-0"></div>
      </div>
    </div>
  );
};

const WorksPage = ({
  photos,
  profile,
  ui,
  onImageClick,
  onBack,
  onNavClick,
}) => {
  const groupedByYearAndProject = photos.reduce((acc, photo) => {
    const yearRaw = photo.year;
    const year =
      yearRaw !== undefined && yearRaw !== null
        ? String(yearRaw).trim()
        : "Unknown";

    const project = photo.project || "Uncategorized";
    if (!acc[year]) acc[year] = {};
    if (!acc[year][project]) acc[year][project] = [];
    acc[year][project].push(photo);
    return acc;
  }, {});

  // 排序：按 order 字段升序
  Object.keys(groupedByYearAndProject).forEach((year) => {
    Object.keys(groupedByYearAndProject[year]).forEach((proj) => {
      groupedByYearAndProject[year][proj].sort(
        (a, b) => (a.order || 999) - (b.order || 999)
      );
    });
  });

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

// --- CMS Components ---

const ProfileSettings = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState(settings.profile);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContentChange = (lang, field, value) => {
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [lang]: {
          ...prev.content[lang],
          [field]: value,
        },
      },
    }));
  };

  const handleSave = () => {
    onUpdate({ ...settings, profile: formData });
    alert("Profile saved!");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5" /> Basic Info
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-neutral-500 uppercase">
              Brand Name
            </label>
            <input
              className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
              value={formData.brandName}
              onChange={(e) => handleChange("brandName", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-500 uppercase">Email</label>
            <input
              className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-500 uppercase">
              Location
            </label>
            <input
              className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-500 uppercase">
              Portrait URL
            </label>
            <input
              className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
              value={formData.heroImage}
              onChange={(e) => handleChange("heroImage", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Type className="w-5 h-5" /> English Content
        </h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-neutral-500 uppercase">
              Home Title
            </label>
            <input
              className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
              value={formData.content.en.title}
              onChange={(e) =>
                handleContentChange("en", "title", e.target.value)
              }
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-500 uppercase">
              Home Bio
            </label>
            <input
              className="w-full bg-black border border-neutral-700 rounded p-2 text-white"
              value={formData.content.en.bio}
              onChange={(e) => handleContentChange("en", "bio", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-500 uppercase">
              About Text
            </label>
            <textarea
              className="w-full bg-black border border-neutral-700 rounded p-2 text-white h-32"
              value={formData.content.en.aboutText}
              onChange={(e) =>
                handleContentChange("en", "aboutText", e.target.value)
              }
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-white text-black font-bold py-3 rounded hover:bg-neutral-200 transition-colors"
      >
        Save Profile Settings
      </button>
    </div>
  );
};

const SlidesSettings = ({ settings, onUpdate }) => {
  const [slides, setSlides] = useState(settings.profile.heroSlides || []);
  const [newSlideUrl, setNewSlideUrl] = useState("");
  const [newSlideTitle, setNewSlideTitle] = useState("");

  const handleAddSlide = () => {
    if (!newSlideUrl) return;
    const newSlide = {
      type: "image",
      url: newSlideUrl,
      title: newSlideTitle || "Featured",
    };
    const updatedSlides = [...slides, newSlide];
    setSlides(updatedSlides);
    setNewSlideUrl("");
    setNewSlideTitle("");
    // Auto save
    onUpdate({
      ...settings,
      profile: { ...settings.profile, heroSlides: updatedSlides },
    });
  };

  const handleDelete = (index) => {
    const updatedSlides = slides.filter((_, i) => i !== index);
    setSlides(updatedSlides);
    onUpdate({
      ...settings,
      profile: { ...settings.profile, heroSlides: updatedSlides },
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
        <h3 className="text-lg font-bold text-white mb-4">Add New Slide</h3>
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 bg-black border border-neutral-700 rounded p-2 text-white"
            placeholder="Image URL"
            value={newSlideUrl}
            onChange={(e) => setNewSlideUrl(e.target.value)}
          />
          <input
            className="w-1/3 bg-black border border-neutral-700 rounded p-2 text-white"
            placeholder="Title (Optional)"
            value={newSlideTitle}
            onChange={(e) => setNewSlideTitle(e.target.value)}
          />
          <button
            onClick={handleAddSlide}
            className="bg-white text-black px-4 rounded font-bold hover:bg-neutral-200"
          >
            Add
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex gap-4 items-center group"
          >
            <div className="w-24 h-16 bg-black rounded overflow-hidden flex-shrink-0">
              {slide.type === "video" ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">
                  Video
                </div>
              ) : (
                <img src={slide.url} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-grow">
              <div className="font-bold text-white">{slide.title}</div>
              <div className="text-xs text-neutral-500 truncate">
                {slide.url}
              </div>
            </div>
            <button
              onClick={() => handleDelete(idx)}
              className="p-2 text-red-500 hover:bg-neutral-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {slides.length === 0 && (
          <div className="text-center text-neutral-500">No slides yet.</div>
        )}
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
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedProject, setSelectedProject] = useState(null);
  const [tab, setTab] = useState("photos"); // 'photos', 'profile', 'slides'
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]); // Batch upload
  const [editPhoto, setEditPhoto] = useState(null); // For editing single photo metadata
  const [photoForm, setPhotoForm] = useState({
    year: new Date().getFullYear().toString(),
    project: "",
  });

  const [localPhotos, setLocalPhotos] = useState(photos);

  useEffect(() => {
    const sorted = [...photos].sort(
      (a, b) => (a.order || 999) - (b.order || 999)
    );
    setLocalPhotos(sorted);
  }, [photos]);

  const years = [
    ...new Set(localPhotos.map((p) => String(p.year).trim())),
  ].sort((a, b) => b - a);

  const filteredPhotos = localPhotos.filter(
    (p) => selectedYear === "All" || String(p.year).trim() === selectedYear
  );
  const projects = [
    ...new Set(filteredPhotos.map((p) => p.project || "Uncategorized")),
  ];

  // Drag & Drop
  const [draggedItem, setDraggedItem] = useState(null);
  const onDragStart = (e, index) => setDraggedItem(localPhotos[index]);
  const onDragOver = (e, index) => {
    e.preventDefault();
    const draggedOverItem = localPhotos[index];
    if (draggedItem === draggedOverItem) return;
    const items = [...localPhotos];
    const draggedIdx = items.indexOf(draggedItem);
    items.splice(draggedIdx, 1);
    items.splice(index, 0, draggedItem);
    setLocalPhotos(items);
  };
  const onDragEnd = () => setDraggedItem(null);

  const saveOrder = async () => {
    setUploading(true);
    try {
      const updates = localPhotos.map((p, i) =>
        updateDoc(getPublicDoc("photos", p.id), { order: i + 1 })
      );
      await Promise.all(updates);
      alert("Order Saved!");
    } catch (e) {
      alert(e.message);
    }
    setUploading(false);
  };

  const handleBatchUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file, idx) => {
        const dim = await new Promise((r) => {
          const i = new Image();
          i.onload = () => r({ w: i.width, h: i.height });
          i.src = URL.createObjectURL(file);
        });
        const refStr = `photos/${Date.now()}_${idx}_${file.name}`;
        const snap = await uploadBytes(ref(storage, refStr), file);
        const url = await getDownloadURL(snap.ref);

        return onAddPhoto({
          title: file.name.split(".")[0],
          year:
            selectedYear === "All"
              ? String(new Date().getFullYear())
              : selectedYear,
          project: selectedProject || "Uncategorized",
          url: url,
          width: dim.w,
          height: dim.h,
          order: 9999,
          isVisible: true,
        });
      });
      await Promise.all(uploadPromises);
      setFiles([]);
      alert("Upload Complete!");
    } catch (e) {
      alert(e.message);
    }
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-200 font-sans flex">
      {/* Sidebar */}
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
            onClick={() => setTab("profile")}
            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
              tab === "profile"
                ? "bg-white text-black font-bold"
                : "text-neutral-500 hover:text-white"
            }`}
          >
            Profile & Settings
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
        </div>

        {tab === "photos" && (
          <div className="overflow-y-auto flex-1 mb-4">
            <h3 className="text-xs font-bold text-neutral-600 uppercase mb-3 flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Years
            </h3>
            <button
              onClick={() => setSelectedYear("All")}
              className={`block w-full text-left px-2 py-1 text-sm mb-1 ${
                selectedYear === "All"
                  ? "text-white font-bold"
                  : "text-neutral-500 hover:text-white"
              }`}
            >
              All Years
            </button>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`block w-full text-left px-2 py-1 text-sm mb-1 ${
                  selectedYear === y
                    ? "text-white font-bold"
                    : "text-neutral-500 hover:text-white"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onLogout}
          className="mt-auto flex items-center gap-2 text-red-500 hover:text-red-400 text-sm"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {tab === "profile" && (
          <ProfileSettings settings={settings} onUpdate={onUpdateSettings} />
        )}

        {tab === "slides" && (
          <SlidesSettings settings={settings} onUpdate={onUpdateSettings} />
        )}

        {tab === "photos" && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white font-serif">
                {selectedYear} Projects
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={saveOrder}
                  disabled={uploading}
                  className="bg-white hover:bg-neutral-200 text-black px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}{" "}
                  Save Order
                </button>
              </div>
            </div>

            {/* Project Document View */}
            <div className="grid grid-cols-1 gap-12">
              {projects.map((proj) => {
                const projPhotos = filteredPhotos.filter(
                  (p) => (p.project || "Uncategorized") === proj
                );
                return (
                  <div
                    key={proj}
                    className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6"
                  >
                    <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2 font-serif">
                        <FolderOpen className="w-5 h-5 text-neutral-500" />{" "}
                        {proj}
                      </h3>
                      <span className="text-neutral-500 text-xs">
                        {projPhotos.length} photos
                      </span>
                    </div>

                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 mb-6">
                      {projPhotos.map((p) => (
                        <div
                          key={p.id}
                          draggable
                          onDragStart={(e) =>
                            onDragStart(e, localPhotos.indexOf(p))
                          }
                          onDragOver={(e) =>
                            onDragOver(e, localPhotos.indexOf(p))
                          }
                          onDragEnd={onDragEnd}
                          className={`relative aspect-square bg-black rounded border border-neutral-700 group cursor-move ${
                            p.isVisible === false ? "opacity-40" : ""
                          }`}
                        >
                          <img
                            src={p.url}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => setEditPhoto(p)}
                              className="p-1 bg-white text-black rounded-full"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onDeletePhoto(p.id)}
                              className="p-1 bg-red-500 text-white rounded-full"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {/* Mini Upload Box for Project */}
                      <div className="aspect-square border-2 border-dashed border-neutral-800 rounded flex flex-col items-center justify-center text-neutral-600 hover:border-white hover:text-white transition-colors cursor-pointer relative group">
                        <UploadCloud className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] uppercase font-bold">
                          Add
                        </span>
                        <input
                          type="file"
                          multiple
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            setFiles(e.target.files);
                            setSelectedProject(proj);
                            if (
                              window.confirm(
                                `Add ${e.target.files.length} photos to "${proj}"?`
                              )
                            ) {
                              alert(
                                `Files ready. Click 'Upload Photos' at bottom to sync.`
                              );
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Global Batch Upload Area */}
            <div className="mt-12 border-t border-neutral-800 pt-8">
              <h3 className="text-white font-bold mb-4 font-serif">
                Batch Upload
              </h3>
              <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <input
                    className="bg-black border border-neutral-700 rounded p-2 text-white text-sm"
                    placeholder="Year (e.g. 2025)"
                    value={photoForm.year}
                    onChange={(e) =>
                      setPhotoForm({ ...photoForm, year: e.target.value })
                    }
                  />
                  <input
                    className="bg-black border border-neutral-700 rounded p-2 text-white text-sm"
                    placeholder="Project Name"
                    value={photoForm.project || ""}
                    onChange={(e) =>
                      setPhotoForm({ ...photoForm, project: e.target.value })
                    }
                  />
                  <div className="relative border border-neutral-700 rounded bg-black flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer hover:border-neutral-500 transition-colors">
                    <span className="text-xs">
                      {files.length > 0
                        ? `${files.length} files selected`
                        : "Select Files"}
                    </span>
                    <input
                      type="file"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => setFiles(e.target.files)}
                    />
                  </div>
                </div>
                <button
                  onClick={handleBatchUpload}
                  disabled={uploading || files.length === 0}
                  className="w-full bg-white text-black font-bold py-3 rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors"
                >
                  {uploading ? "Uploading..." : "Upload Photos"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editPhoto && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-white font-bold mb-4">Edit Photo</h3>
              <img
                src={editPhoto.url}
                className="h-32 object-contain bg-black rounded mb-4 mx-auto"
              />
              <div className="space-y-3">
                <input
                  className="w-full bg-black border border-neutral-700 p-2 rounded text-white"
                  value={editPhoto.title}
                  onChange={(e) =>
                    setEditPhoto({ ...editPhoto, title: e.target.value })
                  }
                  placeholder="Title"
                />
                <input
                  className="w-full bg-black border border-neutral-700 p-2 rounded text-white"
                  value={editPhoto.project}
                  onChange={(e) =>
                    setEditPhoto({ ...editPhoto, project: e.target.value })
                  }
                  placeholder="Project"
                />
                <input
                  className="w-full bg-black border border-neutral-700 p-2 rounded text-white"
                  value={editPhoto.year}
                  onChange={(e) =>
                    setEditPhoto({ ...editPhoto, year: e.target.value })
                  }
                  placeholder="Year"
                />
                <div className="flex items-center gap-2 text-white">
                  <input
                    type="checkbox"
                    checked={editPhoto.isVisible !== false}
                    onChange={(e) =>
                      setEditPhoto({
                        ...editPhoto,
                        isVisible: e.target.checked,
                      })
                    }
                  />
                  <label>Visible</label>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setEditPhoto(null)}
                  className="flex-1 py-2 bg-neutral-800 text-neutral-400 rounded hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await updateDoc(getPublicDoc("photos", editPhoto.id), {
                      title: editPhoto.title,
                      project: editPhoto.project,
                      year: String(editPhoto.year),
                      isVisible: editPhoto.isVisible,
                    });
                    setEditPhoto(null);
                  }}
                  className="flex-1 py-2 bg-white text-black rounded font-bold hover:bg-neutral-200"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
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
          onBack={() => setView("home")}
          onNavClick={handleNavClick}
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

export default function App() {
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState("public");
  const [photos, setPhotos] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading && photos.length === 0) {
        setIsOffline(true);
        setPhotos(MOCK_DATA);
        setIsLoading(false);
      }
    }, 4000);

    const initAuth = async () => {
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

    const unsubAuth = onAuthStateChanged(auth, setUser);
    return () => {
      clearTimeout(timeout);
      unsubAuth();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubPhotos = onSnapshot(
      getPublicCollection("photos"),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (a.order || 9999) - (b.order || 9999));

        if (data.length === 0 && !isOffline) {
          setPhotos(MOCK_DATA);
        } else {
          setPhotos(data);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Data Load Error", err);
        setIsOffline(true);
        setPhotos(MOCK_DATA);
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
        <p className="tracking-[0.2em] text-xs uppercase font-bold font-serif">
          Loading T8DAY...
        </p>
      </div>
    );

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
