import { Leaf, Github, Heart, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative bg-[#020601] border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">Fas<span className="text-gradient">Ai</span></span>
                <span className="text-[10px] block -mt-1 text-green-400 font-medium tracking-widest uppercase">Protector</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm max-w-md leading-relaxed">
              AI-powered comprehensive agriculture platform combining Deep Learning (CNN) for visual diagnosis 
              with Generative AI (RAG) for interactive advisory support — accessible in Hindi & English.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="#" className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-gray-500 hover:text-green-400 hover:border-green-500/20 transition">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-2">
              {['Features', 'Disease Scanner', 'AI Chatbot', 'Smart Tools', 'Tech Stack'].map((link) => (
                <li key={link}>
                  <a href={`#${link.toLowerCase().replace(/\s+/g, '')}`} className="text-gray-500 text-sm hover:text-green-400 transition flex items-center gap-1">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Technologies</h4>
            <ul className="space-y-2">
              {[
                { name: 'Django', url: '#' },
                { name: 'Mistral AI', url: '#' },
                { name: 'ChromaDB', url: '#' },
                { name: 'TensorFlow', url: '#' },
                { name: 'LM Studio', url: '#' },
              ].map((item) => (
                <li key={item.name}>
                  <a href={item.url} className="text-gray-500 text-sm hover:text-green-400 transition flex items-center gap-1">
                    {item.name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/[0.04]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm flex items-center gap-1">
              Developed with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for the Future of Indian Agriculture 🇮🇳
            </p>
            <p className="text-gray-700 text-xs">
              © 2024 FasAi Protector. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
