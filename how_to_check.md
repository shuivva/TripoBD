# TripoBD Security Features - Website Verification Guide

This guide provides step-by-step instructions on how to test and verify all **8 implemented security features** directly in your browser, developer tools, and MySQL database on the running platform.

---

## Prerequisites: Starting the Servers

### 1. Start the Django Backend Server
Open a terminal in `d:\Projects\TripoBD\Backend`:
```powershell
# Activate Python Virtual Environment
.\venv\Scripts\activate

# Run the Django Development Server
python manage.py runserver 127.0.0.1:8000
```
Backend will be available at: `http://127.0.0.1:8000`

### 2. Start the React Frontend Server
Open a separate terminal in `d:\Projects\TripoBD\Frontend`:
```powershell
# Run the Vite Dev Server
npm run dev
```
Frontend will be available at: `http://localhost:5173`

---

## 🛡️ Feature 1 (F-01): Advanced Two-Factor Authentication (TOTP 2FA)

### How to Check on the Website:
1. **Log in to the platform**:
   - Go to `http://localhost:5173/signin`.
   - Log in with any traveler account (or create one at `http://localhost:5173/signup`).
2. **Set up 2FA via Settings**:
   - Navigate to **Account Settings** -> Click the **Security** tab (URL: `http://localhost:5173/traveler/settings`).
   - Find the **Two-Factor Authentication (2FA)** card.
   - Status will show `○ 2FA DISABLED`.
   - Click **"Setup Two-Factor (TOTP)"**.
   - A modal will open displaying a **live QR Code** and a manual Base32 secret key.
   - Open **Google Authenticator**, **Microsoft Authenticator**, or **Authy** on your phone.
   - Scan the QR code (it registers as `TripoBD:<your-email>`).
3. **Verify and Activate**:
   - Enter the 6-digit code shown on your phone app into the verification box.
   - Click **"Verify & Enable 2FA"**.
   - The card status updates to `● 2FA ENABLED` with a green shield.
4. **Test the 2-Step Login Challenge**:
   - Log out of TripoBD (click Logout in the top-right profile menu).
   - Go back to `http://localhost:5173/signin`.
   - Enter your username and password, then click **Sign In**.
   - Notice you are **NOT** logged in immediately! The interface transitions to the **2FA Challenge Screen**:
     > *"Two-Factor Authentication: Enter the 6-digit code from your authenticator app."*
   - Enter an incorrect code (e.g., `000000`) -> Observe the error message *"Invalid two-factor authentication code"*.
   - Enter the valid 6-digit code from your phone -> Instant login and redirect to the dashboard!

---

## 🍪 Feature 2 (F-02): Hardened JWT with HttpOnly Cookies & Rotation

### How to Check in Developer Tools:
1. **Check HttpOnly Cookie Storage**:
   - Log in at `http://localhost:5173/signin`.
   - Press `F12` (or Right Click -> **Inspect**) to open Developer Tools.
   - Go to the **Application** tab (in Chrome/Edge) or **Storage** tab (in Firefox).
   - Under the left sidebar, expand **Cookies** -> Click `http://localhost:5173` (or `http://127.0.0.1:8000`).
   - Notice the cookie named **`refresh_token`**:
     - **HttpOnly**: Checked / `true` (means JavaScript cannot read or steal it via XSS).
     - **SameSite**: `Lax` (protects against CSRF).
     - **Path**: `/`.
2. **Verify `localStorage` is Clean**:
   - Still in Developer Tools, click **Local Storage** under the left sidebar.
   - Check the keys: `access_token` and `refresh_token` are **NOT** stored in `localStorage`!
   - Run this in the **Console** tab:
     ```javascript
     console.log(localStorage.getItem('access_token'))
     ```
     Output: `null` (tokens are kept in secure memory, immune to client-side storage scraping).
3. **Verify Refresh Token Rotation & Transparent 401 Interceptor**:
   - Go to the **Network** tab in Developer Tools.
   - Filter by `Fetch/XHR`.
   - When the short-lived access token expires or when you reload, observe the automatic POST request to `/api/token/refresh/`.
   - The browser automatically attaches the HttpOnly cookie.
   - The response issues a new access token and rotates the refresh cookie seamlessly without logging you out.

---

## 🔒 Feature 3 (F-03): Object-Level Access Control & IDOR Prevention

