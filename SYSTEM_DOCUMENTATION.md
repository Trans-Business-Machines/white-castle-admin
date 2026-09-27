# White Castle Motel — System Access Documentation
**Backend API:** https://asantemeats.ca
**Last Updated:** September 2026

---

## Default Staff Accounts


| Role | Email | Username | Password |
|---|---|---|---|
| Super Admin | superadmin@whitecastlemotel.com | superadmin | `Wh!teCa5tl3#Sup3r2026` |
| Admin | admin@whitecastlemotel.com | wcm_admin | `Admin@WCM2026!` |
| Receptionist | receptionist@whitecastlemotel.com | receptionist | `Recep@WCM2026!` |
| Finance | finance@whitecastlemotel.com | finance | `Finance@WCM2026!` |
| Housekeeping | housekeeping@whitecastlemotel.com | housekeeping | `House@WCM2026!` |
| Catering | catering@whitecastlemotel.com | catering | `Cater@WCM2026!` |

---

## Role Permissions Matrix

### Super Admin
Full system access. Bypasses all role checks.

| Feature | Access |
|---|---|
| All admin features | ✅ |
| Change user roles | ✅ Only super_admin can do this |
| Delete users permanently | ✅ |
| Create/edit/delete roles | ✅ |
| View audit log | ✅ |
| Update motel settings | ✅ |

---

### Admin
Hotel manager. Full operational access.

| Feature | Access |
|---|---|
| View/manage bookings | ✅ |
| Approve/reject/cancel bookings | ✅ |
| Check-in / check-out guests | ✅ |
| Extend bookings | ✅ |
| Extra person charges | ✅ |
| View/manage guests | ✅ |
| Blacklist/unblacklist guests | ✅ |
| Record & verify payments | ✅ |
| View all reports | ✅ |
| Manage rooms (add/edit/delete) | ✅ |
| Upload room photos | ✅ |
| Manage staff members | ✅ |
| Housekeeping tasks | ✅ |
| Maintenance issues | ✅ |
| Update motel settings | ✅ |
| View notification history | ✅ |
| Manage users (create/disable) | ✅ |
| Change user roles | ❌ Super admin only |

---

### Receptionist
Front desk staff. Day-to-day operations.

| Feature | Access |
|---|---|
| View/manage bookings | ✅ |
| Approve/reject/cancel bookings | ✅ |
| Check-in / check-out guests | ✅ |
| Extend bookings | ✅ |
| Extra person charges | ✅ |
| View/manage guests | ✅ |
| Blacklist/unblacklist guests | ✅ |
| Record payments + upload evidence | ✅ |
| Verify/reject payments | ❌ Admin/Finance only |
| View room availability | ✅ |
| Manage rooms (add/edit) | ✅ |
| Delete rooms | ❌ Admin only |
| Upload room photos | ✅ |
| Manage staff | ✅ |
| Housekeeping tasks | ✅ |
| Maintenance issues | ✅ |
| View motel settings | ✅ |
| Update motel settings | ❌ Admin only |
| B&B guest list | ✅ |
| View reports (occupancy, bookings, guests) | ✅ |
| Revenue/financial reports | ❌ Admin/Finance only |

---

### Finance
Accounts staff. Payments and financial reports.

| Feature | Access |
|---|---|
| View bookings (read-only) | ✅ |
| Approve/cancel bookings | ❌ |
| Verify/reject payments | ✅ |
| View all payments | ✅ |
| View guests (read-only) | ❌ |
| Revenue report | ✅ |
| Occupancy report | ✅ |
| Payments report | ✅ |
| Cancellations report | ✅ |
| No-shows report | ✅ |
| Dashboard report | ✅ |
| Housekeeping/maintenance | ❌ |
| B&B list | ❌ |

---

### Housekeeping
Housekeeping staff. Cleaning and maintenance tasks only.

