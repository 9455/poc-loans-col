import { motion } from 'framer-motion';

/**
 * Enhanced loading animation for loan operations
 * Shows animated token icon with pulsing effects
 */
export function LoadingAnimation({ 
  tokenIcon,
  tokenSymbol,
  message = 'Processing transaction...',
  submessage = 'This may take a few moments'
}) {
  return (
    <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
      {/* Animated Token Icon */}
      <div className="relative mb-6" style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {/* Outer pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ 
              position: 'absolute', inset: 0, borderRadius: '50%',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              zIndex: 0
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Middle ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ 
              position: 'absolute', inset: '5px', borderRadius: '50%',
              backgroundColor: 'rgba(59, 130, 246, 0.3)',
              zIndex: 1
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.3, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />

        {/* Token Icon Container */}
        <motion.div
          className="relative h-24 w-24 rounded-full"
          style={{ 
              position: 'relative', width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(168,85,247,0.2))',
              padding: '1rem',
              border: '2px solid rgba(59,130,246,0.4)',
              zIndex: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c222e', borderRadius: '50%' }}>
            <img
              src={tokenIcon}
              alt="Token"
              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            />
          </div>
        </motion.div>

        {/* Orbiting dots */}
        {[0, 120, 240].map((angle, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: '10px', height: '10px', backgroundColor: '#3b82f6',
              position: 'absolute',
              left: '50%',
              top: '50%',
              zIndex: 3
            }}
            animate={{
              x: [
                Math.cos((angle * Math.PI) / 180) * 50,
                Math.cos(((angle + 360) * Math.PI) / 180) * 50,
              ],
              y: [
                Math.sin((angle * Math.PI) / 180) * 50,
                Math.sin(((angle + 360) * Math.PI) / 180) * 50,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Loading Text */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ textAlign: 'center' }}
      >
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>
          {message}
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {submessage}
        </p>
        
        {/* Animated dots */}
        <motion.div
          style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '1rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
