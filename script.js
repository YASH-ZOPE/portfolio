/**
 * Handcrafted Scrapbook & Engineering Notebook Portfolio
 * Yash Zope - Vol. III
 * 
 * High-fidelity vanilla interactions, responsive page-switching,
 * dynamic SVG flight trail triggers, interactive envelopes, and
 * procedural Web Audio synthesis for tactile mechanical audio.
 * 
 * FLOW:
 *  1. Website opens → ONLY cover page shown, no navigation.
 *  2. Click anywhere on cover → cinematic flip → navigation appears → intro page loads.
 *  3. All subsequent navigation works normally via tabs.
 */

// Procedural Audio Engine (Web Audio API - No external files required)
const AudioEngine = {
  ctx: null,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  // Soft organic swoosh for page turns
  playPageTurn() {
    this.init();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      const progress = i / bufferSize;
      data[i] *= (1 - progress) * 0.15;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.35);

    noise.connect(filter);
    filter.connect(this.ctx.destination);
    noise.start();
  },

  // Heavier cover-flip swoosh — deeper, more dramatic
  playCoverFlip() {
    this.init();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.025 * white)) / 1.025;
      lastOut = data[i];
      const progress = i / bufferSize;
      // Louder at start (cover snap), fades out
      data[i] *= Math.max(0, 1 - progress * 1.5) * 0.22;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(this.ctx.destination);
    noise.start();
  },

  // Wooden friction slide sound for bookshelf interactive books
  playBookSlide() {
    this.init();
    if (!this.ctx) return;

    const duration = 0.3;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(90, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + duration);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(50, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + duration);
    osc2.stop(this.ctx.currentTime + duration);
  },

  // Crisp mechanical snap for opening envelope seal
  playWaxCrack() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.setValueAtTime(600, now + 0.02);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(4, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.15);
  }
};