| Feature | Access |
|---|---|
| View housekeeping tasks | ✅ |
| Create housekeeping tasks | ✅ |
| Start/complete tasks | ✅ |
| Upload task photos | ✅ |
| Report maintenance issues | ✅ |
| View maintenance issues | ✅ |
| Update/resolve maintenance | ✅ |
| Housekeeping report | ✅ |
| View bookings | ❌ |
| View guests | ❌ |
| View payments | ❌ |
| Manage rooms | ❌ |
| B&B list | ❌ |

---

### Catering
Catering staff. Breakfast list only.

| Feature | Access |
|---|---|
| B&B guest list for a given date | ✅ |
| B&B summary report | ✅ |
| Everything else | ❌ |

---

## Room Status Flow

| Status | Meaning | Blocks Booking? |
|---|---|---|
| `available` | Ready for booking | No |
| `occupied` | Guest checked in | Yes (by booking dates) |
| `housekeeping` | Being cleaned after checkout | **No** — informational only |
| `maintenance` | Under repair | **Yes** — always blocked |

**Automatic transitions:**
- Guest **checks out** → room: `housekeeping` + cleaning task auto-created
- Housekeeping task **completed** (cleaning) → room: `available` (unless open maintenance issues)
- Maintenance issue **reported** → room: `maintenance` (overrides housekeeping)
- All maintenance issues **resolved** → room: `housekeeping` (if pending cleaning) or `available`

---

## Security Settings

| Setting | Value | Location |
|---|---|---|
| Max login attempts before lockout | 5 | motel.settings |
| Lockout duration | 15 minutes | motel.settings |
| Auto-unlock | After 15 mins | Automatic |
| Manual unlock | `POST /api/auth/users/{id}/unlock` | Admin+ only |
| Nginx rate limit (login) | 5 requests/minute | nginx |
| Nginx rate limit (API) | 60 requests/minute | nginx |
| Access token expiry | 1 hour | JWT |
| Refresh token expiry | 7 days | JWT |

---

## Payment Methods

Accepted payment methods:
- **M-Pesa** — Lipa na M-Pesa Paybill
- **Cash** — At reception


---

## API Endpoints Summary

### Auth Service (`/api/auth/`)
| Endpoint | Auth | Description |
|---|---|---|
| `POST /login` | None | Login — returns JWT token |
| `POST /refresh` | Cookie | Refresh access token |
| `POST /logout` | None | Clear auth cookies |
| `POST /password-reset` | None | Request password reset |
| `POST /password-reset/confirm` | None | Confirm password reset |
| `PATCH /change-password` | Any | Change own password |
| `GET /me` | Any | Get own profile |
| `GET /users` | Admin+ | List users — filter by `?role=&active=` |
| `POST /users` | Admin+ | Create user |
| `PATCH /users/{id}` | Admin+ | Update user (role: super_admin only) |
| `POST /users/{id}/disable` | Admin+ | Disable user |
| `POST /users/{id}/enable` | Admin+ | Enable user |
| `POST /users/{id}/unlock` | Admin+ | Unlock locked account |
| `DELETE /users/{id}` | Super admin | Delete user |
| `GET /audit-log` | Admin+ | View audit trail — filter by user/action/date |
| `GET /audit-log/export` | Admin+ | Export audit log to CSV |

