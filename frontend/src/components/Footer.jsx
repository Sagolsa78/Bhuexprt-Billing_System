import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

export function Footer() {
  const footerSections = [
    {
      title: 'Product',
      links: ['Features', 'Pricing', 'Dashboard', 'Reports', 'Invoicing'],
    },
    {
      title: 'Company',
      links: ['About', 'Blog', 'Careers', 'Contact'],
    },
    {
      title: 'Resources',
      links: ['Documentation', 'Guides', 'API Docs', 'Support'],
    },
    {
      title: 'Legal',
      links: ['Privacy', 'Terms', 'Compliance'],
    },
  ]

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  return (
    <footer className="bg-gray-900 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 mb-12 sm:mb-16">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="col-span-2 sm:col-span-3 md:col-span-1"
          >
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-7 h-7 text-indigo-400" />
              <span className="font-bold text-lg">BhuExpert ERP</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              The complete GST-compliant billing and ERP platform for Indian businesses.
            </p>
          </motion.div>

          {footerSections.map((section, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: (index + 1) * 0.1 }}
            >
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="border-t border-gray-800 mb-6 sm:mb-8" />

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-gray-400 text-xs sm:text-sm">
            © 2024 BhuExpert. All rights reserved.
          </p>

          <div className="flex items-center gap-4 sm:gap-6">
            {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
              <a
                key={social}
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm"
              >
                {social}
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
