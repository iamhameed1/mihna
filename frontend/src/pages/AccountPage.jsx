function AccountPage({ currentUser }) {
  if (!currentUser) {
    return (
      <div className="error-box">
        <p>Please login to view your account.</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-title">
        <p>Account</p>
        <h1>My Account</h1>
        <span>Your Mihna account information.</span>
      </div>

      <div className="account-card">
        <div className="account-row">
          <span>Name</span>
          <strong>{currentUser.name}</strong>
        </div>

        <div className="account-row">
          <span>Email</span>
          <strong>{currentUser.email}</strong>
        </div>

        <div className="account-row">
          <span>Role</span>
          <strong>{currentUser.role}</strong>
        </div>
      </div>
    </>
  );
}

export default AccountPage;