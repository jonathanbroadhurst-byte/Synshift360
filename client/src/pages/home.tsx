import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Key, Shield, Compass, Cpu, Target, Award, Users, TrendingUp, GitMerge } from 'lucide-react';

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
    { name: "Direction & Sense-Making", desc: "Calibrating systemic foresight and intent alignment.", icon: Compass },
    { name: "Systems & Delivery", desc: "Evaluating execution architecture and infrastructure.", icon: Cpu },
    { name: "Purpose & Authenticity", desc: "Assessing core motives and ethical anchors.", icon: Target },
    { name: "Skills & Agility", desc: "Measuring operational dexterity and transformation.", icon: Award },
    { name: "Team & Norms", desc: "Unpacking collaborative trust and interaction.", icon: Users },
    { name: "Impact & Reputation", desc: "Isolating leadership presence and brand vectors.", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      
      {/* Premium Header - Kept as is for consistency */}
      <nav className="bg-[#0A192F] border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-white tracking-tight">🌀 SyncShift</span>
          </div>
          <Link href="/login"><span className="text-sm font-medium text-slate-300 hover:text-white cursor-pointer">Portal Login</span></Link>
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
                  <Button type="submit" className="w-full bg-[#0A192F] hover:bg-slate-800 h-11">
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
          {dimensions.map((dim, i) => (
            <Card key={i} className="border-slate-200 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6 space-y-3">
                <dim.icon className="w-6 h-6 text-[#0A192F]" />
                <h4 className="font-bold text-sm text-slate-900">{dim.name}</h4>
                <p className="text-xs text-slate-500">{dim.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer - Keep your existing footer here */}
    </div>
  );
}
