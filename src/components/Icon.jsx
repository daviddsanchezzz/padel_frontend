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

const SPORT_EMOJIS = {
  padel: '\u{1F3D3}',
  tennis: '\u{1F3BE}',
  football: '\u26BD',
  basketball: '\u{1F3C0}',
  volleyball: '\u{1F3D0}',
  badminton: '\u{1F3F8}',
  squash: '\u{1F3F8}',
  tabletennis: '\u{1F3D3}',
};

export const sportEmoji = (slug) => SPORT_EMOJIS[slug?.toLowerCase()] ?? '\u{1F3C6}';

export default Icon;