### Bookings Service (`/api/bookings/`)
| Endpoint | Auth | Description |
|---|---|---|
| `GET /rooms` | None | List all rooms |
| `GET /rooms/available` | None | Available rooms for dates |
| `GET /rooms/{id}` | None | Get room details |
| `GET /rooms/{id}/calendar` | None | Month-view availability for a room |
| `POST /rooms` | Receptionist+ | Create room |
| `PATCH /rooms/{id}` | Receptionist+ | Update room |
| `DELETE /rooms/{id}` | Admin | Delete room |
| `POST /rooms/{id}/photos` | Receptionist+ | Upload room photos |
| `DELETE /rooms/{id}/photos` | Receptionist+ | Remove room photo |
| `POST /enquiry` | None | Guest booking request |
| `POST /create` | Receptionist+ | Staff creates booking |
| `GET /list` | Receptionist+ | List bookings — filter by status/date |
| `GET /arrivals/today` | Receptionist+ | Today's arrivals |
| `GET /arrivals` | Receptionist+ | Arrivals for any date `?date=YYYY-MM-DD` |
| `GET /departures/today` | Receptionist+ | Today's departures |
| `GET /departures` | Receptionist+ | Departures for any date `?date=YYYY-MM-DD` |
| `GET /bb-list` | Receptionist+, Catering | B&B guests for a date |
| `GET /lookup/{reference}` | Receptionist+ | Lookup by reference |
| `GET /{id}` | Receptionist+ | Get booking details |
| `GET /{id}/history` | Receptionist+ | Booking action timeline |
| `PATCH /{id}` | Receptionist+ | Edit booking fields |
| `PATCH /{id}/approve` | Receptionist+ | Approve booking |
| `PATCH /{id}/reject` | Receptionist+ | Reject booking |
| `PATCH /{id}/cancel` | Receptionist+ | Cancel booking |
| `PATCH /{id}/checkin` | Receptionist+ | Check guest in |
| `PATCH /{id}/checkout` | Receptionist+ | Check guest out (auto-creates housekeeping task) |
| `PATCH /{id}/extend` | Receptionist+ | Extend booking |
| `PATCH /{id}/extra-persons` | Receptionist+ | Add extra guests |
| `DELETE /{id}` | Admin | Hard delete booking |
| `GET /export/bookings` | Admin, Finance | Export bookings CSV |

### Payments Service (`/api/payments/`)
| Endpoint | Auth | Description |
|---|---|---|
| `POST /create` | Receptionist+ | Record payment (mpesa or cash only) |
| `POST /{id}/evidence` | Receptionist+ | Upload payment proof |
| `GET /list` | Receptionist+ | List payments — filter by status/reference/date |
| `GET /search` | Receptionist+ | Search by booking reference |
| `GET /pending` | Receptionist+ | Pending payments |
| `GET /stats` | Admin, Finance | Revenue summary by method/status |
| `GET /booking/{booking_id}` | Receptionist+ | Payments for a booking |
| `GET /{id}` | Receptionist+ | Get payment details |
| `PATCH /{id}` | Admin, Finance | Correct payment before verification |
| `PATCH /{id}/verify` | Admin, Finance | Verify payment (auto-confirms booking) |
| `PATCH /{id}/reject` | Admin, Finance | Reject payment |
| `GET /export/payments` | Admin, Finance | Export payments CSV |

