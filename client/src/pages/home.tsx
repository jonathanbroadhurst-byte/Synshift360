import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  return (
    <div className="min-h-screen syncshift-gradient">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-md shadow-sm border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">🌀 SyncShift</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/" className="text-white/80 hover:text-white transition-colors">Home</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            🌀 SyncShift
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-2">
            Organisational alignment is the key to high performance. Discover what is accelerating or throttling performance in your organisation.
          </p>
          <p className="text-lg text-blue-200 italic font-medium">
            Shift your thinking - Change your world
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* SyncShift Personal */}
          <Card className="syncshift-card hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-900">🌀 SyncShift</CardTitle>
                <Badge className="bg-gradient-to-r from-blue-500 to-teal-500 text-white">Featured</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                An organisation alignment tool that highlights strengths and weaknesses across 6 key factors.
              </p>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-800">✨ Key Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Anonymous feedback collection</li>
                  <li>• SyncShift 360 competency framework</li>
                  <li>• Comprehensive leadership reports</li>
                  <li>• GDPR compliant data handling</li>
                </ul>
              </div>
              <div className="pt-4">
                <a href="/contact-form">
                  <button className="syncshift-button w-full">
                    Try SyncShift Personal
                  </button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Quantum 360 */}
          <Card className="bg-gradient-to-br from-orange-50 to-pink-50 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 border-orange-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-900">✨ Quantum Leadership 360</CardTitle>
                <Badge className="bg-gradient-to-r from-orange-500 to-pink-600 text-white">New</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Advanced leadership calibration across 10 competencies with 4 maturity levels (1-10 scale).
              </p>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-800">⚡ Quantum Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 10 core leadership competencies</li>
                  <li>• 4 maturity levels (Reactive → Quantum)</li>
                  <li>• 9-box performance grid</li>
                  <li>• Advanced analytics & insights</li>
                </ul>
              </div>
              <div className="pt-4">
                <Link href="/quantum360">
                  <button className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white py-3 px-6 font-semibold rounded-lg transition-colors">
                    Explore Quantum 360
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Admin Login */}
          <Card className="syncshift-card hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">⚙️ Admin Portal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Access the administrative dashboard to manage surveys, organizations, and reports.
              </p>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-800">🎯 Admin Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Survey management</li>
                  <li>• Organization oversight</li>
                  <li>• Report generation</li>
                  <li>• User administration</li>
                </ul>
              </div>
              <div className="pt-4">
                <Link href="/login">
                  <button className="w-full bg-gray-700 hover:bg-gray-800 text-white py-3 px-6 font-semibold rounded-lg transition-colors">
                    Admin Login
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="syncshift-card hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">📊 Sample Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                View comprehensive 360-degree feedback report examples with detailed analytics and insights.
              </p>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-800">📈 Report Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Radar chart competency analysis</li>
                  <li>• Anonymous feedback highlights</li>
                  <li>• Development action plans</li>
                  <li>• Detailed strengths assessment</li>
                </ul>
              </div>
              <div className="pt-4 space-y-2">
                <a href="/report/1">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 font-semibold rounded-lg transition-colors">
                    Jon Smith Report (3 responses)
                  </button>
                </a>
                <a href="/report/2">
                  <button className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-6 font-semibold rounded-lg transition-colors">
                    Sarah Johnson Report (10 responses)
                  </button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* About Section */}
        <div className="syncshift-card p-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🌀 About SyncShift
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Organisational alignment is the key to high performance. Discover what is accelerating or throttling performance in your organisation.
            </p>
            <p className="text-blue-600 font-semibold italic">
              "Unlock Consistent High Performance through Alignment"
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 SyncShift. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}