// Application State Management
const Portfolio = {
  currentPage: 'cover',
  notebookOpened: false,   // tracks if user has clicked cover yet
  activeBook: null,
  activeSliders: new Set(),

  async init() {
    this.adjustScale();
    this.setupEventListeners();
    await this.loadPages();
    initCoffeeCupSpin(); // Start fluid, zero-snap coffee cup 3D spinning loop
    initLighthouseBeam(); // Start smooth, cursor-tracking watchtower lighthouse beam loop
    this.initFullscreenCover();
    this.initResumeBtn();
    console.log("Tactile Scrapbook Portfolio Shell Running.");
  },

  // Dynamically load pages from separate standalone pages/ folder files
  async loadPages() {
    const pages = ['cover', 'intro', 'skills', 'projects', 'journey', 'about', 'contact'];

    for (const page of pages) {
      const container = document.getElementById(`page-${page}`);
      if (!container) continue;

      try {
        const response = await fetch(`pages/${page}.html?v=11.11.2`);
        if (response.ok) {
          const html = await response.text();
          container.innerHTML = html;
        } else {
          console.error(`Failed to load: pages/${page}.html (Status: ${response.status})`);
          container.innerHTML = `<div class="error-sheet font-mono">Error: Standalone page pages/${page}.html not found.</div>`;
        }
      } catch (err) {
        console.error(`Fetch exception for pages/${page}.html. Ensure you are running 'npm run dev'!`, err);
        container.innerHTML = `
          <div class="error-sheet font-mono" style="padding: 30px; text-align: center;">
            <h4 style="color: #a43e37; margin-bottom: 10px;">⚠️ MODULAR LOAD BARRIER</h4>
            <p>Stand-alone page <code>pages/${page}.html</code> could not be fetched due to filesystem CORS restrictions.</p>
            <p style="margin-top: 10px; font-size: 0.75rem; color: #706359;">Please run the local web server by running <strong>npm run dev</strong> in the terminal!</p>
          </div>
        `;
      }
    }
  },

  /**
   * FULL-SCREEN COVER SYSTEM
   * After pages load, grab cover.html content and place it
   * inside the full-screen overlay. Clicking the overlay sweeps it
   * away and reveals the notebook with intro page + tabs.
   */
  initFullscreenCover() {
    const overlay = document.getElementById('cover-fullscreen');
    const cfsContent = document.getElementById('cfs-content');
    const coverPage = document.getElementById('page-cover');
    const desk = document.getElementById('desk-wrapper');

    if (!overlay) return;

    // --- Inject cover content into full-screen overlay ---
    if (cfsContent && coverPage) {
      // Move the loaded .cover-exterior HTML into the overlay content area
      const coverExterior = coverPage.querySelector('.cover-exterior');
      if (coverExterior) {
        // Clone so the original stays (hidden) inside the notebook
        cfsContent.appendChild(coverExterior.cloneNode(true));
      }
    }

    // Hide the notebook-page cover (it's now shown full-screen instead)
    if (coverPage) {
      coverPage.classList.remove('active');
      coverPage.style.display = 'none';
    }

    // Ensure notebook is invisible until cover opens
    if (desk) {
      desk.style.opacity = '0';
      desk.style.pointerEvents = 'none';
    }

    // Make sure no tabs are visible yet
    const tabs = document.querySelector('.notebook-tabs');
    if (tabs) tabs.classList.remove('tabs-visible');

    // Click handler on full-screen cover → open notebook
    overlay.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      this.openNotebook();
    });
  },

  /**
   * Called when user clicks the full-screen cover.
   * Sweeps cover away, fades in notebook, shows intro page + tabs.
   */
  openNotebook() {
    if (this.notebookOpened) return;
    this.notebookOpened = true;

    AudioEngine.playCoverFlip();

    const overlay = document.getElementById('cover-fullscreen');
    const desk = document.getElementById('desk-wrapper');
    const introPage = document.getElementById('page-intro');
    const tabs = document.querySelector('.notebook-tabs');

    // 1. Trigger cover sweep-out animation
    if (overlay) {
      overlay.classList.add('cfs-opening');
      // Remove overlay from DOM after animation completes
      setTimeout(() => {
        overlay.style.display = 'none';
        overlay.remove();
      }, 800);
    }

    // 2. Fade in the desk/notebook (slightly delayed for drama)
    if (desk) {
      desk.classList.add('desk-reveal');
      desk.style.pointerEvents = 'auto';
      // After animation ends, lock to opacity:1
      setTimeout(() => {
        desk.style.opacity = '1';
        desk.style.transition = '';
      }, 850);
    }

    // 3. Show intro page with settle animation (after desk begins appearing)
    setTimeout(() => {
      this.currentPage = 'intro';

      if (introPage) {
        introPage.classList.add('active', 'intro-settle-in');
        setTimeout(() => introPage.classList.remove('intro-settle-in'), 700);
      }

      // Mark intro tab active
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-target') === 'intro') {
          tab.classList.add('active');
        }
      });

      // Reveal tabs
      if (tabs) tabs.classList.add('tabs-visible');
    }, 380);
  },

  // Dynamic viewport scale computation to fit absolute scrapbook elements perfectly
  adjustScale() {
    const wrapper = document.querySelector('.notebook-wrapper');
    if (!wrapper) return;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // On mobile and tablet, do not apply scale transform, let responsive CSS handle it
    if (w <= 1024) {
      wrapper.style.transform = '';
      wrapper.style.transformOrigin = '';
      return;
    }

    // Compute scale multipliers for width and height (leaving margin for tabs and shadows)
    const scaleX = w / 1250;
    const scaleY = h / 830;

    // Choose the smaller factor so it never overflows either dimension, and scale down by 15% for a beautiful desk frame
    const scale = Math.min(scaleX, scaleY, 1) * 0.96;

    wrapper.style.transform = `scale(${scale})`;
    wrapper.style.transformOrigin = 'center center';
  },

  setupEventListeners() {
    // Navigation Bookmark Tabs — only work AFTER notebook is opened
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        if (!this.notebookOpened) return; // ignore tab clicks before opening
        const target = tab.getAttribute('data-target');
        if (target === 'cover') return; // don't navigate back to cover via tab
        this.switchPage(target);
      });
    });

    // Bind scaling readjustment to window resizing
    window.addEventListener('resize', () => this.adjustScale());

    // Escape key to close lightbox
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeLightbox();
      }
    });
  },

  // Transition between Inner Book Sheets (normal navigation after cover opened)
  switchPage(targetId, force = false) {
    if (this.currentPage === targetId && !force) return;

    AudioEngine.playPageTurn();

    const previousPageId = this.currentPage;
    this.currentPage = targetId;

    // Update active tab highlight
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      if (tab.getAttribute('data-target') === targetId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Close any open book on skills page
    if (this.activeBook) {
      const bookEl = document.getElementById(`book-${this.activeBook}`);
      if (bookEl) {
        bookEl.classList.remove('open');
        const sheetPaper = bookEl.closest('.sheet-paper');
        if (sheetPaper) sheetPaper.classList.remove('book-open-active');
      }
      this.activeBook = null;
    }

    const oldPage = document.getElementById(`page-${previousPageId}`);
    const newPage = document.getElementById(`page-${targetId}`);

    if (oldPage) {
      oldPage.classList.remove('active', 'page-slide-in');
      oldPage.classList.add('page-slide-out');

      setTimeout(() => {
        oldPage.classList.remove('page-slide-out');
      }, 500);
    }

    if (newPage) {
      newPage.classList.add('active', 'page-slide-in');
    }

    if (targetId === 'journey') {
      setTimeout(() => {
        this.triggerFlightAnimation();
      }, 400);
    }
  },

  // Journey timeline airplane flight paths trigger
  triggerFlightAnimation() {
    const plane = document.getElementById('plane-1');
    const path = document.getElementById('trail-1');

    if (!plane || !path) return;

    const trails = document.querySelectorAll('.flight-trail');
    trails.forEach((trail, index) => {
      const length = trail.getTotalLength();
      trail.style.strokeDasharray = length;
      trail.style.strokeDashoffset = length;

      trail.style.transition = 'none';
      void trail.offsetWidth; // force reflow

      trail.style.transition = `stroke-dashoffset 1.5s ease-in-out ${index * 1.2}s`;
      trail.style.strokeDashoffset = '0';

      // Restore beautiful vintage dashed pattern after trail finishes drawing
      setTimeout(() => {
        trail.style.strokeDasharray = "6 6";
      }, (index * 1.2 + 1.5) * 1000);
    });

    plane.style.animation = 'none';
    void plane.offsetWidth;
    plane.style.animation = 'flightGlide 4.5s linear forwards';
  },

  // Setup interactive resume alert
  initResumeBtn() {
    // Resume button requires active document listener because page is loaded asynchronously
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#resume-btn');
      if (btn) {
        e.preventDefault();
        alert("📋 Handcrafted Resume Vol. III: File download initiated (Simulated).\nIn a real deployment, this would open Yash Zope's curriculum vitae PDF.");
      }
    });
  }
};

