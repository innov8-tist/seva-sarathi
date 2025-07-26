import { supabaseAuth } from "@/supabase/client";
import { zValidator } from "@hono/zod-validator";
import { db } from "@/src/database/db";
import { userTable, type Providers, type UserInsertSchema } from "@/src/database/schema/user.schema";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { v4 } from "uuid";
import { logger } from "@/src/utils/pino.config";
import { env } from "@/src/utils/env.parser";
import { eq } from "drizzle-orm";
import type { Provider } from "@supabase/supabase-js";

const authRoutes = new Hono()
    .get('/cb', zValidator('query', z.object({
        code: z.string(),
        provider: z.enum(['google', 'local']),
        error: z.string().optional(),
        error_description: z.string().optional()
    })), async (c) => {
        try {
            console.log("Callback  called")
            let { code, provider, error, error_description } = c.req.valid('query')

            if (error || error_description) {
                logger.error(`Error occured on oauth cb ${error}`)
                throw new HTTPException(403, { message: `Error occured on oauth ${error}, description ${error_description}` })
            }

            const { data, error: sessionError } = await supabaseAuth.auth.exchangeCodeForSession(code);
            if (sessionError) {
                logger.error(`Error in OAuth callback: ${sessionError.message}`);
                throw new HTTPException(401, { message: sessionError.message });
            }

            if (!data.session) {
                throw new HTTPException(401, { message: 'No session data' });
            }

            let useData = await db.select().from(userTable).where(eq(userTable.providerid, data.user.id));

            if (useData.length == 0) {
                let name = data.user.user_metadata.full_name ?? (data.user.email?.split('@')[0] || `Guest user-${data.user.id}`)
                const dbUser: UserInsertSchema = {
                    id: v4(),
                    email: data?.user.email,
                    name: name,
                    provider: provider as Providers,
                    providerid: data?.user.id,
                    pfp: data.user.user_metadata?.avatar_url,
                    accessToken: data.session.access_token,
                    refreshToken: data.session.refresh_token
                };

                const _ = await db.insert(userTable).values(dbUser as any).returning();
            }

            setCookie(c, 'access_token', data.session.access_token);
            setCookie(c, 'refresh_token', data.session.refresh_token);

            logger.info(`User ${data.user.id} logged in with ${provider}`)
            logger.info(`Access token: ${data.session.access_token}`)
            logger.info(`Refresh token: ${data.session.refresh_token}`)

            return c.redirect(env.CLIENT_URL+'/dashboard');
        } catch (error) {
            logger.error('Unexpected error in callback:', error);
            throw error;
        }
    })

    .post(
        "/sign-in-with-provider",
        zValidator(
            "json",
            z.object({
                provider: z.enum(['google', 'local']),
            }),
        ),
        async (c) => {
            const { provider } = c.req.valid("json");

            const { data, error } = await supabaseAuth.auth.signInWithOAuth({
                provider: provider as Provider,
                options: {
                    redirectTo: `${env.SERVER_URL}/api/auth/cb?provider=${provider}`,
                    skipBrowserRedirect: true,
                    scopes: 'email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar ',
                }
            });

            if (error) {
                logger.error("Error while signing in with Provider ", error);
                throw new HTTPException(401, { message: error.message });
            }
            if (data.url) {
                logger.info(`Sending Redirect request to ${data.url.toString()}`)
                return c.json({ forwardingTo: data.url });
            } else {
                return c.json({ message: "Some error occured in server" }, 500)
            }
        },
    )

    .post(
        "/sign-up",
        zValidator(
            "json",
            z.object({
                name: z.string(),
                email: z.string(),
                password: z.string().min(6),
            }),
        ),
        async (c) => {
            const { email, password, name } = c.req.valid("json");
            const { data, error } = await supabaseAuth.auth.signUp({
                email,
                password,
            });

            if (error || !data?.user?.email) {
                console.log(error);
                throw new Error(error?.message || "Error while signing up", {
                    cause: error,
                });
            }

            const dbUser: UserInsertSchema = {
                id: v4(),
                email: data?.user.email,
                name: name,
                provider: "local" as Providers,
                pwd: password,
                providerid: data?.user.id
            };

            const _ = await db.insert(userTable).values(dbUser as any).returning();
            return c.json("OK", 201);
        },
    )


    .post(
        "/sign-in",
        zValidator(
            "json",
            z.object({
                email: z.string(),
                password: z.string().min(6),
            }),
        ),
        async (c) => {
            const { email, password } = c.req.valid("json");

            const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });

            if (error) {
                logger.error(`Error while signing in :- ${error.message}`);
                throw new HTTPException(401, { message: error.message });
            }

            setCookie(c, "access_token", data?.session.access_token);
            setCookie(c, "refresh_token", data?.session.refresh_token);

            return c.json("Success",200);
        },
    )
    .get("/refresh", async (c) => {
        const refresh_token = getCookie(c, "refresh_token");
        if (!refresh_token) {
            throw new HTTPException(403, { message: "No refresh token" });
        }

        const { data, error } = await supabaseAuth.auth.refreshSession({
            refresh_token,
        });

        if (error) {
            console.error("Error while refreshing token", error);
            throw new HTTPException(403, { message: error.message });
        }

        if (data?.session) {
            setCookie(c, "refresh_token", data.session.refresh_token);
        }

        return c.json(data.user);
    })

.get('/user-data', async (c) => {
    try {
        const accessToken = getCookie(c, 'access_token');
        if (!accessToken) {
            throw new HTTPException(401, { message: 'No access token' });
        }

        const { data: { user }, error } = await supabaseAuth.auth.getUser(accessToken);
        if (error || !user) {
            throw new HTTPException(401, { message: 'Invalid token' });
        }

        const dbUser = (await db.select().from(userTable).where(eq(userTable.providerid, user.id))).at(0);

        if (!dbUser) {
            throw new HTTPException(404, { message: 'User not found' });
        }

        return c.json({ user: dbUser });
    } catch (error) {
        if (error instanceof HTTPException) throw error;
        logger.error('Error in user-data endpoint:', error);
        throw new HTTPException(500, { message: 'Internal server error' });
    }
});

export default authRoutes;
