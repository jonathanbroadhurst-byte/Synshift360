import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Compass, Cpu, Target, User, Users, TrendingUp, ArrowRight, Key } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Navigation */}
      <nav className="bg-[#0B1120] text-white border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <span className="text-blue-500">⚡</span> SyncShift
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm hover:text-gray-300">
              Portal Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="bg-[#0B1120] text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Synchronize your <br />
              <span className="text-orange-400">Organizational DNA.</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-md leading-relaxed">
              We've integrated our leadership and systemic diagnostics into a single,
              cohesive Organization Review. Access your combined evaluation now to
              identify acceleration vectors.
            </p>
          </div>

          {/* Assessment Gate Card */}
          <div className="bg-white rounded-xl p-8 text-gray-900 shadow-2xl">
            <div className="flex items-center gap-2 mb-6 text-sm font-semibold">
              <Key className="w-4 h-4 text-orange-500" /> Secure Assessment Gate
            </div>
            <div className="space-y-4">
              <Input
                placeholder="ENTER INVITE CODE"
                className="h-12 text-center uppercase tracking-widest bg-gray-50 border-gray-200"
              />
              <Button className="w-full h-12 bg-[#0B1120] hover:bg-gray-800 text-white flex items-center justify-center gap-2">
                Start Combined Review <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Framework Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Key className="w-6 h-6 text-orange-500 transform rotate-180" />
            <h2 className="text-3xl font-bold text-[#0B1120]">The Unified Review Framework</h2>
          </div>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Our unified diagnostics now process individual competency intents alongside
            macro systemic alignment outcomes in one seamless evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Cards based exactly on your screenshot */}
          {[
            { icon: <Compass className="w-5 h-5" />, title: "Direction & Sense-Making", desc: "Calibrating systemic foresight and intent alignment." },
            { icon: <Cpu className="w-5 h-5" />, title: "Systems & Delivery", desc: "Evaluating execution architecture and infrastructure." },
            { icon: <Target className="w-5 h-5" />, title: "Purpose & Authenticity", desc: "Assessing core motives and ethical anchors." },
            { icon: <User className="w-5 h-5" />, title: "Skills & Agility", desc: "Measuring operational dexterity and transformation." },
            { icon: <Users className="w-5 h-5" />, title: "Team & Norms", desc: "Unpacking collaborative trust and interaction." },
            { icon: <TrendingUp className="w-5 h-5" />, title: "Impact & Reputation", desc: "Isolating leadership presence and brand vectors." },
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center mb-4 text-[#0B1120]">
                {item.icon}
              </div>
              <h3 className="font-bold text-[#0B1120] mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
