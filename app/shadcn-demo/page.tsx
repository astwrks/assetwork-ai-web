'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sparkles,
  TrendingUp,
  Users,
  DollarSign,
  ArrowRight,
  Check,
  Star,
  Zap,
  Shield,
  Target,
  BarChart3,
  Activity,
  Layers
} from "lucide-react";

export default function ShadcnDemo() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Built for performance with modern web standards",
      color: "#FD7E14"
    },
    {
      icon: Shield,
      title: "Secure by Default",
      description: "Enterprise-grade security out of the box",
      color: "#28A745"
    },
    {
      icon: Layers,
      title: "Modular Design",
      description: "Compose interfaces with reusable components",
      color: "#1B2951"
    },
    {
      icon: Target,
      title: "Precision Tooling",
      description: "Fine-tuned developer experience",
      color: "#405D80"
    },
  ];

  const stats = [
    { label: "Active Users", value: "48.3K", change: "+12.5%", icon: Users },
    { label: "Revenue", value: "$2.8M", change: "+23.1%", icon: DollarSign },
    { label: "Growth Rate", value: "156%", change: "+8.2%", icon: TrendingUp },
    { label: "Engagement", value: "94%", change: "+5.4%", icon: Activity },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      description: "Perfect for small teams",
      features: ["Up to 10 users", "Basic analytics", "Email support", "1GB storage"],
    },
    {
      name: "Professional",
      price: "$99",
      description: "For growing businesses",
      features: ["Up to 50 users", "Advanced analytics", "Priority support", "10GB storage", "Custom integrations"],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: ["Unlimited users", "Custom analytics", "24/7 support", "Unlimited storage", "Dedicated account manager", "SLA guarantee"],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary via-primary/95 to-accent">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span>Powered by shadcn/ui</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
              Beautiful UI
              <span className="block bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
                Built with Purpose
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/90">
              Experience the perfect blend of design and functionality. Built with shadcn/ui
              and styled with AssetWorks brand colors.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-2 transition-all hover:shadow-lg hover:border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <p className="text-xs text-green-600 font-medium mt-2">
                    {stat.change} from last month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful features to build modern applications
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="group relative overflow-hidden border-2 transition-all hover:shadow-xl hover:border-primary/30">
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, ${feature.color} 0%, transparent 100%)`,
                  }}
                />
                <CardHeader>
                  <div
                    className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: feature.color }} strokeWidth={2.5} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that works best for you
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-6xl gap-8 lg:grid-cols-3">
          {pricingPlans.map((plan, index) => (
            <Card
              key={index}
              className={`relative flex flex-col border-2 transition-all hover:shadow-xl ${
                plan.popular
                  ? "border-primary shadow-lg scale-105"
                  : "hover:border-primary/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-white">
                    <Star className="h-3 w-3 fill-current" />
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  Get Started
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl sm:text-4xl">
              Ready to get started?
            </CardTitle>
            <CardDescription className="text-lg mt-4">
              Join thousands of teams building with shadcn/ui and AssetWorks design system
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <Button size="lg" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline">
              Schedule Demo
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Built with shadcn/ui • Styled with AssetWorks Brand Colors • Powered by Next.js
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
