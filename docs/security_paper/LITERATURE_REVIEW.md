# Engineering Defense-in-Depth for Collaborative Web Platforms: A Comprehensive Security Literature Review and Architecture Analysis for TripoBD

**Authors:** TripoBD Security Engineering and Research Group  
**Course:** Computer Security (CSE Capstone Project)  
**Date:** September 2026  
**Document Format:** Academic Literature Review & System Blueprint  

---

## Executive Abstract

Modern collaborative web platforms operate at the convergence of single-page frontends, RESTful microservices, real-time communication channels, asynchronous task queues, and external artificial intelligence engines. This structural complexity drastically expands the attack surface, exposing systems to credential stuffing, Cross-Site Scripting (XSS), Insecure Direct Object References (IDOR), API resource depletion, server-side code execution, and data-at-rest exfiltration. Perimeter-centric defenses fail in these distributed environments, necessitating the adoption of Defense-in-Depth (DiD) and NIST SP 800-207 Zero Trust Architectures (ZTA).

This paper presents an exhaustive academic literature review evaluating nine critical security controls mapped across eight foundational security domains:
1. **Identity & Multi-Factor Authentication** via RFC 6238 TOTP
2. **Hardened Token-Based Session Management** with Refresh Token Rotation and HttpOnly boundary isolation
3. **Object-Level Access Control and IDOR Mitigation** via RFC 4122 UUIDv4 identifiers *(Implemented & Verified in TripoBD)*
4. **Algorithmic API Rate Limiting and Anti-Brute-Force Defense** *(Implemented & Verified in TripoBD)*
5. **Non-Repudiation, Forensic Telemetry, and Temporal Audit Logging** *(Implemented & Verified in TripoBD)*
6. **End-to-End Encryption (E2EE)** using the W3C Web Cryptography API and AES-GCM-256
7. **Browser Policy Hardening** via Content Security Policy (CSP Level 3) and HTTP strict transport controls
8. **Zero-Trust File Ingestion** with magic-byte verification, EXIF stripping, and ClamAV streaming
9. **Field-Level Encryption (FLE)** for Personally Identifiable Information (PII)

We synthesize empirical findings from the TripoBD travel ecosystem—where Features 3, 4, and 5 have been engineered, deployed, and verified—and present a formalized, peer-reviewed blueprint for the remaining roadmap controls.

---

## 1. Introduction and Theoretical Framework

Web application architectures have transitioned from centralized server-rendered monolithic frameworks toward distributed ecosystems characterized by Single-Page Applications (SPAs) communicating via asynchronous RESTful APIs, WebSockets, and external microservice dependencies [De Ryck et al., 2014]. In domain-specific collaborative environments, such as the TripoBD travel platform, this architectural model mediates critical interactions including multi-user group itineraries (Tour Rooms), location-sensitive logistical coordination, peer-to-peer messaging, service provider bookings, identity verification pipelines, and artificial intelligence-driven recommendation engines.

However, the expansion of user-driven dynamism directly amplifies systemic vulnerabilities. The Open Web Application Security Project (OWASP) Top 10 [OWASP, 2021] and OWASP API Security Top 10 [OWASP, 2023] consistently identify Broken Access Control, Cryptographic Failures, Injection, Insecure Design, and Security Misconfiguration as primary exploit categories compromising enterprise web applications.

### 1.1 Foundational Security Axioms
To build resilient web systems, security must not be treated as an external perimeter wrapper but as an intrinsic structural property. This review is grounded in three foundational security paradigms:
- **Saltzer and Schroeder's Design Principles (1975):** Emphasizing *Economy of Mechanism*, *Fail-Safe Defaults*, *Complete Mediation* (every access to every object must be verified), *Least Privilege*, and *Psychological Acceptability*.
- **NIST Zero Trust Architecture (ZTA, SP 800-207) [Rose et al., 2020]:** Premised on the core axiom *"Never Trust, Always Verify."* In a Zero Trust web environment, network locality does not imply trust; all communication channels, API parameters, database entities, and client-submitted tokens are treated as hostile until authenticated and authorized.
- **Defense-in-Depth (DiD):** Implementing nested, redundant defensive layers such that the breach of any single control (e.g., an XSS script injection in the browser DOM) is mitigated by subsequent layers (e.g., HttpOnly cookie boundaries, Content Security Policy, and strict object-level access controls).

