/**
 * Reusable Tailwind class constants to eliminate duplication across components.
 * Import these instead of repeating the same class strings inline.
 */

/** Standard card: semi-transparent, blurred, with blue border */
export const cardBase = 'bg-card/80 backdrop-blur-sm border-mcs-blue/30';

/** Standard form input styling */
export const inputBase = 'bg-background/50 border-mcs-blue/30 focus:border-mcs-blue';

/** Primary CTA button gradient */
export const btnGradient = 'bg-gradient-secondary hover:bg-gradient-primary transition-all duration-300';

/** Subtle card variant for nested sections */
export const cardInner = 'bg-background/30 border-mcs-blue/20';

/** Standard outline button border */
export const btnOutlineBorder = 'border-mcs-blue/30';
