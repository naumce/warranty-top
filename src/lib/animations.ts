// Animation utilities for consistent, smooth animations across the app

/**
 * Page load fade-in animation
 * Usage: Add to root element of page
 */
export const fadeInUp = {
  initial: "opacity-0 translate-y-4",
  animate: "opacity-100 translate-y-0",
  transition: "transition-all duration-700 ease-out",
};

/**
 * Staggered animation for lists
 * Usage: Apply to each item with index-based delay
 */
export const staggerItem = (index: number, baseDelay: number = 100) => ({
  style: { animationDelay: `${index * baseDelay}ms` },
  className: "animate-in fade-in slide-in-from-bottom-4 duration-500",
});

/**
 * Card hover effect
 * Usage: Add to Card component
 */
export const cardHover = "transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]";

/**
 * Button press effect
 * Usage: Add to Button component
 */
export const buttonPress = "active:scale-95 transition-transform duration-150";

/**
 * Smooth expand/collapse
 * Usage: For collapsible sections
 */
export const expandCollapse = "transition-all duration-300 ease-in-out overflow-hidden";

/**
 * Skeleton loader pulse
 * Usage: For loading states
 */
export const skeletonPulse = "animate-pulse bg-muted rounded-lg";

/**
 * Success checkmark animation
 * Usage: For success states
 */
export const successAnimation = "animate-in zoom-in-50 duration-500";

/**
 * Error shake animation
 * Usage: For error states
 */
export const errorShake = "animate-shake";

/**
 * Smooth fade transition
 * Usage: For opacity changes
 */
export const fade = "transition-opacity duration-300 ease-in-out";

/**
 * Slide in from right (mobile menu)
 * Usage: For side panels
 */
export const slideInRight = "animate-in slide-in-from-right duration-300";

/**
 * Slide in from bottom (mobile dialogs)
 * Usage: For bottom sheets
 */
export const slideInBottom = "animate-in slide-in-from-bottom duration-300";

/**
 * Scale in (modals)
 * Usage: For modal entrances
 */
export const scaleIn = "animate-in zoom-in-95 duration-200";

/**
 * Smooth height transition
 * Usage: For expandable content
 */
export const smoothHeight = "transition-[height] duration-300 ease-in-out";

/**
 * Rotate animation (for icons)
 * Usage: For rotating icons
 */
export const rotate180 = "transition-transform duration-300";

/**
 * Loading spinner
 * Usage: For loading indicators
 */
export const spinner = "animate-spin";

/**
 * Bounce animation (for attention)
 * Usage: For important elements
 */
export const bounce = "animate-bounce";

/**
 * Pulse animation (for notifications)
 * Usage: For notification badges
 */
export const pulse = "animate-pulse";

/**
 * Mobile-optimized dialog
 * Usage: For Dialog components
 */
export const mobileDialog = `
  sm:max-w-md 
  max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:right-0
  max-sm:rounded-t-2xl max-sm:rounded-b-none
  max-sm:animate-in max-sm:slide-in-from-bottom
  max-sm:max-h-[90vh] max-sm:overflow-y-auto
`;

/**
 * Sticky header (for dialogs/pages)
 * Usage: For headers that should stick
 */
export const stickyHeader = `
  sticky top-0 z-10 
  bg-background/95 backdrop-blur-sm
  border-b
`;

/**
 * Touch-friendly button
 * Usage: For all interactive elements on mobile
 */
export const touchFriendly = `
  min-h-[44px] min-w-[44px]
  sm:min-h-[40px] sm:min-w-[40px]
`;

/**
 * Gradient text animation
 * Usage: For premium/special text
 */
export const gradientText = `
  bg-gradient-to-r from-primary via-purple-500 to-pink-500
  bg-clip-text text-transparent
  animate-gradient
`;

/**
 * Shimmer effect (for loading)
 * Usage: For skeleton loaders
 */
export const shimmer = `
  relative overflow-hidden
  before:absolute before:inset-0
  before:-translate-x-full
  before:animate-shimmer
  before:bg-gradient-to-r
  before:from-transparent before:via-white/10 before:to-transparent
`;

// Custom animation keyframes to add to global CSS
export const customAnimations = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes shimmer {
  100% { transform: translateX(100%); }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 3s ease infinite;
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;

