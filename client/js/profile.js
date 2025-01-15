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
      // this.showAlert(error.message || "Failed to update profile", "error");
    }
  }

  // showAlert(message, type = "success") {
  //   this.submitAlert.className =
  //     "rounded-md p-4 mb-4 " +
  //     (type === "success"
  //       ? "bg-green-100 text-green-700"
  //       : "bg-red-100 text-red-700");
  //   this.submitAlert.textContent = message;
  //   this.submitAlert.classList.remove("hidden");

  //   // Hide alert after 5 seconds
  //   setTimeout(() => {
  //     this.submitAlert.classList.add("hidden");
  //   }, 5000);
  // }
}

// Initialize profile manager when document is ready
document.addEventListener("DOMContentLoaded", () => {
  new ProfileManager();
});

// Search functionality
document.addEventListener("DOMContentLoaded", function () {
  console.log("Search functionality loaded");
  const searchInput = document.getElementById("searchInput");
  console.log("Search input:", searchInput);
  const searchResults = document.getElementById("searchResults");
  let debounceTimer;

  // Get user type from localStorage
  function getUserType() {
    try {
      const userData = localStorage.getItem("userData");
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.userType;
      }
    } catch (error) {
      console.error("Error getting user type:", error);
    }
    return null;
  }

  // Update placeholder based on user type
  function updatePlaceholder() {
    const userType = getUserType();
    searchInput.placeholder =
      userType === "customer"
        ? "Search for skilled professionals..."
        : "Search for available jobs...";
  }

  // Create freelancer result card
  function createFreelancerCard(freelancer) {
    return `
          <div class="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-200">
              <div class="flex items-center space-x-4">
                  <div class="flex-shrink-0">
                      <i class="fas fa-user-circle text-gray-400 text-3xl"></i>
                  </div>
                  <div class="flex-1">
                      <h3 class="text-lg font-medium text-gray-900">${
                        freelancer.name
                      }</h3>
                      <p class="text-sm text-gray-500">${freelancer.skills}</p>
                      <div class="mt-1 flex items-center text-sm text-gray-500">
                          <i class="fas fa-star text-yellow-400 mr-1"></i>
                          <span>${freelancer.rating || "4.5"}</span>
                          <span class="mx-2">•</span>
                          <i class="fas fa-map-marker-alt mr-1"></i>
                          <span>${freelancer.location}</span>
                      </div>
                  </div>
              </div>
          </div>
      `;
  }

  // Create post result card
  function createPostCard(post) {
    return `
          <div class="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">${post.caption}</h3>
              <p class="mt-1 text-sm text-gray-500 line-clamp-2">${post.description}</p>
              <div class="mt-2 flex items-center text-sm text-gray-500">
                  <i class="fas fa-coins mr-1"></i>
                  <span class="mr-4">$${post.rate}/hr</span>
                  <i class="fas fa-clock mr-1"></i>
                  <span class="mr-4">${post.estimatedTime} hours</span>
                  <i class="fas fa-map-marker-alt mr-1"></i>
                  <span>${post.location}</span>
              </div>
              <div class="mt-2">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      ${post.requiredSkills}
                  </span>
              </div>
          </div>
      `;
  }

  // Show loading state
  function showLoading() {
    searchResults.innerHTML = `
          <div class="p-4 text-center text-gray-500">
              <i class="fas fa-spinner fa-spin mr-2"></i>
              Searching...
          </div>
      `;
    searchResults.classList.remove("hidden");
  }

  // Show no results state
  function showNoResults(searchTerm) {
    searchResults.innerHTML = `
          <div class="p-4 text-center text-gray-500">
              No results found for "${searchTerm}"
          </div>
      `;
    searchResults.classList.remove("hidden");
  }

  // Handle search
  async function handleSearch() {
    const searchTerm = searchInput.value.trim();
    const userType = getUserType();

    if (searchTerm.length < 2) {
      searchResults.classList.add("hidden");
      return;
    }

    showLoading();

    try {
      const endpoint =
        userType === "customer"
          ? `http://localhost/Najeekai/api/freelancer.php?skill=${searchTerm}`
          : `http://localhost/Najeekai/api/post.php?term=${searchTerm}`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.status === "success" && data.data.length > 0) {
        const resultsHTML = data.data
          .map((item) =>
            userType === "customer"
              ? createFreelancerCard(item)
              : createPostCard(item)
          )
          .join("");
        searchResults.innerHTML = resultsHTML;
        searchResults.classList.remove("hidden");
      } else {
        showNoResults(searchTerm);
      }
    } catch (error) {
      console.error("Search error:", error);
      searchResults.innerHTML = `
              <div class="p-4 text-center text-red-500">
                  An error occurred while searching. Please try again.
              </div>
          `;
      searchResults.classList.remove("hidden");
    }
  }

  // Event listeners
  searchInput.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(handleSearch, 300);
  });

  // Close search results when clicking outside
  document.addEventListener("click", function (event) {
    if (
      !searchInput.contains(event.target) &&
      !searchResults.contains(event.target)
    ) {
      searchResults.classList.add("hidden");
    }
  });

  // Initial placeholder update
  updatePlaceholder();
});
