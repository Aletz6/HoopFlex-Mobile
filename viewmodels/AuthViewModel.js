import { loginUser, logoutUser, getFirebaseToken, registerUser } from "../services/FirebaseService";

class AuthViewModel {
  async login(email, password) {
    try {
      await loginUser(email, password);
      const token = await getFirebaseToken();
      return { success: true, token };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: error.message || "Login failed" };
    }
  }

  async logout() {
    try {
      await logoutUser();
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, message: error.message || "Logout failed" };
    }
  }

  async register(email, password) {
    try {
      await registerUser(email, password);
      const token = await getFirebaseToken();
      return { success: true, token };
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, message: error.message || "Registration failed" };
    }
  }
}

export default new AuthViewModel();