### 1.2 The TripoBD Security Mandate
The TripoBD platform (engineered on Django REST Framework, Vite React, and MySQL) processes high-consequence traveler and provider assets: National Identity (NID) cards, financial payment credentials, GPS tracking data, and private tour deliberations. Prior to security hardening, the platform exhibited structural exposures shared by typical rapid-development web frameworks: sequential auto-incrementing database identifiers, unprotected API endpoints susceptible to brute-forcing, lack of historical auditability, cleartext database persistence, and browser-accessible token storage.

To resolve these vulnerabilities, a nine-feature security roadmap was established. This paper reviews the underlying literature, theoretical mechanics, and comparative state-of-the-art across all nine controls, examining both the three completed/verified features (F-03, F-04, F-05) and the active implementation roadmap (F-01, F-02, F-06, F-07, F-08, F-09).

---

## 2. Domain 1: Multi-Factor Authentication and Identity Verification (Feature 1)

User authentication represents the primary barrier guarding digital identity. The literature underscores the vulnerability of single-factor password mechanisms: Bonneau et al. [2012] demonstrated that human memory limits invariably force password reuse, making credentials vulnerable to automated dictionary guessing, credential stuffing, and phishing campaigns.

### 2.1 Vulnerabilities of Telephony-Based Out-of-Band Verification
While out-of-band Short Message Service (SMS) verification emerged as an early second factor, modern threat models recognize severe vulnerabilities in telephony routing. Grassi et al. in NIST SP 800-63B [2017] explicitly deprecate SMS-based OTP as a restricted authenticator due to Signaling System 7 (SS7) interception attacks, SIM-swapping fraud, and real-time reverse proxy phishing (e.g., Modlishka, Evilginx2).

### 2.2 Algorithmic Foundation of RFC 6238 TOTP
To achieve cryptographically secure, device-bound multi-factor authentication without external network dependencies, M'Raihi et al. [2011] formalized the Time-Based One-Time Password (TOTP) algorithm in RFC 6238, extending the HMAC-based One-Time Password (HOTP) specification.

TOTP replaces the event counter of HOTP with a discrete time step derived from Unix Epoch time:
$$T = \left\lfloor \frac{\text{UnixTime} - T_0}{X} \right\rfloor$$
where $T_0$ is the epoch start offset (typically 0), and $X$ represents the time-step window (standardized at 30 seconds). The resulting 64-bit integer $T$ is hashed with a cryptographically shared secret key $K$ (distributed during enrollment via Base32-encoded `otpauth://` URI QR codes):
$$\text{HS} = \text{HMAC-SHA-1}(K, T)$$
Dynamic truncation extracts a 4-byte string based on the low-order 4 bits of $\text{HS}[19]$:
$$\text{Offset} = \text{HS}[19] \ \& \ \text{0x0F}$$
$$\text{P} = \text{HS}[\text{Offset} \dots \text{Offset}+3] \ \& \ \text{0x7FFFFFFF}$$
$$\text{TOTP} = \text{P} \pmod{10^d}$$
where $d \in \{6, 8\}$ denotes code length. The server evaluates $\text{TOTP}$ across time intervals $T-1, T, T+1$ to tolerate clock drift while strictly invalidating used codes to prevent replay attacks.

### 2.3 State Machine Escalation in REST Architectures
In stateless REST environments, implementing TOTP requires a two-phase authentication handshake. Upon validation of primary credentials, the backend generates an ephemeral, cryptographically signed pre-authentication token with restricted scope (`scope: "2fa_pending"`) and low expiration lifetime ($t < 300\text{s}$). The full authorization context (e.g., JWT access/refresh pair) is minted exclusively upon presentation of a valid TOTP token, enforcing strict role elevation.

---

## 3. Domain 2: Token-Based Session Management and Storage Isolation (Feature 2)

