# FINAL LAUNCH CHECKLIST

1. **Neon database** created, and the *Set up database* workflow run (or `database/all.sql` pasted into Neon). Run it again after every update that adds a `database/` file: it is safe to repeat.
2. **Netlify settings** (Site configuration, Environment variables), then *Deploys, Trigger deploy*:

| Name | Value |
|---|---|
| `DATABASE_URL`, `PGSSL` | Neon connection string, `true` |
| `JWT_SECRET`, `MPESA_CALLBACK_SECRET` | two long random strings |
| `PUBLIC_SITE_URL`, `PUBLIC_API_URL`, `CORS_ORIGINS` | your live site address |
| `SMS_PROVIDER` | `africastalking` |
| `AT_USERNAME`, `AT_API_KEY` | from Africa's Talking |
| `AT_SENDER_ID` | `KNUMLO` (this is also the built-in default) |
| `PAYBILL_NUMBER` | **add when you have it.** Dues notices and reminders stay paused until this is set |
| `DARAJA_*` | when your Safaricom Paybill is approved. Until then M-Pesa runs in practice mode |

3. **`site/config.js`**: paste the official phone, email, Paybill, bank details and social links, then commit.
4. **Officials portal** (`/admin`): sign in, import the members' CSV, then open **Bulk SMS, Automatic messages** and send the registration-received and membership-number messages. Review each message's wording first.
5. **Test once** with your own phone: register, approve, pay, and check that each SMS arrives.

---

## Automatic messages (all sent under your Sender ID)

| When | Who gets it | Message |
|---|---|---|
| Someone registers | The applicant | Registration received, with a reference |
| An official approves a member (single or bulk) | The member | Congratulations, membership number, how to set a password |
| An official rejects an application | The applicant | Could not verify, please contact the secretariat |
| A password is set or changed | The member | Security alert |
| Any payment completes (M-Pesa prompt, Paybill, cash, bank) | The member | Amount, receipt number, outstanding dues |
| 1st of every month, 08:00 Nairobi time | Active members with dues outstanding | Monthly dues notice with Paybill and account number |
| 10th and 20th (change with `REMINDER_DAYS`) | Members still owing | Reminder with Paybill and account number |

How it works: each message is placed in a queue and sent within seconds. A background job runs every 5 minutes to send anything left over and retries failures up to three times. The same message is never sent twice to the same member for the same event. Members with no phone number, or marked as opted out, are skipped. Officials can change the wording or switch any message off in **Bulk SMS, Automatic messages**.

**The imported members:** after importing the CSV, press *Tell pending members their registration was received*. When you approve them, each one automatically gets their membership number by SMS. For anyone already approved, press *Send membership numbers to approved members*. Each button shows how many people will be messaged and asks you to confirm first.

---

# KNUMLO: quick start (about 15 minutes, no coding)

This one project contains the website, the officials portal, the API and the database setup. Three free accounts make it run: GitHub, Neon (database) and Netlify (hosting).

1. **Database.** Create a free project at neon.tech and copy its connection string (starts with `postgresql://`).
2. **GitHub.** Create a private repository and upload everything in this folder (extract the ZIP first, then drag the files and folders in). In the repository open *Settings, Secrets and variables, Actions* and add four secrets: `DATABASE_URL` (from step 1), `ADMIN_EMAIL`, `ADMIN_PASSWORD` (10+ characters) and `ADMIN_NAME`. Then open the *Actions* tab, choose *Set up database* and click *Run workflow*. This creates every table and your administrator login automatically.
3. **Netlify.** Choose *Add new site, Import an existing project*, pick the repository, and deploy. Then add the settings from the table in section 3 below (database address, secret keys, Paybill number) and redeploy.

Your site is then live, and officials sign in at `/admin` with the email and password from step 2.

If the hidden `.github` folder does not upload, create the file `.github/workflows/setup-database.yml` through *Add file, Create new file* and paste in its contents from the ZIP. Or skip it and paste `database/all.sql` into Neon's SQL Editor instead.

---

## Your organisation's details (phone, email, Paybill, social links)

Open `site/config.js` (on GitHub: click the file, then the pencil icon), replace the example values with the real official phone number, email address, Paybill number, office address and social media links, then choose *Commit changes*. Netlify republishes the site automatically. The details appear in the Contact section, the Paybill button and instructions, and the footer icons. Leave a social link empty to hide its icon.

The Paybill number members see comes from this file. The Safaricom connection itself uses `DARAJA_SHORTCODE` in Netlify's environment settings (set both to the same Paybill when you go live with M-Pesa).

---

# KNUMLO on Netlify

One project holds the website (`site/`), the API (`server.js`, run as a Netlify Function), and the database scripts (`database/`). Netlify does not provide a database, so the data lives in a free hosted PostgreSQL (Neon is used below; Supabase also works).

## Bulk SMS and your Sender ID

Officials with the *super admin* or *secretary* role open **Bulk SMS** in the portal (`/admin`). They choose the Sender ID, pick who receives it (approved members, pending applicants or everyone, optionally by sector or county), write the message, count the recipients, send a test to one phone, then send. A progress bar shows delivery, and every campaign is kept with its sent and failed counts and the reason for each failure. Members without a valid phone number, or marked as opted out, are skipped automatically. Messages are sent through Africa's Talking.

**To set it up (no code changes, only Netlify settings)**
1. Create an account at Africa's Talking, make an API key, and top up your SMS credit.
2. Ask them to register your **Sender ID** (for example `KNUMLO`). Sender IDs must be approved before they work, and approval is handled by your SMS provider and the mobile networks.
3. In Netlify open *Site configuration, Environment variables* and set:

