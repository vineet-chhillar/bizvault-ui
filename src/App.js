
import BillingAppLayout from "./BillingAppLayout";
import React, { useEffect, useState } from "react";
import LoginPage from "./LoginPage";
import { session } from "./utils/Session";
import { HashRouter as Router } from "react-router-dom";
import { encryptObject } from "./utils/CryptoHelper";
export default function App() {
  const [user, setUser] = useState(null);
  const [lastAction, setLastAction] = useState(null);

const [forceChangePassword, setForceChangePassword] = useState(false);
const clearLastAction = () => setLastAction(null);
const [loginAttempt, setLoginAttempt] = useState(0);
const [loginError, setLoginError] = useState("");
  useEffect(() => {
    if (window.chrome?.webview) {
      const handler = (event) => {
        let msg = event.data;

        if (typeof msg === "string") {
          try {
            msg = JSON.parse(msg);
          } catch {
            return;
          }
        }

        switch (msg.Type) {

     case "Login":
  if (msg.Status === "Success") {
    setLoginError("");

    // ✅ SET GLOBAL SESSION USER (MANDATORY)
    session.user = {
      ...msg.Data,
      permissions: msg.Data.Permissions,
      permissionVersion: msg.Data.PermissionVersion
    };

    

    // 🔐 FORCE PASSWORD CHANGE CHECK
    if (msg.Data.MustChangePassword) {
      setUser(msg.Data);
      setForceChangePassword(true);
    } else {
      handleLogin(msg.Data);
    }

  } else {
    
    setLoginError(msg.Message);
setLoginAttempt(prev => prev + 1);
  }
  break;



case "ChangePassword":
  if (msg.Status === "Success") {
    setLastAction("ChangePasswordSuccess");
  } else {
    alert(msg.Message);
  }
  break;
case "GetUsers":
  if (msg.Status === "Success") {
    window.__onUsersLoaded?.(msg.Data);
  }
  break;

case "SetUserStatus":
  if (msg.Status === "Success") {
    sendToCSharp("GetUsers", {});
  } else {
    alert(msg.Message);
  }
  break;

case "CreateUser":
  if (msg.Status === "Success") {
    setLastAction("CreateUserSuccess");
  } else {
    alert(msg.Message);
  }
  break;


          case "AddItem":
            break;

          default:
            console.log("Unknown:", "Unhandled message from C#:");
        }
      };

      window.chrome.webview.addEventListener("message", handler);
      return () =>
        window.chrome.webview.removeEventListener("message", handler);
    }
  }, []);

  const sendToCSharp = (action, payload) => {

  // Encrypt only sensitive actions
  if (
    action === "Login" ||
    action === "CreateUser" ||
    action === "ChangePassword"
  ) {
    payload = encryptObject(payload);
  }

  

  if (window.chrome?.webview) {
    window.chrome.webview.postMessage({
      Action: action,
      Payload: payload,
    });
  } else {
    console.warn("⚠️ WebView2 not available");
  }
};


  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // 🔴 ADD / REPLACE THIS PART HERE
  if (!user) {
  return (
    <LoginPage
      sendToCSharp={sendToCSharp}
      loginError={loginError}
      loginAttempt={loginAttempt}
    />
  );
}


  return (
  <Router>
    <BillingAppLayout
      user={user}
      onLogout={handleLogout}
      sendToCSharp={sendToCSharp}
      lastAction={lastAction}
      forceChangePassword={forceChangePassword}
      clearForceChangePassword={() => setForceChangePassword(false)}
      clearLastAction={clearLastAction}
    />
  </Router>
);
}