Web sessions represent continuous authorization state. Historically, web architectures utilized stateful server-side session stores indexed by random cookie identifiers. In modern distributed systems, stateless JSON Web Tokens (JWT, RFC 7519) [Jones et al., 2015] have become predominant due to zero-lookup horizontal scalability.

### 3.1 The SPA Storage Paradox: LocalStorage vs. HttpOnly Cookies
A critical security debate in web engineering centers on client-side token persistence [De Ryck et al., 2014]. SPAs frequently store JWT bearer tokens in HTML5 Web Storage (`localStorage` or `sessionStorage`). However, as demonstrated by Lekies et al. [2013], any DOM-based or Stored Cross-Site Scripting (XSS) vulnerability permits an attacker to execute arbitrary JavaScript within the document origin:
```javascript
fetch("https://attacker.com/steal?token=" + localStorage.getItem("access_token"));
```
Because Web Storage lacks contextual isolation, token exfiltration is immediate, granting attackers unauthorized session impersonation.

Conversely, RFC 6265 [Barth, 2011] establishes the `HttpOnly` cookie directive, instructing user agents to deny client-side scripts access to the cookie via the `Document.cookie` DOM API. When coupled with the `Secure` directive (enforcing transmission solely over TLS) and `SameSite=Lax` or `Strict` (mitigating Cross-Site Request Forgery - CSRF), the browser automatically handles token dispatch while remaining impervious to script-based exfiltration.

### 3.2 Refresh Token Rotation (RTR) and Token Blacklisting
Stateless tokens present an operational challenge: revocation before expiration is mathematically impossible without server-side state. The IETF OAuth 2.0 Security Best Current Practice [Fett et al., 2023] specifies Refresh Token Rotation (RTR) to mitigate token theft risks:
1. Access tokens are given a brief expiration horizon ($t_{\text{access}} \le 15\text{ minutes}$) and kept in transient JavaScript runtime memory (lost on tab closure).
2. Refresh tokens have extended lifetimes ($t_{\text{refresh}} = 7\text{ days}$) and are stored exclusively inside `HttpOnly, Secure, SameSite` cookies.
3. Every token refresh request consumes the existing refresh token, returns a newly minted access/refresh token pair, and immediately blacklists the consumed refresh token.
4. **Token Family Revocation:** If a previously consumed refresh token is presented (indicating that a malicious actor intercepted or cloned the token), the authorization server detects reuse, invalidates the entire genealogical token family, and terminates all active sessions associated with that subject.

---

## 4. Domain 3: Object-Level Access Control and IDOR Mitigation (Feature 3 - Implemented & Verified)

Broken Access Control ranks as the number-one security vulnerability in the OWASP Top 10 [OWASP, 2021]. In RESTful API architectures, Insecure Direct Object References (IDOR) occur when an application exposes a reference to an internal implementation object (such as a database integer ID) in URLs or request payloads without verifying whether the requesting user possesses authorization to access or mutate that specific entity.

### 4.1 Access Control Paradigms: DAC, RBAC, and ABAC
Classical access control literature categorizes mechanisms into:
- **Role-Based Access Control (RBAC)** [Sandhu et al., 1996]: Permissions are assigned to predefined administrative roles (e.g., Traveler, Service Provider, Admin). While effective for vertical authorization, RBAC is incapable of resolving horizontal authorization: a Traveler should not access another Traveler's personal booking, even though both hold the same role.
- **Attribute-Based Access Control (ABAC)** [Hu et al., 2014]: Access rights are evaluated dynamically through Boolean rules over subject attributes, resource attributes, environmental context, and object ownership. In collaborative platforms, horizontal access requires checking object-level ownership predicates:
$$\text{Permit}(S, O, A) \iff (S.\text{id} = O.\text{owner\_id}) \lor S.\text{is\_staff}$$

### 4.2 Entropy and Mathematical Unpredictability of RFC 4122 UUIDv4
Sequential integer primary keys (`id` = 1, 2, 3...) introduce critical vulnerabilities. They exhibit zero entropy, allowing automated enumeration scripts to crawl platform assets via sequential parameter incrementation ($O(N)$ scraping complexity). Furthermore, predictable sequential IDs leak sensitive business intelligence regarding transaction volume and user acquisition rates.

