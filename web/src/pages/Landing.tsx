import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const particlesRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
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
      const color = colors[Math.floor(Math.random() * colors.length)]
      p.style.backgroundColor = color
      p.style.animationDuration = (8 + Math.random() * 12) + 's'
      p.style.animationDelay = Math.random() * 15 + 's'
      const size = (1 + Math.random() * 2) + 'px'
      p.style.width = size
      p.style.height = size
      p.style.boxShadow = `0 0 ${4 + Math.random() * 6}px ${color}`
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

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

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
      <nav className="main-nav">
        <div className="nav-logo">SWIFTIE</div>
        <ul className="nav-links">
          <li><a href="#pillars" onClick={(e) => { e.preventDefault(); scrollTo('pillars') }}>The Three Sections</a></li>
          <li><a href="#how" onClick={(e) => { e.preventDefault(); scrollTo('how') }}>How It Works</a></li>
          <li><a href="#tech" onClick={(e) => { e.preventDefault(); scrollTo('tech') }}>Stack</a></li>
          <li><a href="#principles" onClick={(e) => { e.preventDefault(); scrollTo('principles') }}>Principles</a></li>
          <li><a href="#launch" onClick={(e) => { e.preventDefault(); scrollTo('launch') }}>Launch</a></li>
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
            </g>
          </svg>
        </div>

        <h1 className="hero-title glitch-text" data-text="SWIFTIE">
          <span className="l1">S</span>
          <span className="l2">W</span>
          <span className="l3">I</span>
          <span className="l4">F</span>
          <span className="l5">T</span>
          <span className="l6">I</span>
          <span className="l7">E</span>
        </h1>

        <p className="hero-tagline">Personality &middot; Ideology &middot; Occupation</p>

        <h2 className="hero-headline">
          <span className="hs">FIND</span> <span className="hw">YOUR</span> <span className="hg">TRIBE</span>
        </h2>

        <p className="hero-sub">
          India&apos;s first community discovery platform powered by personality science.
          Take three short assessments. Get matched to communities of people who think like you,
          believe like you, and create like you.
        </p>

        <div className="cta-row">
          <button className="cta-btn" onClick={() => navigate('/login')}>
            USE SWIFTIE <span className="cta-arrow">&#10140;</span>
          </button>
          <button className="cta-btn cta-btn-secondary" onClick={() => scrollTo('how')}>
            HOW IT WORKS
          </button>
        </div>

        <div className="scroll-indicator">
          <span>Scroll</span>
          <div className="scroll-chevron" />
        </div>
      </section>

      <div className="section-divider" />

      {/* Three Sections / Pillars */}
      <section id="pillars" className="content-section">
        <p className="section-label anim">// 001 — THE THREE SECTIONS</p>
        <h2 className="section-title anim">THREE LENSES. ONE YOU.</h2>
        <p className="section-desc anim">
          Every Swiftie user is profiled along three independent dimensions. Each section has its own
          assessment, its own communities, and its own conversation. Engage with one, two, or all three.
        </p>

        <div className="pillars-grid">
          <div className="pillar-card pillar-personality anim">
            <div className="pillar-number">SECTION_01</div>
            <span className="pillar-icon">🧠</span>
            <h3 className="pillar-title">PERSONALITY</h3>
            <p className="pillar-subtitle">Who you are</p>
            <p className="pillar-text">
              Take a 30-question personality assessment based on MBTI or the scientifically-validated
              Big Five (OCEAN) model. Get matched to communities of people who share your cognitive style.
            </p>
            <div className="pillar-tags">
              <span className="pillar-tag">MBTI</span>
              <span className="pillar-tag">Big Five</span>
              <span className="pillar-tag">16 Types</span>
              <span className="pillar-tag">OCEAN</span>
            </div>
          </div>

          <div className="pillar-card pillar-ideology anim">
            <div className="pillar-number">SECTION_02</div>
            <span className="pillar-icon">⚐</span>
            <h3 className="pillar-title">IDEOLOGY</h3>
            <p className="pillar-subtitle">What you believe</p>
            <p className="pillar-text">
              30 questions across political, social, and economic axes. Find communities for thoughtful
              discourse, plus weekly digests from neighbouring perspectives so you never get stuck in
              an echo chamber.
            </p>
            <div className="pillar-tags">
              <span className="pillar-tag">Political</span>
              <span className="pillar-tag">Social</span>
              <span className="pillar-tag">Economic</span>
              <span className="pillar-tag">Moderated</span>
            </div>
          </div>

          <div className="pillar-card pillar-occupation anim">
            <div className="pillar-number">SECTION_03</div>
            <span className="pillar-icon">🔧</span>
            <h3 className="pillar-title">OCCUPATION</h3>
            <p className="pillar-subtitle">What you do</p>
            <p className="pillar-text">
              30 questions across technical, artistic, humanities, and commerce branches. Connect with
              peers in your craft, from backend engineers to indie game devs, illustrators to founders.
            </p>
            <div className="pillar-tags">
              <span className="pillar-tag">Tech</span>
              <span className="pillar-tag">Art</span>
              <span className="pillar-tag">Humanities</span>
              <span className="pillar-tag">Commerce</span>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* How It Works */}
      <section id="how" className="content-section">
        <p className="section-label anim">// 002 — HOW IT WORKS</p>
        <h2 className="section-title anim">FROM SIGN-UP TO COMMUNITY</h2>
        <p className="section-desc anim">
          No 90-question gauntlet at signup. We split assessments across the first week so you never
          feel overwhelmed.
        </p>

        <div className="flow-container">
          {[
            { num: '01', icon: '🔒', title: 'SIGN IN', text: 'One-tap Google Sign-In via Firebase. Set username, photo, and choose your sections.' },
            { num: '02', icon: '📝', title: 'ASSESS', text: "Take one section's 30-question assessment now. The other two are offered later." },
            { num: '03', icon: '🎯', title: 'MATCH', text: 'Our engine recommends 3–5 communities ranked by your unique profile signature.' },
            { num: '04', icon: '🤝', title: 'JOIN', text: 'Join up to 3 communities per section. Post, discuss, react, and find your people.' },
          ].map((step) => (
            <div key={step.num} className="flow-step anim">
              <div className="flow-num">{step.num}</div>
              <span className="flow-icon">{step.icon}</span>
              <h4 className="flow-title">{step.title}</h4>
              <p className="flow-text">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Tech Stack */}
      <section id="tech" className="content-section">
        <p className="section-label anim">// 003 — ARCHITECTURE</p>
        <h2 className="section-title anim">THE TECH STACK</h2>
        <p className="section-desc anim">
          Modern, real-time, and built for scale. One React codebase serves the web platform.
        </p>

        <div className="tech-grid">
          {[
            { emoji: '⚛', name: 'REACT', desc: 'WEB FRONTEND' },
            { emoji: '🔷', name: 'TYPESCRIPT', desc: 'TYPE-SAFE' },
            { emoji: '⚡', name: 'CONVEX', desc: 'REACTIVE BACKEND' },
            { emoji: '🔥', name: 'FIREBASE AUTH', desc: 'GOOGLE SIGN-IN' },
            { emoji: '▲', name: 'VERCEL', desc: 'EDGE DEPLOY' },
            { emoji: '🧠', name: 'OCEAN ENGINE', desc: 'MATCH ALGORITHM' },
            { emoji: '🔐', name: 'AES-256', desc: 'ENCRYPTED AT REST' },
            { emoji: '🇮🇳', name: 'DPDP READY', desc: 'COMPLIANT BY DESIGN' },
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

      {/* Principles */}
      <section id="principles" className="content-section">
        <p className="section-label anim">// 004 — OUR PRINCIPLES</p>
        <h2 className="section-title anim">DESIGNED RESPONSIBLY</h2>
        <p className="section-desc anim">
          Personality, ideology, and occupational data are sensitive. We treat them that way —
          encrypted, consent-driven, and never sold.
        </p>

        <div className="principles-grid">
          {[
            { icon: '🔒', title: 'CONSENT FIRST', text: 'Every assessment requires explicit consent. You can withdraw anytime and we purge your data within 30 days.' },
            { icon: '💬', title: 'NO ECHO CHAMBERS', text: 'Ideology communities include a weekly "Other Perspectives" digest. Reflection, not radicalisation.' },
            { icon: '🛡️', title: 'HUMAN MODERATION', text: 'Every community has trained moderators. Hate speech and personal attacks get removed within 24 hours.' },
            { icon: '🇮🇳', title: 'DPDP COMPLIANT', text: "Built for India's Digital Personal Data Protection Act 2023. Data lives in India. Export anytime." },
          ].map((p) => (
            <div key={p.title} className="principle-card anim">
              <span className="principle-icon">{p.icon}</span>
              <h3 className="principle-title">{p.title}</h3>
              <p className="principle-text">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Stats */}
      <section className="content-section" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="stats-row">
          {[
            { num: '3', label: 'DISCOVERY SECTIONS' },
            { num: '90', label: 'TOTAL QUESTIONS' },
            { num: '100+', label: 'SEED COMMUNITIES' },
            { num: '2', label: 'PLATFORMS' },
          ].map((s) => (
            <div key={s.label} className="stat-item anim">
              <div className="stat-number">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Final CTA */}
      <section className="final-cta" id="launch">
        <div className="final-cta-glow" />
        <p className="section-label anim" style={{ textAlign: 'center' }}>// READY TO BEGIN?</p>
        <h2 className="final-title">
          <span className="highlight-saffron">DISCOVER</span> YOURSELF.{' '}
          <span className="highlight-green">DISCOVER</span> YOUR PEOPLE.
        </h2>
        <p className="final-sub">Join India&apos;s first personality-driven community platform.</p>
        <button className="cta-btn-large" onClick={() => navigate('/login')}>
          USE SWIFTIE <span className="cta-arrow" style={{ fontSize: '22px' }}>&#10140;</span>
        </button>
      </section>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-tricolour">
          <div className="s" /><div className="w" /><div className="g" />
        </div>
        <p className="footer-text">SWIFTIE &copy; 2026 &mdash; PERSONALITY-DRIVEN COMMUNITIES</p>
        <div className="footer-links">
          <a href="#">PRIVACY POLICY</a>
          <a href="#">TERMS OF SERVICE</a>
          <a href="#">DPDP COMPLIANCE</a>
          <a href="https://github.com/Nipunjaiswal442/swiftie.app" target="_blank" rel="noreferrer">GITHUB</a>
          <a href="#">CONTACT</a>
        </div>
        <p className="made-in-india">
          🇮🇳 Designed &amp; Engineered in India by Nipun Jaiswal
        </p>
      </footer>
    </>
  )
}
