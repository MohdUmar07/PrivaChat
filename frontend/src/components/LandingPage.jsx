import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import {
  Shield,
  Lock,
  Zap,
  MessageCircle,
  Eye,
  EyeOff,
  Users,
  FileText,
  Video,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Globe,
  Fingerprint,
  KeyRound,
  Server,
  ShieldCheck,
  Palette,
} from "lucide-react";

/* ───────── Reusable fade-in-on-scroll wrapper ───────── */
const FadeInSection = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.7, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ───────── Floating particles background ───────── */
const FloatingParticles = () => {
  const particles = Array.from({ length: 18 });
  return (
    <div className="landing-particles" aria-hidden="true">
      {particles.map((_, i) => (
        <span
          key={i}
          className="landing-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${Math.random() * 10 + 12}s`,
          }}
        />
      ))}
    </div>
  );
};

/* ───────── Feature card ───────── */
const FeatureCard = ({ icon: Icon, title, description, gradient, delay }) => (
  <FadeInSection delay={delay}>
    <div className="landing-feature-card group">
      <div className={`landing-feature-icon ${gradient}`}>
        <Icon size={28} />
      </div>
      <h3 className="text-xl font-bold text-white mt-5 mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm">{description}</p>
    </div>
  </FadeInSection>
);

/* ───────── Comparison row ───────── */
const ComparisonRow = ({ feature, privachat, others, delay }) => (
  <FadeInSection delay={delay}>
    <div className="landing-comparison-row">
      <span className="text-gray-300 font-medium flex-1">{feature}</span>
      <span className="landing-comparison-cell text-emerald-400">
        <CheckCircle2 size={20} /> {privachat}
      </span>
      <span className="landing-comparison-cell text-red-400">
        <XCircle size={20} /> {others}
      </span>
    </div>
  </FadeInSection>
);

/* ───────── Upcoming card ───────── */
const UpcomingCard = ({ icon: Icon, title, description, tag, delay }) => (
  <FadeInSection delay={delay}>
    <div className="landing-upcoming-card">
      <div className="flex items-center justify-between mb-4">
        <div className="landing-upcoming-icon">
          <Icon size={22} />
        </div>
        <span className="landing-upcoming-tag">{tag}</span>
      </div>
      <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  </FadeInSection>
);

