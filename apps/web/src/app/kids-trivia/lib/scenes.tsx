'use client';

import type { ReactNode } from 'react';
import type { KidsTriviaDifficulty } from '../types/game';

type SceneProps = {
  questionId: string;
  difficulty: KidsTriviaDifficulty;
  className?: string;
};

function BaseBackdrop({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_1px_1px,#ffffff24_1px,transparent_0)] [background-size:28px_28px]" />
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20" />
      {children}
    </div>
  );
}

function SeaScene() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-55" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#22c55e" stopOpacity="0.15" />
          <stop offset="0.45" stopColor="#0ea5e9" stopOpacity="0.35" />
          <stop offset="1" stopColor="#1d4ed8" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="800" height="320" fill="url(#sea)" />
      <path d="M0 200 C 80 170, 160 230, 240 200 C 320 170, 400 230, 480 200 C 560 170, 640 230, 720 200 C 760 185, 780 185, 800 190 L800 320 L0 320 Z" fill="#0ea5e9" fillOpacity="0.22" />
      <path d="M0 230 C 90 210, 170 250, 260 230 C 350 210, 430 250, 520 230 C 610 210, 690 250, 780 230 L800 240 L800 320 L0 320 Z" fill="#2563eb" fillOpacity="0.18" />
      <circle cx="80" cy="70" r="28" fill="#fcd34d" fillOpacity="0.35" />
      <circle cx="120" cy="68" r="12" fill="#fff" fillOpacity="0.18" />
    </svg>
  );
}

function ArkScene() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-55" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#34d399" stopOpacity="0.18" />
          <stop offset="0.55" stopColor="#60a5fa" stopOpacity="0.3" />
          <stop offset="1" stopColor="#1e3a8a" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <rect width="800" height="320" fill="url(#sky)" />
      <path d="M160 208 C 250 120, 550 120, 640 208" stroke="#fde68a" strokeOpacity="0.35" strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M200 210 C 280 170, 520 170, 600 210 L560 250 C 520 270, 280 270, 240 250 Z" fill="#f59e0b" fillOpacity="0.22" stroke="#fcd34d" strokeOpacity="0.35" strokeWidth="3" />
      <path d="M0 250 C 100 230, 200 280, 300 250 C 400 220, 520 290, 640 250 C 720 225, 770 235, 800 240 L800 320 L0 320 Z" fill="#0ea5e9" fillOpacity="0.2" />
      <circle cx="690" cy="70" r="26" fill="#fcd34d" fillOpacity="0.32" />
      <circle cx="655" cy="75" r="10" fill="#fff" fillOpacity="0.16" />
    </svg>
  );
}

function SlingScene() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-55" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="dusk" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fcd34d" stopOpacity="0.18" />
          <stop offset="0.5" stopColor="#f97316" stopOpacity="0.2" />
          <stop offset="1" stopColor="#1e3a8a" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <rect width="800" height="320" fill="url(#dusk)" />
      <path d="M40 270 C 160 220, 260 300, 380 260 C 510 215, 610 305, 760 250" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="14" strokeLinecap="round" />
      <path d="M170 95 C 250 60, 330 140, 410 105" fill="none" stroke="#fcd34d" strokeOpacity="0.35" strokeWidth="10" strokeLinecap="round" />
      <circle cx="440" cy="96" r="10" fill="#e5e7eb" fillOpacity="0.6" />
      <circle cx="610" cy="95" r="40" fill="#fcd34d" fillOpacity="0.28" />
    </svg>
  );
}

function FishScene() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-55" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="deep" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#22c55e" stopOpacity="0.12" />
          <stop offset="0.5" stopColor="#0ea5e9" stopOpacity="0.3" />
          <stop offset="1" stopColor="#1e3a8a" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <rect width="800" height="320" fill="url(#deep)" />
      <path d="M80 220 C 140 180, 220 180, 280 220 C 220 260, 140 260, 80 220 Z" fill="#fcd34d" fillOpacity="0.22" />
      <path d="M280 220 L325 195 L325 245 Z" fill="#fcd34d" fillOpacity="0.18" />
      <circle cx="120" cy="210" r="6" fill="#0f172a" fillOpacity="0.35" />
      <path d="M0 255 C 120 235, 240 285, 360 255 C 480 225, 600 295, 720 255 C 770 238, 790 240, 800 242 L800 320 L0 320 Z" fill="#0ea5e9" fillOpacity="0.16" />
      <circle cx="620" cy="70" r="28" fill="#fcd34d" fillOpacity="0.25" />
    </svg>
  );
}

