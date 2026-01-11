import React, { useState } from "react";
import "./Modal.css";

export default function ChangePasswordModal({
  user,
  sendToCSharp,
  onClose
}) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    setError("");

    if (!oldPwd || !newPwd || !confirmPwd) {
      setError("All fields are required");
      return;
    }

    if (newPwd !== confirmPwd) {
      setError("New passwords do not match");
      return;
    }

    sendToCSharp("ChangePassword", {
      userId: user.Id,
      oldPassword: oldPwd,
      newPassword: newPwd
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        {/* HEADER */}
        <div className="modal-header">
          <h3>Change Password</h3>
        </div>

        {/* BODY */}
        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}

          <div className="form-group">
            <label>Old Password</label>
            <input
              type="password"
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
  <button
    className="btn-submit small secondary"
    onClick={onClose}
  >
    Cancel
  </button>

  <button
    className="btn-submit small"
    onClick={submit}
  >
    Update Password
  </button>
</div>

      </div>
    </div>
  );
}
