import {
    getApp,
    getApps,
    initializeApp,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
    GoogleAuthProvider,
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    getAuth,
    onAuthStateChanged,
    setPersistence,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

let firebaseAuth;

function userData(user) {
    if (!user) {
        return null;
    }

    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
    };
}

function success(user = null, token = null) {
    return {
        success: true,
        user: userData(user),
        token,
        errorCode: null,
        errorMessage: null,
    };
}

function failure(error) {
    return {
        success: false,
        user: null,
        token: null,
        errorCode: error?.code ?? "auth/unknown-error",
        errorMessage: error?.message ?? "Nieznany błąd Firebase Auth",
    };
}

function waitForAuthState() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
            firebaseAuth,
            user => {
                unsubscribe();
                resolve(user);
            },
            reject,
        );
    });
}

export async function initialize(firebaseConfig) {
    try {
        if (!firebaseAuth) {
            const app = getApps().length > 0
                ? getApp()
                : initializeApp(firebaseConfig);

            firebaseAuth = getAuth(app);
            await setPersistence(firebaseAuth, browserLocalPersistence);
        }

        return success(await waitForAuthState());
    } catch (error) {
        return failure(error);
    }
}

export async function login(email, password) {
    try {
        const credential = await signInWithEmailAndPassword(
            firebaseAuth,
            email,
            password,
        );

        return success(credential.user);
    } catch (error) {
        return failure(error);
    }
}

export async function register(fullName, email, password) {
    try {
        const credential = await createUserWithEmailAndPassword(
            firebaseAuth,
            email,
            password,
        );

        await updateProfile(credential.user, {
            displayName: fullName.trim(),
        });

        return success(credential.user);
    } catch (error) {
        return failure(error);
    }
}

export async function loginWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        const credential = await signInWithPopup(firebaseAuth, provider);
        return success(credential.user);
    } catch (error) {
        return failure(error);
    }
}

export async function logout() {
    try {
        await signOut(firebaseAuth);
        return success();
    } catch (error) {
        return failure(error);
    }
}

export async function getIdToken(forceRefresh) {
    try {
        if (!firebaseAuth?.currentUser) {
            return failure({
                code: "auth/user-not-signed-in",
                message: "Użytkownik nie jest zalogowany",
            });
        }

        const token = await firebaseAuth.currentUser.getIdToken(forceRefresh);
        return success(firebaseAuth.currentUser, token);
    } catch (error) {
        return failure(error);
    }
}
