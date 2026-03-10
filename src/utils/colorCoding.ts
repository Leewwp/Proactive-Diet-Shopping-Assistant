import { COLORS } from '@/constants';
import { AlertLevel } from '@/types';

export function getComplianceColor(level: AlertLevel): string {
  return COLORS.compliance[level];
}

export function getComparisonColor(status: 'better' | 'worse' | 'neutral'): string {
  return COLORS.comparison[status];
}

export function getMeterColorByPercentage(percentage: number): string {
  if (percentage < 50) return COLORS.meter.low;
  if (percentage < 80) return COLORS.meter.mid;
  return COLORS.meter.high;
}

export function getNutriScoreColor(score: 'A' | 'B' | 'C' | 'D' | 'E'): string {
  return COLORS.nutriScore[score];
}

export function getAlertBackgroundColor(level: AlertLevel): string {
  switch (level) {
    case 'emergency':
      return '#FFEBEE';
    case 'suggestion':
      return '#FFF8E1';
    case 'optimization':
      return '#E8F5E9';
    default:
      return 'transparent';
  }
}

export function getAlertTextColor(level: AlertLevel): string {
  switch (level) {
    case 'emergency':
      return '#B71C1C';
    case 'suggestion':
      return '#F57F17';
    case 'optimization':
      return '#1B5E20';
    default:
      return '#212121';
  }
}

export function getAlertIcon(level: AlertLevel): string {
  switch (level) {
    case 'emergency':
      return 'alert-circle';
    case 'suggestion':
      return 'alert';
    case 'optimization':
      return 'lightbulb';
    default:
      return 'check-circle';
  }
}
