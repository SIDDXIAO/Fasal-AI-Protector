import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CloudSun, Droplets, Wind, Eye, Thermometer, TrendingUp, TrendingDown,
  Calculator, Wheat, ArrowRight, Sun, CloudRain, Cloud, MapPin
} from 'lucide-react';

const weatherData = {
  current: { temp: 32, condition: 'Partly Cloudy', humidity: 68, wind: 12, visibility: 8, uv: 7, location: 'Lucknow, UP' },
  forecast: [
    { day: 'Mon', icon: Sun, temp: 34, low: 24, rain: 5 },
    { day: 'Tue', icon: CloudSun, temp: 32, low: 23, rain: 15 },
    { day: 'Wed', icon: CloudRain, temp: 28, low: 22, rain: 75 },
    { day: 'Thu', icon: CloudRain, temp: 27, low: 21, rain: 80 },
    { day: 'Fri', icon: Cloud, temp: 29, low: 22, rain: 40 },
    { day: 'Sat', icon: CloudSun, temp: 31, low: 23, rain: 20 },
    { day: 'Sun', icon: Sun, temp: 33, low: 24, rain: 10 },
  ],
};

const mandiData = [
  { crop: '🌾 Wheat', price: 2350, change: +3.2, msp: 2275, unit: '₹/qtl' },
  { crop: '🍚 Rice (Basmati)', price: 4200, change: +1.8, msp: 2183, unit: '₹/qtl' },
  { crop: '🌽 Maize', price: 1980, change: -1.5, msp: 2090, unit: '₹/qtl' },
  { crop: '🥔 Potato', price: 1450, change: +5.1, msp: null, unit: '₹/qtl' },
  { crop: '🧅 Onion', price: 2100, change: -2.3, msp: null, unit: '₹/qtl' },
  { crop: '🍅 Tomato', price: 3200, change: +8.7, msp: null, unit: '₹/qtl' },
];

const crops = ['Wheat', 'Rice', 'Maize', 'Sugarcane', 'Potato', 'Cotton'];

