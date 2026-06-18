import { useState } from "react";
import { Link } from "wouter";
import { Compass, Cpu, Target, User, Users, TrendingUp, ArrowRight, BrainCircuit } from "lucide-react";
import EQSurvey from "./EQSurvey"; 

export default function Home() {
  const [showPublicEQ, setShowPublicEQ] = useState(false);

  const frameworkPillars = [
    { 
      icon: <Compass className="w-5 h-5" />, 
      title: "Direction & Sense-Making", 
      desc: "Calibrating systemic foresight and intent alignment.",
      insight: "Evaluates leadership's ability to forecast industry shifts and communicate strategic vectors clearly across all management tiers."
    },
    { 
      icon: <Cpu className="w-5 h-5" />, 
      title: "Systems & Delivery", 
      desc: "Evaluating execution architecture and infrastructure.",
      insight: "Measures the efficiency of your operational workflows, resource allocation, and the elimination of delivery bottlenecks."
    },
    { 
      icon: <Target className="w-5 h-5" />, 
      title: "Purpose & Authenticity", 
      desc: "Assessing core motives and ethical anchors.",
      insight: "Analyzes the tangible alignment between stated corporate values and the daily behavioral anchors of your leadership team."
    },
    { 
      icon: <User className="w-5 h-5" />, 
      title: "Skills & Agility", 
      desc: "Measuring operational dexterity and transformation.",
      insight: "Assesses the workforce's aggregate capability to learn, unlearn, and rapidly pivot in response to changing market conditions."
    },
    { 
      icon: <Users className="w-5 h-5" />, 
      title: "Team & Norms", 
      desc: "Unpacking collaborative trust and interaction.",
      insight: "Uncovers the degree of psychological safety, cross-functional collaboration metrics, and conflict resolution mechanics."
    },
    { 
      icon: <TrendingUp className="w-5 h-5" />, 
      title: "Impact & Reputation", 
      desc: "Isolating leadership presence and brand vectors.",
      insight: "Evaluates external market perception driven by internal leadership presence, community footprint, and stakeholder trust."
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans scroll-smooth">
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

      {/* 🚀 CORE SYNCSHIFT HERO SECTION (100% Core Focused) */}
      <main className="bg-[#0B1120] text-white py-24 md:py-32 border-b border-gray-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-blue-400 text-xs font-bold tracking-widest uppercase bg-blue-500/10 px-3 py-1.5 rounded-full mb-6 inline-block">
            Enterprise Deployment Architecture
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 leading-tight">
            Synchronize your <br />
            <span className="text-orange-400">Organizational DNA.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            We integrate proprietary enterprise 360 diagnostics, organizational review framework architectures, 
            and systemic feedback metrics arrays into a single, cohesive baseline evaluation engine.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <a 
              href="#framework" 
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-lg text-sm transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Explore Framework Review <ArrowRight className="w-4 h-4" />
            </a>
            <a 
              href="#coaching-tool"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-gray-200 border border-white/20 font-semibold px-8 py-3.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
            >
              Try Individual EQ Mini-Module
            </a>
          </div>
        </div>
      </main>

      {/* Core Framework Cards */}
      <section id="framework" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#0B1120] mb-4">The Unified Review Framework</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Our diagnostic systems map individual behavioral competencies alongside 
            macro systemic alignment patterns to reveal targeted growth horizons.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {frameworkPillars.map((item, i) => (
            <div key={i} className="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-500 flex flex-col min-h-[240px] cursor-default">
              <div className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center mb-4 text-[#0B1120] group-hover:text-orange-600 group-hover:border-orange-200 group-hover:bg-orange-50 transition-colors duration-300">
                {item.icon}
              </div>
              <h3 className="font-bold text-[#0B1120] mb-3">{item.title}</h3>
              <div className="relative flex-grow">
                <p className="text-sm text-gray-500 absolute top-0 left-0 w-full transition-all duration-500 opacity-100 group-hover:opacity-0 group-hover:-translate-y-2">
                  {item.desc}
                </p>
                <p className="text-sm text-gray-800 font-medium leading-relaxed absolute top-0 left-0 w-full transition-all duration-500 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0">
                  {item.insight}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🧠 THE OPT-IN MARKETING/COACHING SPOTLIGHT BANNER */}
      <section id="coaching-tool" className="bg-gradient-to-b from-gray-100 to-gray-50 border-t border-gray-200 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#0B1120] mb-3">
                Executive & Leadership Coaching Spotlight
              </h2>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                Looking for situational micro-insights? Take our free standalone **Emotional Intelligence (EQ) Blueprint** to capture quick somatic indicators and establish an immediate real-world experiment baseline.
              </p>
              
              {!showPublicEQ && (
                <button 
                  onClick={() => setShowPublicEQ(true)}
                  className="mt-6 inline-flex bg-[#0B1120] hover:bg-gray-800 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors"
                >
                  Open Standalone Inventory Widget
                </button>
              )}
            </div>

            {showPublicEQ && (
              <div className="border-t border-gray-100 pt-8 mt-8 transition-all max-h-[600px] overflow-y-auto">
                <EQSurvey />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