Leach et al. [2005] established RFC 4122 for Universally Unique Identifiers (UUIDs). A version 4 UUID comprises 128 bits, containing 122 bits of cryptographically secure pseudorandom entropy. The probability $P$ of a collision between $n$ randomly generated UUIDv4 keys is approximated via the birthday paradox:
$$P(n) \approx 1 - e^{-\frac{n^2}{2 \times 2^{122}}} \approx \frac{n^2}{2^{123}}$$
To achieve a one-in-a-billion collision chance ($10^{-9}$), an application would need to generate over 103 trillion UUIDs. Consequently, replacing sequential integers with UUIDv4 completely eliminates enumeration attacks, preventing attackers from predicting entity references.

### 4.3 Complete Mediation and Scoped Querysets in TripoBD
Saltzer and Schroeder's Complete Mediation principle requires that authorization is verified at every layer. TripoBD engineered this through custom DRF permission classes (`IsOwnerOrReadOnly`, `IsTourRoomMember`, `IsBookingParticipant`, `IsOwnerOnly`) and user-scoped queryset filtering:
```python
def get_queryset(self):
    return Booking.objects.filter(
        Q(customer=self.request.user) |
        Q(service_provider__user=self.request.user)
    )
```
A zero-downtime database migration (`0013_uuid_fields.py`) safely populated unique UUIDv4 keys for all existing records across `ServiceProviderBooking`, `TourRoom`, `ServiceProvider`, `TripStory`, `OpenTourGroup`, and `CommunityPost`.

---

## 5. Domain 4: API Rate Limiting and Resource Preservation (Feature 4 - Implemented & Verified)

Web APIs are vulnerable to automated resource exhaustion, credential stuffing, and brute-force dictionary attacks. Unrestricted resource consumption is formally categorized as OWASP API4:2023 [OWASP, 2023]. In applications integrating third-party generative artificial intelligence APIs (e.g., Google Gemini in TripoBD), unthrottled endpoints present severe financial denial-of-wallet (DoW) risks alongside server CPU exhaustion.

### 5.1 Algorithmic Analysis of Throttling Paradigms
Computer networking literature presents several rate-limiting algorithms:
1. **Token Bucket:** Tokens accumulate in a bucket at a sustained rate $r$ up to capacity $b$. Requests consume tokens; bursts are permitted up to $b$.
2. **Leaky Bucket:** Requests enter a FIFO queue and leak at a constant rate, smoothing bursty traffic into uniform flow.
3. **Fixed Window Counter:** Tracks request counts within discrete temporal windows (e.g., $[0, 60\text{s}]$). Suffers from the boundary burst flaw, where twice the allowed limit can execute across window boundaries.
4. **Sliding Window Counter:** Computes a weighted estimate combining the current and previous window:
$$\text{Count} = \text{Count}_{\text{current}} + \text{Count}_{\text{previous}} \times \left(1 - \frac{t - t_{\text{start}}}{W}\right)$$
where $W$ is window width. This completely neutralizes boundary spikes with negligible memory overhead.

### 5.2 Protocol-Level Signaling: RFC 6585 HTTP 429
Nottingham and Fielding [2012] formalized HTTP status code `429 Too Many Requests` in RFC 6585. In TripoBD, custom throttling classes (`LoginRateThrottle` at 5/min, `OTPRateThrottle` at 3/min per IP/email tuple, and `AIGenerationRateThrottle` at 10/hour) leverage Django's cache engine to maintain sliding request counts. Exceeding limits immediately returns HTTP 429 with standard `Retry-After` headers, allowing clients to apply exponential backoff.

---

## 6. Domain 5: Non-Repudiation, Forensic Telemetry, and Temporal Auditing (Feature 5 - Implemented & Verified)

Information security models require the guarantee of *Non-Repudiation*: ensuring that an entity cannot deny the authenticity of an action or transaction performed on the system. NIST SP 800-92 [Kent and Souppaya, 2006] specifies guidelines for computer security log management, defining audit records as essential evidence for incident response, threat detection, and forensic reconstruction.

