import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">SyncShift360</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to SyncShift360
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional 360-degree feedback platform for leadership development and organizational growth.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* SyncShift Personal */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">SyncShift Personal</CardTitle>
                <Badge variant="secondary">Featured</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Complete anonymous 360-degree feedback surveys for leadership development and team growth.
              </p>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-800">Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Anonymous feedback collection</li>
                  <li>• SyncShift 360 competency framework</li>
                  <li>• Comprehensive leadership reports</li>
                  <li>• GDPR compliant data handling</li>
                </ul>
              </div>
              <div className="pt-4">
                <a href="/contact-form">
                  <Button variant="outline" className="w-full border-2 border-gray-300 hover:border-gray-400 py-3 px-6 font-semibold">
                    Try SyncShift Personal
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Admin Login */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Admin Portal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Access the administrative dashboard to manage surveys, organizations, and reports.
              </p>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-800">Admin Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Survey management</li>
                  <li>• Organization oversight</li>
                  <li>• Report generation</li>
                  <li>• User administration</li>
                </ul>
              </div>
              <div className="pt-4">
                <Link href="/login">
                  <Button variant="outline" className="w-full border-2 border-gray-300 hover:border-gray-400 py-3 px-6 font-semibold">
                    Admin Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Sample Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                View comprehensive 360-degree feedback report examples with detailed analytics and insights.
              </p>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-800">Report Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Radar chart competency analysis</li>
                  <li>• Anonymous feedback highlights</li>
                  <li>• Development action plans</li>
                  <li>• Detailed strengths assessment</li>
                </ul>
              </div>
              <div className="pt-4 space-y-2">
                <a href="/report/1">
                  <Button variant="outline" className="w-full border-2 border-gray-300 hover:border-gray-400 py-3 px-6 font-semibold">
                    Jon Smith Report (3 responses)
                  </Button>
                </a>
                <a href="/report/2">
                  <Button variant="outline" className="w-full border-2 border-gray-300 hover:border-gray-400 py-3 px-6 font-semibold">
                    Sarah Johnson Report (10 responses)
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              About SyncShift360
            </h2>
            <p className="text-gray-600 leading-relaxed">
              SyncShift360 specializes in 360-degree feedback solutions that help leaders and organizations 
              achieve meaningful growth. Our SyncShift Personal platform provides comprehensive, anonymous 
              feedback collection with detailed insights for leadership development.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 SyncShift360. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}