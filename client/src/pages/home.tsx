import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, ArrowRight, Shield, Zap, Target, Users, Lightbulb, BarChart } from "lucide-react";

// The refactored dimensions array with hover insights
const frameworkPillars = [
  {
    id: "leadership",
    title: "Quantum Leadership",
    icon: <Zap className="w-6 h-6 text-orange-400" />,
    color: "from-orange-500/20 to-transparent border-orange-500/30",
    description: "Navigate uncertainty with agile decision-making.",
    insight: "Assesses adaptive capacity, visionary communication, and decentralized empowerment across management tiers."
  },
  {
    id: "culture",
    title: "Cultural Resonance",
    icon: <Users className="w-6 h-6 text-pink-400" />,
    color: "from-pink-500/20 to-transparent border-pink-500/30",
    description: "Build psychological safety and high-trust environments.",
    insight: "Measures team cohesion, conflict resolution mechanics, and the embedded values of your organizational DNA."
  },
  {
    id: "strategy",
    title: "Strategic Alignment",
    icon: <Target className="w-6 h-6 text-blue-400" />,
    color: "from-blue-500/20 to-transparent border-blue-500/30",
    description: "Connect daily execution to overarching market objectives.",
    insight: "Evaluates the clarity of strategic vectors and the efficiency of resource allocation toward core goals."
  },
  {
    id: "execution",
    title: "Execution Velocity",
    icon: <BarChart className="w-6 h-6 text-emerald-400" />,
    color: "from-emerald-500/20 to-transparent border-emerald-500/30",
    description: "Translate strategic blueprints into measurable outcomes.",
    insight: "Analyzes operational bottlenecks, cross-functional collaboration, and the delivery cadence of key initiatives."
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white font-sans selection:bg-orange-500/30">
      
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <Activity className="w-6 h-6 text-orange-500" />
            SyncShift
          </div>
          <div className="flex items-center gap-4">
            <Link href="/contact-form">
              <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-800 hidden sm:inline-flex">
                Contact
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-white text-black hover:bg-gray-200">
                Platform Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section & Assessment Gateway */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-sm font-mono mb-8">
          <Shield className="w-4 h-4" /> Enterprise 360 Feedback Loop
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Unified Alignment <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500">
            Diagnostic Framework
          </span>
        </h1>
        
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Uncover the hidden dynamics of your organization. Deploy high-fidelity surveys to measure leadership, culture, and operational velocity.
        </p>
        
        {/* The Gateway Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
          <Link href="/quantum360/start" className="w-full">
            <Button size="lg" className="w-full h-14 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-semibold text-lg shadow-lg shadow-orange-500/20">
              Start Evaluation <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </main>

      {/* Framework Pillars (Hover-based Insights) */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-gray-800/50">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Core Measurement Dimensions</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Our proprietary diagnostic engine evaluates your organization across four critical performance vectors.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {frameworkPillars.map((pillar) => (
            <div key={pillar.id} className="group relative">
              {/* Card Background gradient that shifts on hover */}
              <div className={`absolute inset-0 bg-gradient-to-b ${pillar.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />
              
              <Card className="relative h-full bg-gray-900/40 border-gray-800 backdrop-blur-sm hover:border-gray-600 transition-colors duration-300">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-center mb-6 shadow-inner">
                    {pillar.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{pillar.title}</h3>
                  
                  {/* Default Description */}
                  <p className="text-gray-400 text-sm leading-relaxed group-hover:opacity-0 transition-opacity duration-300 absolute mt-12 pr-6">
                    {pillar.description}
                  </p>
                  
                  {/* Hover Insight (Deep Dive) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-grow pt-2">
                    <p className="text-gray-300 text-sm leading-relaxed font-medium">
                      {pillar.insight}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-gray-950/50 py-12 text-center text-gray-500 text-sm">
        <p>© 2026 SyncShift. Powered by Quantum Leadership Theory.</p>
      </footer>
    </div>
  );
}