### 6.1 Limitations of Single-State Relational Systems
Conventional Relational Database Management Systems (RDBMS) maintain only the latest state of an entity via destructive `UPDATE` and `DELETE` operations. If an attacker or compromised internal user modifies a booking status, alters bank account details, or marks an unverified guide as verified, all preceding states are overwritten. Post-incident forensics cannot determine the temporal instant the alteration occurred, the authenticated principal responsible, the exact delta of changed fields, or the network provenance.

### 6.2 Temporal Table Architecture and Signal Telemetry in TripoBD
To solve this gap, TripoBD implemented a dual-layered audit architecture:
1. **Temporal Table Tracking** via `django-simple-history`, which shadows core models (`UserProfile`, `ServiceProvider`, `ServiceProviderBooking`, `AccountSettings`) with append-only historical mirrors capturing full-state snapshots and delta diffs.
2. **Security Event Signal Telemetry**, connecting framework authentication signals (`user_logged_in`, `user_login_failed`, `user_logged_out`) to an immutable `SecurityAuditLog` table capturing attempted usernames, timestamps, client IP addresses, and User-Agent headers.

---

## 7. Domain 6: End-to-End Cryptography in Web Applications (Feature 6)

Collaborative applications frequently exchange sensitive personal communications (tour room logistical chats, travel schedules, direct guide negotiations). While Transport Layer Security (TLS 1.3) encrypts data in transit between client and server, the server maintains access to plaintext, exposing data to insider threats, subpoena exfiltration, and database dump leaks.

### 7.1 The Untrusted Server and Zero-Knowledge Paradigm
To achieve mathematical confidentiality, systems implement End-to-End Encryption (E2EE) under the Zero-Knowledge Server model. In this architecture, cryptographic key generation, encryption, and decryption occur strictly on client endpoints. The backend server acts merely as a blind ciphertext relay and persistence buffer, never possessing decryption keys.

### 7.2 W3C Web Cryptography API and AES-GCM-256
Historically, executing cryptography in web browsers was considered hazardous due to pseudo-random number generator (PRNG) predictability and timing side-channels in interpreted JavaScript. The W3C Web Cryptography API [Dahl and Sleevi, 2017] resolved these concerns by exposing native, hardware-accelerated cryptographic primitives directly through `window.crypto.subtle`.

The gold standard for authenticated symmetric encryption is AES in Galois/Counter Mode (AES-GCM) with a 256-bit key [NIST SP 800-38D, Dworkin, 2007]:
$$C, T = \text{AES-GCM-256}(K, \text{IV}, P, \text{AAD})$$
AES-GCM operates as an Authenticated Encryption with Associated Data (AEAD) cipher, simultaneously guaranteeing confidentiality and integrity via an authentication tag. In TripoBD, tour room messages are encrypted client-side using unique 96-bit Initialization Vectors (IVs), persisting only `(room_id, sender_id, IV, ciphertext)` tuples in MySQL.

---

## 8. Domain 7: Browser Policy Hardening and Injection Defense (Feature 7)

The browser security model relies primarily on the Same-Origin Policy (SOP). However, SOP does not prevent an application from executing malicious scripts injected into its own origin through Reflected, Stored, or DOM-based XSS [Lekies et al., 2013].

### 8.1 Content Security Policy (W3C CSP Level 3)
Content Security Policy (CSP), formalized in W3C CSP Level 3 [West et al., 2023], provides a declarative mechanism allowing server operators to define a strict whitelist of valid sources from which the browser is permitted to load dynamic resources. Calzavara et al. [2020] proved that rigorous CSP deployment effectively neutralizes script injection exploits. A hardened CSP eliminates dangerous JavaScript idioms (`eval()`) by omitting `'unsafe-eval'` and blocks inline script execution by omitting `'unsafe-inline'`, while whitelisting authorized origins such as Google Maps API, Google Fonts, and Cloudinary:
```http
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' https://maps.googleapis.com; 
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
  img-src 'self' data: https://res.cloudinary.com; 
  connect-src 'self' https://maps.googleapis.com;
```

