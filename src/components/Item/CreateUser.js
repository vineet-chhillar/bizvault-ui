function CreateUser({ sendToCSharp }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Staff");

  return (
    <div>
      <h3>Create User</h3>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Temporary Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option>Admin</option>
        <option>Accountant</option>
        <option>Staff</option>
        <option>Viewer</option>
      </select>

      <button
        onClick={() =>
          sendToCSharp("CreateUser", { username, password, role })
        }
      >
        Create User
      </button>
    </div>
  );
}