// Global handlers exposed for HTML onclick events

/**
 * Handles Skill book click transitions.
 * Shifts book forward and folds/opens spine, hiding other active books.
 */
function openBook(bookId) {
  AudioEngine.playBookSlide();

  const bookEl = document.getElementById(`book-${bookId}`);
  if (!bookEl) return;

  const sheetPaper = bookEl.closest('.sheet-paper');

  if (Portfolio.activeBook === bookId) {
    bookEl.classList.remove('open');
    if (sheetPaper) sheetPaper.classList.remove('book-open-active');
    Portfolio.activeBook = null;
    return;
  }

  if (Portfolio.activeBook) {
    const prevBook = document.getElementById(`book-${Portfolio.activeBook}`);
    if (prevBook) {
      prevBook.classList.remove('open');
    }
  }

  bookEl.classList.add('open');
  if (sheetPaper) sheetPaper.classList.add('book-open-active');
  Portfolio.activeBook = bookId;
}

/**
 * Handles pull slider expander mechanics.
 * Slides open the blueprint partition on the right.
 */
function toggleSlider(sliderNumber) {
  AudioEngine.playBookSlide();

  const slider = document.getElementById(`slider-${sliderNumber}`);
  if (!slider) return;

  slider.classList.toggle('expanded');
}

/**
 * Contact Envelope Wax seal click opening.
 * Splits/cracks wax seal, folds open envelope flap, and slides out letter.
 */
function openEnvelope() {
  const envelope = document.getElementById('contact-envelope');
  const seal = document.getElementById('wax-seal');
  const flap = document.getElementById('envelope-flap');
  const letter = document.getElementById('envelope-letter');

  if (!envelope) return;

  if (envelope.classList.contains('envelope-open')) {
    AudioEngine.playPageTurn();

    letter.style.transform = 'translateY(0)';
    setTimeout(() => {
      flap.style.transform = 'rotateX(0deg)';
      setTimeout(() => {
        envelope.classList.remove('envelope-open');
        seal.style.opacity = '1';
        seal.style.transform = 'scale(1)';
      }, 300);
    }, 450);
  } else {
    AudioEngine.playWaxCrack();

    seal.style.transform = 'scale(0.8) rotate(15deg)';
    seal.style.opacity = '0';

    setTimeout(() => {
      envelope.classList.add('envelope-open');
      flap.style.transform = 'rotateX(180deg)';

      setTimeout(() => {
        AudioEngine.playPageTurn();
        letter.style.transform = 'translateY(-110px)';
      }, 450);
    }, 200);
  }
}

