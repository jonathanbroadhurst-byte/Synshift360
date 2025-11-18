import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Brain, Target, Zap, Shield, TrendingUp, Users, Lightbulb, BarChart3, Heart } from "lucide-react";

export default function Quantum360() {
  const [, setLocation] = useLocation();

  const competencies = [
    { icon: Brain, name: "Cognitive Agility", color: "text-orange-500" },
    { icon: Shield, name: "Trust Intelligence", color: "text-pink-500" },
    { icon: Target, name: "Systems Awareness", color: "text-purple-500" },
    { icon: Users, name: "Adaptive Communication", color: "text-blue-500" },
    { icon: Heart, name: "Emotional Regulation", color: "text-red-500" },
    { icon: Zap, name: "Ethical Anchoring", color: "text-yellow-500" },
    { icon: TrendingUp, name: "Coherence Leadership", color: "text-green-500" },
    { icon: Lightbulb, name: "Change Navigation", color: "text-indigo-500" },
    { icon: Sparkles, name: "Creative Problem Solving", color: "text-cyan-500" },
    { icon: BarChart3, name: "Human Energy Stewardship", color: "text-teal-500" }
  ];

  const maturityLevels = [
    { 
      level: "Reactive", 
      range: "1-3", 
      description: "Responds to immediate challenges",
      color: "from-red-500 to-orange-500"
    },
    { 
      level: "Transitional", 
      range: "4-6", 
      description: "Building new capabilities",
      color: "from-orange-500 to-yellow-500"
    },
    { 
      level: "Adaptive", 
      range: "7-8", 
      description: "Proactive and flexible",
      color: "from-yellow-500 to-green-500"
    },
    { 
      level: "Quantum", 
      range: "9-10", 
      description: "Transformative and visionary",
      color: "from-green-500 to-blue-500"
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Gradient */}
      <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Radial Gradient Background */}
        <div 
          className="absolute inset-0" 
          style={{
            background: "radial-gradient(ellipse at center, #ff6b35 0%, #f72585 35%, #000000 70%)"
          }}
        />
        
        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Quantum Leadership<br />Calibration 360
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Measure leadership across 10 core competencies with 4 maturity levels. 
            Transform insights into quantum leaps in performance.
          </p>
          
          <Button 
            size="lg" 
            onClick={() => setLocation("/quantum360/start")}
            className="bg-white/10 backdrop-blur-lg border-2 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-6 rounded-full"
            data-testid="button-start-quantum"
          >
            Start Assessment
          </Button>
        </div>
      </div>

      {/* Maturity Levels Section */}
      <div className="py-24 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-white text-center mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Four Levels of Leadership Maturity
          </h2>
          <p className="text-gray-400 text-center mb-12 text-lg">
            Progress from reactive to quantum-level leadership capabilities
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {maturityLevels.map((level, index) => (
              <Card 
                key={index} 
                className="relative p-6 bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all"
                data-testid={`card-maturity-${level.level.toLowerCase()}`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${level.color}`} />
                <div className="text-3xl font-bold text-white mb-2">{level.range}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{level.level}</h3>
                <p className="text-gray-400 text-sm">{level.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Competencies Grid */}
      <div className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-white text-center mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            10 Core Competencies
          </h2>
          <p className="text-gray-400 text-center mb-12 text-lg">
            Comprehensive assessment across critical leadership dimensions
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {competencies.map((comp, index) => {
              const Icon = comp.icon;
              return (
                <Card 
                  key={index} 
                  className="p-6 bg-gray-800/50 border-gray-700 hover:bg-gray-800 transition-all text-center"
                  data-testid={`card-competency-${index}`}
                >
                  <Icon className={`w-10 h-10 ${comp.color} mx-auto mb-3`} />
                  <h3 className="text-sm font-medium text-white">{comp.name}</h3>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-24 bg-black">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Ready to Elevate Your Leadership?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Begin your quantum leadership journey with a comprehensive 360-degree assessment
          </p>
          <Button 
            size="lg" 
            onClick={() => setLocation("/quantum360/start")}
            className="bg-gradient-to-r from-orange-500 to-pink-600 text-white hover:from-orange-600 hover:to-pink-700 text-lg px-8 py-6 rounded-full"
            data-testid="button-cta-start"
          >
            Launch Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}
