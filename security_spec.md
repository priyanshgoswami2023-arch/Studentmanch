# Security Specification — Student Manch (studentmanch.in)

## 1. Data Invariants
1. **Identity Integrity**: A `UserProfile`, `UserPrivateInfo`, `QuizAttempt`, `Bookmark`, or non-admin `LeaderboardEntry` cannot be created or updated with a `userId`/`uid` differing from `request.auth.uid`.
2. **PII Isolation**: User email addresses reside exclusively in `/users/{userId}/private/{docId}` and `/contact_messages/{messageId}`. Neither collection permits unauthenticated or non-owner/non-admin reads.
3. **Admin Exclusivity & Firestore Whitelist**: Only verified admins (`priyanshugoswami802@gmail.com` with `email_verified == true`, or an active entry in `/admin_whitelist/{emailKey}`, or uid in `/admins/{uid}`) can write/delete `/quizzes`, `/notices`, `/colleges`, `/news`, or read/delete `/contact_messages`. Only the primary owner (`priyanshugoswami802@gmail.com`) can list or mutate `/admin_whitelist`; standard signed-in users can only check their own deterministic slot.
4. **Path Variable Hardening**: Every single-document operation validates `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
5. **Temporal Integrity**: `createdAt` and `updatedAt` are validated against `request.time` (Firestore serverTimestamp) on writes.
6. **Strict Key & Size Enforcement**: Every create enforces `hasAll` + `hasOnly` and bounds all string and array fields.

## 2. The "Dirty Dozen" Attack Payloads (All Must Fail with PERMISSION_DENIED)
1. **Unauthenticated Quiz Write**: Unauthenticated client attempts `setDoc('/quizzes/q1', ...)` -> Denied.
2. **Email Spoofing Admin Bypass**: Signed-in user with `email == 'priyanshugoswami802@gmail.com'` and `email_verified == false` attempts `setDoc('/news/n1', ...)` -> Denied.
3. **Cross-User Quiz Attempt Spoofing**: User A creates `/quiz_attempts/a1` with `userId: 'userB'` -> Denied.
4. **Shadow Field Injection on User Profile**: User A creates `/users/userA` with extra `{ isAdmin: true }` -> Denied by `hasOnly`.
5. **PII Scraping on Private Subcollection**: User B reads `/users/userA/private/info` -> Denied.
6. **Contact Message Exfiltration**: Signed-in non-admin user lists `/contact_messages` -> Denied.
7. **ID Poisoning**: Authenticated user attempts `setDoc('/bookmarks/invalid$id..123', ...)` -> Denied by `isValidId`.
8. **Score Value Poisoning**: Authenticated user submits `/quiz_attempts/a1` with `score: 999999` or `score: "100"` -> Denied by type/bounds check (`score >= 0 && score <= totalQuestions`).
9. **Client Timestamp Forgery**: Authenticated user submits `/quiz_attempts/a1` with backdated `completedAt` -> Denied by `request.time`.
10. **Immutable Field Tampering**: User A updates `/users/userA` changing `createdAt` or `uid` -> Denied.
11. **Unbounded Array Exhaustion**: Admin/User attempts to inject > 20 tags or > 50 questions without bounds -> Denied by `.size()` checks.
12. **Bookmark List Enumeration**: User B executes `getDocs(collection(db, 'bookmarks'))` without filtering to `userB` -> Denied by `resource.data.userId == request.auth.uid`.