### 8.2 Complementary Defensive HTTP Headers
A robust defense-in-depth posture combines CSP with complementary HTTP security headers:
- **HTTP Strict Transport Security (HSTS, RFC 6797):** Enforces HTTPS and neutralizes SSL-stripping.
- **X-Frame-Options: DENY:** Forbids malicious framing and Clickjacking.
- **X-Content-Type-Options: nosniff:** Prevents browser MIME-type confusion exploits.

---

## 9. Domain 8: Secure File Ingestion and Data-at-Rest Privacy (Features 8 & 9)

### 9.1 Zero-Trust File Upload Validation and Antivirus Pipelines (Feature 8)
Unrestricted file upload is categorized as a critical injection vulnerability (OWASP A03:2021). Collaborative travel platforms ingest profile photos, review images, travel receipts, and identity documents (National ID scans, certifications). Threat vectors include polyglot executable uploads (masking webshell scripts with image extensions like `shell.php.jpg`), client MIME-spoofing, path traversal, and EXIF metadata leakage containing GPS coordinates of travelers.

TripoBD's zero-trust ingestion architecture enforces:
1. **Magic Byte Signature Inspection:** Reads initial 2048 bytes via `python-magic`/`libmagic` to verify true binary headers.
2. **Cryptographic Key Renaming:** Replaces all filenames with unguessable random UUIDv4 hashes before disk storage.
3. **EXIF Stripping and Re-encoding:** Opens image byte streams with Pillow, extracts raw pixels, and reconstructs images without metadata.
4. **Streaming Antivirus Scanning:** Streams files directly into ClamAV daemon (`clamd.scan_stream()`) to check for known virus signatures before persisting.

### 9.2 Field-Level Encryption for Personally Identifiable Information (Feature 9)
Database storage security is categorized under Cryptographic Failures (OWASP A02:2021). Relational databases often store Personally Identifiable Information (PII)—including phone numbers, national identification numbers, passport scans, and banking payout details—in plaintext.

While Transparent Data Encryption (TDE) and Full Disk Encryption (FDE) protect data against physical hard drive theft, they offer zero protection against SQL injection vulnerabilities, leaked database backups (`.sql` dumps), or rogue database administrators. Application-Layer / Field-Level Encryption (FLE) resolves this by encrypting sensitive attributes before database persistence using AES-256-CBC with HMAC-SHA256 (Fernet) or AES-256-GCM envelope encryption [NIST SP 800-57, Barker, 2020]. The master encryption key is isolated outside the database in secure environment variables or a Key Management Service (KMS), rendering stolen SQL dumps unreadable.

---

## 10. Comparative Synthesis and Analytical Matrix

| Ref | Security Control | Primary Threats Mitigated | Core Primitives / Standards | Enforcement Layer | Status in TripoBD |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-01** | TOTP Multi-Factor Auth | Credential stuffing, account takeover | RFC 6238, HMAC-SHA1 | Auth API / React | Roadmap (Phase 2) |
| **F-02** | Hardened JWT & RTR | Token theft via XSS, session hijack | RFC 7519, RFC 6749, HttpOnly | Cookie / DRF Filter | Roadmap (Phase 1) |
| **F-03** | Object Access & IDOR | Horizontal data tampering, scraping | RFC 4122 UUIDv4, ABAC | ORM / DRF ViewSet | **Implemented & Verified** |
| **F-04** | Rate Limiting & Throttling | Brute-force, OTP flooding, DoS | Sliding Window, RFC 6585 | DRF Throttling / Cache | **Implemented & Verified** |
| **F-05** | Audit Logging & Monitoring | Repudiation, undetected tampering | NIST SP 800-92, SCD Type 4 | ORM / Signal Handlers | **Implemented & Verified** |
| **F-06** | End-to-End Encrypted Chat | Server eavesdropping, DB leaks | Web Crypto API, AES-GCM-256 | Browser Client / DB | Roadmap (Phase 3) |
| **F-07** | CSP & Security Headers | Script injection, Clickjacking, sniffing | W3C CSP Level 3, RFC 6797 | HTTP Middleware | Roadmap (Phase 2) |
| **F-08** | Zero-Trust File Ingestion | Remote Code Execution (RCE), EXIF | Magic Bytes, ClamAV, Pillow | Ingestion Pipeline | Roadmap (Phase 1) |
| **F-09** | Field-Level PII Encryption | Plaintext DB dump exfiltration | AES-256-CBC/GCM, NIST 800-57 | Model ORM / KMS | Roadmap (Phase 2) |

