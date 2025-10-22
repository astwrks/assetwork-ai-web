'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Sparkles,
  Zap,
  ChevronRight,
  BarChart3,
  Brain,
  ArrowRight,
  Activity,
  Play,
  Building2,
  Hash,
  MessageSquare,
  Search,
  FileText,
  Clock,
  Target,
  Users,
  CheckCircle2,
  Globe,
  Layers,
  Github,
  Twitter,
  Linkedin,
  Send,
  AlertCircle,
  BookOpen,
  Code2,
  Database,
  Shield,
  ArrowUpRight,
  Bot,
  Cpu,
  MousePointer,
  Gauge,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import DemoSection from '@/components/homepage/demo-section';

export default function HomePage() {
  const [currentEntityIndex, setCurrentEntityIndex] = useState(0);
  const [typedQuery, setTypedQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);

  // Example queries to type
  const exampleQueries = [
    "Analyze Apple's Q4 performance and market position",
    "Compare Indian retail giants: Reliance vs DMart",
    "What are the risks in the semiconductor industry?",
    "Generate a bull case for renewable energy stocks",
    "Explain the latest Fed policy impact on tech stocks",
  ];

  // Rotating entities showcase
  const entities = [
    { name: 'Apple', ticker: 'AAPL', type: 'COMPANY', sentiment: '+82%', mentions: 1847 },
    { name: 'NVIDIA', ticker: 'NVDA', type: 'COMPANY', sentiment: '+91%', mentions: 2103 },
    { name: 'Bitcoin', ticker: 'BTC', type: 'CRYPTOCURRENCY', sentiment: '+67%', mentions: 892 },
    { name: 'S&P 500', ticker: 'SPX', type: 'INDEX', sentiment: '+54%', mentions: 3291 },
    { name: 'Tesla', ticker: 'TSLA', type: 'COMPANY', sentiment: '+73%', mentions: 1562 },
  ];

  // Auto-rotate entities
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEntityIndex((prev) => (prev + 1) % entities.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Removed typing animation - using predefined queries instead

  // Simulate report generation
  const handleTryDemo = () => {
    setIsGenerating(true);
    setGeneratedContent('');

    // Simulate streaming content
    const content = `## Market Analysis Report

### Executive Summary
Based on comprehensive analysis of recent market data and company filings, we've identified key trends and opportunities in the technology sector...

### Key Entities Identified
• **Apple (AAPL)** - Positive sentiment: 82% | Market leader in consumer electronics
• **NVIDIA (NVDA)** - Positive sentiment: 91% | Dominating AI chip market
• **Microsoft (MSFT)** - Positive sentiment: 78% | Cloud growth accelerating

### Financial Highlights
The technology sector shows strong momentum with average YoY growth of 23.4%...`;

    let currentChar = 0;
    const streamInterval = setInterval(() => {
      if (currentChar < content.length) {
        setGeneratedContent(content.substring(0, currentChar + 10));
        currentChar += 10;
      } else {
        clearInterval(streamInterval);
        setIsGenerating(false);
      }
    }, 30);

    setTimeout(() => {
      clearInterval(streamInterval);
      setIsGenerating(false);
      setGeneratedContent(content);
    }, 3000);
  };

  const features = [
    {
      icon: Brain,
      title: 'AI Financial Analyst',
      description: 'Claude-powered analysis that understands context and generates institutional-quality reports',
      demo: '95% accuracy',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Building2,
      title: 'Entity Intelligence',
      description: 'Automatic extraction of companies, people, and financial entities with sentiment analysis',
      demo: '10K+ entities',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Zap,
      title: 'Real-time Generation',
      description: 'Stream reports as they generate with token counting and live entity extraction',
      demo: '<100ms latency',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Database,
      title: 'Knowledge Graph',
      description: 'Build a connected graph of financial entities, relationships, and historical insights',
      demo: '50M+ data points',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption, SOC2 compliance, and isolated data processing',
      demo: 'SOC2 Type II',
      color: 'from-gray-500 to-slate-500',
    },
    {
      icon: Code2,
      title: 'API Access',
      description: 'Comprehensive REST API for custom integrations and workflow automation',
      demo: '100+ endpoints',
      color: 'from-indigo-500 to-blue-500',
    },
  ];

  const useCases = [
    {
      title: 'Investment Research',
      description: 'Generate comprehensive research reports with AI-powered insights',
      icon: FileText,
      example: 'Analyze AAPL Q4 earnings',
    },
    {
      title: 'Market Analysis',
      description: 'Track market trends and sentiment across thousands of entities',
      icon: TrendingUp,
      example: 'Tech sector outlook 2024',
    },
    {
      title: 'Risk Assessment',
      description: 'Identify and quantify risks with intelligent pattern recognition',
      icon: AlertCircle,
      example: 'Portfolio risk analysis',
    },
    {
      title: 'Competitive Intelligence',
      description: 'Compare companies and track competitive dynamics',
      icon: Target,
      example: 'Tesla vs traditional auto',
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">AssetWorks</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="#demo" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Demo
              </Link>
              <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#use-cases" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Use Cases
              </Link>
              <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/financial-playground">
                <Button size="sm" className="gap-2 shadow-lg shadow-blue-600/20">
                  Try Playground
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative pt-32 pb-20 px-6"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-6xl mx-auto relative">
          {/* Announcement Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <Badge variant="outline" className="px-4 py-1.5 gap-2 bg-blue-500/10 border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-sm">Powered by Claude 3.5 Sonnet</span>
            </Badge>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              Financial Intelligence
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Powered by AI
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Generate institutional-quality financial reports with AI.
              Extract entities, analyze sentiment, and build a knowledge graph of the financial world.
            </p>
          </motion.div>

          {/* CTA to Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto mb-8"
          >
            <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
              <p className="text-lg font-semibold mb-2">Experience AI-Powered Financial Analysis</p>
              <p className="text-muted-foreground mb-4">Click on predefined queries below to see instant report generation</p>
              <Button
                size="lg"
                className="gap-2 shadow-lg shadow-blue-600/25"
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <MousePointer className="w-4 h-4" />
                Try Interactive Demo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>

          {/* Entity Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {entities.map((entity, index) => (
              <motion.div
                key={entity.ticker}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: currentEntityIndex === index ? 1 : 0.5,
                  scale: currentEntityIndex === index ? 1.05 : 1,
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "px-4 py-2 rounded-full border bg-background/50 backdrop-blur-sm transition-all",
                  currentEntityIndex === index ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {entity.type === 'COMPANY' && <Building2 className="w-4 h-4 text-blue-500" />}
                    {entity.type === 'CRYPTOCURRENCY' && <Hash className="w-4 h-4 text-orange-500" />}
                    {entity.type === 'INDEX' && <TrendingUp className="w-4 h-4 text-green-500" />}
                    <span className="font-semibold">{entity.name}</span>
                    <span className="text-muted-foreground">({entity.ticker})</span>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    entity.sentiment.startsWith('+') ? "border-green-500 text-green-600" : "border-red-500 text-red-600"
                  )}>
                    {entity.sentiment}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{entity.mentions} mentions</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
          >
            <Link href="/financial-playground">
              <Button size="lg" className="h-12 px-8 gap-2 shadow-lg shadow-blue-600/25">
                <Sparkles className="w-4 h-4" />
                Launch Playground
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="h-12 px-8 gap-2">
                <BarChart3 className="w-4 h-4" />
                View Dashboard
              </Button>
            </Link>
            <Button size="lg" variant="ghost" className="h-12 px-8 gap-2" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
              <MousePointer className="w-4 h-4" />
              See it in Action
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-8 mt-12 text-xs text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-500" />
              <span>Claude 3.5 Sonnet</span>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-orange-500" />
              <span>Real-time streaming</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" />
              <span>Enterprise security</span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Live Demo Section */}
      <DemoSection id="demo" />

      {/* Features Grid */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-6">
              <Layers className="w-3 h-3 mr-2" />
              Platform Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need for{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Financial Intelligence
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built by developers, for developers. API-first with powerful integrations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <Card className={cn(
                  "h-full border-2 transition-all duration-300",
                  hoveredFeature === index ? "border-blue-500 shadow-xl shadow-blue-500/20 scale-105" : "border-border hover:border-border/80"
                )}>
                  <CardContent className="p-6">
                    <div className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4",
                      feature.color
                    )}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{feature.demo}</Badge>
                      <ArrowUpRight className={cn(
                        "w-4 h-4 transition-transform",
                        hoveredFeature === index ? "translate-x-1 -translate-y-1" : ""
                      )} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-6">
              <Target className="w-3 h-3 mr-2" />
              Use Cases
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built for{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Real Work
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From research to risk assessment, AssetWorks handles it all
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-2 hover:border-blue-500/50 transition-all">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <useCase.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{useCase.title}</h3>
                        <p className="text-muted-foreground mb-4">{useCase.description}</p>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-mono">
                            <span className="text-muted-foreground">$</span> ask "{useCase.example}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10" />

        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-6">
              <Sparkles className="w-3 h-3 mr-2" />
              Get Started
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Financial Analysis?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of analysts using AI to generate insights faster and smarter
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/financial-playground">
                <Button size="lg" className="h-14 px-10 text-lg gap-3 shadow-lg shadow-blue-600/25">
                  <Sparkles className="w-5 h-5" />
                  Try Financial Playground
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg gap-3">
                  <BarChart3 className="w-5 h-5" />
                  Explore Dashboard
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Free tier available</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>API included</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">AssetWorks</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered financial intelligence platform
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <div className="space-y-2">
                <Link href="/financial-playground" className="block text-sm text-muted-foreground hover:text-foreground">
                  Financial Playground
                </Link>
                <Link href="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground">
                  Dashboard
                </Link>
                <Link href="/docs" className="block text-sm text-muted-foreground hover:text-foreground">
                  Documentation
                </Link>
                <Link href="/api" className="block text-sm text-muted-foreground hover:text-foreground">
                  API Reference
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <div className="space-y-2">
                <Link href="/blog" className="block text-sm text-muted-foreground hover:text-foreground">
                  Blog
                </Link>
                <Link href="/changelog" className="block text-sm text-muted-foreground hover:text-foreground">
                  Changelog
                </Link>
                <Link href="/roadmap" className="block text-sm text-muted-foreground hover:text-foreground">
                  Roadmap
                </Link>
                <Link href="/support" className="block text-sm text-muted-foreground hover:text-foreground">
                  Support
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Connect</h4>
              <div className="flex gap-3">
                <Button size="sm" variant="outline" className="w-10 h-10 p-0">
                  <Github className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="w-10 h-10 p-0">
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="w-10 h-10 p-0">
                  <Linkedin className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              © 2024 AssetWorks. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}