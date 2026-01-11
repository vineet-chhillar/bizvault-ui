import React, { useState } from "react";

export default function ChangePassword({ user, sendToCSharp }) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!oldPwd || !newPwd) {
      setError("All fields required");
      return;
    }
    if (newPwd !== confirmPwd) {
      setError("Passwords do not match");
      return;
    }

    sendToCSharp("ChangePassword", {
      userId: user.Id,
      oldPassword: oldPwd,
      newPassword: newPwd
    });
  };

  return (
    <div>
      <h3>Change Password</h3>
      {error && <div className="error">{error}</div>}

      <input
        type="password"
        placeholder="Old Password"
        value={oldPwd}
        onChange={(e) => setOldPwd(e.target.value)}
      />

      <input
        type="password"
        placeholder="New Password"
        value={newPwd}
        onChange={(e) => setNewPwd(e.target.value)}
      />

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPwd}
        onChange={(e) => setConfirmPwd(e.target.value)}
      />

      <button onClick={submit}>Update Password</button>
    </div>
  );
}
