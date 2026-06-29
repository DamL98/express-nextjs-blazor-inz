import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let firebaseAuth;

class FirebaseConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "FirebaseConfigError";
  }
}

function getFirebaseOptions() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      return {
        projectId: serviceAccount.project_id || serviceAccount.projectId,
        credential: cert(serviceAccount),
      };
    } catch {
      throw new FirebaseConfigError(
        "FIREBASE_SERVICE_ACCOUNT_JSON nie jest poprawnym JSON-em.",
      );
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || "dl-inz-d0d0d";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (Boolean(clientEmail) !== Boolean(privateKey)) {
    throw new FirebaseConfigError(
      "FIREBASE_CLIENT_EMAIL i FIREBASE_PRIVATE_KEY muszą być ustawione razem.",
    );
  }

  return {
    projectId,
    ...(clientEmail && privateKey
      ? { credential: cert({ projectId, clientEmail, privateKey }) }
      : {}),
  };
}

export function getFirebaseAuth() {
  if (firebaseAuth) {
    return firebaseAuth;
  }

  const options = getFirebaseOptions();
  const app =
    getApps()[0] ??
    initializeApp(options);

  firebaseAuth = getAuth(app);
  return firebaseAuth;
}