function LionsScene() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-55" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="den" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#a78bfa" stopOpacity="0.12" />
          <stop offset="0.55" stopColor="#f59e0b" stopOpacity="0.12" />
          <stop offset="1" stopColor="#0f172a" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="800" height="320" fill="url(#den)" />
      <path d="M0 250 C 110 210, 250 300, 380 255 C 520 205, 640 305, 800 245 L800 320 L0 320 Z" fill="#0f172a" fillOpacity="0.25" />
      <circle cx="120" cy="185" r="34" fill="#fcd34d" fillOpacity="0.22" />
      <circle cx="120" cy="185" r="18" fill="#fde68a" fillOpacity="0.18" />
      <circle cx="640" cy="195" r="28" fill="#fcd34d" fillOpacity="0.18" />
      <circle cx="640" cy="195" r="14" fill="#fde68a" fillOpacity="0.14" />
      <path d="M360 190 C 390 170, 430 170, 460 190" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="10" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function PalaceScene() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-55" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="palace" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fcd34d" stopOpacity="0.16" />
          <stop offset="0.45" stopColor="#a78bfa" stopOpacity="0.14" />
          <stop offset="1" stopColor="#1e3a8a" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <rect width="800" height="320" fill="url(#palace)" />
      <path d="M220 235 L580 235 L560 120 L240 120 Z" fill="#fcd34d" fillOpacity="0.14" stroke="#fde68a" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M250 120 L275 80 L300 120" fill="#fcd34d" fillOpacity="0.12" />
      <path d="M400 120 L425 65 L450 120" fill="#fcd34d" fillOpacity="0.12" />
      <path d="M520 120 L545 85 L570 120" fill="#fcd34d" fillOpacity="0.12" />
      <path d="M260 235 V160 M320 235 V160 M380 235 V160 M440 235 V160 M500 235 V160 M560 235 V160" stroke="#fde68a" strokeOpacity="0.2" strokeWidth="8" strokeLinecap="round" />
      <circle cx="650" cy="70" r="30" fill="#fcd34d" fillOpacity="0.28" />
      <circle cx="620" cy="75" r="12" fill="#fff" fillOpacity="0.14" />
    </svg>
  );
}

function FireScene() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-55" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="fireSky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fcd34d" stopOpacity="0.18" />
          <stop offset="0.55" stopColor="#f97316" stopOpacity="0.2" />
          <stop offset="1" stopColor="#1e3a8a" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <rect width="800" height="320" fill="url(#fireSky)" />
      <path d="M320 255 C 330 220, 360 230, 360 200 C 360 170, 410 170, 410 135 C 425 170, 470 170, 470 205 C 470 240, 510 230, 520 255 Z" fill="#fcd34d" fillOpacity="0.25" />
      <path d="M350 255 C 360 235, 380 240, 385 220 C 390 200, 420 195, 420 175 C 430 200, 455 205, 455 225 C 455 245, 480 240, 490 255 Z" fill="#fb7185" fillOpacity="0.18" />
      <path d="M250 255 L590 255" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="16" strokeLinecap="round" />
      <path d="M0 280 C 140 250, 290 310, 440 275 C 580 245, 700 305, 800 280 L800 320 L0 320 Z" fill="#0f172a" fillOpacity="0.18" />
    </svg>
  );
}