/**
 * Blueprint Image Zoom modal overlay viewer.
 */
function openLightbox(event) {
  AudioEngine.playPageTurn();

  const lightbox = document.getElementById('blueprint-lightbox');
  const body = document.getElementById('lightbox-blueprint-body');

  if (!lightbox || !body) return;

  const trigger = event.currentTarget;
  const originalSvg = trigger.querySelector('.arch-sketch-svg');
  const title = trigger.closest('.project-container-wrapper').querySelector('.project-title').textContent;

  document.getElementById('lightbox-title').textContent = `${title} - ARCHITECTURE SPECIFICATIONS`;

  if (originalSvg) {
    body.innerHTML = '';
    const clonedSvg = originalSvg.cloneNode(true);
    clonedSvg.setAttribute('stroke-width', '1.2');
    body.appendChild(clonedSvg);
  }

  lightbox.classList.add('active');
}

function closeLightbox() {
  AudioEngine.playPageTurn();

  const lightbox = document.getElementById('blueprint-lightbox');
  if (lightbox) {
    lightbox.classList.remove('active');
  }
}

/**
 * Initializes continuous, mathematically fluid 3D coffee cup rotation
 * with smooth acceleration on mouseover and deceleration on mouseleave.
 * Fully prevents visual snapping by managing angular momentum in JS.
 */
function initCoffeeCupSpin() {
  if (window.innerWidth <= 1024) return;
  const container = document.querySelector('.coffee-cup-container');
  const rotator = document.querySelector('.coffee-cup-rotator');
  if (!container || !rotator) return;

  let rotation = 12; // Start rotation angle on Z-axis
  let currentSpeed = 0.15; // Starting slow ambient spin speed
  let isHovered = false;

  container.addEventListener('mouseenter', () => {
    isHovered = true;
  });

  container.addEventListener('mouseleave', () => {
    isHovered = false;
  });

  function update() {
    // Target speeds: 1.8 degrees/frame for normal fast spin, 0.15 for ambient slow drift
    const targetSpeed = isHovered ? 1.8 : 0.15;

    // Smooth interpolation (Lerp) for realistic physical momentum
    currentSpeed += (targetSpeed - currentSpeed) * 0.06;
    rotation = (rotation + currentSpeed) % 360;

    // Spin only the rotator inside the parent's tilted 3D space, keeping cup body shadow locked downwards!
    rotator.style.transform = `rotateZ(${rotation}deg)`;

    requestAnimationFrame(update);
  }

  // Kick off the continuous spin animation loop
  requestAnimationFrame(update);
}

/**
 * Lighthouse beam interactive tracking loop.
 * Emerges from left cabin window (91.5, 63) in projects watchtower SVG.
 * Clamps beam range to a 120-degree horizontal cone [-60, 60] pointing rightwards.
 */
function initLighthouseBeam() {
  if (window.innerWidth <= 1024) return;
  let currentAngle = 0;
  let targetAngle = 0;

  document.addEventListener('mousemove', (e) => {
    // Only run tracking calculations if projects page is currently active
    if (Portfolio.currentPage !== 'projects') return;

    const svg = document.querySelector('.watchtower-svg');
    if (!svg) return;

    try {
      const ctm = svg.getScreenCTM();
      if (!ctm) return;

      // Right outer corner of balcony railing, 5 SVG units past edge (viewbox coords 137, 74)
      const pt = svg.createSVGPoint();
      pt.x = 150;
      pt.y = 74;
      const screenPt = pt.matrixTransform(ctm);

      const dx = e.clientX - screenPt.x;
      const dy = e.clientY - screenPt.y;

      let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

      // Clamp beam rotation to a 120-degree range (-60 to +60 degrees)
      if (angleDeg < -60 || angleDeg > 60) {
        if (dy < 0) {
          targetAngle = -60;
        } else {
          targetAngle = 60;
        }
      } else {
        targetAngle = angleDeg;
      }
    } catch (err) {
      // getScreenCTM is occasionally unavailable when sheet is loading
    }
  });

  function update() {
    const beam = document.getElementById('watchtower-light-beam-group');
    if (beam && Portfolio.currentPage === 'projects') {
      const diff = targetAngle - currentAngle;
      // Damped motion to simulate heavy physical lighthouse rotation
      currentAngle += diff * 0.08;
      beam.setAttribute('transform', `rotate(${currentAngle}, 150, 74)`);
    }
    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// Start Portfolio
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    Portfolio.init();
  });
} else {
  Portfolio.init();
}