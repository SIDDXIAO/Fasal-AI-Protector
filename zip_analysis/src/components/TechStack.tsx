import { motion } from 'framer-motion';
import { Code2, Server, Brain, Database, Lock, Smartphone, Layers, Cpu } from 'lucide-react';

const techCategories = [
  {
    title: 'Backend',
    icon: Server,
    color: 'from-green-500 to-emerald-600',
    items: ['Python 3.10+', 'Django 4.2', 'Django REST Framework', 'SQLite / PostgreSQL'],
  },
  {
    title: 'AI / ML Engine',
    icon: Brain,
    color: 'from-purple-500 to-indigo-600',
    items: ['Mistral AI (LLM)', 'ChromaDB (Vector DB)', 'TensorFlow / Keras (CNN)', 'MobileNetV2 Architecture'],
  },
  {
    title: 'Data Processing',
    icon: Database,
    color: 'from-amber-500 to-orange-600',
    items: ['Pandas', 'NumPy', 'RAG Pipeline', 'Gov. Agriculture Data'],
  },
  {
    title: 'Frontend',
    icon: Code2,
    color: 'from-sky-500 to-blue-600',
    items: ['HTML5 / CSS3 / JS', 'Responsive PWA', 'Real-time Updates', 'Offline Capable'],
  },
  {
    title: 'Security',
    icon: Lock,
    color: 'from-red-500 to-rose-600',
    items: ['CSRF Protection', 'Input Validation', 'Secure API Endpoints', 'Data Encryption'],
  },
  {
    title: 'Infrastructure',
    icon: Cpu,
    color: 'from-teal-500 to-cyan-600',
    items: ['LM Studio (Local LLM)', 'REST APIs', 'WebSocket Ready', 'Docker Compatible'],
  },
];

const archSteps = [
  { icon: Smartphone, label: 'User Input', desc: 'Image / Text query' },
  { icon: Server, label: 'Django API', desc: 'Route & validate' },
  { icon: Brain, label: 'AI Engine', desc: 'CNN / RAG processing' },
  { icon: Layers, label: 'Knowledge Base', desc: 'ChromaDB retrieval' },
  { icon: Smartphone, label: 'Response', desc: 'Diagnosis / Advisory' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function TechStack() {
  return (
    <section id="techstack" className="relative py-24 bg-[#020801]">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/3 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-4">
            <Code2 className="w-3.5 h-3.5" />
            ARCHITECTURE
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Tech <span className="text-gradient">Stack</span>
          </h2>
          <p className="mt-4 text-gray-400 max-w-lg mx-auto">
            Built with cutting-edge AI technologies for reliable, scalable agricultural intelligence.
          </p>
        </motion.div>

        {/* Architecture Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0">
            {archSteps.map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center gap-2 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-white text-sm font-bold">{step.label}</div>
                    <div className="text-gray-500 text-xs">{step.desc}</div>
                  </div>
                </div>
                {i < archSteps.length - 1 && (
                  <div className="hidden sm:block w-8 h-px bg-gradient-to-r from-green-500/40 to-green-500/10" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tech Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {techCategories.map((cat) => (
            <motion.div
              key={cat.title}
              variants={item}
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-green-500/20 transition-all group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg`}>
                  <cat.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-bold">{cat.title}</h3>
              </div>
              <ul className="space-y-2">
                {cat.items.map((tech) => (
                  <li key={tech} className="flex items-center gap-2 text-gray-400 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                    {tech}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Project Structure */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 p-6 rounded-3xl bg-white/[0.02] border border-white/[0.06]"
        >
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-green-400" />
            Project Structure
          </h3>
          <pre className="text-sm text-gray-400 leading-relaxed overflow-x-auto font-mono">
{`agritech-pro/
├── apps/
│   ├── chatbot/       # RAG engine, RAGChatbot class
│   ├── scanner/       # CNN model inference
│   ├── weather/       # Weather API service
│   └── market/        # Mandi price service
├── config/            # Django settings, URLs
├── media/             # Uploaded leaf images
├── models/            # AI models (.h5) & Vector DB
├── static/            # CSS, JS, Icons
├── templates/         # HTML Templates
└── manage.py          # Django entry point`}
          </pre>
        </motion.div>
      </div>
    </section>
  );
}
