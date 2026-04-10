import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const particlesRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()

  // Spawn particles
  useEffect(() => {
    const container = particlesRef.current
    if (!container) return
    const colors = ['#FF9933', '#FFFFFF', '#00FF41', '#0044FF', '#FFB347', '#00FF6A']
    for (let i = 0; i < 50; i++) {
      const p = document.createElement('div')
      p.className = 'particle'
      p.style.left = Math.random() * 100 + '%'
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      p.style.animationDuration = (8 + Math.random() * 12) + 's'
      p.style.animationDelay = Math.random() * 15 + 's'
      const size = (1 + Math.random() * 2) + 'px'
      p.style.width = size
      p.style.height = size
      p.style.boxShadow = `0 0 ${4 + Math.random() * 6}px ${p.style.backgroundColor}`
      container.appendChild(p)
    }
    return () => { container.innerHTML = '' }
  }, [])

  // Parallax grid on mouse move
  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const handler = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 10
      const y = (e.clientY / window.innerHeight - 0.5) * 10
      grid.style.transform = `translate(${x}px, ${y}px)`
    }
    document.addEventListener('mousemove', handler)
    return () => document.removeEventListener('mousemove', handler)
  }, [])

  // Navbar glass on scroll
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const handler = () => {
      if (window.scrollY > 50) nav.classList.add('scrolled')
      else nav.classList.remove('scrolled')
    }
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Scroll-triggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const all = document.querySelectorAll('.anim')
            const idx = Array.from(all).indexOf(entry.target as Element)
            setTimeout(() => entry.target.classList.add('visible'), (idx % 6) * 100)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.anim').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Background layers */}
      <div className="grid-bg" ref={gridRef} />
      <div className="scanlines" />
      <div className="ambient-glow" />
      <div className="particles" ref={particlesRef} />

      {/* Tricolour top bar */}
      <div className="tricolour-top">
        <div className="saffron" />
        <div className="white-bar" />
        <div className="green-bar" />
      </div>

      {/* Navigation */}
      <nav className="main-nav" ref={navRef}>
        <div className="nav-logo">SWIFTIE</div>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#tech">Stack</a></li>
          <li><a href="#security">Security</a></li>
          <li><a href="#launch">Launch</a></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="chakra-container">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(0,68,204,0.3)" strokeWidth="2" />
            <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(0,68,204,0.5)" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="15" fill="rgba(0,68,204,0.6)" stroke="rgba(0,120,255,0.8)" strokeWidth="1" />
            <g stroke="rgba(0,100,255,0.6)" strokeWidth="1.5">
              <line x1="100" y1="20" x2="100" y2="85" /><line x1="100" y1="115" x2="100" y2="180" />
              <line x1="20" y1="100" x2="85" y2="100" /><line x1="115" y1="100" x2="180" y2="100" />
              <line x1="43.4" y1="43.4" x2="89.4" y2="89.4" /><line x1="110.6" y1="110.6" x2="156.6" y2="156.6" />
              <line x1="156.6" y1="43.4" x2="110.6" y2="89.4" /><line x1="89.4" y1="110.6" x2="43.4" y2="156.6" />
              <line x1="67" y1="28" x2="87" y2="87" /><line x1="113" y1="113" x2="133" y2="172" />
              <line x1="133" y1="28" x2="113" y2="87" /><line x1="87" y1="113" x2="67" y2="172" />
              <line x1="28" y1="67" x2="87" y2="87" /><line x1="113" y1="113" x2="172" y2="133" />
              <line x1="172" y1="67" x2="113" y2="87" /><line x1="87" y1="113" x2="28" y2="133" />
              <line x1="48" y1="28" x2="88" y2="88" /><line x1="112" y1="112" x2="152" y2="172" />
              <line x1="152" y1="28" x2="112" y2="88" /><line x1="88" y1="112" x2="48" y2="172" />
              <line x1="28" y1="48" x2="88" y2="88" /><line x1="112" y1="112" x2="172" y2="152" />
              <line x1="172" y1="48" x2="112" y2="88" /><line x1="88" y1="112" x2="28" y2="152" />
            </g>
          </svg>
        </div>

        <h1 className="hero-title glitch-text" data-text="SWIFTIE">
          <span className="letter-s">S</span>
          <span className="letter-w">W</span>
          <span className="letter-i">I</span>
          <span className="letter-f">F</span>
          <span className="letter-t">T</span>
          <span className="letter-i2">I</span>
          <span className="letter-e">E</span>
        </h1>
        <p className="hero-tagline">Connect &middot; Chat &middot; Encrypt</p>
        <p className="hero-sub">
          India&apos;s next-gen social platform with military-grade end-to-end encryption.
          Your conversations, your data, your sovereignty.
        </p>

        <button className="cta-btn" onClick={() => navigate('/login')}>
          USE SWIFTIE <span className="cta-arrow">➔</span>
        </button>

        <div className="scroll-indicator">
          <span>Scroll</span>
          <div className="scroll-chevron" />
        </div>
      </section>

      <div className="section-divider" />

      {/* Features Section */}
      <section id="features" className="content-section">
        <p className="section-label anim">// 001 — FEATURES</p>
        <h2 className="section-title anim">BUILT FOR THE NEXT BILLION</h2>
        <p className="section-desc anim">
          A social experience engineered from the ground up — profiles, feeds,
          encrypted chat, and media sharing in one seamless platform.
        </p>

        <div className="features-grid">
          {[
            { icon: '🔒', title: 'E2E ENCRYPTED CHAT', text: 'Signal Protocol powered messaging. X3DH key exchange with Double Ratchet algorithm. Your messages are unreadable — even to us.' },
            { icon: '👤', title: 'RICH PROFILES', text: 'Custom usernames, bios, profile photos, cover images. Follow system with real-time follower counts and activity feeds.' },
            { icon: '📸', title: 'PHOTO SHARING', text: 'Share moments with smart compression. 100MB storage per user. Like, comment, and engage with your community\'s content.' },
            { icon: '⚡', title: 'REAL-TIME ENGINE', text: 'WebSocket-powered instant delivery. Typing indicators, read receipts, online status. Zero lag, always connected.' },
            { icon: '🇮🇳', title: 'MADE IN INDIA', text: 'Designed for the Indian digital ecosystem. Privacy-first approach aligned with India\'s data sovereignty vision.' },
            { icon: '📱', title: 'CROSS-PLATFORM', text: 'Single codebase, dual deployment. React Native delivers native performance on both iOS and Android simultaneously.' },
          ].map((f) => (
            <div key={f.title} className="feature-card anim">
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-text">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Tech Stack Section */}
      <section id="tech" className="content-section">
        <p className="section-label anim">// 002 — ARCHITECTURE</p>
        <h2 className="section-title anim">THE TECHNOLOGY STACK</h2>
        <p className="section-desc anim">Battle-tested technologies assembled into a modern, scalable architecture.</p>

        <div className="tech-grid">
          {[
            { emoji: '⚛', name: 'REACT', desc: 'WEB FRONTEND' },
            { emoji: '🔷', name: 'TYPESCRIPT', desc: 'TYPE-SAFE CODE' },
            { emoji: '🏠', name: 'NODE.JS', desc: 'SERVER RUNTIME' },
            { emoji: '🚀', name: 'EXPRESS.JS', desc: 'API FRAMEWORK' },
            { emoji: '🍃', name: 'MONGODB', desc: 'NOSQL DATABASE' },
            { emoji: '🔥', name: 'FIREBASE', desc: 'AUTH + STORAGE' },
            { emoji: '🔌', name: 'SOCKET.IO', desc: 'REAL-TIME LAYER' },
            { emoji: '🔐', name: 'SIGNAL PROTOCOL', desc: 'E2E ENCRYPTION' },
            { emoji: '☁️', name: 'RENDER', desc: 'CLOUD DEPLOY' },
            { emoji: '🎯', name: 'JWT', desc: 'AUTH TOKENS' },
          ].map((t) => (
            <div key={t.name} className="tech-item anim">
              <span className="tech-emoji">{t.emoji}</span>
              <div className="tech-name">{t.name}</div>
              <div className="tech-desc">{t.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Security Section */}
      <section id="security" className="content-section">
        <p className="section-label anim">// 003 — SECURITY</p>
        <h2 className="section-title anim">ENCRYPTION PROTOCOL</h2>
        <p className="section-desc anim">
          Military-grade Signal Protocol ensures zero-knowledge messaging.
          Not even Swiftie&apos;s servers can read your conversations.
        </p>

        <div className="encrypt-visual">
          <div className="encrypt-node sender">
            👤 SENDER<br />
            <small style={{ fontFamily: "'Share Tech Mono'", fontSize: '10px', color: 'var(--text-dim)' }}>
              encrypts locally
            </small>
          </div>
          <div className="encrypt-arrow">⟶</div>
          <div className="encrypt-node protocol">
            🔒 SIGNAL PROTOCOL<br />
            <small style={{ fontFamily: "'Share Tech Mono'", fontSize: '10px', color: 'var(--text-dim)' }}>
              X3DH + Double Ratchet
            </small>
          </div>
          <div className="encrypt-arrow">⟶</div>
          <div className="encrypt-node receiver">
            👤 RECEIVER<br />
            <small style={{ fontFamily: "'Share Tech Mono'", fontSize: '10px', color: 'var(--text-dim)' }}>
              decrypts locally
            </small>
          </div>
        </div>

        <div className="encrypt-details">
          {[
            { title: 'FORWARD SECRECY', text: 'Each message uses unique keys. Compromising one key reveals nothing about past or future messages.' },
            { title: 'ZERO KNOWLEDGE', text: 'Server stores only ciphertext. No plaintext ever touches our infrastructure. Your words, your eyes only.' },
            { title: 'AES-256 ENCRYPTION', text: 'The same standard used by intelligence agencies worldwide. Mathematically infeasible to break.' },
          ].map((d) => (
            <div key={d.title} className="encrypt-detail-card">
              <h4>{d.title}</h4>
              <p>{d.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Stats */}
      <section className="content-section" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="stats-row">
          {[
            { num: '256', unit: '-BIT', label: 'ENCRYPTION' },
            { num: '100', unit: 'MB', label: 'PER USER STORAGE' },
            { num: '<50', unit: 'ms', label: 'MESSAGE LATENCY' },
            { num: '2', unit: '', label: 'PLATFORMS' },
          ].map((s) => (
            <div key={s.label} className="stat-item anim">
              <div className="stat-number">
                {s.num}
                {s.unit && <small style={{ fontSize: '0.6em' }}>{s.unit}</small>}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Final CTA */}
      <section className="final-cta" id="launch">
        <div className="final-cta-glow" />
        <p className="section-label anim" style={{ textAlign: 'center' }}>// READY TO JOIN?</p>
        <h2 className="final-title">
          <span className="highlight-saffron">YOUR</span> PLATFORM.{' '}
          <span className="highlight-green">YOUR</span> PRIVACY.
        </h2>
        <p className="final-sub">Be among the first to experience India&apos;s privacy-first social network.</p>
        <button className="cta-btn-large" onClick={() => navigate('/login')}>
          USE SWIFTIE <span className="cta-arrow" style={{ fontSize: '22px' }}>➔</span>
        </button>
      </section>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-tricolour">
          <div className="s" /><div className="w" /><div className="g" />
        </div>
        <p className="footer-text">SWIFTIE &copy; 2026 &mdash; ALL RIGHTS RESERVED</p>
        <div className="footer-links">
          <a href="#">PRIVACY POLICY</a>
          <a href="#">TERMS OF SERVICE</a>
          <a href="https://github.com/Nipunjaiswal442/swiftie.app" target="_blank" rel="noreferrer">GITHUB</a>
          <a href="#">CONTACT</a>
        </div>
        <p className="made-in-india">
          🇮🇳 Designed &amp; Engineered in India
        </p>
      </footer>
    </>
  )
}
