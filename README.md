# instgram-automation

No demo accounts, simulated payments or sample data are used. All flows are real.

## Signup → dashboard flow

1. User signs up normally (email/password) or with Google.
2. The dashboard opens immediately.
3. A **"Connect Instagram now"** card is shown at the top and every sidebar tab is locked.
4. After the real Meta OAuth connection finishes, the tabs unlock automatically.

## 1. Instagram API keys (required)

This app uses the **Instagram API** use case
("Manage messaging & content on Instagram"), i.e. **Instagram Login**, not
Facebook Login. Steps:

1. <https://developers.facebook.com/apps/> → **Create App** → **Use cases →
   Add use cases → Business messaging → Manage messaging & content on Instagram**.
2. Open the **Instagram** app (it has its own App ID) → **Settings → Basic** →
   copy **Instagram app ID** and **Instagram app secret** into `backend/config.php`.
3. In the app setup screen, under **Set up Instagram business login**, add the
   redirect URI (it must be HTTPS):
   ```
   https://YOUR_PUBLIC_BACKEND/auth/ig-callback
   ```
4. Under **Add required messaging permissions**, add:
   `instagram_business_basic`, `instagram_business_manage_messages`,
   `instagram_business_manage_comments`.
5. In the app's **Roles / Instagram Testers** tab, add the Instagram account
   you will connect so it can log in while the app is in Development mode.
6. Keep the app **unpublished** for testing. (Webhooks and live data require
   app review and a published app — they are not needed to link the account.)

Paste the values into `backend/config.php` (gitignored) or set env vars:

```php
'meta_app_id'        => 'YOUR_INSTAGRAM_APP_ID',
'meta_app_secret'    => 'YOUR_INSTAGRAM_APP_SECRET',
'meta_graph_version' => 'v19.0',
'meta_redirect_uri'  => 'https://YOUR_PUBLIC_BACKEND/auth/ig-callback',
'meta_scopes'        => 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments',
'app_origin'         => 'http://localhost:5173',
```

`app_origin` is the frontend URL Meta returns the user to (comma-separated for
multiple origins). Env equivalents: `META_APP_ID`, `META_APP_SECRET`,
`META_REDIRECT_URI`, `META_SCOPES`, `APP_ORIGIN`.

## 2. Google sign-in keys

Existing keys are in `backend/config.php`:

```php
'google_client_id'     => '...apps.googleusercontent.com',
'google_client_secret' => '...',
'google_redirect_uri'  => 'http://localhost:8000/auth/callback',
```

To get your own: <https://console.cloud.google.com/apis/credentials> →
**Create Credentials → OAuth client ID → Web application**, then add
`http://localhost:8000/auth/callback` as an **Authorized redirect URI**.

## 3. Razorpay keys (required for plan upgrades)

1. Sign up / log in at <https://dashboard.razorpay.com>.
2. Go to **Settings → API Keys** → **Generate Key** (test or live).
3. Copy the **Key ID** (`rzp_test_…` / `rzp_live_…`) and **Key Secret**.
4. Log in as admin → **Admin → Settings**, paste both and save.
   (Secrets are stored server-side; only the key id is sent to the browser.)

Orders are created on Razorpay by `/api/payments/create-order`, and
`/api/payments/verify` checks the `HMAC-SHA256(order_id|payment_id, secret)`
signature before upgrading a plan. No simulated payments exist.

## 4. Admin account

No seeded users. To create the first admin, run the seeder with credentials:

```powershell
$env:ADMIN_EMAIL = "you@example.com"
$env:ADMIN_PASSWORD = "a-strong-password"
$env:ADMIN_NAME = "Admin"
php backend/database/seed.php
```

The seeder only inserts plans, blog posts and (optionally) that admin account.

## Endpoints added for the dashboard

- `GET /auth/instagram` → Meta OAuth URL
- `GET /auth/ig-callback` → token exchange + one-time link token
- `POST /api/instagram/link` → links found accounts to the logged-in user
- `POST /api/instagram/select` → choose the active linked account
- `GET /api/notifications` → real notifications from the user's data
- `POST /api/account/delete` → self-service account deletion

## Validation

- `php -l` on all backend PHP files
- `npm run build` in `frontend/`