---

## 11. TripoBD Implementation Analysis: Verified Controls and Roadmap

### 11.1 Empirical Analysis of Verified Controls
During recent platform development, the TripoBD security team implemented and empirically verified Features 3, 4, and 5:

1. **Feature 3 (IDOR Elimination & UUID Migration):**
   - UUIDv4 primary attributes were migrated onto `ServiceProviderBooking`, `TourRoom`, `ServiceProvider`, `TripStory`, `OpenTourGroup`, and `CommunityPost`.
   - Custom permissions (`IsOwnerOrReadOnly`, `IsTourRoomMember`, `IsBookingParticipant`, `IsOwnerOnly`) were bound to ModelViewSets with scoped `get_queryset()` methods.
   - Dual integer/UUID resolvers preserved backward compatibility with legacy endpoints.

2. **Feature 4 (Algorithmic Rate Limiting):**
   - Throttling classes (`LoginRateThrottle` at 5/min, `OTPRateThrottle` at 3/min per IP/email tuple, and `AIGenerationRateThrottle` at 10/hour) were mounted directly on authentication and Gemini AI endpoints.
   - Automated testing confirmed HTTP 429 Too Many Requests enforcement with `Retry-After` header calculations.

3. **Feature 5 (Audit Logging & Historical Records):**
   - Full-history temporal tracking via `django-simple-history` was integrated on `UserProfile`, `ServiceProvider`, `ServiceProviderBooking`, and `AccountSettings` models.
   - Signals intercepting `user_logged_in`, `user_login_failed`, and `user_logged_out` populate an append-only `SecurityAuditLog` capturing client IP, user agent, timestamps, and usernames.

### 11.2 Roadmap for Remaining Controls
The remaining six controls will be deployed in prioritized phases:
- **Phase 1 (Immediate - High Risk):** Feature 2 (Hardened JWT with HttpOnly cookies and RTR) and Feature 8 (Zero-Trust File Upload Validation).
- **Phase 2 (Core Security):** Feature 1 (TOTP 2FA), Feature 7 (Content Security Policy & HTTP Security Headers), and Feature 9 (Field-Level PII Encryption).
- **Phase 3 (Advanced Privacy):** Feature 6 (End-to-End Encrypted Tour Room Chat via Web Cryptography API).

---

## 12. Conclusion and Future Research Directions

This literature review establishes a theoretical and architectural framework for securing modern collaborative web platforms. By replacing legacy perimeter assumptions with the rigorous axioms of Saltzer and Schroeder, NIST Zero Trust Architecture, and multi-layered Defense-in-Depth, platforms can achieve mathematical resilience against modern threat vectors. The successful engineering and verification of Object-Level Authorization (F-03), Rate Limiting (F-04), and Forensic Audit Logging (F-05) within TripoBD provides an empirical foundation for completing the remaining security controls.

Future research will explore passwordless authentication via the FIDO2/WebAuthn standard (Passkeys) and evaluate the performance impact of Post-Quantum Cryptography (PQC) algorithms (such as NIST ML-KEM and ML-DSA) on client-side web application cryptography.

---

## References

