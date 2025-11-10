import AppLogoIcon from '@/components/app-logo-icon';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Brain,
    CheckCircle2,
    Code,
    Download,
    FileText,
    Info,
    Megaphone,
    Monitor,
    Palette,
    Shield,
    Smartphone,
    Sparkles,
    TrendingUp,
    Users,
} from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    const features = [
        {
            icon: Sparkles,
            title: 'AI-Powered Generation',
            description: 'Generate professional quotations instantly using advanced AI technology. Save time and ensure consistency.',
            color: 'text-purple-600 dark:text-purple-400',
        },
        {
            icon: FileText,
            title: 'Smart Quotation Management',
            description: 'Create, edit, and manage quotations with ease. Track status, view history, and organize all your quotes in one place.',
            color: 'text-blue-600 dark:text-blue-400',
        },
        {
            icon: Users,
            title: 'Client Management',
            description: 'Efficiently manage client information, track relationships, and maintain a comprehensive client database.',
            color: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            icon: BarChart3,
            title: 'Analytics Dashboard',
            description: 'Get insights into your quotation performance with comprehensive analytics and visual reports.',
            color: 'text-amber-600 dark:text-amber-400',
        },
        {
            icon: Download,
            title: 'PDF Export',
            description: 'Export professional PDF quotations ready for client delivery. Customizable templates and branding options.',
            color: 'text-rose-600 dark:text-rose-400',
        },
        {
            icon: Shield,
            title: 'Secure & Reliable',
            description: 'Your data is secure with enterprise-grade security. Regular backups and data protection included.',
            color: 'text-indigo-600 dark:text-indigo-400',
        },
    ];

    const services = [
        {
            icon: Code,
            title: 'Web Development',
            description: 'Custom web applications and websites',
        },
        {
            icon: Smartphone,
            title: 'Mobile Development',
            description: 'iOS and Android app development',
        },
        {
            icon: Monitor,
            title: 'Desktop Development',
            description: 'Cross-platform desktop applications',
        },
        {
            icon: Brain,
            title: 'AI Development',
            description: 'Machine learning and AI solutions',
        },
        {
            icon: Palette,
            title: 'Graphic Design',
            description: 'Creative design and branding services',
        },
        {
            icon: Megaphone,
            title: 'Digital Marketing',
            description: 'Marketing strategies and campaigns',
        },
    ];

    const benefits = [
        'Save hours on quotation creation',
        'Ensure consistent, professional formatting',
        'Track all quotations in one place',
        'Generate reports and analytics',
        'Export to PDF instantly',
        'Manage clients efficiently',
    ];

    return (
        <>
            <Head title="QuotationAI - AI-Powered Quotation Management System">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
                <meta
                    name="description"
                    content="AI-powered quotation management system for creating, managing, and tracking professional quotations. Demo system showcasing modern web technologies."
                />
            </Head>

            <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-gradient-to-b from-background to-muted/20">
                {/* Demo Banner */}
                <Alert className="rounded-none border-x-0 border-t-0 border-b border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/20">
                    <Info className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                    <AlertTitle className="font-semibold text-amber-900 dark:text-amber-100">Demo System</AlertTitle>
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                        This is a demonstration system showcasing QuotationAI capabilities. All data is for demonstration purposes only.
                    </AlertDescription>
                </Alert>

                {/* Header */}
                <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container mx-auto flex h-16 max-w-[100vw] items-center justify-between px-4 md:px-6">
                        <div className="flex flex-shrink-0 items-center gap-2">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                <AppLogoIcon />
                            </div>
                            <span className="text-lg font-bold whitespace-nowrap">QuotationAI</span>
                        </div>
                        <nav className="flex flex-shrink-0 items-center gap-2 md:gap-4">
                            {auth.user ? (
                                <Button asChild size="sm" className="text-sm">
                                    <Link href={route('dashboard')}>
                                        Go to Dashboard
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2 md:gap-3">
                                    <Button variant="ghost" asChild size="sm" className="text-sm whitespace-nowrap">
                                        <Link href={route('login')}>Log in</Link>
                                    </Button>
                                    <Button asChild size="sm" className="text-sm whitespace-nowrap">
                                        <Link href={route('register')}>Get Started</Link>
                                    </Button>
                                </div>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="container mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-32">
                    <div className="mx-auto max-w-4xl text-center">
                        <Badge variant="secondary" className="mb-4 px-4 py-1">
                            <Sparkles className="mr-2 h-3 w-3" />
                            AI-Powered Quotation System
                        </Badge>
                        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                            Create Professional
                            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"> Quotations </span>
                            in Seconds
                        </h1>
                        <p className="mb-8 text-lg text-muted-foreground sm:text-xl md:text-2xl">
                            Transform your quotation process with AI-powered automation. Generate, manage, and track professional quotations
                            effortlessly.
                        </p>
                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            {auth.user ? (
                                <Button size="lg" asChild className="px-8 py-6 text-lg">
                                    <Link href={route('dashboard')}>
                                        Open Dashboard
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button size="lg" asChild className="px-8 py-6 text-lg">
                                        <Link href={route('register')}>
                                            Get Started Free
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Link>
                                    </Button>
                                    <Button size="lg" variant="outline" asChild className="px-8 py-6 text-lg">
                                        <Link href={route('login')}>Sign In</Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="container mx-auto max-w-7xl px-4 py-20 md:px-6">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-12 text-center">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Powerful Features</h2>
                            <p className="text-lg text-muted-foreground">Everything you need to manage quotations efficiently</p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <Card key={index} className="border transition-all hover:shadow-lg">
                                        <CardHeader>
                                            <div className={`mb-4 inline-flex rounded-lg bg-muted p-3 ${feature.color}`}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <CardTitle className="text-xl">{feature.title}</CardTitle>
                                            <CardDescription className="text-base">{feature.description}</CardDescription>
                                        </CardHeader>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                <section className="w-full bg-muted/30 py-20">
                    <div className="container mx-auto max-w-7xl px-4 md:px-6">
                        <div className="mx-auto max-w-6xl">
                        <div className="mb-12 text-center">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Supported Service Types</h2>
                            <p className="text-lg text-muted-foreground">Generate quotations for various service categories</p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {services.map((service, index) => {
                                const Icon = service.icon;
                                return (
                                    <Card key={index} className="border transition-all hover:shadow-md">
                                        <CardHeader>
                                            <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <CardTitle className="text-xl">{service.title}</CardTitle>
                                            <CardDescription className="text-base">{service.description}</CardDescription>
                                        </CardHeader>
                                    </Card>
                                );
                            })}
                        </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="container mx-auto max-w-7xl px-4 py-20 md:px-6">
                    <div className="mx-auto max-w-4xl">
                        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
                            <div>
                                <h2 className="mb-6 text-3xl font-bold tracking-tight">Why Choose QuotationAI?</h2>
                                <p className="mb-8 text-lg text-muted-foreground">
                                    Streamline your quotation process and focus on what matters most - growing your business.
                                </p>
                                <ul className="space-y-4">
                                    {benefits.map((benefit, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-base">{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex items-center justify-center">
                                <Card className="w-full border-2 border-dashed">
                                    <CardHeader className="text-center">
                                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                                            <TrendingUp className="h-10 w-10 text-primary" />
                                        </div>
                                        <CardTitle className="text-2xl">Boost Productivity</CardTitle>
                                        <CardDescription className="text-base">
                                            Reduce quotation creation time by up to 80% with AI-powered automation
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="w-full bg-primary/5 py-20">
                    <div className="container mx-auto max-w-7xl px-4 md:px-6">
                        <div className="mx-auto max-w-4xl text-center">
                        <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Ready to Transform Your Quotation Process?</h2>
                        <p className="mb-8 text-lg text-muted-foreground">Join the demo and experience the future of quotation management</p>
                        {auth.user ? (
                            <Button size="lg" asChild className="px-8 py-6 text-lg">
                                <Link href={route('dashboard')}>
                                    Go to Dashboard
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                                <Button size="lg" asChild className="px-8 py-6 text-lg">
                                    <Link href={route('register')}>
                                        Create Free Account
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                                <Button size="lg" variant="outline" asChild className="px-8 py-6 text-lg">
                                    <Link href={route('login')}>Sign In</Link>
                                </Button>
                            </div>
                        )}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t bg-muted/30">
                    <div className="container mx-auto max-w-7xl px-4 py-12 md:px-6">
                        <div className="mx-auto max-w-6xl">
                            <div className="grid gap-8 md:grid-cols-4">
                                <div className="md:col-span-2">
                                    <div className="mb-4 flex items-center gap-2">
                                        <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                            <AppLogoIcon />
                                        </div>
                                        <span className="text-lg font-bold">QuotationAI</span>
                                    </div>
                                    <p className="mb-4 text-sm text-muted-foreground">
                                        AI-powered quotation management system for modern businesses. This is a demonstration system showcasing the
                                        capabilities of QuotationAI.
                                    </p>
                                    <Badge variant="outline" className="mt-2">
                                        Demo System
                                    </Badge>
                                </div>
                                <div>
                                    <h3 className="mb-4 font-semibold">Product</h3>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li>
                                            <Link href={route('dashboard')} className="transition-colors hover:text-foreground">
                                                Dashboard
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="mb-4 font-semibold">Resources</h3>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li>
                                            <a href="https://dydxsoft.my" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
                                                Documentation
                                            </a>
                                        </li>
                                        <li>
                                            <a href="https://dydxsoft.my" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
                                                Support
                                            </a>
                                        </li>
                                        <li>
                                            <a href="mailto:dydxsoft@gmail.com" className="transition-colors hover:text-foreground">
                                                Contact
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
                                <p>© 2025 QuotationAI. Demo system for demonstration purposes only.</p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