### How to Check on the Website / DevTools:
1. **Test Booking IDOR Protection**:
   - Log in as Traveler A (e.g. ID `27`).
   - In Developer Tools Console (or Postman/curl), attempt to fetch or modify Traveler B's booking (e.g. Booking ID `9` or non-owned booking UUID):
     ```javascript
     fetch('http://127.0.0.1:8000/api/traveler/bookings/9/status/', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ status: 'confirmed' }),
       credentials: 'include'
     }).then(r => console.log('Status code:', r.status))
     ```
   - Output: `Status code: 403` (Forbidden! Non-owners cannot tamper with other travelers' bookings).
2. **Test Tour Room IDOR Protection**:
   - User B attempts to access User A's private Tour Room or inject activities:
     ```javascript
     fetch('http://127.0.0.1:8000/api/tourrooms/25/expenses/', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ description: 'Malicious Expense', amount: 500 }),
       credentials: 'include'
     }).then(r => console.log('Status code:', r.status))
     ```
   - Output: `Status code: 403` (Forbidden! Only authenticated room members can access room resources).
3. **Verify Scoped DRF ViewSets with UUID**:
   - Access `http://127.0.0.1:8000/api/v1/bookings/` in your browser.
   - The response only shows bookings where you are the customer or the provider. All other bookings are filtered out.

---

## ⏱️ Feature 4 (F-04): Rate Limiting & Anti-Brute-Force Protection

### How to Check on the Website / Console:
1. **Test OTP Rate Limiting (Limit: 3 requests / minute)**:
   - Run a quick burst loop in the browser console:
     ```javascript
     for (let i = 1; i <= 5; i++) {
       fetch('http://127.0.0.1:8000/api/auth/verify-otp/', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email: 'test@example.com', otp: '123456' })
       }).then(r => console.log(`Attempt ${i} -> HTTP`, r.status))
     }
     ```
   - Observe the outputs:
     - Attempts 1, 2, 3: `HTTP 400` (Bad Request - invalid OTP)
     - Attempts 4, 5: **`HTTP 429 (Too Many Requests)`**!
   - In the Network tab, inspect the 429 response headers: notice the `Retry-After: 60` header.
2. **Test Login Rate Limiting (Limit: 5 requests / minute)**:
   - Attempting rapid incorrect passwords triggers HTTP 429 after 5 attempts, preventing automated brute-force attacks.

---

## 📜 Feature 5 (F-05): Audit Logging & Historical Tracking

### How to Check in Django Admin:
1. **Access Django Admin**:
   - Go to `http://127.0.0.1:8000/admin/`.
   - Log in with your admin superuser account.
2. **Inspect Authentication Security Logs**:
   - Under the **API** section, click **Security audit logs**.
   - You will see chronological logs recording:
     - `login_success` events with user, timestamp, IP address, and user agent.
     - `login_failed` attempts showing the attempted username.
     - `2fa_enabled` and `2fa_disabled` events.
     - `logout` events.
3. **Inspect Database Modification History (HistoricalRecords)**:
   - Click on **User profiles**, **Service providers**, or **Service provider bookings**.
   - Click on any specific record.
   - Click the **History** button in the top right corner.
   - You can see a complete revision audit trail of every change, what fields were updated, who changed them, and when.

---

## 🔐 Feature 6 (F-06): End-to-End Encrypted Tour Room Messaging

### How to Check on the Website:
1. **Open a Tour Room**:
   - Go to `http://localhost:5173/traveler/room`.
   - Click on any Tour Room card (or create one using the "+ Create Tour Room" button).
   - You will be taken to the room detail view (`http://localhost:5173/traveler/room?id=<room_id>`).
2. **Navigate to the Group Chat tab**:
   - In the room navigation tabs, click **"Group Chat"**.
3. **Verify the E2EE Shield Banner**:
   - At the top of the chat panel, observe the green shield banner:
     > 🛡️ **End-to-End Encrypted Tour Chat**  
     > *Protected by Web Crypto API AES-GCM (256-bit). Server operates in Zero-Knowledge mode.*
4. **Inspect the Room Security Key Modal**:
   - In the banner, click the **"🔑 Room Security Key"** button.
   - A modal opens displaying:
     - **Room Identifier** (UUID)
     - **Room Invite Secret** (derived key material)
     - **Custom Room Passphrase** input (allows entering an optional custom shared secret)
     - Status: `● Web Cryptography API AES-GCM Active & Protected`
   - Click **Done**.
5. **Send an Encrypted Message**:
   - Type a secret message in the input box: `"Secret rendezvous point: Lake view spot at 4 PM"`.
   - Click **Send ➔**.
   - Notice the message bubble appears with a green **`🔒 E2EE`** badge next to the timestamp.
6. **Verify the Zero-Knowledge Server & Database**:
   - Open Developer Tools -> **Network** tab -> find the POST request to `/api/tourrooms/<room_id>/chat/`.
   - Inspect the Request Payload:
     ```json
     {
       "sender": 27,
       "ciphertext": "QWVy...==",
       "iv": "3KxP...==",
       "is_encrypted": true
     }
     ```
     Notice the cleartext message was **never sent across the network**! Only ciphertext and random IV!
   - Check the MySQL database directly:
     ```sql
     SELECT id, sender_id, ciphertext, iv, is_encrypted, message FROM tour_room_chat_messages ORDER BY id DESC LIMIT 1;
     ```
     The database contains **only** the encrypted Base64 string and IV. The cleartext is nowhere on the server disk or database.
   - Back in the browser, the client decrypted it locally in memory using the shared AES-GCM key derived by the Web Cryptography API.

---

## 🌐 Feature 7 (F-07): Content Security Policy (CSP) & HTTP Security Headers

### How to Check in Developer Tools:
1. **Inspect Network Response Headers**:
   - Open Developer Tools (`F12`) -> **Network** tab.
   - Click on any API request or navigate to any page (e.g. click on a request to `/api/token/` or `/api/tourrooms/`).
   - Click on the request and select the **Headers** tab.
   - Scroll down to the **Response Headers** section.
2. **Verify All Hardened Security Headers**:
   - **`Content-Security-Policy`**:
     ```text
     default-src 'self';
     script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com;
     style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
     img-src 'self' data: blob: https://res.cloudinary.com https://*.tile.openstreetmap.org http://localhost:8000 http://127.0.0.1:8000;
     font-src 'self' https://fonts.gstatic.com data:;
     connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 http://localhost:5173 http://127.0.0.1:5173 https://maps.googleapis.com;
     frame-ancestors 'none'
     ```
   - **`X-Frame-Options`**: `DENY` (Prevents malicious sites from embedding TripoBD in an `<iframe>` for Clickjacking attacks).
   - **`X-Content-Type-Options`**: `nosniff` (Prevents browsers from MIME-sniffing away from declared content-type).
3. **Verify Clickjacking Protection in Action**:
   - If any external website creates `<iframe src="http://127.0.0.1:8000"></iframe>`, modern browsers automatically refuse to display the frame and log:
     > *"Refused to display in a frame because it set 'X-Frame-Options' to 'DENY'."*

---

## 🗄️ Feature 9 (F-09): Field-Level Encryption for Personally Identifiable Information (PII)

### How to Check on the Website & Database:

1. **Update Sensitive PII via the Website**:
   - Log in at `http://localhost:5173/signin`.
   - Go to your profile page: `http://localhost:5173/traveler/profile`.
   - Notice your phone number (e.g., `01711223344`) and national ID are displayed normally and cleanly.
   - Click **Edit Profile** or update your phone number in Settings.
   - Save the changes. The frontend seamlessly displays the updated plaintext.

2. **Inspect the MySQL Database Directly (Proof of Encryption at Rest)**:
   - Open MySQL Workbench, phpMyAdmin, or your terminal MySQL client:
     ```powershell
     mysql -u root -p tripo_db
     ```
   - Run a query to inspect the raw stored values:
     ```sql
     SELECT id, full_name, phone_number, national_id FROM user_profiles ORDER BY id DESC LIMIT 3;
     ```
   - **Observe the Database Output**:
     ```text
     +----+---------------+------------------------------------------------------+------------------------------------------------------+
     | id | full_name     | phone_number                                         | national_id                                          |
     +----+---------------+------------------------------------------------------+------------------------------------------------------+
     | 27 | PII Traveler  | gAAAAABqvmMOaUgFHzvx__duQH4jboGuF6992...             | gAAAAABqvmMOT7gOWl8RMMQbY_G026tUsTE62...             |
     +----+---------------+------------------------------------------------------+------------------------------------------------------+
     ```
   - Notice:
     - The database columns contain **strictly encrypted Fernet tokens** starting with `gAAAAA...`.
     - Your real phone number and national ID are **NEVER readable in raw SQL dumps or database backups**.
     - An attacker stealing the SQL database backup cannot read any user's identity or contact information without the server's `FIELD_ENCRYPTION_KEY`.

3. **Check Service Provider Banking Details Encryption**:
   - Run:
     ```sql
     SELECT id, user_id, bank_account_details FROM service_providers ORDER BY id DESC LIMIT 2;
     ```
   - Observe that `bank_account_details` is also stored as an encrypted Fernet ciphertext token (`gAAAAA...`).

4. **Verify Transparent Decryption in Django Admin & API**:
   - Go to `http://127.0.0.1:8000/admin/api/userprofile/`.
   - Open any user profile: Django transparently decrypts and displays the readable phone number and national ID to authenticated administrators.
   - Save an update from Django admin: it automatically re-encrypts the new value into the MySQL database.

---

## ⚡ Automated Verification Scripts (Quick Check)

To verify all 8 features programmatically in seconds, run the automated test scripts from `d:\Projects\TripoBD\Backend`:

```powershell
.\venv\Scripts\activate

# 1. Feature 9 (Field-Level PII Encryption in MySQL)
python .\scratch\test_security_f9.py

# 2. Feature 6 (E2EE Chat) & Feature 7 (CSP / Security Headers)
python .\scratch\test_security_f6_f7.py

# 3. Feature 1 (2FA TOTP) & Feature 2 (Hardened JWT & Cookies)
python .\scratch\test_security_f1_f2.py

# 4. Feature 3 (IDOR Prevention & Object Access)
python .\scratch\test_security_f3.py

# 5. Feature 4 (Rate Limiting) & Feature 5 (Audit Logging)
python .\scratch\test_security_f4_f5.py
```
*(All test suites exit with code 0 and 100% pass rates).*
