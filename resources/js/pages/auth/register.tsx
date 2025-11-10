import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
    name: string;
    email: string;
    phone_number: string;
    password: string;
    password_confirmation: string;
    company_name?: string;
    company_phone?: string;
    company_email?: string;
    company_website?: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        phone_number: '',
        password: '',
        password_confirmation: '',
        company_name: '',
        company_phone: '',
        company_email: '',
        company_website: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Create an account" description="Enter your details below to create your account">
            <Head title="Register" />
            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled={processing}
                            placeholder="Full name"
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone_number">Phone number</Label>
                        <Input
                            id="phone_number"
                            type="text"
                            required
                            tabIndex={3}
                            autoComplete="phone"
                            value={data.phone_number}
                            onChange={(e) => setData('phone_number', e.target.value)}
                            disabled={processing}
                            placeholder="Phone number"
                        />
                        <InputError message={errors.phone_number} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            disabled={processing}
                            placeholder="Password"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            required
                            tabIndex={5}
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            disabled={processing}
                            placeholder="Confirm password"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>
                </div>

                <div className="grid gap-6">
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">Company Information (Optional)</h3>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="company_name">Company Name</Label>
                                <Input
                                    id="company_name"
                                    type="text"
                                    tabIndex={6}
                                    autoComplete="organization"
                                    value={data.company_name || ''}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    disabled={processing}
                                    placeholder="Your company name"
                                />
                                <InputError message={errors.company_name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="company_phone">Company Phone</Label>
                                <Input
                                    id="company_phone"
                                    type="text"
                                    tabIndex={7}
                                    autoComplete="tel"
                                    value={data.company_phone || ''}
                                    onChange={(e) => setData('company_phone', e.target.value)}
                                    disabled={processing}
                                    placeholder="Company phone number"
                                />
                                <InputError message={errors.company_phone} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="company_email">Company Email</Label>
                                <Input
                                    id="company_email"
                                    type="email"
                                    tabIndex={8}
                                    autoComplete="email"
                                    value={data.company_email || ''}
                                    onChange={(e) => setData('company_email', e.target.value)}
                                    disabled={processing}
                                    placeholder="company@example.com"
                                />
                                <InputError message={errors.company_email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="company_website">Company Website</Label>
                                <Input
                                    id="company_website"
                                    type="text"
                                    tabIndex={9}
                                    autoComplete="url"
                                    value={data.company_website || ''}
                                    onChange={(e) => setData('company_website', e.target.value)}
                                    disabled={processing}
                                    placeholder="www.example.com"
                                />
                                <InputError message={errors.company_website} />
                            </div>
                        </div>
                    </div>
                </div>

                <Button type="submit" className="mt-2 w-full" tabIndex={10} disabled={processing}>
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Create account
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <TextLink href={route('login')} tabIndex={11}>
                        Log in
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
