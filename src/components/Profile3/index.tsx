'use client';

/** React Bits Pro 资料卡验证样例；适配项目主题与 UnoCSS，不接入业务路由。 */

import { motion } from 'motion/react';
import { Users, FileText } from 'lucide-react';
import { useState } from 'react';

export default function Profile3() {
  const [isHovered, setIsHovered] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <section className="w-full min-h-[var(--rb-section-min-h,100vh)] flex items-start desktop:items-center py-12 px-4 desktop:px-6 wide:px-8 bg-canvas">
      <div className="max-w-[1280px] mx-auto w-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="relative w-full max-w-sm"
        >
          <div className="relative bg-surface rounded-3xl shadow-lg overflow-hidden border border-border border-solid">
            <motion.div
              className="absolute inset-0 z-0"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1 : 1.1,
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="absolute inset-0">
                <img
                  src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 500%22%3E%3Crect width=%22400%22 height=%22500%22 fill=%22%23dbe4ec%22/%3E%3Ccircle cx=%22200%22 cy=%22170%22 r=%2270%22 fill=%22%2394a3b8%22/%3E%3Cpath d=%22M60 500v-70a140 140 0 01280 0v70%22 fill=%22%2394a3b8%22/%3E%3C/svg%3E"
                  alt="Background"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-b from-surface/90 via-surface/95 to-surface" />
            </motion.div>

            <div className="relative z-10 p-2">
              <div className="mb-4">
                <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-canvas">
                  <img
                    src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 500%22%3E%3Crect width=%22400%22 height=%22500%22 fill=%22%23dbe4ec%22/%3E%3Ccircle cx=%22200%22 cy=%22170%22 r=%2270%22 fill=%22%2394a3b8%22/%3E%3Cpath d=%22M60 500v-70a140 140 0 01280 0v70%22 fill=%22%2394a3b8%22/%3E%3C/svg%3E"
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface pointer-events-none" />
                </div>
              </div>

              <div className="mb-4 px-4">
                <h3 className="text-2xl font-bold text-text mb-2">Sarah Chen</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Frontend developer focused on building fast, accessible, & beautiful web
                  experiences.
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">243</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">18</span>
                  </div>
                </div>
                <motion.button
                  type="button"
                  aria-pressed={isFollowing}
                  onClick={() => setIsFollowing((value) => !value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-5 py-2 rounded-full font-medium text-sm transition-colors duration-200 ${
                    isFollowing
                      ? 'bg-accent text-white hover:bg-accent-hover'
                      : 'border border-solid border-border text-text hover:bg-canvas'
                  }`}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
