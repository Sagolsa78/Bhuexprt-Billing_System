import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Play } from 'lucide-react'

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
  }

  const scaleVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.7 } },
  }

  return (
    <section className="relative min-h-screen bg-black pt-24 sm:pt-28 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 sm:space-y-8"
        >
          <motion.div variants={itemVariants} className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-blue-950/40 border border-blue-500/30 px-4 py-2 rounded-full backdrop-blur-sm hover:border-blue-400/60 transition-colors">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-xs sm:text-sm font-medium text-blue-300">GST-Compliant Indian ERP System</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-tight tracking-tight">
              Smart ERP for
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Modern Business
              </span>
            </h1>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-center text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light px-4"
          >
            Streamline your billing, inventory, and accounting with our comprehensive, GST-compliant ERP system. Designed for speed, built for scale.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="relative group bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold shadow-lg shadow-blue-500/20 w-full sm:w-auto justify-center"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>

            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="relative group border border-gray-600 hover:border-gray-400 bg-gray-900/50 hover:bg-gray-800/50 text-white px-8 py-4 rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold backdrop-blur-sm w-full sm:w-auto justify-center"
              >
                <Play className="w-4 h-4" />
                <span>Live Demo</span>
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            variants={scaleVariants}
            className="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-gray-800"
          >
            <p className="text-center text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 uppercase tracking-wider">Trusted by businesses across India</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
              <motion.div
                variants={itemVariants}
                className="text-center space-y-2 sm:space-y-3"
              >
                <p className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  10K+
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">Invoices generated monthly</p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="text-center space-y-2 sm:space-y-3"
              >
                <p className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  99.9%
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">System uptime guarantee</p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="text-center space-y-2 sm:space-y-3"
              >
                <p className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  24/7
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">Expert support available</p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.1, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-20 right-10 w-48 sm:w-72 h-48 sm:h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          opacity: [0.3, 0.1, 0.3]
        }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        className="absolute bottom-10 left-10 sm:left-20 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"
      />
    </section>
  )
}