| Name | Value |
|---|---|
| `SMS_PROVIDER` | `africastalking` |
| `AT_USERNAME` | your Africa's Talking username |
| `AT_API_KEY` | your API key |
| `AT_SENDER_ID` | your approved Sender ID, e.g. `KNUMLO` |
| `SMS_SENDER_IDS` | optional: extra approved Sender IDs separated by commas |
| `AT_ENV` | `production` (use `sandbox` for testing) |

4. In Netlify open *Deploys, Trigger deploy, Deploy site*. Changes to settings take effect after a new deploy.

To change the Sender ID or credentials later, edit these settings and redeploy. No code is touched. Until step 3 is done the portal shows **Simulation mode** and nothing is delivered.

If your database was created before this feature, run the *Set up database* workflow again (or paste `database/07_sms.sql` into Neon's SQL editor).

Tips: keep messages under 160 characters to use one SMS part, include how to opt out, and send a test first. The portal does not yet have a screen to mark a member as opted out; the database column `sms_opt_out` exists for that.

---

## 1. Create the database

1. Create a free account and project at Neon (neon.tech). Copy the **connection string** (it starts with `postgresql://`).
2. Open Neon's SQL Editor, paste the whole of `database/all.sql` and run it. (Or from a computer with psql: `psql "<connection string>" -f database/all.sql`.)
3. Create the first official in the SQL Editor (change the name, email and password):
   ```sql
   INSERT INTO staff_users (full_name, email, password_hash, role)
   VALUES ('Your Name', 'you@knumlo.or.ke', crypt('A-long-password-here', gen_salt('bf', 12)), 'super_admin');
   ```
   Roles: `super_admin`, `secretary` (approves members), `treasurer` (payments), `branch_officer`, `viewer`.

Do **not** run `04_demo_data.sql` on the real database.

## 2. Put the project on Netlify

Use one of these. (Dragging a folder onto Netlify Drop may publish only the website and skip the API, so use Git or the CLI.)

- **Git (recommended):** upload this folder to a private GitHub repository. In Netlify choose *Add new site, Import an existing project*, pick the repository. The settings are read from `netlify.toml`, so just deploy.
- **CLI:** install Node, then `npm i -g netlify-cli`, `netlify login`, `netlify init`, and `netlify deploy --prod`.

## 3. Add the settings

In Netlify: *Site configuration, Environment variables*. Add these, then **redeploy**.

| Name | Value |
|---|---|
| `DATABASE_URL` | the Neon connection string |
| `PGSSL` | `true` |
| `JWT_SECRET` | a long random string |
| `MPESA_CALLBACK_SECRET` | another long random string |
| `PAYBILL_NUMBER` | your Paybill number |
| `PUBLIC_SITE_URL` | your site address, e.g. `https://knumlo.netlify.app` |
| `PUBLIC_API_URL` | the same address |
| `CORS_ORIGINS` | the same address |
| `SMS_PROVIDER` | `log` until Africa's Talking is set up, then `africastalking` with `AT_USERNAME`, `AT_API_KEY`, `AT_SENDER_ID` |
| `DARAJA_ENV`, `DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`, `DARAJA_SHORTCODE`, `DARAJA_PASSKEY` | leave empty for now (M-Pesa runs in mock mode) |

## 4. Check it

- Open `https://your-site/api/health`. You should see `{"ok":true}`.
- On the site, click **Member**, choose *KNUMLO official* and log in with the account from step 1.

## 5. Officials portal (your backend landing page)

Open `https://your-site/admin`. It is not linked from the public site and search engines are told to ignore it.

Sign in with the official's email and **admin verification password**. These are the account details created in the database (step 1 above); the password is stored scrambled, never as plain text. To add more officials, insert more rows into `staff_users` with the SQL from step 1, choosing a role for each.

| Role | Can do |
|---|---|
| `super_admin` | Everything, including the audit log |
| `secretary` | Members, approvals, import, member downloads, payments view |
| `treasurer` | Members (view), payments, matching Paybill payments, payment downloads |
| `branch_officer` | View members |
| `viewer` | Progress charts and totals only (no personal details) |

Pages: **Progress** (registered, approved, pending, collection, charts by day, sector and county, data quality), **Members** (search, filter, approve or reject), **Payments**, **Downloads** (CSV files that open in Excel; every download is logged), and **Import data**.

To make the members you already collected visible: sign in, open **Import data**, upload the Google Form responses as CSV. They appear under **Members** as pending, ready for approval.

## 6. Real M-Pesa

1. Get your Daraja credentials and fill the `DARAJA_*` settings, then redeploy.
2. Register the Paybill confirmation address once, from your computer: put the same settings in a local `.env` file and run `node scripts/register-c2b-urls.js`.
3. Safaricom's live approval for a production Paybill is arranged with them and can take time.

## 7. Loading the existing members (command line alternative)

Run `python3 database/import_registrations.py registrations.csv`, review `import_report.csv`, then run the generated `import_members.sql` in Neon. See `database/README.md` for the full process.

## Good to know

- Passwords are never stored in plain text. Members set theirs from an SMS link sent after approval. Until real SMS is set up, those links only appear in Netlify's function logs.
- A scheduled function creates each month's dues invoices daily (it only adds missing ones).
- Netlify functions have a short time limit and free-plan usage limits. This suits a union of this size, but watch usage as it grows.
- Login attempt limits are kept per running function instance, so they are weaker than on a dedicated server. Accounts also lock after repeated wrong passwords.
- Turn on Neon's automatic backups and keep the connection string secret.