/* ═══════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════ */
export default function LandingPage() {
  /* Typing effect for the tagline */
  const tagline = "Where Privacy Meets Conversation.";
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setTyped(tagline.slice(0, i + 1));
      i++;
      if (i >= tagline.length) clearInterval(id);
    }, 55);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="landing-root">
      <FloatingParticles />

      {/* ──── Navbar ──── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-logo">
            <Shield size={28} className="text-blue-400" />
            <span>PrivaChat</span>
          </Link>
          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#compare" className="landing-nav-link">Why Us</a>
            <a href="#roadmap" className="landing-nav-link">Roadmap</a>
            <Link to="/login" className="landing-nav-link">Login</Link>
            <Link to="/register" className="landing-nav-cta">
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ──── Hero Section ──── */}
      <section className="landing-hero">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="landing-hero-content"
        >
          <div className="landing-hero-badge">
            <Lock size={14} />
            <span>End-to-End Encrypted</span>
          </div>

          <h1 className="landing-hero-title">
            Chat{" "}
            <span className="landing-gradient-text">Without</span>{" "}
            Compromise.
          </h1>

          <p className="landing-hero-tagline">
            {typed}
            <span className="landing-cursor">|</span>
          </p>

          <p className="landing-hero-desc">
            PrivaChat is a next-generation messaging app built with{" "}
            <strong className="text-white">military-grade RSA + AES encryption</strong>.
            Your messages are encrypted on your device — not even our servers can read them.
          </p>

          <div className="landing-hero-actions">
            <Link to="/register" className="landing-btn-primary">
              Start Chatting Free
              <ArrowRight size={18} />
            </Link>
            <a href="#features" className="landing-btn-ghost">
              Explore Features
              <ChevronDown size={18} />
            </a>
          </div>

          {/* Encryption visual */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.9 }}
            className="landing-hero-visual"
          >
            <div className="landing-encryption-demo">
              <div className="landing-demo-msg landing-demo-msg--plain">
                <MessageCircle size={16} className="text-blue-400" />
                <span>Hey, are you free tonight?</span>
              </div>
              <div className="landing-demo-arrow">
                <KeyRound size={18} className="text-purple-400" />
                <span className="text-xs text-gray-500">RSA-2048 + AES-256</span>
              </div>
              <div className="landing-demo-msg landing-demo-msg--encrypted">
                <Lock size={16} className="text-emerald-400" />
                <span className="font-mono text-xs">aG9sYSBhbWlnbywg...</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ──── Features Section ──── */}
      <section id="features" className="landing-section">
        <FadeInSection>
          <div className="landing-section-header">
            <span className="landing-section-badge">Features</span>
            <h2 className="landing-section-title">
              Why <span className="landing-gradient-text">PrivaChat</span>?
            </h2>
            <p className="landing-section-subtitle">
              More than just a chat app — it's a fortress for your conversations.
            </p>
          </div>
        </FadeInSection>

        <div className="landing-features-grid">
          <FeatureCard
            icon={ShieldCheck}
            title="True End-to-End Encryption"
            description="Every message is encrypted with AES-256 before leaving your device. Keys are exchanged using RSA-2048 — only you and the recipient can read it."
            gradient="landing-gradient-blue"
            delay={0.1}
          />
          <FeatureCard
            icon={Fingerprint}
            title="Zero-Knowledge Architecture"
            description="Your private keys are encrypted with your password using PBKDF2 before storage. We literally cannot access your messages — ever."
            gradient="landing-gradient-purple"
            delay={0.2}
          />
          <FeatureCard
            icon={Zap}
            title="Real-Time Messaging"
            description="Powered by Socket.IO for instant delivery. No delays, no polling — just seamless, lightning-fast communication."
            gradient="landing-gradient-cyan"
            delay={0.3}
          />
          <FeatureCard
            icon={Palette}
            title="Stunning Glassmorphic UI"
            description="A dark-mode-first interface with frosted glass panels, smooth animations, and micro-interactions that feel premium."
            gradient="landing-gradient-pink"
            delay={0.4}
          />
          <FeatureCard
            icon={KeyRound}
            title="Password-Protected Keys"
            description="Your RSA private key is wrapped with AES-GCM derived from your password via PBKDF2. Even if someone gets the database, they can't decrypt anything."
            gradient="landing-gradient-amber"
            delay={0.5}
          />
          <FeatureCard
            icon={Globe}
            title="Access From Anywhere"
            description="Web-based and responsive. No app store needed — open your browser, log in, and chat securely from any device."
            gradient="landing-gradient-emerald"
            delay={0.6}
          />
        </div>
      </section>

      {/* ──── Comparison Section ──── */}
      <section id="compare" className="landing-section landing-section-alt">
        <FadeInSection>
          <div className="landing-section-header">
            <span className="landing-section-badge">Comparison</span>
            <h2 className="landing-section-title">
              Not Your <span className="landing-gradient-text">Basic</span> Chat App
            </h2>
            <p className="landing-section-subtitle">
              See how PrivaChat stacks up against the apps you're used to.
            </p>
          </div>
        </FadeInSection>

        <div className="landing-comparison-table">
          <div className="landing-comparison-header">
            <span className="flex-1 text-gray-500 text-sm uppercase tracking-wider">Feature</span>
            <span className="landing-comparison-cell text-blue-400 font-bold">PrivaChat</span>
            <span className="landing-comparison-cell text-gray-500 font-bold">Others</span>
          </div>
          <ComparisonRow feature="End-to-End Encryption" privachat="RSA + AES" others="Varies / None" delay={0.1} />
          <ComparisonRow feature="Zero-Knowledge Server" privachat="Yes" others="No" delay={0.15} />
          <ComparisonRow feature="Open Encryption Model" privachat="Transparent" others="Proprietary" delay={0.2} />
          <ComparisonRow feature="Data Mining / Ad Tracking" privachat="Never" others="Yes" delay={0.25} />
          <ComparisonRow feature="Password-Encrypted Keys" privachat="PBKDF2+AES" others="Not offered" delay={0.3} />
          <ComparisonRow feature="No Phone Number Required" privachat="Username only" others="Phone required" delay={0.35} />
          <ComparisonRow feature="Premium UI Design" privachat="Glassmorphism" others="Basic / Generic" delay={0.4} />
        </div>
      </section>

      {/* ──── Upcoming Updates ──── */}
      <section id="roadmap" className="landing-section">
        <FadeInSection>
          <div className="landing-section-header">
            <span className="landing-section-badge">Roadmap</span>
            <h2 className="landing-section-title">
              What's <span className="landing-gradient-text">Coming Next</span>
            </h2>
            <p className="landing-section-subtitle">
              We're just getting started. Here's what's on the horizon.
            </p>
          </div>
        </FadeInSection>

        <div className="landing-upcoming-grid">
          <UpcomingCard
            icon={Users}
            title="Encrypted Group Chats"
            description="Create groups with full E2E encryption. Every member gets unique session keys for maximum security."
            tag="Q3 2026"
            delay={0.1}
          />
          <UpcomingCard
            icon={FileText}
            title="Secure File Sharing"
            description="Share documents, images, and files with the same encryption that protects your messages. Zero exposure."
            tag="Q3 2026"
            delay={0.2}
          />
          <UpcomingCard
            icon={Video}
            title="Voice & Video Calls"
            description="Encrypted voice and video calling powered by WebRTC. Crystal-clear quality with zero data leaks."
            tag="Q4 2026"
            delay={0.3}
          />
          <UpcomingCard
            icon={EyeOff}
            title="Disappearing Messages"
            description="Set a timer and watch messages auto-destruct. Perfect for sensitive conversations that shouldn't persist."
            tag="Q4 2026"
            delay={0.4}
          />
          <UpcomingCard
            icon={Sparkles}
            title="AI-Powered Smart Replies"
            description="On-device AI suggestions that never leave your phone. Smart features without sacrificing privacy."
            tag="2027"
            delay={0.5}
          />
          <UpcomingCard
            icon={Server}
            title="Self-Hosted Option"
            description="Deploy your own PrivaChat server for ultimate control. Perfect for teams and organizations."
            tag="2027"
            delay={0.6}
          />
        </div>
      </section>

      {/* ──── CTA Section ──── */}
      <section className="landing-cta-section">
        <FadeInSection>
          <div className="landing-cta-content">
            <h2 className="landing-cta-title">
              Ready to Chat <span className="landing-gradient-text">Privately</span>?
            </h2>
            <p className="landing-cta-desc">
              Join PrivaChat today and take back control of your conversations.
              No phone number. No data mining. Just pure, encrypted communication.
            </p>
            <div className="landing-cta-actions">
              <Link to="/register" className="landing-btn-primary landing-btn-lg">
                Create Free Account
                <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="landing-btn-ghost">
                I Already Have an Account
              </Link>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* ──── Footer ──── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <Shield size={24} className="text-blue-400" />
            <span className="font-bold text-lg text-white">PrivaChat</span>
          </div>
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} PrivaChat. Built with privacy at heart.
          </p>
        </div>
      </footer>
    </div>
  );
}
