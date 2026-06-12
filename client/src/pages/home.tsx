import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Key, Compass, Cpu, Target, Award, Users, TrendingUp, GitMerge } from 'lucide-react';

export default function Home() {
  const [inviteCode, setInviteCode] = useState('');
  const [, setLocation] = useLocation();

  const handleJoinSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      setLocation(`/survey/${inviteCode.trim().toUpperCase()}`);
    }
  };

  const dimensions = [
    { 
      name: "Direction & Sense-Making", 
      desc: "Calibrating systemic long-range foresight, intent alignment, and corporate narrative framing.", 
      expandedDesc: "We analyze how leadership frames intent and propagates narrative across the enterprise to ensure every node in your organization understands the long-term vector.",
      icon: Compass 
    },
    { 
      name: "Systems & Delivery", 
      desc: "Evaluating execution architecture, structural deployment fluidities, and infrastructure scales.", 
      expandedDesc: "This measures the friction within your delivery pipelines, looking at how effectively your structural architecture supports high-velocity execution.",
      icon: Cpu 
    },
    { 
      name: "Purpose & Authenticity", 
      desc: "Assessing authentic values-driven focus, core motives, and foundational ethical anchors.", 
      expandedDesc: "We isolate the gap between declared organizational values and the lived experience of employees to identify authenticity gaps.",
      icon: Target 
    },
    { 
      name: "Skills & Agility", 
      desc: "Measuring operational dexterity, strategic cognitive capabilities, and workforce transformation tolerances.", 
      expandedDesc: "This diagnostic evaluates the cognitive load your team can handle and their adaptability during periods of rapid structural transformation.",
      icon: Award 
    },
    { 
      name: "Team & Norms", 
      desc: "Unpacking collaborative culture, structural trust indicators, and peer interaction baselines.", 
      expandedDesc: "We track the health of peer interactions, looking specifically for 'trust silos' that might be throttling collaborative output.",
      icon: Users 
    },
    { 
      name: "Impact & Reputation", 
      desc: "Isolating personal leadership presence outcomes, market credibility, and systemic brand vectors.", 
      expandedDesc: "This measures your leadership brand's ripple effect, calculating how your internal performance translates into external market credibility.",
      icon: TrendingUp 
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      
      {/* Premium Header */}
      <nav className="bg-[#0A192F] border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-white tracking-tight">🌀 SyncShift</span>
          </div>
          <Link href="/login"><span className="text-sm font-medium text-slate-300 hover:text-white cursor-pointer transition-colors">Portal Login</span></Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-[#0A192F] text-white py-20 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <Badge className="bg-[#D97706] text-white font-semibold text-xs px-3 py-1 rounded-md border-none">
              UNIFIED ALIGNMENT ARCHITECTURE • 2026
            </Badge>
            <h1 className="text-5xl font-extrabold tracking-tight text-white leading-none">
              Synchronize your <br/>
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Organizational DNA.</span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed max-w-xl">
              We've integrated our leadership and systemic diagnostics into a single, cohesive Organization Review. Access your combined evaluation now to identify acceleration vectors.
            </p>
          </div>

          <div className="lg:col-span-5">
            <Card className="border-none shadow-2xl bg-white text-slate-900">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold flex items-center gap-2"><Key className="w-4 h-4 text-[#D97706]" /> Secure Assessment Gate</h2>
              </div>
              <CardContent className="p-5">
                <form onSubmit={handleJoinSurvey} className="space-y-3">
                  <Input 
                    value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="ENTER INVITE CODE" 
                    className="uppercase font-mono text-center text-lg h-12 bg-slate-50 border-slate-200"
                    maxLength={8} required
                  />
                  <Button type="submit" className="w-full bg-[#0A192F] hover:bg-slate-800 h-11 transition-all">
                    Start Combined Review <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Unified Framework Showcase */}
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-[#0A192F] flex items-center justify-center gap-3">
            <GitMerge className="text-[#D97706]" /> The Unified Review Framework
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Our unified diagnostics now process individual competency intents alongside macro systemic alignment outcomes in one seamless evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dimensions.map((dim, i) => {
            const IconComponent = dim.icon;
            return (
              <Card key={i} className="group relative border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-default">
                <CardContent className="p-6 space-y-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-[#0A192F]">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-900 tracking-tight">{dim.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{dim.desc}</p>
                  </div>
                </CardContent>

                {/* Hover Callout Overlay */}
                <div className="absolute inset-0 bg-[#0A192F]/95 text-white p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">Deep Dive</p>
                  <p className="text-xs leading-relaxed text-slate-200">
                    {dim.expandedDesc}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0A192F] py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-slate-400">
          <p>&copy; 2026 SyncShift. All rights reserved. Built with systemic dual-line integrity protocols.</p>
        </div>
      </footer>
    </div>
  );
}
