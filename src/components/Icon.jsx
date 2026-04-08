import React from 'react';
import {
  Trophy, Medal, GitMerge, CalendarDays, CircleCheck,
  ChevronLeft, ChevronRight, LayoutList, Dumbbell,
  Plus, SlidersHorizontal, ChevronsRight, TrendingUp,
  Users2, Trash2, Loader2, AlertTriangle, Zap, Pencil,
} from 'lucide-react';

const ICONS = {
  alert:        AlertTriangle,   // advertencia visible
  bracket:      GitMerge,        // ramas que se fusionan = bracket
  calendar:     CalendarDays,    // calendario con días
  check:        CircleCheck,    // check dentro de círculo
  edit:         Pencil,
  chevronLeft:  ChevronLeft,
  chevronRight: ChevronRight,
  division:     LayoutList,      // filas estructuradas = divisiones
  league:       Medal,           // medalla = liga/clasificación
  match:        Zap,             // acción/energía = partido
  plus:         Plus,
  settings:     SlidersHorizontal, // sliders = configuración
  skip:         ChevronsRight,   // doble flecha = bye/saltar
  sport:        Dumbbell,        // deporte físico
  standings:    TrendingUp,      // subida = clasificación
  team:         Users2,          // dos personas = pareja de pádel
  tournament:   Trophy,          // copa = torneo
  trash:        Trash2,
  trophy:       Trophy,
  spinner:      Loader2,
};

const Icon = ({ name, size = 16, className = '' }) => {
  const Comp = ICONS[name];
  if (!Comp) return null;
  return <Comp size={size} className={className} />;
};

const SPORT_EMOJIS = {
  padel:      '🏓',
  tennis:     '🎾',
  football:   '⚽',
  basketball: '🏀',
  volleyball: '🏐',
  badminton:  '🏸',
  squash:     '🏸',
  tabletennis:'🏓',
};

export const sportEmoji = (slug) => SPORT_EMOJIS[slug?.toLowerCase()] ?? '🏆';

export default Icon;

