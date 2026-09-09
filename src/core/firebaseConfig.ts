export const firebaseConfig = {
  apiKey: "AIzaSyD7Nvi8o2AVQvac8BcLOG0grocc2vPYFXs",
  authDomain: "elopingpong-38191.firebaseapp.com",
  projectId: "elopingpong-38191",
  storageBucket: "elopingpong-38191.firebasestorage.app",
  messagingSenderId: "18382069709",
  appId: "1:18382069709:web:df6d8e3a0a303d1e496e84",
};

export function isFirebaseConfigured(): boolean {
  return (
    firebaseConfig.apiKey !== "INSERISCI_LA_TUA_API_KEY" &&
    firebaseConfig.projectId !== "INSERISCI_IL_TUO_PROJECT_ID" &&
    !!firebaseConfig.apiKey
  );
}