### Motel Service (`/api/motel/`)
| Endpoint | Auth | Description |
|---|---|---|
| `GET /staff` | Receptionist+ | List staff |
| `POST /staff` | Receptionist+ | Add staff |
| `PATCH /staff/{id}` | Receptionist+ | Update staff |
| `DELETE /staff/{id}` | Admin | Deactivate staff |
| `GET /housekeeping` | Receptionist+, Housekeeping | List tasks |
| `GET /housekeeping/pending` | Receptionist+, Housekeeping | Pending tasks |
| `GET /housekeeping/stats` | Receptionist+, Housekeeping | Task completion statistics |
| `POST /housekeeping` | Receptionist+, Housekeeping | Create task |
| `PATCH /housekeeping/{id}/start` | Receptionist+, Housekeeping | Start task |
| `PATCH /housekeeping/{id}/complete` | Receptionist+, Housekeeping | Complete task (auto-updates room status) |
| `GET /maintenance` | Receptionist+, Housekeeping | List issues |
| `GET /maintenance/stats` | Receptionist+, Housekeeping | Issue statistics by category/status |
| `POST /maintenance` | Receptionist+, Housekeeping | Report issue (auto-sets room to maintenance) |
| `PATCH /maintenance/{id}` | Receptionist+, Housekeeping | Update issue |
| `PATCH /maintenance/{id}/resolve` | Receptionist+, Housekeeping | Resolve issue (auto-restores room status) |
| `GET /settings` | Receptionist+ | View settings |
| `PATCH /settings/{key}` | Admin+ | Update setting |
| `GET /reports/dashboard` | Receptionist+, Finance | Dashboard — today + week + month |
| `GET /reports/occupancy` | Admin, Finance | Occupancy report |
| `GET /reports/revenue` | Admin, Finance | Revenue report |
| `GET /reports/bookings` | Receptionist+, Finance | Bookings report |
| `GET /reports/payments` | Admin, Finance | Payments report |
| `GET /reports/guests` | Receptionist+, Finance | Guests report |
| `GET /reports/cancellations` | Admin, Finance | Cancellations report |
| `GET /reports/bb-summary` | Receptionist+, Finance, Catering | B&B revenue report |
| `GET /reports/housekeeping` | Receptionist+, Housekeeping | Housekeeping report |
| `GET /reports/no-shows` | Admin, Finance | No-shows report |
| `GET /reports/audit` | Admin+ | Audit report |

### Guests Service (`/api/guests/`)
| Endpoint | Auth | Description |
|---|---|---|
| `GET /list` | Receptionist+ | List guests |
| `GET /search` | Receptionist+ | Search guests |
| `GET /stats` | Receptionist+ | Guest statistics |
| `POST /create` | Receptionist+ | Create guest profile |
| `GET /{id}` | Receptionist+ | Get guest details |
| `GET /{id}/bookings` | Receptionist+ | Guest booking history |
| `GET /{id}/documents` | Receptionist+ | List ID documents |
| `PATCH /{id}` | Receptionist+ | Update guest |
| `PATCH /{id}/blacklist` | Receptionist+ | Blacklist guest |
| `PATCH /{id}/unblacklist` | Receptionist+ | Remove from blacklist |
| `POST /{id}/id-document` | Receptionist+ | Upload ID document |
| `DELETE /{id}` | Admin | GDPR erasure — hard delete guest |
| `GET /export/guests` | Admin, Finance | Export guests CSV |

### Notifications Service (`/api/notifications/`)
| Endpoint | Auth | Description |
|---|---|---|
| `GET /notifications/history` | Receptionist+ | Notification history |
| `GET /notifications/stats` | Receptionist+ | Delivery statistics |
| `POST /notifications/retry/{id}` | Receptionist+ | Retry failed notification |
| `GET /notifications/booking/{id}` | Receptionist+ | Notifications for a booking |
| `GET /notifications/templates` | Receptionist+ | List templates |
| `GET /notifications/templates/{name}` | Receptionist+ | Get template |
| `POST /notifications/templates` | Admin | Create template |
| `PATCH /notifications/templates/{name}` | Admin | Update template |
| `DELETE /notifications/templates/{name}` | Admin | Delete template |

---

## Motel Settings Reference

| Key | Default | Description |
|---|---|---|
| `deposit_percentage` | 50 | % of total required as deposit |
| `payment_deadline_hours` | 24 | Hours to pay before room is released |
| `cancellation_fee_percentage` | 50 | % of deposit forfeited on late cancellation |
| `free_cancellation_hours` | 24 | Hours within which cancellation is free |
| `mpesa_paybill` | _(empty)_ | M-Pesa Paybill number |
| `staff_email` | reservations@whitecastlemotel.com | Staff alert email |
| `catering_email` | catering@whitecastlemotel.com | B&B list recipient |
| `bb_cutoff_time` | 08:00 | Time daily B&B list is sent |
| `max_login_attempts` | 5 | Failed attempts before lockout |
| `lockout_minutes` | 15 | Lockout duration |
