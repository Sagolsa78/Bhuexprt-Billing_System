import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function ContactCTA() {
  return (
    <section id="enterprise" className="section-spacing px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 sm:p-12 md:p-16 text-white text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join businesses across India already using BhuExpert ERP to streamline operations and drive growth.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 sm:mb-8">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 font-semibold px-8 py-3.5 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
          </div>

          <p className="text-blue-200 text-xs sm:text-sm mb-8 sm:mb-10">
            14-day free trial · No credit card required
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-blue-100">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-white">10K+</p>
              <p className="text-xs sm:text-sm">Invoices Generated</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-blue-400/30" />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-white">99.9%</p>
              <p className="text-xs sm:text-sm">Uptime SLA</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-blue-400/30" />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-white">24/7</p>
              <p className="text-xs sm:text-sm">Expert Support</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
