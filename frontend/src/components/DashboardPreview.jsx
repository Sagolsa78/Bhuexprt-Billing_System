import { motion } from 'framer-motion'
import { Play } from 'lucide-react'

export function DashboardPreview() {
  return (
    <section id="solutions" className="section-spacing px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Powerful Dashboard
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Get real-time visibility into your entire business with intuitive dashboards and reports.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-gray-700"
        >
          <div className="bg-gray-950 p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-800 gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">Dashboard Overview</h3>
                <p className="text-gray-400 text-sm sm:text-base">Real-time Business Metrics</p>
              </div>
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-sm">
                <Play className="w-4 h-4" />
                <span>Watch Demo</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {[
                { label: 'Total Revenue', value: '₹24.5L', change: '+12.5%' },
                { label: 'Invoices', value: '1,240', change: '+8.2%' },
                { label: 'Net Profit', value: '₹8.2L', change: '+15.3%' },
                { label: 'Outstanding', value: '₹3.4L', change: '-2.1%' },
              ].map((stat, index) => (
                <div key={index} className="bg-gray-900 rounded-lg p-3 sm:p-4 border border-gray-800">
                  <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2 truncate">{stat.label}</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">{stat.value}</p>
                  <p className={`text-xs sm:text-sm ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.change} vs last month
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-800">
                <h4 className="text-white font-semibold mb-4 text-sm sm:text-base">Revenue Trend</h4>
                <div className="h-24 sm:h-32 bg-gradient-to-t from-blue-600/30 to-transparent rounded flex items-end gap-1">
                  {[40, 60, 45, 70, 55, 80, 65, 90].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-blue-600 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-800">
                <h4 className="text-white font-semibold mb-4 text-sm sm:text-base">Top Products</h4>
                <div className="space-y-3">
                  {['Product A', 'Product B', 'Product C', 'Product D'].map((product, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs sm:text-sm w-16 sm:w-20 truncate">{product}</span>
                      <div className="flex-1 bg-gray-800 rounded h-2">
                        <div
                          className="bg-blue-600 h-2 rounded"
                          style={{ width: `${100 - i * 15}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-xs sm:text-sm w-10 text-right">{100 - i * 15}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16"
        >
          {[
            {
              title: 'Real-Time Sync',
              description: 'Data syncs instantly across all modules',
            },
            {
              title: 'Multiple Reports',
              description: 'Sales, GST, P&L, and low-stock reports',
            },
            {
              title: 'Export & Share',
              description: 'Download invoices and reports as PDF',
            },
          ].map((feature, index) => (
            <div key={index} className="text-center">
              <h4 className="text-base sm:text-lg font-semibold text-white mb-2">
                {feature.title}
              </h4>
              <p className="text-gray-400 text-sm sm:text-base">
                {feature.description}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
