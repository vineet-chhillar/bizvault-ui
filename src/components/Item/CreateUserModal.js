import React, { useState } from "react";
import "./Modal.css";

export default function CreateUserModal({
  sendToCSharp,
  onClose
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Staff");
  const [error, setError] = useState("");

  const submit = () => {
    setError("");

    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    sendToCSharp("CreateUser", {
      username,
      password,
      role
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        {/* HEADER */}
        <div className="modal-header">
          <h3>Create User</h3>
        </div>

        {/* BODY */}
        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}

          <div className="form-group">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Temporary Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Admin">Admin</option>
              <option value="Accountant">Accountant</option>
              <option value="Staff">Staff</option>
              <option value="Viewer">Viewer</option>
            </select>
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
            Create User
          </button>
        </div>
      </div>
    </div>
  );
}
