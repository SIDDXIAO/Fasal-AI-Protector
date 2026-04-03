import { motion } from 'framer-motion';
import {
  Bot, ScanLine, CloudSun, BarChart3, Calculator, Globe,
  Brain, Database, MessageCircle, Camera, Pill, FlaskConical,
  Wifi, TrendingUp, Languages
} from 'lucide-react';

const mainFeatures = [
  {
    icon: Bot,
    title: '🤖 AI Chatbot (Agri-Assistant)',
    desc: 'Bilingual conversational AI powered by Mistral & RAG. Retrieves verified agricultural knowledge — not hallucinations.',
    color: 'from-green-500 to-emerald-600',
    shadow: 'shadow-green-500/20',
    details: [
      { icon: Languages, text: 'Hindi & English fluency' },
      { icon: Brain, text: 'RAG with ChromaDB vectors' },
      { icon: MessageCircle, text: 'Context-aware follow-ups' },
      { icon: Database, text: 'Gov. agriculture data trained' },
    ],
  },
  {
    icon: ScanLine,
    title: '🍃 Disease Scanner',
    desc: 'Upload a leaf photo for instant AI diagnosis with MobileNetV2 CNN — 92%+ accuracy across 38+ disease classes.',
    color: 'from-lime-500 to-green-600',
    shadow: 'shadow-lime-500/20',
    details: [
      { icon: Camera, text: 'Visual leaf diagnosis' },
      { icon: BarChart3, text: '92%+ classification accuracy' },
      { icon: Pill, text: 'Chemical treatment options' },
      { icon: FlaskConical, text: 'Organic remedy suggestions' },
    ],
  },
  {
    icon: CloudSun,
    title: '📊 Smart Tools Suite',
    desc: 'Real-time weather, live mandi rates, and scientific fertilizer calculations — all in one dashboard.',
    color: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/20',
    details: [
      { icon: CloudSun, text: '7-day hyper-local weather' },
      { icon: TrendingUp, text: 'Live crop market prices' },
      { icon: Calculator, text: 'Fertilizer dose calculator' },
      { icon: Wifi, text: 'Offline-capable caching' },
    ],
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function Features() {
  return (
    <section id="features" className="relative py-24 bg-[#020801]">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-green-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium mb-4">
            <Globe className="w-3.5 h-3.5" />
            CORE CAPABILITIES
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Key <span className="text-gradient">Features</span>
          </h2>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            Three powerful pillars designed to transform Indian agriculture through AI innovation.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {mainFeatures.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              whileHover={{ y: -8 }}
              className={`group relative p-8 rounded-3xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-green-500/30 transition-all duration-500 ${feature.shadow} hover:shadow-xl`}
            >
              {/* Glow */}
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

              <div className="relative z-10">
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg mb-6`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                {/* Title & Desc */}
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">{feature.desc}</p>

                {/* Details */}
                <div className="space-y-3">
                  {feature.details.map((d) => (
                    <div key={d.text} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <d.icon className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-gray-300 text-sm">{d.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
