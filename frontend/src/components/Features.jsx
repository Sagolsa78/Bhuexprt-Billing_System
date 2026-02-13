import { motion } from 'framer-motion'
import { BarChart3, Users, Zap, Shield, Layers, TrendingUp } from 'lucide-react'

export function Features() {
  const features = [
    {
      icon: BarChart3,
      title: 'Smart Dashboard',
      description: 'Real-time insights into your revenue, expenses, profit, and pending payments at a glance.',
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Manage customer profiles, credit limits, outstanding balances, and full payment history.',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: Zap,
      title: 'GST Billing',
      description: 'Create professional, GST-compliant invoices with HSN codes and automatic tax calculation.',
      color: 'bg-amber-100 text-amber-600',
    },
    {
      icon: Shield,
      title: 'Expense Tracking',
      description: 'Track business expenses with bill attachments, categorization, and monthly analytics.',
      color: 'bg-red-100 text-red-600',
    },
    {
      icon: Layers,
      title: 'Inventory Control',
      description: 'Track stock levels, set reorder points, and get low-stock alerts automatically.',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: TrendingUp,
      title: 'Reports & Analytics',
      description: 'Sales, P&L, GST, product sales, customer outstanding, and low stock reports.',
      color: 'bg-cyan-100 text-cyan-600',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }

  return (
    <section id="features" className="section-spacing px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Features</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 mt-2">
            Everything Your Business Needs
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            A complete ERP platform — billing, inventory, expenses, and reports in one place.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            const [bgColor, textColor] = feature.color.split(' ')
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group"
              >
                <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${textColor}`} />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
