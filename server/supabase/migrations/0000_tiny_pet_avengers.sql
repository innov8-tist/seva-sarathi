CREATE TYPE "public"."provider" AS ENUM('google', 'local');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"pwd" text,
	"provider" "provider" NOT NULL,
	"access_token" text,
	"refresh_token" json,
	"p_id" text NOT NULL,
	"email" text,
	"pfp" text
);
