# Rookie Vault 2 Starter

A clean, free-to-host PWA foundation for a private family sports-card collection.

## What is included

- Supabase email/password authentication
- No shared password or PIN stored in GitHub
- Row Level Security-ready database
- Card entry, search, totals, values, trade status and soft delete
- Installable PWA shell
- Mobile-first layout
- GitHub Pages-compatible file structure

## 1. Create a new Supabase project

Use a new project rather than reusing the project whose credentials were exposed.

In the Supabase SQL Editor, run:

`supabase/schema.sql`

## 2. Create the browser configuration

Copy:

`js/config.example.js`

to:

`js/config.js`

Then add your Supabase project URL and public anonymous key.

The anonymous key is intended for browser use when Row Level Security is enabled.

Never put these items in the repository:

- A Supabase account password
- A service-role key
- A private AI API key
- A shared PIN intended to provide real security

## 3. Create your first account

Open the deployed app and choose **Create account**. If email confirmation is enabled in Supabase, confirm the email before signing in.

The database trigger automatically creates that account's first collection, and the app loads it after login.

## 4. GitHub Pages

Push these files to the new repository.

In GitHub:

1. Open **Settings**
2. Open **Pages**
3. Choose **Deploy from a branch**
4. Select `main` and `/root`
5. Save

## Planned next build steps

1. Load the signed-in user's collection
2. Add secure front/back photo storage
3. Add edit screen and trash/restore
4. Add CSV and JSON backup
5. Add shared family membership
6. Add trade calculator
7. Add optional card lookup links