function StormScene() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-55" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="storm" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#a7f3d0" stopOpacity="0.08" />
          <stop offset="0.45" stopColor="#60a5fa" stopOpacity="0.14" />
          <stop offset="1" stopColor="#0f172a" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="800" height="320" fill="url(#storm)" />
      <path d="M120 110 C 170 70, 260 70, 310 110 C 360 80, 450 80, 500 110 C 560 80, 650 80, 700 110 C 730 130, 735 165, 710 185 L140 185 C 110 170, 95 135, 120 110 Z" fill="#e5e7eb" fillOpacity="0.14" />
      <path d="M480 185 L450 240 L490 240 L455 300" stroke="#fcd34d" strokeOpacity="0.35" strokeWidth="10" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M0 235 C 90 205, 170 265, 260 235 C 350 205, 430 265, 520 235 C 610 205, 690 265, 780 235 L800 245 L800 320 L0 320 Z" fill="#0ea5e9" fillOpacity="0.18" />
    </svg>
  );
}

function PrisonScene() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-55" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="cell" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#60a5fa" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="#a78bfa" stopOpacity="0.1" />
          <stop offset="1" stopColor="#0f172a" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="800" height="320" fill="url(#cell)" />
      <path d="M210 70 H590 V250 H210 Z" fill="#0f172a" fillOpacity="0.18" stroke="#e5e7eb" strokeOpacity="0.12" strokeWidth="3" />
      <path d="M250 70 V250 M290 70 V250 M330 70 V250 M370 70 V250 M410 70 V250 M450 70 V250 M490 70 V250 M530 70 V250" stroke="#e5e7eb" strokeOpacity="0.14" strokeWidth="10" />
      <path d="M200 270 C 260 240, 320 300, 380 270 C 440 240, 510 310, 580 270 C 650 235, 720 290, 800 265 L800 320 L0 320 L0 265 C 70 290, 140 240, 200 270 Z" fill="#fcd34d" fillOpacity="0.08" />
      <circle cx="650" cy="85" r="18" fill="#fcd34d" fillOpacity="0.18" />
    </svg>
  );
}

function CoatScene() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-55" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="coat" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#34d399" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="#fcd34d" stopOpacity="0.12" />
          <stop offset="1" stopColor="#60a5fa" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <rect width="800" height="320" fill="url(#coat)" />
      <path d="M340 85 C 360 70, 440 70, 460 85 L510 140 L470 255 L400 235 L330 255 L290 140 Z" fill="#fcd34d" fillOpacity="0.12" stroke="#fde68a" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M340 120 L460 120" stroke="#22c55e" strokeOpacity="0.3" strokeWidth="14" strokeLinecap="round" />
      <path d="M330 150 L470 150" stroke="#60a5fa" strokeOpacity="0.3" strokeWidth="14" strokeLinecap="round" />
      <path d="M320 180 L480 180" stroke="#fb7185" strokeOpacity="0.26" strokeWidth="14" strokeLinecap="round" />
      <path d="M310 210 L490 210" stroke="#a78bfa" strokeOpacity="0.26" strokeWidth="14" strokeLinecap="round" />
      <circle cx="650" cy="78" r="26" fill="#fcd34d" fillOpacity="0.2" />
    </svg>
  );
}

function DefaultScene({ difficulty }: { difficulty: KidsTriviaDifficulty }) {
  const tint =
    difficulty === 'easy' ? 'from-emerald-400/15 via-green-500/10 to-sky-400/15' :
      difficulty === 'medium' ? 'from-yellow-400/10 via-emerald-400/10 to-blue-400/15' :
        'from-purple-400/10 via-blue-500/10 to-emerald-500/10';
  return <div className={`absolute inset-0 bg-gradient-to-br ${tint}`} />;
}

export function KidsTriviaScene({ questionId, difficulty, className }: SceneProps) {
  const id = questionId.toLowerCase();
  const scene =
    id.includes('noah') ? <ArkScene /> :
      id.includes('david') ? <SlingScene /> :
        id.includes('jonah') ? <FishScene /> :
          id.includes('joseph') ? <CoatScene /> :
            id.includes('moses') ? <SeaScene /> :
              id.includes('daniel') ? <LionsScene /> :
                id.includes('esther') ? <PalaceScene /> :
                  id.includes('elijah') ? <FireScene /> :
                    id.includes('jesus') ? <StormScene /> :
                      id.includes('paul') ? <PrisonScene /> :
                        null;

  return (
    <BaseBackdrop className={className ?? 'absolute inset-0'}>
      <DefaultScene difficulty={difficulty} />
      {scene}
    </BaseBackdrop>
  );
}
