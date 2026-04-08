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
  skip: ChevronsRight,
  sport: Dumbbell,
  standings: TrendingUp,
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

const SPORT_EMOJIS = {
  padel: '??',
  tennis: '??',
  football: '?',
  basketball: '??',
  volleyball: '??',
  badminton: '??',
  squash: '??',
  tabletennis: '??',
};

export const sportEmoji = (slug) => SPORT_EMOJIS[slug?.toLowerCase()] ?? '??';

export default Icon;