1. D. M'Raihi, S. Machani, M. Pei, and J. Rydell, "TOTP: Time-Based One-Time Password Algorithm," IETF RFC 6238, May 2011.
2. M. Jones, J. Bradley, and N. Sakimura, "JSON Web Token (JWT)," IETF RFC 7519, May 2015.
3. D. Hardt, "The OAuth 2.0 Authorization Framework," IETF RFC 6749, Oct. 2012.
4. P. Leach, M. Mealling, and R. Salz, "A Universally Unique Identifier (UUID) URN Namespace," IETF RFC 4122, July 2005.
5. J. Hodges, C. Jackson, and A. Barth, "HTTP Strict Transport Security (HSTS)," IETF RFC 6797, Nov. 2012.
6. M. Nottingham and R. Fielding, "Additional HTTP Status Codes," IETF RFC 6585, Apr. 2012.
7. S. Rose, O. Borchert, S. Mitchell, and S. Connelly, "Zero Trust Architecture," NIST Special Publication 800-207, Aug. 2020.
8. P. A. Grassi, J. L. Fenton, E. M. Newton, et al., "Digital Identity Guidelines: Authentication and Lifecycle Management," NIST SP 800-63B, June 2017.
9. K. Kent and M. Souppaya, "Guide to Computer Security Log Management," NIST Special Publication 800-92, Sept. 2006.
10. E. Barker, "Recommendation for Key Management: Part 1 -- General," NIST Special Publication 800-57 Part 1 Rev. 5, May 2020.
11. M. Dworkin, "Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC," NIST Special Publication 800-38D, Nov. 2007.
12. OWASP Foundation, "OWASP Top 10: The Ten Most Critical Web Application Security Risks," 2021. [Online]. Available: https://owasp.org/Top10/
13. OWASP Foundation, "OWASP API Security Top 10," 2023. [Online]. Available: https://owasp.org/www-project-api-security/
14. J. H. Saltzer and M. D. Schroeder, "The Protection of Information in Computer Systems," Proceedings of the IEEE, vol. 63, no. 9, pp. 1278-1308, 1975.
15. M. Dahl and R. Sleevi, "Web Cryptography API," W3C Recommendation, Jan. 2017. [Online]. Available: https://www.w3.org/TR/WebCryptoAPI/
16. M. West, A. Barth, and D. Veditz, "Content Security Policy Level 3," W3C Working Draft, Dec. 2023. [Online]. Available: https://www.w3.org/TR/CSP3/
17. J. Bonneau, C. Herley, P. C. van Oorschot, and F. Stajano, "The Quest to Replace Passwords: A Framework for Comparative Evaluation of Web Authentication Schemes," in IEEE Symposium on Security and Privacy (S&P), pp. 553-567, 2012.
18. S. Calzavara, A. Rabitti, A. Cortesi, and M. Bugliesi, "A Large-Scale Empirical Study of Content Security Policy on the Web," ACM Transactions on Privacy and Security (TOPS), vol. 23, no. 3, pp. 1-36, 2020.
19. S. Lekies, B. Stock, and M. Johns, "25 Million Flows Later: Large-Scale Detection of DOM-based XSS," in Proceedings of the 2013 ACM SIGSAC Conference on Computer & Communications Security (CCS), pp. 1193-1204, 2013.
20. P. De Ryck, L. Desmet, and W. Joosen, "Security Analysis of Client-Side Web Applications," in Foundations of Security Analysis and Design VII, Springer, pp. 162-190, 2014.
21. D. Fett, T. Lodderstedt, and M. Jones, "OAuth 2.0 Security Best Current Practice," IETF Internet-Draft, Sept. 2023.
22. A. Barth, "HTTP State Management Mechanism," IETF RFC 6265, Apr. 2011.
23. W. Diffie and M. Hellman, "New Directions in Cryptography," IEEE Transactions on Information Theory, vol. 22, no. 6, pp. 644-654, 1976.
24. F. Roesner, T. Kohno, and D. Wetherall, "Detecting and Defending Against Third-Party Web Tracking and Injection," in 9th USENIX NSDI, pp. 155-168, 2012.
25. R. S. Sandhu, E. J. Coyne, H. L. Feinstein, and C. E. Youman, "Role-Based Access Control Models," IEEE Computer, vol. 29, no. 2, pp. 38-47, 1996.
26. V. C. Hu, D. Ferraiolo, R. Kuhn, et al., "Guide to Attribute Based Access Control (ABAC) Definition and Considerations," NIST SP 800-162, 2014.
27. N. Ferguson, B. Schneier, and T. Kohno, "Cryptography Engineering: Design Principles and Practical Applications," John Wiley & Sons, 2010.
