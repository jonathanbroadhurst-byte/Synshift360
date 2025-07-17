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
              <h1 className="text-xl font-bold text-gray-900">Business Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" size="sm">Admin Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Our Business Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access powerful tools and services designed to help your organization grow and succeed.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* 360 Feedback Platform */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">360 Feedback Platform</CardTitle>
                <Badge variant="secondary">New</Badge>
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
              <div className="pt-2">
                <Link href="/survey-access">
                  <Button className="w-full">Access 360 Feedback</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Placeholder for other services */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="text-lg">Project Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Organize and track your projects with powerful collaboration tools.
              </p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Get insights into your business performance with detailed analytics.
              </p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              About Our Platform
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Our business platform provides essential tools for modern organizations. 
              Start with our 360 feedback system to gather anonymous insights and drive 
              leadership development, with more services coming soon.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 Business Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}