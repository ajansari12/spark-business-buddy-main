import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3, TrendingUp, Users, Target, Download, RefreshCw } from 'lucide-react';
import { getABTestsConfig, getUserABTestAssignments } from '@/hooks/useABTest';
import { supabase } from '@/integrations/supabase/client';
import { PageLoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';

interface TestResult {
  test_name: string;
  variant: string;
  conversions: number;
  total_assignments: number;
  conversion_rate: number;
}

interface TestStats {
  test_name: string;
  variants: Record<string, {
    assignments: number;
    conversions: number;
    conversion_rate: number;
  }>;
  total_users: number;
  statistical_significance: number;
  winner?: string;
}

/**
 * A/B Testing Dashboard
 * View and analyze A/B test results
 */
const ABTestingDashboard = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [testStats, setTestStats] = useState<TestStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    if (selectedTest) {
      loadTestStats(selectedTest);
    }
  }, [selectedTest]);

  const loadTests = async () => {
    const activeTests = getABTestsConfig();
    setTests(activeTests);

    if (activeTests.length > 0 && !selectedTest) {
      setSelectedTest(activeTests[0].name);
    }

    setIsLoading(false);
  };

  const loadTestStats = async (testName: string) => {
    setIsRefreshing(true);

    try {
      // Get test assignments
      const { data: assignments, error: assignError } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_name', 'ab_test_assigned')
        .eq('properties->>test_name', testName);

      if (assignError) throw assignError;

      // Get test conversions
      const { data: conversions, error: convError } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_name', 'ab_test_conversion')
        .eq('properties->>test_name', testName);

      if (convError) throw convError;

      // Calculate stats by variant
      const stats: TestStats = {
        test_name: testName,
        variants: {},
        total_users: 0,
        statistical_significance: 0,
      };

      // Get test configuration
      const testConfig = tests.find((t) => t.name === testName);
      if (!testConfig) return;

      // Initialize variant stats
      testConfig.variants.forEach((variant: string) => {
        const variantAssignments = assignments?.filter(
          (a) => a.properties?.variant === variant
        ) || [];

        const variantConversions = conversions?.filter(
          (c) => c.properties?.variant === variant
        ) || [];

        const conversionRate = variantAssignments.length > 0
          ? (variantConversions.length / variantAssignments.length) * 100
          : 0;

        stats.variants[variant] = {
          assignments: variantAssignments.length,
          conversions: variantConversions.length,
          conversion_rate: conversionRate,
        };

        stats.total_users += variantAssignments.length;
      });

      // Calculate statistical significance (simplified chi-square test)
      const variantEntries = Object.entries(stats.variants);
      if (variantEntries.length === 2) {
        const [variant1, data1] = variantEntries[0];
        const [variant2, data2] = variantEntries[1];

        const significance = calculateSignificance(
          data1.conversions,
          data1.assignments,
          data2.conversions,
          data2.assignments
        );

        stats.statistical_significance = significance;

        // Determine winner if significant
        if (significance >= 95) {
          stats.winner = data1.conversion_rate > data2.conversion_rate ? variant1 : variant2;
        }
      }

      setTestStats(stats);
    } catch (error) {
      console.error('Error loading test stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const calculateSignificance = (
    conversions1: number,
    total1: number,
    conversions2: number,
    total2: number
  ): number => {
    if (total1 === 0 || total2 === 0) return 0;

    const p1 = conversions1 / total1;
    const p2 = conversions2 / total2;
    const pPooled = (conversions1 + conversions2) / (total1 + total2);

    const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / total1 + 1 / total2));
    const zScore = Math.abs((p1 - p2) / se);

    // Convert z-score to confidence level (simplified)
    if (zScore >= 2.576) return 99;
    if (zScore >= 1.96) return 95;
    if (zScore >= 1.645) return 90;
    return Math.round((1 - Math.exp(-zScore)) * 100);
  };

  const exportResults = () => {
    if (!testStats) return;

    const data = {
      test_name: testStats.test_name,
      total_users: testStats.total_users,
      statistical_significance: testStats.statistical_significance,
      winner: testStats.winner,
      variants: testStats.variants,
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ab-test-${testStats.test_name}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (tests.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <EmptyState
          icon={BarChart3}
          title="No A/B Tests Found"
          description="There are no active A/B tests configured."
          action={{
            label: 'Learn More',
            onClick: () => window.open('/docs/ab-testing', '_blank'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">A/B Testing Dashboard</h1>
          <p className="text-muted-foreground">
            Analyze experiment results and make data-driven decisions
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedTest && loadTestStats(selectedTest)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="outline" size="sm" onClick={exportResults} disabled={!testStats}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Test Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Test</CardTitle>
          <CardDescription>Choose an A/B test to analyze</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTest} onValueChange={setSelectedTest}>
            <SelectTrigger>
              <SelectValue placeholder="Select a test" />
            </SelectTrigger>
            <SelectContent>
              {tests.map((test) => (
                <SelectItem key={test.name} value={test.name}>
                  {test.testName} - {test.enabled ? 'Active' : 'Paused'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {testStats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-2xl font-bold">{testStats.total_users}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Variants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-2xl font-bold">
                    {Object.keys(testStats.variants).length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-2xl font-bold">
                    {testStats.statistical_significance.toFixed(0)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Winner
                </CardTitle>
              </CardHeader>
              <CardContent>
                {testStats.winner ? (
                  <Badge className="text-sm">{testStats.winner}</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">No clear winner</span>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Variant Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Variant Performance</CardTitle>
              <CardDescription>Conversion rates by variant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(testStats.variants).map(([variant, data]) => {
                const isWinner = variant === testStats.winner;

                return (
                  <div key={variant} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{variant}</span>
                        {isWinner && <Badge variant="default">Winner</Badge>}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {data.conversion_rate.toFixed(2)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {data.conversions} / {data.assignments} conversions
                        </div>
                      </div>
                    </div>

                    <Progress value={data.conversion_rate} className="h-2" />

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{data.assignments} users</span>
                      <span>{data.conversions} converted</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Statistical Significance */}
          <Card>
            <CardHeader>
              <CardTitle>Statistical Significance</CardTitle>
              <CardDescription>
                Confidence level: {testStats.statistical_significance.toFixed(1)}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={testStats.statistical_significance} className="h-3" />

                <div className="text-sm space-y-2">
                  {testStats.statistical_significance >= 95 ? (
                    <p className="text-green-600 dark:text-green-400">
                      ✓ Results are statistically significant (≥95% confidence)
                    </p>
                  ) : testStats.statistical_significance >= 90 ? (
                    <p className="text-yellow-600 dark:text-yellow-400">
                      ⚠ Results show moderate confidence (90-95%)
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      ℹ Need more data for statistical significance
                    </p>
                  )}

                  <p className="text-muted-foreground">
                    {testStats.statistical_significance >= 95
                      ? 'You can confidently choose the winning variant.'
                      : 'Continue running the test to gather more data.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ABTestingDashboard;
