export default function Dashboard() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      <p>✅ You are now a paid user</p>

      <div style={{ marginTop: 20 }}>
        <h3>Your System</h3>
        <ul>
          <li>Leads: Active</li>
          <li>Payments: Connected</li>
          <li>Automation: Running</li>
        </ul>
      </div>
    </div>
  );
}