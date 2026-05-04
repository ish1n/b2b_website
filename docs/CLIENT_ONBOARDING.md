# Client onboarding (Firebase)

## How client login works

This app signs users in with **Firebase Authentication (email/password)** and then loads the user profile from **Firestore**:

- Auth: `signInWithEmailAndPassword(email, password)`
- Profile: reads `b2b_managers/{UID}` (document id must equal the Firebase Auth user UID)
- Role routing:
  - `role === "admin"` → `/admin`
  - otherwise → `/client/dashboard`

## Create a new client (example: Treebo Trend Hotel)

1. Firebase Console → **Authentication** → **Add user**
   - Set client email and a temporary password
   - Copy the user **UID**
2. Firestore → create/update document:
   - Collection: `b2b_managers`
   - Document ID: **the same UID**
   - Fields (minimum):
     - `role`: `"client"`
     - `email`: client email
     - `name`: client name (e.g. `"Treebo Trend Hotel"`)
     - `partnernames`: array of property strings (e.g. `["Treebo Trend"]`)

Notes:
- The client will only see orders where `order.property` **or** `order.linkedHostel` contains one of the `partnernames` values.
- For multi-property clients, set `partnernames` to multiple names and set `isGroup: true`.
- If you want clients to see **website/cart** orders securely, store `partnerUid` on those order docs and allow reads only when `partnerUid == request.auth.uid`.

## Using the Admin UI

If you are logged in as an admin, you can create/update the Firestore profile from:

- Admin → `Clients` tab → `New Client Profile`

You still need to create the user in Firebase Authentication first (so you have a UID).
