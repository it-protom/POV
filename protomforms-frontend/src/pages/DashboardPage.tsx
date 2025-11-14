import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart3, FileText, Users, TrendingUp } from 'lucide-react';

const DashboardPage: React.FC = () => {
  return (
    <div className="container mx-auto px-6 py-8 relative min-h-screen pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Panoramica delle attività e statistiche</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Forms"
          value="24"
          change="+12%"
          changeType="positive"
          icon={<FileText className="w-6 h-6" />}
        />
        <StatCard
          title="Total Responses"
          value="1,234"
          change="+23%"
          changeType="positive"
          icon={<BarChart3 className="w-6 h-6" />}
        />
        <StatCard
          title="Active Users"
          value="89"
          change="+5%"
          changeType="positive"
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="Completion Rate"
          value="87%"
          change="+2%"
          changeType="positive"
          icon={<TrendingUp className="w-6 h-6" />}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Forms</CardTitle>
            <CardDescription>Forms created in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Customer Satisfaction Survey</p>
                  <p className="text-sm text-gray-600">Created 2 days ago</p>
                </div>
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Employee Feedback Form</p>
                  <p className="text-sm text-gray-600">Created 5 days ago</p>
                </div>
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Responses</CardTitle>
            <CardDescription>Latest form submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Customer Satisfaction Survey</p>
                  <p className="text-sm text-gray-600">Response from john@example.com</p>
                </div>
                <span className="text-sm text-gray-500">2h ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Employee Feedback Form</p>
                  <p className="text-sm text-gray-600">Response from jane@example.com</p>
                </div>
                <span className="text-sm text-gray-500">4h ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType, icon }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className={`text-sm ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
              {change} from last month
            </p>
          </div>
          <div className="w-12 h-12 bg-[#FFCD00]/10 rounded-lg flex items-center justify-center">
            <div className="text-[#FFCD00]">{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardPage;


