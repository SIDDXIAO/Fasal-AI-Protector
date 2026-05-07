import { motion } from 'framer-motion';
import { ScanLine, Bot, CloudSun, ArrowDown, Shield, Zap } from 'lucide-react';

export function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#030a01]">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-20 left-20 w-[300px] h-[300px] bg-lime-500/8 rounded-full blur-[80px] animate-float-slow" />
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-green-400/40 rounded-full"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-8"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-medium">AI-Powered Agricultural Intelligence</span>
            <Shield className="w-3.5 h-3.5 text-green-400" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-8xl font-black text-white leading-tight tracking-tight"
          >
            <span className="block">🌾 Fas</span>
            <span className="text-gradient text-6xl sm:text-7xl lg:text-9xl">Ai</span>
            <span className="block text-4xl sm:text-5xl lg:text-7xl mt-2 text-gray-300">Protector</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Empowering farmers with <span className="text-green-400 font-semibold">Deep Learning</span> disease detection, 
            <span className="text-emerald-400 font-semibold"> Bilingual AI Advisory</span>, and 
            <span className="text-lime-400 font-semibold"> Data-Driven Insights</span> — 
            in Hindi & English.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-6 sm:gap-10 mt-10"
          >
            {[
              { value: '92%+', label: 'Detection Accuracy' },
              { value: '38+', label: 'Disease Classes' },
              { value: '2', label: 'Languages Supported' },
              { value: '24/7', label: 'AI Advisory' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gradient">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
          >
            <a
              href="#features"
              className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl text-lg shadow-2xl shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-105 active:scale-95"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Explore Features
              </span>
            </a>
            <a
              href="#scanner"
              className="px-8 py-4 border-2 border-green-500/30 text-green-400 font-bold rounded-2xl text-lg hover:bg-green-500/10 hover:border-green-500/50 transition-all hover:scale-105 active:scale-95"
            >
              <span className="flex items-center gap-2">
                <ScanLine className="w-5 h-5" />
                Try Scanner
              </span>
            </a>
          </motion.div>

          {/* Feature Cards Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-3xl mx-auto"
          >
            {[
              { icon: Bot, label: 'AI Chatbot', desc: 'Hindi & English', color: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/20' },
              { icon: ScanLine, label: 'Disease Scanner', desc: 'CNN Powered', color: 'from-lime-500/20 to-green-500/20', border: 'border-lime-500/20' },
              { icon: CloudSun, label: 'Smart Tools', desc: 'Weather & Mandi', color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/20' },
            ].map(({ icon: Icon, label, desc, color, border }) => (
              <motion.div
                key={label}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`p-5 rounded-2xl bg-gradient-to-br ${color} border ${border} glass`}
              >
                <Icon className="w-8 h-8 text-green-400 mb-3 mx-auto" />
                <h3 className="text-white font-semibold">{label}</h3>
                <p className="text-gray-400 text-sm mt-1">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex justify-center mt-16"
        >
          <motion.a
            href="#features"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-3 rounded-full border border-green-500/20 text-green-400/60 hover:text-green-400 hover:border-green-500/40 transition"
          >
            <ArrowDown className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
