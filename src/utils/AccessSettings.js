import { useEffect, useState } from "react";
import { hasPermission } from "./Permissions";
import { PERMISSIONS } from "./PermissionKeys";
import { session } from "./Session";
import "./AccessSettings.css";
const ROLES = ["Admin", "Accountant", "Staff", "Viewer"];
const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export default function AccessSettings() {
  const user = session.user;

  const [role, setRole] = useState("Admin");
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
const isAdminRole = role === "Admin";

  useEffect(() => {
    function handleMessage(e) {
      const msg = e.data;

      switch (msg.Type) {
        case "LoadRolePermissions":
          if (msg.Status === "Success") {
            setPermissions(msg.Data.Permissions || {});
            if (msg.Data.Role === session.user.Role) {
              session.user.permissions = msg.Data.Permissions;
              session.user.permissionVersion = msg.Data.PermissionVersion;
            }
          }
          setLoading(false);
          break;

        case "SaveRolePermissions":
          if (msg.Status === "Success") {
            alert("Role Permissions Saved Successfully");
          }
          setLoading(false);
          break;

        case "ResetRolePermissions":
          if (msg.Status === "Success") {
            alert("Role Reset to Default completed Successfully");
            loadRolePermissions(role);
          }
          break;

        default:
          break;
      }
    }

    window.chrome.webview.addEventListener("message", handleMessage);
    loadRolePermissions(role);

    return () => {
      window.chrome.webview.removeEventListener("message", handleMessage);
    };
  }, [role]);

  function loadRolePermissions(selectedRole) {
    setLoading(true);
    window.chrome.webview.postMessage({
      Action: "LoadRolePermissions",
      Payload: { role: selectedRole }
    });
  }

  function togglePermission(key) {
    setPermissions(p => ({
      ...p,
      [key]: !p[key]
    }));
  }

  function savePermissions() {
    setLoading(true);
    window.chrome.webview.postMessage({
      Action: "SaveRolePermissions",
      Payload: { role, permissions }
    });
  }

  function resetPermissions() {
    if (!window.confirm("Reset permissions to default?")) return;
    window.chrome.webview.postMessage({
      Action: "ResetRolePermissions",
      Payload: { role }
    });
  }

  if (!hasPermission(user, PERMISSIONS.SETTINGS)) {
    return <h3>Access Denied</h3>;
  }

  return (
    <div style={{ padding: 20 }}>

      <h2 className="form-title access-settings-title">
  <span className="access-icon">🔐</span>
  Access Settings
</h2>


      {/* ✅ DROPDOWN — wrapped in customer-section */}
      <div className="access-settings-role">
  <label htmlFor="roleSelect">Select Role</label>

  <select
    id="roleSelect"
    value={role}
    onChange={e => setRole(e.target.value)}
  >
    {ROLES.map(r => (
      <option key={r} value={r}>
        {r}
      </option>
    ))}
  </select>
</div>


      <hr />

      {/* Permissions (kept simple, no CSS change requested) */}
      <div className="access-settings-permissions">
  {ALL_PERMISSIONS.map(key => (
    <label
      key={key}
      className={isAdminRole ? "readonly" : ""}
      title={isAdminRole ? "Admin permissions are fixed" : ""}
    >
      <input
        type="checkbox"
        checked={!!permissions[key]}
        disabled={isAdminRole}   // ✅ IMPORTANT
        onChange={() => togglePermission(key)}
      />
      <span>{key}</span>
    </label>
  ))}
</div>



      <br />

      {/* ✅ BUTTONS — wrapped in inventory-btns */}
      <div className="inventory-btns">
        <button
          type="submit"
          className="btn-submit small"
          onClick={savePermissions}
          disabled={loading}
        >
          Save
        </button>

        <button
          type="button"
          className="btn-submit small"
          onClick={resetPermissions}
          disabled={loading}
        >
          Reset to Default
        </button>
      </div>

    </div>
  );
}
