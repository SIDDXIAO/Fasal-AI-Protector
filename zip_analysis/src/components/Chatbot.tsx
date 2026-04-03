import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles, Languages, RotateCcw } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'bot';
  text: string;
  lang?: string;
}

const mockResponses: Record<string, { text: string; lang: string }> = {
  'default_en': {
    text: "I'm the FasAi Agri-Assistant! 🌾 I can help you with crop disease identification, treatment recommendations, weather updates, fertilizer calculations, and more. Ask me anything about agriculture!",
    lang: 'English',
  },
  'default_hi': {
    text: "नमस्ते! मैं FasAi कृषि-सहायक हूँ! 🌾 मैं फसल रोग पहचान, उपचार सिफारिशें, मौसम अपडेट, उर्वरक गणना और बहुत कुछ में आपकी मदद कर सकता हूँ। कृषि के बारे में कुछ भी पूछें!",
    lang: 'Hindi',
  },
  'disease': {
    text: "Based on your description, this sounds like it could be **Late Blight** (Phytophthora infestans). Here's what I recommend:\n\n🔬 **Identification**: Dark brown/black water-soaked lesions on leaves\n💊 **Chemical**: Mancozeb 75% WP @ 2.5g/L, spray every 7 days\n🌿 **Organic**: Neem oil spray (5ml/L) + copper oxychloride\n⏰ **Timing**: Apply during cool, humid conditions\n\nWould you like me to explain more about prevention?",
    lang: 'English',
  },
  'weather': {
    text: "☀️ Here's the weather forecast for your region:\n\n**Today**: 32°C, Partly Cloudy, Humidity 68%\n**Tomorrow**: 30°C, Light Rain expected\n**Week Ahead**: Monsoon patterns indicate good rainfall\n\n💡 **Advisory**: Good time for transplanting rice seedlings. Avoid spraying pesticides before expected rain.",
    lang: 'English',
  },
  'mandi': {
    text: "📊 Current Mandi Rates (Today):\n\n🌾 **Wheat**: ₹2,350/quintal (MSP: ₹2,275)\n🍚 **Rice (Basmati)**: ₹4,200/quintal\n🌽 **Maize**: ₹1,980/quintal\n🥔 **Potato**: ₹1,450/quintal\n\n📈 Wheat prices are above MSP — good time to sell!",
    lang: 'English',
  },
  'fertilizer': {
    text: "🧪 **Fertilizer Recommendation for Wheat (1 Hectare)**:\n\n**Basal Dose** (At sowing):\n- DAP: 130 kg\n- MOP: 50 kg\n\n**1st Top Dressing** (21 DAS):\n- Urea: 65 kg\n\n**2nd Top Dressing** (45 DAS):\n- Urea: 65 kg\n\n💧 Irrigate within 2-3 days of fertilizer application for best results.",
    lang: 'English',
  },
  'hindi': {
    text: "🌾 **गेहूं के लिए उर्वरक सिफारिश (1 हेक्टेयर)**:\n\n**बुवाई के समय**:\n- DAP: 130 किग्रा\n- MOP: 50 किग्रा\n\n**पहली टॉप ड्रेसिंग** (21 दिन बाद):\n- यूरिया: 65 किग्रा\n\n**दूसरी टॉप ड्रेसिंग** (45 दिन बाद):\n- यूरिया: 65 किग्रा\n\n💧 सर्वोत्तम परिणामों के लिए उर्वरक डालने के 2-3 दिन बाद सिंचाई करें।",
    lang: 'Hindi',
  },
};

function getResponse(input: string): { text: string; lang: string } {
  const lower = input.toLowerCase();
  const isHindi = /[\u0900-\u097F]/.test(input);

  if (isHindi) return mockResponses['hindi'];
  if (lower.includes('disease') || lower.includes('blight') || lower.includes('rot') || lower.includes('leaf')) return mockResponses['disease'];
  if (lower.includes('weather') || lower.includes('rain') || lower.includes('forecast')) return mockResponses['weather'];
  if (lower.includes('mandi') || lower.includes('price') || lower.includes('rate') || lower.includes('market')) return mockResponses['mandi'];
  if (lower.includes('fertilizer') || lower.includes('urea') || lower.includes('dap') || lower.includes('dose')) return mockResponses['fertilizer'];
  if (isHindi) return mockResponses['default_hi'];
  return mockResponses['default_en'];
}

const suggestedQueries = [
  "What disease affects tomato leaves?",
  "Today's weather forecast",
  "Current mandi rates for wheat",
  "गेहूं के लिए उर्वरक बताएं",
];

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'bot', text: "Namaste! 🙏 I'm your **FasAi Agri-Assistant**. I speak Hindi and English. Ask me about crop diseases, weather, mandi rates, or fertilizers!", lang: 'English' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now(), role: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const resp = getResponse(userMsg.text);
      const botMsg: Message = { id: Date.now() + 1, role: 'bot', text: resp.text, lang: resp.lang };
      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const handleReset = () => {
    setMessages([
      { id: Date.now(), role: 'bot', text: "Chat reset! 🔄 How can I help you today? Ask me about crops, diseases, weather, or market prices.", lang: 'English' },
    ]);
  };

  return (
    <section id="chatbot" className="relative py-24 bg-[#020801]">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            RAG-POWERED AI
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Agri <span className="text-gradient">Chatbot</span>
          </h2>
          <p className="mt-4 text-gray-400 max-w-lg mx-auto">
            Bilingual AI assistant powered by Mistral & ChromaDB. Try asking in Hindi or English!
          </p>
        </motion.div>

        {/* Chat Window */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] overflow-hidden shadow-2xl"
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0a0a0a]" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">FasAi Agri-Assistant</h3>
                <div className="flex items-center gap-1">
                  <Languages className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 text-xs">Hindi • English</span>
                </div>
              </div>
            </div>
            <button onClick={handleReset} className="p-2 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-blue-500/20' : 'bg-green-500/20'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-blue-400" /> : <Bot className="w-4 h-4 text-green-400" />}
                  </div>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-500/10 border border-blue-500/20 text-gray-200'
                      : 'bg-green-500/5 border border-green-500/10 text-gray-300'
                  }`}>
                    {msg.text.split('\n').map((line, i) => (
                      <span key={i}>
                        {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                          part.startsWith('**') && part.endsWith('**')
                            ? <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>
                            : <span key={j}>{part}</span>
                        )}
                        {i < msg.text.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                    {msg.lang && msg.role === 'bot' && (
                      <span className="block mt-2 text-[10px] text-gray-600">Responded in {msg.lang}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-green-400" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-green-500/5 border border-green-500/10">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-green-400 rounded-full"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestions */}
          <div className="px-4 py-2 border-t border-white/[0.04] flex gap-2 overflow-x-auto pb-2">
            {suggestedQueries.map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                className="flex-shrink-0 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/15 text-green-400 text-xs hover:bg-green-500/20 transition whitespace-nowrap"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/[0.06]">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about diseases, weather, prices... (Hindi/English)"
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:border-green-500/40 focus:ring-1 focus:ring-green-500/20 text-sm transition"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-400 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
