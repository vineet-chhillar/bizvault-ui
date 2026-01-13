import React, { useEffect, useState } from "react";
import { FaUsers } from "react-icons/fa";
import "./UserList.css";
import { hasPermission } from "../../utils/Permissions";
import { PERMISSIONS } from "../../utils/PermissionKeys";


export default function UserList({ sendToCSharp, user }) {
  const [users, setUsers] = useState([]);
const canManageUsers =
  user?.Role === "Admin" ||
  hasPermission(user, PERMISSIONS.USERS);

  useEffect(() => {
    sendToCSharp("GetUsers", {});
  }, [sendToCSharp]);

  window.__onUsersLoaded = (data) => {
    setUsers(data);
  };

  const toggleUser = (u) => {
    sendToCSharp("SetUserStatus", {
      userId: u.Id,
      isActive: !u.IsActive
    });
  };


  return (
    <div className="userlist-container">
      <div className="userlist-title">
        <FaUsers />
        User Management
      </div>

      <div className="userlist-table-container">
        <table className="userlist-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            
            {users.length === 0 && (
              <tr>
                <td colSpan="4" className="userlist-empty">
                  No users found
                </td>
              </tr>
            )}

            {users.map((u) => (
                
              <tr key={u.Id}>
                <td>{u.Username}</td>
                <td>{u.Role}</td>


                <td>{u.IsActive ? "Active" : "Disabled"}</td>
                
              {/*}  <td>
  {u.Id !== user.Id && hasPermission(user, PERMISSIONS.USERS) && (
  <button
    className="btn-submit small"
    onClick={() => toggleUser(u)}
  >
    {u.IsActive ? "Disable" : "Enable"}
  </button>
)}

</td>*/}
<td>
  
    <td className="userlist-action-cell">
  <button
    className="btn-submit small userlist-action-btn"
    disabled={
      u.Id === user.Id ||
      !(user?.Role === "Admin" || hasPermission(user, PERMISSIONS.USERS))
    }
    onClick={() => toggleUser(u)}
    title={
      u.Id === user.Id
        ? "You cannot disable your own account"
        : !(user?.Role === "Admin" || hasPermission(user, PERMISSIONS.USERS))
        ? "You do not have permission to manage users"
        : ""
    }
  >
    {u.IsActive ? "Disable" : "Enable"}
  </button>
</td>


  
</td>



              </tr>
              
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
