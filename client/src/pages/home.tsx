import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Key, Shield, Compass, Cpu, Target, Award, Users, TrendingUp } from 'lucide-react';

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
    { name: "Direction & Sense-Making", desc: "Calibrating systemic long-range foresight, intent alignment, and corporate narrative framing.", icon: Compass },
    { name: "Systems & Delivery", desc: "Evaluating execution architecture, structural deployment fluidities, and infrastructure scales.", icon: Cpu },
    { name: "Purpose & Authenticity", desc: "Assessing authentic values-driven focus, core motives, and foundational ethical anchors.", icon: Target },
    { name: "Skills & Agility", desc: "Measuring operational dexterity, strategic cognitive capabilities, and workforce transformation tolerances.", icon: Award },
    { name: "Team & Norms", desc: "Unpacking collaborative culture, structural trust indicators, and peer interaction baselines.", icon: Users },
    { name: "Impact & Reputation", desc: "Isolating personal leadership presence outcomes, market credibility, and systemic brand vectors.", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-amber-500/30">
      
      {/* Premium Header */}
      <nav className="bg-[#0A192F] border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-white tracking-tight">🌀 SyncShift</span>
            <span className="text-[10px] uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold tracking-wider">Enterprise</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <span className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer">Portal Login</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Split Container */}
      <div className="bg-[#0A192F] text-white py-16 sm:py-20 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <Badge className="bg-[#D97706] hover:bg-[#D97706] text-white font-semibold text-xs px-3 py-1 rounded-md border-none tracking-wide">
              ALIGNMENT ARCHITECTURE • 2026
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-none">
              Shift your thinking — <br/>
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Change your world.</span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
              Organizational alignment is the single greatest multiplier of high performance. Discover exactly what is accelerating or throttling execution velocity inside your systemic framework today.
            </p>
          </div>

          {/* Interactive Rater Entry Gateway Card */}
          <div className="lg:col-span-5">
            <Card className="border-none shadow-2xl bg-white text-slate-900 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 p-5">
                <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#D97706]" />
                  Stakeholder Assessment Gate
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Invited to evaluate a leader? Input your secure tracking token below to open your response form.
                </p>
              </div>
              <CardContent className="p-5">
                <form onSubmit={handleJoinSurvey} className="space-y-3">
                  <div className="space-y-1.5">
                    <Input 
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="e.g., LFM9GU" 
                      className="uppercase font-mono tracking-widest text-center text-lg h-12 bg-slate-50 border-slate-200 focus:border-[#D97706] focus:ring-[#D97706]"
                      maxLength={8}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-[#0A192F] hover:bg-slate-800 text-white font-semibold h-11 transition-all flex items-center justify-center gap-2">
                    Access Evaluation Form <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      {/* The 6 Framework Dimensions Showcase */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0A192F] tracking-tight">
            The SyncShift Spiral Alignment Framework
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
            Our dual-line diagnostics measure individual competency intents perfectly baseline-matched against macro systemic alignment outcomes across 6 core pillars.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dimensions.map((dim, i) => {
            const IconComponent = dim.icon;
            return (
              <Card key={i} className="bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-[#0A192F]">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-900 tracking-tight">{dim.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{dim.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Gateway Management Portals & Tracks */}
      <div className="bg-slate-100 border-t border-b border-slate-200/60 py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Core Track Assessment Platform */}
          <Card className="bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase bg-amber-50 text-[#D97706] px-2.5 py-0.5 rounded-md font-bold tracking-wider border border-amber-200/40">Core Diagnostic</span>
              </div>
              <CardTitle className="text-lg font-bold text-slate-900 pt-2">SyncShift Diagnostic Engine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
              <p className="text-xs text-slate-600 leading-relaxed">
                Deploy comprehensive 360-degree feedback assessment loops natively mapped to standard frameworks. Includes anonymity threshold firewalls and vector print report engines.
              </p>
              <div className="pt-4">
                <Link href="/contact-form">
                  <Button className="w-full bg-[#0A192F] hover:bg-slate-800 text-white font-medium text-xs h-10">
                    Initialize Workspace Loop
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quantum Leadership Track */}
          <Card className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md flex flex-col justify-between border-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase bg-[#D97706] text-white px-2.5 py-0.5 rounded-md font-bold tracking-wider">Advanced Track</span>
              </div>
              <CardTitle className="text-lg font-bold text-white pt-2">Quantum Leadership 360</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
              <p className="text-xs text-slate-300 leading-relaxed">
                Advanced structural calibration across 10 strategic leadership competencies, multi-tiered organization maturity tiers, and non-linear performance tracking arrays.
              </p>
              <div className="pt-4">
                <Link href="/quantum360">
                  <Button className="w-full bg-[#D97706] hover:bg-[#b26205] text-white font-semibold text-xs h-10 border-none">
                    Explore Quantum Framework
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Internal Management Portal Access Links */}
      <div className="max-w-2xl mx-auto text-center px-6 py-12 space-y-4">
        <h3 className="text-sm font-bold text-[#0A192F] uppercase tracking-wider flex items-center justify-center gap-1.5">
          <Shield className="w-4 h-4 text-[#D97706]" /> Secure Corporate Gateway
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Authorized consultants, organization administrators, and reviewed leaders can access workspace metrics pipelines through our synchronized portal.
        </p>
        <div className="pt-2">
          <Link href="/login">
            <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 font-medium px-6 text-xs h-10">
              Sign In to Your Workspace Portal
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0A192F] border-t border-slate-800 mt-auto py-8">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center text-xs text-slate-400 font-medium">
          <p>&copy; 2026 SyncShift. All rights reserved. Built with systemic dual-line integrity protocols.</p>
        </div>
      </footer>

    </div>
  );
}
