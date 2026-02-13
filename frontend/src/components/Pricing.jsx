import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: '₹499',
      description: 'Perfect for small businesses getting started',
      features: [
        'Up to 2 users',
        'Basic reporting',
        'Email support',
        '500 invoices/month',
        'GST compliant billing',
        'Mobile access',
      ],
      cta: 'Start Free Trial',
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '₹1,499',
      description: 'For growing businesses that need more',
      features: [
        'Up to 10 users',
        'Advanced analytics',
        'Priority support',
        'Unlimited invoices',
        'Expense management',
        'Inventory tracking',
        'All report types',
        'API access',
      ],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: null,
      description: 'For large organizations with custom needs',
      features: [
        'Unlimited users',
        'Custom analytics',
        'Dedicated support',
        'Multi-branch support',
        'Custom integrations',
        'Advanced security',
        'SLA guarantee',
        'On-premise option',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ]

  const comparisonFeatures = [
    { category: 'Users', starter: 'Up to 2', professional: 'Up to 10', enterprise: 'Unlimited' },
    { category: 'Invoices', starter: '500/mo', professional: 'Unlimited', enterprise: 'Unlimited' },
    { category: 'Reports', starter: 'Basic', professional: 'All types', enterprise: 'Custom' },
    { category: 'Inventory', starter: 'No', professional: 'Yes', enterprise: 'Advanced' },
    { category: 'API Access', starter: 'No', professional: 'Yes', enterprise: 'Yes' },
    { category: 'SLA', starter: 'No', professional: 'No', enterprise: '99.9%' },
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
    <section id="pricing" className="section-spacing px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your business. Always flexible to scale.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-20"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`relative rounded-2xl p-6 sm:p-8 transition-all duration-300 ${plan.highlighted
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl md:scale-105'
                  : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg'
                }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                {plan.name}
              </h3>
              <p className={`mb-4 sm:mb-6 text-sm sm:text-base ${plan.highlighted ? 'text-blue-100' : 'text-gray-600'}`}>
                {plan.description}
              </p>

              <div className="mb-6 sm:mb-8">
                {plan.price ? (
                  <div>
                    <span className={`text-4xl sm:text-5xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm sm:text-base ${plan.highlighted ? 'text-blue-100' : 'text-gray-600'}`}>
                      /month
                    </span>
                  </div>
                ) : (
                  <div className={`text-xl sm:text-2xl font-semibold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    Custom pricing
                  </div>
                )}
              </div>

              <button
                className={`w-full py-3 rounded-lg font-semibold mb-6 sm:mb-8 transition-all duration-200 text-sm sm:text-base ${plan.highlighted
                    ? 'bg-white text-indigo-600 hover:bg-gray-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
              >
                {plan.cta}
              </button>

              <ul className="space-y-3 sm:space-y-4">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-white' : 'text-indigo-600'}`} />
                    <span className={`text-sm sm:text-base ${plan.highlighted ? 'text-blue-50' : 'text-gray-700'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
        >
          <div className="p-6 sm:p-8 border-b border-gray-200">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              Detailed Comparison
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 sm:px-8 py-3 sm:py-4 text-left font-semibold text-gray-900 text-sm sm:text-base">Feature</th>
                  <th className="px-4 sm:px-8 py-3 sm:py-4 text-center font-semibold text-gray-900 text-sm sm:text-base">Starter</th>
                  <th className="px-4 sm:px-8 py-3 sm:py-4 text-center font-semibold text-gray-900 text-sm sm:text-base">Professional</th>
                  <th className="px-4 sm:px-8 py-3 sm:py-4 text-center font-semibold text-gray-900 text-sm sm:text-base">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 sm:px-8 py-3 sm:py-4 font-medium text-gray-900 text-sm sm:text-base">{feature.category}</td>
                    <td className="px-4 sm:px-8 py-3 sm:py-4 text-center text-gray-600 text-sm sm:text-base">{feature.starter}</td>
                    <td className="px-4 sm:px-8 py-3 sm:py-4 text-center text-gray-600 text-sm sm:text-base">{feature.professional}</td>
                    <td className="px-4 sm:px-8 py-3 sm:py-4 text-center text-gray-600 text-sm sm:text-base">{feature.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
