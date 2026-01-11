import { useState, useRef, useEffect } from "react";
import {
  FaUserShield,
  FaKey,
  FaUserPlus,
  FaSignOutAlt
} from "react-icons/fa";
import "./UserMenu.css";

function UserMenu({
  user,
  onLogout,
  onChangePassword,
  onCreateUser,
  forceChangePassword
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // ✅ Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      <button
        className="icon-btn user-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        title="User Menu"
      >
        <FaUserShield />
      </button>

      {open && (
        <div className="user-menu-dropdown">
          {/* USER INFO */}
          <div className="user-info">
            <div className="user-avatar">
              <FaUserShield />
            </div>
            <div>
              <div className="user-name">{user.Username}</div>
              <div className="user-role">{user.Role}</div>
            </div>
          </div>

          <div className="menu-divider" />

          {/* Change Password */}
          <div
            className="user-menu-item"
            onClick={() => {
              setOpen(false);
              onChangePassword();
            }}
          >
            <FaKey className="menu-icon" />
            <span>Change Password</span>
          </div>

          {/* Create User (Admin only) */}
          {user.Role === "Admin" && !forceChangePassword && (
            <div
              className="user-menu-item"
              onClick={() => {
                setOpen(false);
                onCreateUser();
              }}
            >
              <FaUserPlus className="menu-icon" />
              <span>Create User</span>
            </div>
          )}

          <div className="menu-divider" />

          {/* Logout */}
          <div
            className={`user-menu-item logout ${
              forceChangePassword ? "disabled" : ""
            }`}
            onClick={() => {
              if (!forceChangePassword) {
                setOpen(false);
                onLogout();
              }
            }}
          >
            <FaSignOutAlt className="menu-icon" />
            <span>Logout</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
