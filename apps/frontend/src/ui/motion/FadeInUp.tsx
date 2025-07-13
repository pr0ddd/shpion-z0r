import React from 'react';
import { motion } from 'framer-motion';

interface FadeInUpProps {
  delay?: number;
  duration?: number;
}

/**
 * Simple wrapper that fades content in while sliding up.
 */
export const FadeInUp: React.FC<React.PropsWithChildren<FadeInUpProps>> = ({
  children,
  delay = 0,
  duration = 0.8,
}) => (
  <motion.div
    initial={{ y: 50, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration, delay, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
); 