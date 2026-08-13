import { Component, computed, input } from '@angular/core';
import { getInitials } from '../../utils/initials.util';

const PALETTE = [
  'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300',
  'bg-success-50 text-success-700 dark:bg-success-500/20 dark:text-success-400',
  'bg-warning-50 text-warning-700 dark:bg-warning-500/25 dark:text-warning-500',
  'bg-error-50 text-error-700 dark:bg-error-500/20 dark:text-error-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
];

/** Avatar circular con iniciales y color consistente derivado de `seed` (ej. el id del asesor). */
@Component({
  selector: 'app-initials-avatar',
  templateUrl: './initials-avatar.html',
})
export class InitialsAvatar {
  readonly name = input<string | null>(null);
  readonly seed = input<number | null>(null);

  protected readonly initials = computed(() => {
    const name = this.name();
    return name ? getInitials(name) : '?';
  });

  protected readonly colorClass = computed(() => {
    const seed = this.seed();
    if (seed === null) {
      return PALETTE[0];
    }
    return PALETTE[Math.abs(seed) % PALETTE.length];
  });
}
