class Login {
  String email;
  String password;

  Login(this.email, this.password) {
    if (email.isEmpty) {
      throw Exception("Email is required");
    }
    if (password.isEmpty) {
      throw Exception("Password is required");
    }

    email = email;
    password = password;
  }


  getEmail() {
    return email;
  }

  getPassword() {
    return password;
  }

  setEmail(String email) {
    if (email.isEmpty) {
      throw Exception("Email is required");
    }
    this.email = email;
  }

  setPassword(String password) {
    if (password.isEmpty) {
      throw Exception("Password is required");
    }
    this.password = password;
  }

}
