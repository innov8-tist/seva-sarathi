"use client"

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { api } from '@/lib/api'
import { ThemeProvider } from "@/components/theme-provider"

export const Route = createFileRoute('/login')({
    component: RouteComponent,
})


const formSchema = z.object({
    email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
    password: z.string().min(1, "Password is required"),
})

type FormData = z.infer<typeof formSchema>

export default function RouteComponent() {
    const navigate = useNavigate()
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(data: FormData) {
        const response = await api.auth['sign-in'].$post({
            json: {
                email: data.email,
                password: data.password
            },
        })
        if(!response.ok){
            toast.error("Invalid credentials")
            return
        }
        const res = await response.json()
        navigate({to:"/dashboard"})
        toast.success("Logged in successfully")
    }


    async function signInWithGoogle() {
        try {
            const response = await api.auth['sign-in-with-provider'].$post({
                json: {
                    provider: 'google'
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log(data)
                if (data.forwardingTo) {
                    window.location.href = data.forwardingTo;
                }
            } else {
                console.error('Failed to initiate Google sign in');
            }
        } catch (error) {
            console.error('Error during Google sign in:', error);
        }
    }

    return (
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-sm border-none shadow-none">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl">Welcome back</CardTitle>
                    <CardDescription>Sign in to your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <Button variant="outline" className="w-full" onClick={() => { signInWithGoogle() }}>
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => { }}>
                            <svg
                                className="mr-2 h-4 w-4"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect width="18" height="18" x="3" y="3" rx="2" />
                                <path d="M7 7h10" />
                                <path d="M7 12h10" />
                                <path d="M7 17h10" />
                            </svg>
                            Continue with SSO
                        </Button>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">or</span>
                        </div>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="you@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Password</FormLabel>
                                            <Link to="/" className="text-sm text-primary hover:underline">
                                                Forgot Password?
                                            </Link>
                                        </div>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full">
                                Sign In
                            </Button>
                        </form>
                    </Form>
                    <div className="text-center text-sm">
                        {"Don't have an account? "}
                        <Link to="/" className="text-primary font-bold underline hover:text-primary/80 transition-colors">
                            Sign Up Now
                        </Link>
                    </div>
                </CardContent>
            </Card>
            </div>
        </ThemeProvider>
    )
}
