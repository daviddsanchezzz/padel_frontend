import React from 'react';
import {
  Trophy,
  Medal,
  GitMerge,
  CalendarDays,
  CircleCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LayoutList,
  Dumbbell,
  Plus,
  SlidersHorizontal,
  ChevronsRight,
  TrendingUp,
  Users2,
  Trash2,
  Loader2,
  AlertTriangle,
  Zap,
  Pencil,
  EllipsisVertical,
  Share2,
  User,
} from 'lucide-react';

const ICONS = {
  alert: AlertTriangle,
  bracket: GitMerge,
  calendar: CalendarDays,
  check: CircleCheck,
  edit: Pencil,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  division: LayoutList,
  league: Medal,
  match: Zap,
  more: EllipsisVertical,
  plus: Plus,
  settings: SlidersHorizontal,
  share: Share2,
  skip: ChevronsRight,
  sport: Dumbbell,
  standings: TrendingUp,
  user: User,
  team: Users2,
  tournament: Trophy,
  trash: Trash2,
  trophy: Trophy,
  spinner: Loader2,
};

const Icon = ({ name, size = 16, className = '' }) => {
  const Comp = ICONS[name];
  if (!Comp) return null;
  return <Comp size={size} className={className} />;
};

/* ── Padel racket SVG ───────────────────────────────────────── */
export const PadelRacketIcon = ({ size = 24, className = '', color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 28"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    {/* Racket head — round like a padel racket */}
    <ellipse cx="10" cy="9.5" rx="8.5" ry="9" fill={color} />
    {/* Holes — 2 rows of 3 */}
    <circle cx="6.5"  cy="7.5"  r="1.25" fill="white" />
    <circle cx="10"   cy="7.5"  r="1.25" fill="white" />
    <circle cx="13.5" cy="7.5"  r="1.25" fill="white" />
    <circle cx="6.5"  cy="11.5" r="1.25" fill="white" />
    <circle cx="10"   cy="11.5" r="1.25" fill="white" />
    <circle cx="13.5" cy="11.5" r="1.25" fill="white" />
    {/* Neck */}
    <rect x="8" y="17.5" width="4" height="2" rx="0.5" fill={color} />
    {/* Handle */}
    <rect x="7.5" y="19" width="5" height="8" rx="2.5" fill={color} />
  </svg>
);

/* ── Sport icon — SVG for padel, emoji for everything else ─── */
const SPORT_EMOJIS = {
  tennis:      '🎾',
  football:    '⚽',
  basketball:  '🏀',
  volleyball:  '🏐',
  badminton:   '🏸',
  squash:      '🏸',
  tabletennis: '🏓',
};

export const SportIcon = ({ slug, size = 22, color = 'currentColor', className = '' }) => {
  if (slug?.toLowerCase() === 'padel') {
    return <PadelRacketIcon size={size} color={color} className={className} />;
  }
  const emoji = SPORT_EMOJIS[slug?.toLowerCase()] ?? '🏆';
  return (
    <span
      className={className}
      aria-label={slug}
      style={{ fontSize: size * 0.85, lineHeight: 1, display: 'inline-block' }}
    >
      {emoji}
    </span>
  );
};

/** @deprecated use SportIcon */
export const sportEmoji = (slug) => {
  const map = { padel: '🎾', tennis: '🎾', football: '⚽', basketball: '🏀', volleyball: '🏐', badminton: '🏸', squash: '🏸', tabletennis: '🏓' };
  return map[slug?.toLowerCase()] ?? '🏆';
};

export default Icon;
