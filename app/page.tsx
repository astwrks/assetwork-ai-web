'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  TrendingUp,
  Sparkles,
  Zap,
  ChevronRight,
  BarChart3,
  Brain,
  ArrowRight,
  Globe,
  Users,
  Activity,
  Shield,
  Infinity as InfinityIcon,
  Rocket,
  Terminal,
  LineChart,
  PieChart,
  DollarSign,
  Lock,
  Cpu,
  Cloud,
  Gauge,
  Target,
  TrendingDown,
  CheckCircle2,
  Play,
  Download,
  Code,
  Layers,
  Database,
  GitBranch,
  Workflow,
  FileText,
  Clock,
  Boxes,
  ArrowUpRight,
  Check,
  X,
  Star,
  Building2,
  Briefcase,
  Lightbulb,
  Settings,
  Bell,
  Award,
  Package,
  Search,
  Filter,
  Send,
  MessageSquare,
  Hash,
  Box,
  CreditCard,
  RefreshCw,
  Snowflake,
  Link2,
  CloudIcon,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('individuals');
  const [activePricingTab, setActivePricingTab] = useState('monthly');
  const [selectedFeature, setSelectedFeature] = useState(0);
  const [isHeroInView, setIsHeroInView] = useState(true);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  // Auto-rotate feature showcase
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedFeature((prev) => (prev + 1) % 6);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced machine learning algorithms that understand context, detect patterns, and provide actionable insights from your financial data in real-time.',
      benefits: ['Pattern Recognition', 'Predictive Analytics', 'Anomaly Detection', 'Smart Recommendations'],
      color: 'from-blue-500 to-cyan-500',
      demoIcon: BarChart3,
      metrics: { accuracy: '99.8%', speed: '47ms', models: '12+' }
    },
    {
      icon: Zap,
      title: 'Lightning Fast Processing',
      description: 'Process millions of transactions per second with our optimized infrastructure. Generate comprehensive reports in under 100ms with enterprise-grade performance.',
      benefits: ['Sub-100ms Response', 'Parallel Processing', 'Edge Computing', 'Auto-scaling'],
      color: 'from-yellow-500 to-orange-500',
      demoIcon: Zap,
      metrics: { latency: '47ms', throughput: '10M/s', uptime: '99.99%' }
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption with SOC2 Type II, GDPR, and CCPA compliance. Your data is protected with military-grade security and isolated tenant architecture.',
      benefits: ['256-bit Encryption', 'SOC2 Certified', 'GDPR Compliant', 'Zero-trust Security'],
      color: 'from-green-500 to-emerald-500',
      demoIcon: Lock,
      metrics: { certified: 'SOC2 II', encryption: 'AES-256', compliance: '4+' }
    },
    {
      icon: InfinityIcon,
      title: 'Infinite Scalability',
      description: 'Built on cloud-native infrastructure that scales automatically. Handle billions of data points without performance degradation or infrastructure management.',
      benefits: ['Auto-scaling', 'Global CDN', '99.99% Uptime SLA', 'Multi-region Support'],
      color: 'from-purple-500 to-pink-500',
      demoIcon: InfinityIcon,
      metrics: { regions: '15+', datapoints: '50B+', users: '500K+' }
    },
    {
      icon: Workflow,
      title: 'Advanced Automation',
      description: 'Automate repetitive tasks with smart workflows. Set up rules, triggers, and custom logic to streamline your financial operations and save hours daily.',
      benefits: ['Custom Workflows', 'API Integrations', 'Event Triggers', 'No-code Builder'],
      color: 'from-indigo-500 to-blue-500',
      demoIcon: RefreshCw,
      metrics: { integrations: '100+', workflows: 'Unlimited', saved: '73%' }
    },
    {
      icon: LineChart,
      title: 'Real-time Analytics',
      description: 'Monitor your financial metrics in real-time with customizable dashboards. Track KPIs, trends, and anomalies with interactive visualizations.',
      benefits: ['Live Dashboards', 'Custom Reports', 'Data Export', 'Alert System'],
      color: 'from-red-500 to-pink-500',
      demoIcon: TrendingUp,
      metrics: { refresh: 'Real-time', charts: '50+', exports: 'Unlimited' }
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      description: 'Perfect for individual investors',
      monthlyPrice: 29,
      annualPrice: 290,
      features: [
        { name: 'Up to 10 portfolios', included: true },
        { name: '1,000 AI credits/month', included: true },
        { name: 'Basic analytics', included: true },
        { name: 'Email support', included: true },
        { name: 'API access', included: false },
        { name: 'Custom integrations', included: false },
        { name: 'SSO & RBAC', included: false },
        { name: '99.99% SLA', included: false },
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Professional',
      description: 'For financial advisors & teams',
      monthlyPrice: 99,
      annualPrice: 990,
      features: [
        { name: 'Unlimited portfolios', included: true },
        { name: '10,000 AI credits/month', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Priority support', included: true },
        { name: 'API access', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'SSO & RBAC', included: false },
        { name: '99.99% SLA', included: false },
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      description: 'For large organizations',
      monthlyPrice: null,
      annualPrice: null,
      features: [
        { name: 'Unlimited portfolios', included: true },
        { name: 'Unlimited AI credits', included: true },
        { name: 'Enterprise analytics', included: true },
        { name: 'Dedicated support', included: true },
        { name: 'API access', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'SSO & RBAC', included: true },
        { name: '99.99% SLA', included: true },
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const caseStudies = [
    {
      company: 'TechBank',
      icon: Building2,
      industry: 'Banking',
      challenge: 'Manual report generation taking 40+ hours per week',
      solution: 'Automated workflows with AI-powered analysis',
      results: [
        { metric: 'Time Saved', value: '90%', icon: Clock },
        { metric: 'Accuracy', value: '99.8%', icon: Target },
        { metric: 'Cost Reduction', value: '$2.4M/yr', icon: DollarSign },
      ],
      quote: "AssetWorks transformed our operations. We've eliminated manual work and improved accuracy dramatically.",
      author: 'Sarah Chen, CTO',
    },
    {
      company: 'InvestCorp',
      icon: BarChart3,
      industry: 'Investment Management',
      challenge: 'Inability to scale client reporting',
      solution: 'Enterprise platform with custom integrations',
      results: [
        { metric: 'Clients Served', value: '10x', icon: Users },
        { metric: 'Report Speed', value: '100x', icon: Zap },
        { metric: 'Revenue Growth', value: '+250%', icon: TrendingUp },
      ],
      quote: "We went from managing 50 clients to 500 clients without adding headcount.",
      author: 'Michael Rodriguez, CEO',
    },
    {
      company: 'Global Finance',
      icon: Globe,
      industry: 'Financial Services',
      challenge: 'Complex compliance requirements across regions',
      solution: 'Multi-region deployment with SOC2 certification',
      results: [
        { metric: 'Regions', value: '15', icon: Globe },
        { metric: 'Compliance', value: '100%', icon: CheckCircle2 },
        { metric: 'Audit Time', value: '-80%', icon: Clock },
      ],
      quote: "The security and compliance features gave us confidence to expand globally.",
      author: 'Emily Thompson, Chief Compliance Officer',
    },
  ];

  const comparisonFeatures = [
    { name: 'AI-Powered Analysis', assetworks: true, competitor1: false, competitor2: true },
    { name: 'Sub-100ms Response Time', assetworks: true, competitor1: false, competitor2: false },
    { name: 'Real-time Analytics', assetworks: true, competitor1: true, competitor2: false },
    { name: 'SOC2 Type II Certified', assetworks: true, competitor1: true, competitor2: false },
    { name: 'Custom Integrations', assetworks: true, competitor1: false, competitor2: false },
    { name: 'No-code Workflow Builder', assetworks: true, competitor1: false, competitor2: false },
    { name: 'Multi-region Support', assetworks: true, competitor1: false, competitor2: true },
    { name: 'API Access', assetworks: true, competitor1: true, competitor2: true },
    { name: '99.99% Uptime SLA', assetworks: true, competitor1: false, competitor2: false },
    { name: 'White-label Options', assetworks: true, competitor1: false, competitor2: false },
  ];

  const faqs = [
    {
      question: 'How does AssetWorks pricing work?',
      answer: 'We offer flexible pricing based on your usage. Start with our Starter plan at $29/month, upgrade to Professional at $99/month, or contact us for Enterprise pricing. All plans include a 14-day free trial with no credit card required.',
    },
    {
      question: 'What security certifications does AssetWorks have?',
      answer: 'AssetWorks is SOC2 Type II certified, GDPR compliant, and CCPA compliant. We use bank-level AES-256 encryption for data at rest and TLS 1.3 for data in transit. We also maintain isolated tenant architectures and zero-trust security models.',
    },
    {
      question: 'Can I integrate AssetWorks with my existing tools?',
      answer: 'Yes! AssetWorks integrates with 100+ popular services including Stripe, QuickBooks, Salesforce, Slack, and more. We also offer a comprehensive REST API for custom integrations.',
    },
    {
      question: 'What kind of support do you offer?',
      answer: 'We offer email support for Starter plans, priority support for Professional plans, and dedicated support teams for Enterprise customers. Response times range from 24 hours (Starter) to under 1 hour (Enterprise).',
    },
    {
      question: 'How does the AI-powered analysis work?',
      answer: 'Our AI uses advanced machine learning models trained on billions of data points to detect patterns, predict trends, and provide actionable insights. The AI continuously learns from your data to improve accuracy over time.',
    },
    {
      question: 'What happens to my data if I cancel?',
      answer: 'You can export all your data at any time in standard formats (CSV, JSON, PDF). After cancellation, we retain your data for 30 days before permanent deletion. Enterprise customers can negotiate custom retention policies.',
    },
  ];

  const integrations = [
    { name: 'Stripe', icon: CreditCard, category: 'Payments', description: 'Payment processing & billing' },
    { name: 'QuickBooks', icon: BarChart3, category: 'Accounting', description: 'Financial data sync' },
    { name: 'Salesforce', icon: Cloud, category: 'CRM', description: 'Customer relationship management' },
    { name: 'Slack', icon: MessageSquare, category: 'Communication', description: 'Team notifications' },
    { name: 'Zapier', icon: Zap, category: 'Automation', description: '5000+ app connections' },
    { name: 'Google Workspace', icon: Box, category: 'Productivity', description: 'Docs, Sheets, Drive' },
    { name: 'Microsoft 365', icon: Package, category: 'Enterprise', description: 'Office suite integration' },
    { name: 'AWS', icon: CloudIcon, category: 'Infrastructure', description: 'Cloud deployment' },
    { name: 'Snowflake', icon: Snowflake, category: 'Data Warehouse', description: 'Data analytics' },
    { name: 'Tableau', icon: TrendingUp, category: 'BI Tools', description: 'Business intelligence' },
    { name: 'Power BI', icon: BarChart3, category: 'BI Tools', description: 'Microsoft BI platform' },
    { name: 'Plaid', icon: Link2, category: 'Banking', description: 'Bank account connections' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AssetWorks
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#solutions" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Solutions
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="#customers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Customers
              </Link>
              <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Docs
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/ai-chat">
                <Button variant="ghost" size="sm">AI Chat</Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="gap-2">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative pt-20 pb-12 overflow-hidden"
      >
        {/* Animated Grid Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px',
            }}
          />
          {/* Animated gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-6 backdrop-blur-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                Trusted by 500K+ Financial Professionals
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-6xl font-bold mb-6 leading-[1.1] tracking-tight"
            >
              Financial Intelligence
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Built for Scale
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Transform billions of data points into actionable insights in milliseconds.
              Enterprise-grade AI platform with bank-level security.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center mb-6"
            >
              <Link href="/ai-chat">
                <Button size="lg" className="h-12 px-8 gap-2 shadow-lg shadow-primary/25">
                  <Rocket className="w-4 h-4" />
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-12 px-8 gap-2">
                <Play className="w-4 h-4" />
                Watch Demo
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center justify-center gap-6 text-xs text-muted-foreground"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span>14-day trial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span>SOC2 certified</span>
              </div>
            </motion.div>
          </div>

          {/* Bento Grid Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative max-w-7xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-transparent blur-3xl" />

            <div className="relative bg-background/50 backdrop-blur-xl rounded-3xl border border-border shadow-2xl overflow-hidden">
              {/* Browser Chrome */}
              <div className="bg-muted/50 border-b border-border px-6 py-4 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 flex items-center justify-center gap-2 bg-background/50 rounded-lg px-4 py-2">
                  <Lock className="w-3 h-3 text-green-500" />
                  <span className="text-sm text-muted-foreground font-mono">https://app.assetworks.ai/dashboard</span>
                </div>
                <div className="flex gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* Bento Grid Layout */}
              <div className="p-8 grid grid-cols-6 gap-4">
                {/* Main Chart - Large */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="col-span-4 row-span-2 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 border border-border/50 hover:border-primary/50 transition-all backdrop-blur-sm group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Portfolio Performance</h3>
                      <p className="text-3xl font-bold">$2,847,392</p>
                      <div className="flex items-center gap-2 text-sm text-green-500">
                        <TrendingUp className="w-4 h-4" />
                        <span>+23.4% this month</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="h-8">1D</Button>
                      <Button size="sm" variant="ghost" className="h-8">1W</Button>
                      <Button size="sm" variant="ghost" className="h-8 bg-primary text-primary-foreground">1M</Button>
                      <Button size="sm" variant="ghost" className="h-8">1Y</Button>
                    </div>
                  </div>
                  <div className="h-48 flex items-end justify-between gap-2">
                    {[65, 72, 58, 84, 91, 78, 88, 95, 89, 92, 97, 100, 94, 98, 96].map((height, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 0.6 + i * 0.05, duration: 0.5 }}
                        className="flex-1 bg-gradient-to-t from-primary to-secondary rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Quick Stats - 2 columns */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="col-span-2 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-border/50 hover:border-green-500/50 transition-all backdrop-blur-sm"
                >
                  <TrendingUp className="w-8 h-8 text-green-500 mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">Total Return</p>
                  <p className="text-4xl font-bold mb-2">+47.3%</p>
                  <div className="flex items-center gap-1 text-xs text-green-500">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>+5.2% vs last month</span>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="col-span-2 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 border border-border/50 hover:border-blue-500/50 transition-all backdrop-blur-sm"
                >
                  <Activity className="w-8 h-8 text-blue-500 mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">Active Portfolios</p>
                  <p className="text-4xl font-bold mb-2">247</p>
                  <div className="flex items-center gap-1 text-xs text-blue-500">
                    <Users className="w-3 h-3" />
                    <span>18 new this week</span>
                  </div>
                </motion.div>

                {/* AI Insights */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="col-span-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-border/50 hover:border-purple-500/50 transition-all backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">AI Insights</h3>
                      <p className="text-xs text-muted-foreground">Updated 2 min ago</p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    Portfolio shows strong momentum. AI detected 3 optimization opportunities worth
                    <span className="font-bold text-green-500"> +$127K potential gain</span>. Recommend rebalancing tech sector allocation.
                  </p>
                  <Button size="sm" variant="outline" className="mt-4 gap-2">
                    View Details
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="col-span-3 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl p-6 border border-border/50 hover:border-orange-500/50 transition-all backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium">Recent Activity</h3>
                    <Bell className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: CheckCircle2, text: 'Q4 report generated', time: '2m ago', color: 'text-green-500' },
                      { icon: Zap, text: 'Workflow automation completed', time: '15m ago', color: 'text-yellow-500' },
                      { icon: Users, text: '3 new team members added', time: '1h ago', color: 'text-blue-500' },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <activity.icon className={`w-4 h-4 ${activity.color}`} />
                        <div className="flex-1">
                          <p className="text-sm">{activity.text}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Social Proof Bar */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Trusted by leading financial institutions worldwide
          </p>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center">
            {['Goldman Sachs', 'JP Morgan', 'BlackRock', 'Vanguard', 'Fidelity', 'Morgan Stanley'].map((company, i) => (
              <div key={i} className="text-center">
                <p className="text-lg font-bold text-muted-foreground/50">{company}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Feature Showcase */}
      <section id="features" className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6"
            >
              <Cpu className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Platform Features</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              The complete platform for
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                financial intelligence
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Everything you need to analyze, automate, and scale your financial operations
            </p>
          </div>

          {/* Feature Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {features.map((feature, index) => (
              <button
                key={index}
                onClick={() => setSelectedFeature(index)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  selectedFeature === index
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <feature.icon className="w-4 h-4" />
                  <span>{feature.title}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Feature Content */}
          <motion.div
            key={selectedFeature}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            {/* Left: Content */}
            <div>
              {(() => {
                const FeatureIcon = features[selectedFeature].icon;
                return (
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${features[selectedFeature].color} mb-6`}>
                    <FeatureIcon className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                );
              })()}

              <h3 className="text-4xl font-bold mb-4">{features[selectedFeature].title}</h3>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {features[selectedFeature].description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {features[selectedFeature].benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button size="lg" className="gap-2">
                  Try it now
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" className="gap-2">
                  <Code className="w-4 h-4" />
                  View Docs
                </Button>
              </div>
            </div>

            {/* Right: Demo Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={`relative bg-gradient-to-br ${features[selectedFeature].color} p-1 rounded-3xl shadow-2xl`}
            >
              <div className="bg-background rounded-[calc(1.5rem-4px)] p-8">
                <div className="text-center mb-8">
                  {(() => {
                    const DemoIcon = features[selectedFeature].demoIcon;
                    return <DemoIcon className="w-20 h-20 mx-auto mb-4 text-primary" strokeWidth={1.5} />;
                  })()}
                  <h4 className="text-2xl font-bold mb-2">{features[selectedFeature].title}</h4>
                  <p className="text-sm text-muted-foreground">Live Performance Metrics</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(features[selectedFeature].metrics).map(([key, value], i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-center p-4 bg-muted/50 rounded-xl"
                    >
                      <p className="text-2xl font-bold mb-1">{value}</p>
                      <p className="text-xs text-muted-foreground capitalize">{key}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-primary/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium">Live Status</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    System operating at optimal performance • Last updated just now
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Case Studies */}
      <section id="customers" className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Customer{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                success stories
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how leading organizations are transforming their operations with AssetWorks
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {caseStudies.map((study, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-border hover:border-primary/50 transition-all h-full hover:shadow-lg group">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                        <study.icon className="w-8 h-8 text-white" strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{study.company}</h3>
                        <p className="text-sm text-muted-foreground">{study.industry}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-primary mb-2">Challenge</h4>
                      <p className="text-sm text-muted-foreground mb-4">{study.challenge}</p>

                      <h4 className="text-sm font-semibold text-primary mb-2">Solution</h4>
                      <p className="text-sm text-muted-foreground">{study.solution}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {study.results.map((result, i) => (
                        <div key={i} className="text-center p-3 bg-muted rounded-xl">
                          <result.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                          <p className="text-xl font-bold mb-1">{result.value}</p>
                          <p className="text-xs text-muted-foreground">{result.metric}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-primary/5 rounded-xl border-l-4 border-primary">
                      <p className="text-sm italic mb-3">"{study.quote}"</p>
                      <p className="text-xs font-semibold">{study.author}</p>
                    </div>

                    <Button variant="outline" className="w-full mt-6 gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      Read Full Case Study
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              How we{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                compare
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See why leading organizations choose AssetWorks over alternatives
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border border-border rounded-2xl overflow-hidden">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <span>AssetWorks</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Competitor A</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Competitor B</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index} className="border-t border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{feature.name}</td>
                    <td className="px-6 py-4 text-center">
                      {feature.assetworks ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {feature.competitor1 ? (
                        <CheckCircle2 className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {feature.competitor2 ? (
                        <CheckCircle2 className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="gap-2">
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Simple,{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                transparent pricing
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Choose the plan that's right for your organization
            </p>

            {/* Pricing Toggle */}
            <div className="inline-flex items-center gap-4 p-1 bg-background rounded-full border border-border">
              <button
                onClick={() => setActivePricingTab('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activePricingTab === 'monthly'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setActivePricingTab('annual')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activePricingTab === 'annual'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Annual
                <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-500 text-xs rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative ${plan.popular ? 'md:-mt-8' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}

                <Card className={`border-2 h-full ${
                  plan.popular
                    ? 'border-primary shadow-xl shadow-primary/20'
                    : 'border-border hover:border-primary/50'
                } transition-all`}>
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                    <div className="mb-6">
                      {plan.monthlyPrice ? (
                        <>
                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold">
                              ${activePricingTab === 'monthly' ? plan.monthlyPrice : Math.round(plan.annualPrice! / 12)}
                            </span>
                            <span className="text-muted-foreground">/month</span>
                          </div>
                          {activePricingTab === 'annual' && (
                            <p className="text-sm text-muted-foreground mt-2">
                              ${plan.annualPrice} billed annually
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="text-4xl font-bold mb-2">Custom</div>
                      )}
                    </div>

                    <Button
                      size="lg"
                      className={`w-full mb-6 ${
                        plan.popular
                          ? ''
                          : 'bg-background text-foreground border-2 border-border hover:bg-muted'
                      }`}
                    >
                      {plan.cta}
                    </Button>

                    <div className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                          {feature.included ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/30 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${
                            feature.included ? '' : 'text-muted-foreground'
                          }`}>
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground mb-4">
              All plans include 14-day free trial • No credit card required • Cancel anytime
            </p>
            <Button variant="outline" size="lg" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Integrates with{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                everything
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Connect AssetWorks to 100+ popular services and automate your entire workflow
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
            {integrations.map((integration, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
              >
                <Card className="border-border hover:border-primary/50 transition-all hover:shadow-lg group">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center">
                      <integration.icon className="w-6 h-6 text-primary" strokeWidth={2} />
                    </div>
                    <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">{integration.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{integration.category}</p>
                    <p className="text-xs text-muted-foreground">{integration.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" variant="outline" className="gap-2">
              <Package className="w-5 h-5" />
              View All 100+ Integrations
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Frequently asked{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                questions
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about AssetWorks
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.details
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group bg-background border border-border rounded-2xl p-6 hover:border-primary/50 transition-all"
              >
                <summary className="flex items-center justify-between cursor-pointer text-lg font-semibold list-none">
                  <span>{faq.question}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </motion.details>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">Still have questions?</p>
            <Button size="lg" variant="outline" className="gap-2">
              <MessageSquare className="w-5 h-5" />
              Contact Support
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px',
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-6 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Ready to transform your
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                financial operations?
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Join 500,000+ financial professionals using AssetWorks to automate workflows,
              generate insights, and scale effortlessly
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/ai-chat">
                <Button size="lg" className="h-16 px-10 text-lg gap-3 shadow-xl shadow-primary/25">
                  <Rocket className="w-6 h-6" />
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-16 px-10 text-lg gap-3 backdrop-blur-sm">
                <Download className="w-6 h-6" />
                Download Whitepaper
              </Button>
              <Link href="/dashboard">
                <Button size="lg" variant="ghost" className="h-16 px-10 text-lg gap-3">
                  <Play className="w-6 h-6" />
                  View Demo
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>SOC2 Type II certified</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">AssetWorks</span>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Enterprise-grade financial intelligence platform powered by AI.
                Transform your data into actionable insights in milliseconds.
              </p>
              <div className="flex gap-4">
                <Button size="sm" variant="outline" className="w-10 h-10 p-0">
                  <GitBranch className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="w-10 h-10 p-0">
                  <MessageSquare className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="w-10 h-10 p-0">
                  <Hash className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-3">
                <Link href="/features" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
                <Link href="/pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
                <Link href="/integrations" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Integrations</Link>
                <Link href="/changelog" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Changelog</Link>
                <Link href="/roadmap" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Roadmap</Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-3">
                <Link href="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">About Us</Link>
                <Link href="/blog" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
                <Link href="/careers" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</Link>
                <Link href="/contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
                <Link href="/partners" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Partners</Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <div className="space-y-3">
                <Link href="/docs" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</Link>
                <Link href="/api" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">API Reference</Link>
                <Link href="/support" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Support</Link>
                <Link href="/status" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">System Status</Link>
                <Link href="/community" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Community</Link>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <p className="text-sm text-muted-foreground">
                © 2025 AssetWorks. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3 h-3 text-green-500" />
                <span>SOC2 Type II Certified</span>
              </div>
            </div>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="/security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</Link>
              <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
