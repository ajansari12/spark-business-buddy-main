/**
 * Advanced Analytics Dashboard
 * Includes funnel visualization, cohort analysis, and user journey mapping
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Users, Target, Download, Filter } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  FunnelChart,
  Funnel,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Sample data
const funnelData = [
  { name: 'Visited Site', value: 10000, fill: '#8884d8' },
  { name: 'Started Wizard', value: 5000, fill: '#83a6ed' },
  { name: 'Completed Profile', value: 3500, fill: '#8dd1e1' },
  { name: 'Generated Ideas', value: 2500, fill: '#82ca9d' },
  { name: 'Created Document', value: 1500, fill: '#a4de6c' },
  { name: 'Upgraded to Pro', value: 500, fill: '#d0ed57' },
];

const cohortData = [
  { cohort: 'Jan 2025', week1: 100, week2: 85, week3: 72, week4: 65 },
  { cohort: 'Feb 2025', week1: 100, week2: 88, week3: 75, week4: 68 },
  { cohort: 'Mar 2025', week1: 100, week2: 90, week3: 78, week4: 70 },
  { cohort: 'Apr 2025', week1: 100, week2: 92, week3: 80, week4: 72 },
];

const journeyData = [
  { step: 'Homepage', users: 10000, avgTime: '45s' },
  { step: 'Pricing Page', users: 4500, avgTime: '2m 30s' },
  { step: 'Sign Up', users: 3200, avgTime: '1m 15s' },
  { step: 'Wizard Start', users: 2800, avgTime: '3m 45s' },
  { step: 'Idea Generation', users: 2500, avgTime: '5m 20s' },
  { step: 'Document Creation', users: 1500, avgTime: '8m 10s' },
];

export default function AdvancedAnalytics() {
  const [timeRange, setTimeRange] = useState('30d');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">Deep insights into user behavior and conversion</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">500</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+12%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.0%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+0.5%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Time to Convert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2 days</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="text-muted-foreground">-0.3 days</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Cohorts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Currently tracked</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="cohort">Cohort Analysis</TabsTrigger>
          <TabsTrigger value="journey">User Journey</TabsTrigger>
        </TabsList>

        {/* Conversion Funnel */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Track user progression through key conversion steps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid md:grid-cols-3 gap-4">
                {funnelData.map((step, index) => {
                  const nextStep = funnelData[index + 1];
                  const dropOff = nextStep ? ((step.value - nextStep.value) / step.value) * 100 : 0;

                  return (
                    <div key={step.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{step.name}</span>
                        <Badge variant="secondary">{step.value.toLocaleString()}</Badge>
                      </div>
                      {nextStep && (
                        <p className="text-xs text-muted-foreground">
                          {dropOff.toFixed(1)}% drop-off to next step
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cohort Analysis */}
        <TabsContent value="cohort" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Retention Analysis</CardTitle>
              <CardDescription>Track user retention by signup cohort over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cohortData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cohort" />
                    <YAxis label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="week1" stroke="#8884d8" name="Week 1" />
                    <Line type="monotone" dataKey="week2" stroke="#82ca9d" name="Week 2" />
                    <Line type="monotone" dataKey="week3" stroke="#ffc658" name="Week 3" />
                    <Line type="monotone" dataKey="week4" stroke="#ff7c7c" name="Week 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-3">Cohort Insights</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="text-sm">Best Performing Cohort</span>
                    <Badge>Apr 2025 - 72% Week 4 Retention</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="text-sm">Average Week 4 Retention</span>
                    <Badge variant="secondary">68.75%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="text-sm">Retention Trend</span>
                    <Badge variant="outline" className="text-green-500">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Improving
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Journey */}
        <TabsContent value="journey" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Journey Mapping</CardTitle>
              <CardDescription>Understand how users navigate through your application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {journeyData.map((step, index) => {
                  const prevStep = journeyData[index - 1];
                  const dropOffRate = prevStep ? ((prevStep.users - step.users) / prevStep.users) * 100 : 0;

                  return (
                    <div key={step.step}>
                      {index > 0 && (
                        <div className="flex items-center justify-center py-2">
                          <div className="text-center">
                            <div className="h-8 w-0.5 bg-border mx-auto mb-1" />
                            <Badge variant="outline" className="text-xs">
                              {dropOffRate.toFixed(1)}% drop-off
                            </Badge>
                          </div>
                        </div>
                      )}
                      <div className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-bold">{index + 1}</span>
                            </div>
                            <div>
                              <h4 className="font-medium">{step.step}</h4>
                              <p className="text-sm text-muted-foreground">Avg time: {step.avgTime}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{step.users.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">users</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
