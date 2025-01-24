
class ProfileManager {
  constructor() {
    this.profileForm = document.getElementById("profileForm");
    this.submitAlert = document.getElementById("submitAlert");
    this.proposalsContent = document.getElementById("proposalsContent");
    this.proposalsLoading = document.getElementById("proposalsLoading");
    this.userType = JSON.parse(localStorage.getItem("userData")).userType;
    this.userData = null;

    this.initialize();
  }

  async initialize() {
    try {
      await this.loadUserProfile();
      this.setupEventListeners();
      this.setupTabSwitching();
    } catch (error) {
      console.error("Failed to initialize profile:", error);
      this.showAlert("Failed to load profile data", "error");
    }
  }

  async loadUserProfile() {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData) throw new Error("User data not found in local storage.");

    let apiUrl = "";
    if (userData.userType === "customer") {
      apiUrl = `http://localhost/Najeekai/api/customer.php?id=${userData.id}`;
    } else if (userData.userType === "freelancer") {
      apiUrl = `http://localhost/Najeekai/api/freelancer.php?id=${userData.id}`;
    }

    try {
      const response = await AuthHandler.makeAuthenticatedRequest(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

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
        if (field === "username" || field === "email") {
          input.readOnly = true;
          input.classList.add("bg-gray-100");
        }
      }
    });
  }

  updateHeaderInfo() {
    if (!this.userData) return;

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
      await this.handleProfileUpdate();
    });

    const logoutButton = document.querySelector(
      "button i.fa-sign-out-alt"
    )?.parentElement;

    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        AuthHandler.clearAuth();
        window.location.href = "login.html";
      });
    }

    const newPostBtn = document.getElementById("newPostBtn");
    const postForm = document.getElementById("postForm");
    const cancelPostBtn = document.getElementById("cancelPost");

    if (newPostBtn && postForm && cancelPostBtn) {
      newPostBtn.addEventListener("click", () => {
        postForm.classList.remove("hidden");
      });

      cancelPostBtn.addEventListener("click", () => {
        postForm.classList.add("hidden");
      });
    }
  }

  setupTabSwitching() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remove active classes from all buttons
        tabButtons.forEach((btn) => {
          btn.classList.remove(
            "text-blue-600",
            "border-b-2",
            "border-blue-600"
          );
          btn.classList.add("text-gray-500");
        });

        // Add active classes to clicked button
        button.classList.add("text-blue-600", "border-b-2", "border-blue-600");
        button.classList.remove("text-gray-500");

        // Hide all tab contents
        tabContents.forEach((content) => {
          content.classList.add("hidden");
        });

        // Show selected tab content
        const tabId = button.getAttribute("data-tab");

        const TabContent = document.getElementById(tabId);
        if (TabContent) {
          TabContent.classList.remove("hidden");
          if (tabId === "proposal") {
            loadProposals();
          }
        }
      });
    });

    if (this.userType === "freelancer") {
      const postTab = document.getElementById("postTab");
      if (postTab) postTab.classList.add("hidden");
    }
  }

  async handleProfileUpdate() {
    const formData = new FormData(this.profileForm);
    const updatedData = {};

    formData.forEach((value, key) => {
      updatedData[key] = value;
    });

    const apiUrl =
      this.userType === "customer"
        ? `http://localhost/Najeekai/api/customer.php`
        : `http://localhost/Najeekai/api/freelancer.php`;

    try {
      const response = await AuthHandler.makeAuthenticatedRequest(apiUrl, {
        method: "POST",
        body: JSON.stringify(updatedData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        this.showAlert("Profile updated successfully", "success");
        await this.loadUserProfile();
      } else {
        throw new Error(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      this.showAlert("Failed to update profile", "error");
    }
  }
}

// Initialize the ProfileManager when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  new ProfileManager();
});
