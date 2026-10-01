# Public deployment

The Node server serves the built React website and `/api` on the same domain.
`npm run build` builds the frontend; `npm start` starts the server. Leave
`VITE_API_BASE_URL` unset for this arrangement. Existing `/src/pictures/` image
and video URLs remain supported. Other source files and PDFs are not served.

## Render setup

1. Create a GitHub account and a **private** repository for the project.
   Upload source files, package.json, package-lock.json, render.yaml and build
   configuration. Exclude `.env`, `node_modules`, `dist`, `server/data`, source
   ZIP archives and private documents. Some generated files are already tracked
   locally: `.gitignore` alone does not remove tracked files. Review the upload
   before publishing. Do not upload your existing local Git history blindly.
2. Create a Render account at https://dashboard.render.com/ and connect GitHub.
3. Select **New > Blueprint**, choose the private repository and use render.yaml.
   The blueprint uses a free instance for preview. Review the plan before deploying.
4. Enter the requested environment variables in Render, never in frontend source:
   - `SUPABASE_URL`: the existing Supabase project URL.
   - `SUPABASE_SECRET_KEY`: the server secret (or use `SUPABASE_SERVICE_ROLE_KEY`
     instead). Never put this value in any variable starting with `VITE_`.
   - `VITE_SUPABASE_URL`: the same project URL.
   - `VITE_SUPABASE_ANON_KEY`: the public anon key used for realtime updates.
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD`: initial admin credentials. Choose a
     unique password. Existing Supabase admin accounts are not reset by these.
5. Confirm the existing Supabase project has the schema required by
   `server/supabase-schema.sql` and the inventory migration. Back up existing
   data before applying SQL; do not blindly rerun setup against a live database.
   Local JSON records are not automatically migrated to Supabase.
6. Deploy. Render assigns an HTTPS `onrender.com` address; the exact name depends
   on availability. This preparation has not reserved a name or published a site.
7. Check `/api/health`, refresh `/about`, inspect venue photos, then verify admin
   login, a test booking, payment proof upload and data persistence. Use a test
   email address for email validation.

## Email and hosting limitations

Render free web services sleep after inactivity and block SMTP ports used by
the current Gmail email sender. They are suitable for preview, not the complete
live booking operation. To retain Gmail SMTP, select a paid instance and set
`SMTP_USER` and `SMTP_PASS` (a Gmail app password) in Render. Alternatively,
implement an HTTPS email provider before using the free instance for emails.
Email delivery has not been verified by the local build.

Production refuses to start without Supabase or with the known default admin
password, avoiding temporary local-file storage and default initial credentials.
This is deployment preparation, not a complete security audit.

Official guides:
- https://render.com/docs/deploy-node-express-app
- https://render.com/docs/free
- https://render.com/docs/blueprint-spec

A purchased custom domain can be connected later; it is not needed for the
initial public URL.
