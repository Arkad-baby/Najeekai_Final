// profile.js
class ProfileManager {
  constructor() {
    this.profileForm = document.getElementById("profileForm");
    this.submitAlert = document.getElementById("submitAlert");
    this.userType = JSON.parse(localStorage.getItem("userData")).userType;
    this.userData = null;

    this.initialize();
  }

  async initialize() {
    try {
      await this.loadUserProfile();
      this.setupEventListeners();
    } catch (error) {
      console.error("Failed to initialize profile:", error);
      this.showAlert("Failed to load profile data", "error");
    }
  }

  async loadUserProfile() {
    console.log("Loading user profile...");
    console.log(localStorage.getItem("authToken"));
    try {
      const response = await AuthHandler.makeAuthenticatedRequest(
        "/Najeekai/api/customer.php",
        {
          method: "GET",
          headers: {
            // 'Content-Type': 'application/json',
            // authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }

      const result = await response.json();
      this.userData = result.data;
      this.populateProfileData();
      this.updateHeaderInfo();
    } catch (error) {
      console.error("Error loading profile:", error);
      throw error;
    }
  }

  populateProfileData() {
    if (!this.userData) return;

    // Update form fields
    const fields = [
      "firstName",
      "lastName",
      "middleName",
      "username",
      "email",
      "phoneNumber",
    ];
    fields.forEach((field) => {
      const input = this.profileForm.querySelector(`[name="${field}"]`);
      if (input) {
        input.value = this.userData[field] || "";
        // Make username and email readonly as they shouldn't be changed
        if (field === "username" || field === "email") {
          input.readOnly = true;
          input.classList.add("bg-gray-100");
        }
      }
    });
  }

  updateHeaderInfo() {
    if (!this.userData) return;

    // Update profile header information
    const nameElement = document.querySelector(".text-white .text-3xl");
    const usernameElement = document.querySelector(".text-white .text-lg");

    if (nameElement) {
      nameElement.textContent = `${this.userData.firstName} ${this.userData.lastName}`;
    }
    if (usernameElement) {
      usernameElement.textContent = `@${this.userData.username}`;
    }
  }

  setupEventListeners() {
    this.profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleProfileUpdate(e);
    });

    // Handle logout
    const logoutButton = document.querySelector(
      "button i.fa-sign-out-alt"
    ).parentElement;
    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        AuthHandler.clearAuth();
      });
    }
  }

  async handleProfileUpdate(event) {
    const formData = new FormData(event.target);
    const profileData = Object.fromEntries(formData);

    // Add the user ID to the update data
    profileData.id = this.userData.id;

    try {
      const response = await AuthHandler.makeAuthenticatedRequest(
        "http://localhost/Najeekai/api/customer.php",
        {
          method: "PUT",
          body: JSON.stringify(profileData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      const result = await response.json();
      this.showAlert("Profile updated successfully", "success");

      // Reload the profile data to show updated information
      await this.loadUserProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      this.showAlert(error.message || "Failed to update profile", "error");
    }
  }

  showAlert(message, type = "success") {
    this.submitAlert.className =
      "rounded-md p-4 mb-4 " +
      (type === "success"
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700");
    this.submitAlert.textContent = message;
    this.submitAlert.classList.remove("hidden");

    // Hide alert after 5 seconds
    setTimeout(() => {
      this.submitAlert.classList.add("hidden");
    }, 5000);
  }
}

// Initialize profile manager when document is ready
document.addEventListener("DOMContentLoaded", () => {
  new ProfileManager();
});
