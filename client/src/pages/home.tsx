import { Link } from "wouter";
import { Compass, Cpu, Target, User, Users, TrendingUp } from "lucide-react";
import EQSurvey from "../EQSurvey"; // Pulls in your public inventory component cleanly

export default function Home() {
  
  // The expanded data array including the 'insight' text for the hover state
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
      <main className="bg-[#0B1120] text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Side: Marketing and Branding Copy */}
          <div className="lg:col-span-5 pt-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Synchronize your <br />
              <span className="text-orange-400">Organizational DNA.</span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed mb-6">
              We've integrated our leadership and systemic diagnostics into a single,
              cohesive Organization Review. Access your combined evaluation now to
              identify acceleration vectors.
            </p>
            <div className="border-t border-gray-800 pt-6 mt-6">
              <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase block mb-2">Public Module Active</span>
              <p className="text-sm text-gray-400">Take our standalone Emotional Intelligence (EQ) Blueprint completely free on the right to instantly unlock your personalized micro-experiment action playbook.</p>
            </div>
          </div>

          {/* Right Side: Interactive Public Lead Capture Assessment Panel */}
          <div className="lg:col-span-7 bg-white rounded-xl text-gray-900 shadow-2xl overflow-hidden">
            <div className="p-1 bg-gradient-to-r from-orange-400 to-blue-500"></div>
            <div className="p-6 md:p-8 max-h-[680px] overflow-y-auto">
              <EQSurvey />
            </div>
          </div>

        </div>
      </main>

      {/* Framework Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#0B1120] mb-4">The Unified Review Framework</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Our unified diagnostics now process individual competency intents alongside
            macro systemic alignment outcomes in one seamless evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {frameworkPillars.map((item, i) => (
            <div key={i} className="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-500 flex flex-col min-h-[240px] cursor-default">
              
              {/* Icon color changes on hover */}
              <div className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center mb-4 text-[#0B1120] group-hover:text-orange-600 group-hover:border-orange-200 group-hover:bg-orange-50 transition-colors duration-300">
                {item.icon}
              </div>
              
              <h3 className="font-bold text-[#0B1120] mb-3">{item.title}</h3>
              
              {/* Text Container for Cross-Fade */}
              <div className="relative flex-grow">
                {/* Short Description: Fades out and slides up slightly on hover */}
                <p className="text-sm text-gray-500 absolute top-0 left-0 w-full transition-all duration-500 opacity-100 group-hover:opacity-0 group-hover:-translate-y-2">
                  {item.desc}
                </p>
                
                {/* Deep Insight: Hidden initially, slides up and fades in on hover */}
                <p className="text-sm text-gray-800 font-medium leading-relaxed absolute top-0 left-0 w-full transition-all duration-500 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0">
                  {item.insight}
                </p>
              </div>

            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