export function Tools() {
  const [activeTab, setActiveTab] = useState<'weather' | 'mandi' | 'fertilizer'>('weather');
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [area, setArea] = useState('1');

  const fertilizerCalc = () => {
    const a = parseFloat(area) || 1;
    const data: Record<string, { n: number; p: number; k: number }> = {
      Wheat: { n: 120, p: 60, k: 40 },
      Rice: { n: 150, p: 60, k: 40 },
      Maize: { n: 120, p: 60, k: 40 },
      Sugarcane: { n: 250, p: 60, k: 60 },
      Potato: { n: 180, p: 80, k: 100 },
      Cotton: { n: 100, p: 50, k: 50 },
    };
    const d = data[selectedCrop] || data.Wheat;
    return {
      urea: ((d.n / 0.46) * a).toFixed(1),
      dap: ((d.p / 0.46) * a).toFixed(1),
      mop: ((d.k / 0.60) * a).toFixed(1),
      npk: `${(d.n * a).toFixed(0)}:${(d.p * a).toFixed(0)}:${(d.k * a).toFixed(0)}`,
    };
  };

  const fert = fertilizerCalc();

  const tabs = [
    { key: 'weather' as const, label: 'Weather', icon: CloudSun },
    { key: 'mandi' as const, label: 'Mandi Rates', icon: TrendingUp },
    { key: 'fertilizer' as const, label: 'Fertilizer Calc', icon: Calculator },
  ];

  return (
    <section id="tools" className="relative py-24 bg-[#030a01]">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium mb-4">
            <Calculator className="w-3.5 h-3.5" />
            SMART UTILITIES
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Smart <span className="text-gradient">Tools</span>
          </h2>
          <p className="mt-4 text-gray-400 max-w-lg mx-auto">
            Real-time agricultural intelligence at your fingertips.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* WEATHER */}
          {activeTab === 'weather' && (
            <div className="space-y-6">
              {/* Current */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-sky-500/10 to-blue-500/5 border border-sky-500/15">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <MapPin className="w-4 h-4" />
                  {weatherData.current.location}
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="text-center sm:text-left">
                    <div className="text-6xl font-black text-white">{weatherData.current.temp}°</div>
                    <div className="text-sky-400 font-medium mt-1">{weatherData.current.condition}</div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                    {[
                      { icon: Droplets, label: 'Humidity', value: `${weatherData.current.humidity}%` },
                      { icon: Wind, label: 'Wind', value: `${weatherData.current.wind} km/h` },
                      { icon: Eye, label: 'Visibility', value: `${weatherData.current.visibility} km` },
                      { icon: Thermometer, label: 'UV Index', value: `${weatherData.current.uv}/10` },
                    ].map((item) => (
                      <div key={item.label} className="text-center p-3 rounded-xl bg-white/[0.04]">
                        <item.icon className="w-5 h-5 text-sky-400 mx-auto mb-1" />
                        <div className="text-white font-semibold text-sm">{item.value}</div>
                        <div className="text-gray-500 text-xs">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* 7-day */}
              <div className="grid grid-cols-7 gap-2">
                {weatherData.forecast.map((day) => (
                  <div key={day.day} className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-center hover:border-sky-500/20 transition">
                    <div className="text-gray-500 text-xs font-medium">{day.day}</div>
                    <day.icon className="w-6 h-6 text-sky-400 mx-auto my-2" />
                    <div className="text-white font-bold text-sm">{day.temp}°</div>
                    <div className="text-gray-600 text-xs">{day.low}°</div>
                    <div className="text-sky-400/60 text-[10px] mt-1">{day.rain}% 💧</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MANDI */}
          {activeTab === 'mandi' && (
            <div className="rounded-3xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {['Crop', 'Price', 'Change', 'MSP', 'Status'].map((h) => (
                        <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mandiData.map((item) => (
                      <tr key={item.crop} className="border-b border-white/[0.03] hover:bg-green-500/5 transition">
                        <td className="px-6 py-4 text-white font-semibold">{item.crop}</td>
                        <td className="px-6 py-4 text-white font-bold">₹{item.price.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1 text-sm font-semibold ${item.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {item.change > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {item.change > 0 ? '+' : ''}{item.change}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">{item.msp ? `₹${item.msp}` : '—'}</td>
                        <td className="px-6 py-4">
                          {item.msp && (
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              item.price >= item.msp
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {item.price >= item.msp ? '↑ Above MSP' : '↓ Below MSP'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FERTILIZER */}
          {activeTab === 'fertilizer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Input */}
              <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/[0.06] space-y-5">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Wheat className="w-5 h-5 text-amber-400" />
                  Calculate Fertilizer Dose
                </h3>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Select Crop</label>
                  <div className="grid grid-cols-3 gap-2">
                    {crops.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedCrop(c)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                          selectedCrop === c
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/[0.03] text-gray-400 border border-white/[0.06] hover:border-green-500/20'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Area (Hectares)</label>
                  <input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    min="0.1"
                    step="0.5"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-green-500/40 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-xs">
                  <ArrowRight className="w-3.5 h-3.5" />
                  Based on ICAR recommended dosage
                </div>
              </div>
              {/* Output */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/15 space-y-4">
                <h3 className="text-white font-bold">📊 Recommendation for {selectedCrop}</h3>
                <p className="text-gray-400 text-sm">Area: {area} hectare(s) | NPK: {fert.npk} kg/ha</p>
                <div className="space-y-3">
                  {[
                    { name: 'Urea (46% N)', amount: fert.urea, color: 'from-green-500 to-lime-500' },
                    { name: 'DAP (46% P₂O₅)', amount: fert.dap, color: 'from-amber-500 to-orange-500' },
                    { name: 'MOP (60% K₂O)', amount: fert.mop, color: 'from-blue-500 to-indigo-500' },
                  ].map((f) => (
                    <div key={f.name} className="p-4 rounded-xl bg-black/30 border border-white/[0.05]">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">{f.name}</span>
                        <span className="text-white font-bold">{f.amount} kg</span>
                      </div>
                      <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${f.color} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(parseFloat(f.amount) / 5, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
