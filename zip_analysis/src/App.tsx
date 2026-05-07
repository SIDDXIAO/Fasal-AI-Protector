import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Scanner } from './components/Scanner';
import { Chatbot } from './components/Chatbot';
import { Tools } from './components/Tools';
import { TechStack } from './components/TechStack';
import { Footer } from './components/Footer';

export function App() {
  return (
    <div className="min-h-screen bg-[#030a01] text-white antialiased">
      <Navbar />
      <Hero />
      <Features />
      <Scanner />
      <Chatbot />
      <Tools />
      <TechStack />
      <Footer />
    </div>
  );
}
