// posts.js
// Add this at the start of your file with other constants
let isEditing = false;
let editingPostId = null;

// Update the form reset function
function resetForm() {
  isEditing = false;
  editingPostId = null;
  postForm.reset();
  postForm.classList.add("hidden");
  const submitBtn = postForm.querySelector('button[type="submit"]');
  submitBtn.textContent = "Create Post";
  const formTitle = postForm.querySelector("h3");
  formTitle.textContent = "Create New Post";
}
// Base URL for API endpoints
const API_BASE_URL = "http://localhost/Najeekai/api";

const customerId = JSON.parse(localStorage.getItem("userData")).id;

// Get user data from localStorage
const user = JSON.parse(localStorage.getItem("userData"));
const userType = user ? user.userType : null;

// DOM Elements
const postsContainer = document.querySelector(".grid.grid-cols-1.gap-4");
const newPostBtn = document.getElementById("newPostBtn");
const postForm = document.getElementById("postForm");
const cancelPostBtn = document.getElementById("cancelPost");

// Show/hide elements based on user type
if (userType !== "customer") {
  newPostBtn.style.display = "none";
}

// Initialize posts display
document.addEventListener("DOMContentLoaded", () => {
  fetchPosts();
  setupEventListeners();
});

function setupEventListeners() {
  // Form submission for new post
  postForm.addEventListener("submit", handlePostSubmission);

  // Cancel button
  cancelPostBtn.addEventListener("click", () => {
    postForm.classList.add("hidden");
    postForm.reset();
  });

  // Sort selection
  document.querySelector("select").addEventListener("change", (e) => {
    const sortBy = e.target.value;
    fetchPosts(sortBy);
  });
}

async function fetchPosts(sortBy = "Latest") {
  try {
    let url = `${API_BASE_URL}/post.php`;
    if (userType === "Customer") {
      url += `?customerId=${customerId}`;
    }

    const response = await fetch(url);
    const result = await response.json();

    if (result.status === "success") {
      let posts = result.data;

      // Sort posts based on selection
      switch (sortBy) {
        case "Oldest":
          posts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case "Budget":
          posts.sort((a, b) => b.rate - a.rate);
          break;
        default: // Latest
          posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      displayPosts(posts);
    } else {
      showAlert("Failed to fetch posts", "error");
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    showAlert("Error loading posts", "error");
  }
}

function displayPosts(posts) {
  postsContainer.innerHTML = "";

  posts.forEach((post) => {
    const postElement = createPostElement(post);
    postsContainer.appendChild(postElement);
  });
}

function createPostElement(post) {
  const div = document.createElement("div");
  div.className =
    "bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow";
  let skills = [];
  try {
    skills = JSON.parse(post.requiredSkills);
  } catch (e) {
    console.warn("Could not parse skills:", e);
    // If parsing fails, try to use it as is or default to empty array
    skills = post.requiredSkills || [];
  }

  const isCustomer = userType === "customer" && post.customerId === customerId;

  // Create the HTML structure
  div.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <h3 class="text-xl font-semibold">${post.caption}</h3>
                <p class="text-gray-600 mt-2">${post.description}</p>
            </div>
            ${
              isCustomer
                ? `
                <div class="flex space-x-2">
                    <button class="edit-btn p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `
                : ""
            }
        </div>
        <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span class="text-sm font-medium text-gray-500">Required Skills</span>
                <div class="flex flex-wrap gap-2 mt-1">
                    ${
                      Array.isArray(skills)
                        ? skills
                            .map(
                              (skill) => `
                            <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                ${skill}
                            </span>
                        `
                            )
                            .join("")
                        : '<p class="text-sm">No skills specified</p>'
                    }
                </div>
            </div>
            <div>
                <span class="text-sm font-medium text-gray-500">Location</span>
                <p class="text-sm">${post.location}</p>
            </div>
            <div>
                <span class="text-sm font-medium text-gray-500">Estimated Time</span>
                <p class="text-sm">${post.estimatedTime} hours</p>
            </div>
            <div>
                <span class="text-sm font-medium text-gray-500">Rate</span>
                <p class="text-sm">$${post.rate}/hr</p>
            </div>
        </div>
    `;

  // Add event listeners if customer buttons exist
  if (isCustomer) {
    // Add edit button event listener
    const editBtn = div.querySelector(".edit-btn");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        editPost(post.id);
      });
    }

    // Add delete button event listener
    const deleteBtn = div.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        deletePost(post.id);
      });
    }
  }

  return div;
}
async function handlePostSubmission(e) {
  e.preventDefault();

  // Get form values using IDs
  const caption = document.getElementById("postCaption").value;
  const description = document.getElementById("postDescription").value;
  const requiredSkills = document.getElementById("postRequiredSkills").value;
  const location = document.getElementById("postLocation").value;
  const estimatedTime = document.getElementById("postEstimatedTime").value;
  const rate = document.getElementById("postRate").value;

  // Format required skills as array string
  const skillsArray = requiredSkills.split(",").map((skill) => skill.trim());
  const skillsString = JSON.stringify(skillsArray);

  const formData = {
    caption,
    description,
    requiredSkills: skillsString, // Now properly formatted as ["skill1","skill2",...]
    location,
    estimatedTime: parseInt(estimatedTime),
    rate: parseInt(rate),
    customerId,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/post.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    fetchPosts();

    if (result.status === "success") {
      showAlert("Post created successfully", "success");
      postForm.classList.add("hidden");
      postForm.reset();
      fetchPosts();
    } else {
      showAlert(result.message || "Failed to create post", "error");
    }
  } catch (error) {
    console.error("Error creating post:", error);
    showAlert("Error creating post", "error");
  }
}

async function deletePost(postId) {
  if (!confirm("Are you sure you want to delete this post?")) return;

  try {
    const response = await fetch(`${API_BASE_URL}/post.php?id=${postId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (result.status === "success") {
      showAlert("Post deleted successfully", "success");
      fetchPosts();
    } else {
      showAlert(result.message || "Failed to delete post", "error");
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    showAlert("Error deleting post", "error");
  }
}

// Add this at the top with other DOM elements
const submitButton = document.querySelector('button[type="submit"]');
const formTitle = document.querySelector("#postForm h3");
let isEditMode = false;
let editPostId = null;
const postFormContainer = document.getElementById("postForm"); // Container div
const postFormElement = document.querySelector("#postForm form"); // Actual form element

function setupEventListeners() {
    // Form submission handler - use postFormElement instead of postForm
    postFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isEditMode) {
            await updatePost(editPostId);
        } else {
            await handlePostSubmission(e);
        }
    });

    // Cancel button
    cancelPostBtn.addEventListener('click', () => {
        resetForm();
    });

    // Sort selection
    document.querySelector('select').addEventListener('change', (e) => {
        const sortBy = e.target.value;
        fetchPosts(sortBy);
    });
}

function resetForm() {
    postFormElement.reset(); // Use the actual form element
    postFormContainer.classList.add('hidden'); // Hide the container
    isEditMode = false;
    editPostId = null;
    formTitle.textContent = 'Create New Post';
    submitButton.textContent = 'Create Post';
}

async function editPost(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/post.php?id=${postId}`);
        const result = await response.json();

        if (result.status === 'success') {
            const post = result.data;
            isEditMode = true;
            editPostId = postId;

            // Parse the skills string back to array and join with commas
            let skills = post.requiredSkills;
            try {
                skills = JSON.parse(post.requiredSkills).join(', ');
            } catch (e) {
                console.warn('Could not parse skills JSON:', e);
            }

            // Update form UI
            formTitle.textContent = 'Edit Post';
            submitButton.textContent = 'Update Post';

            // Fill the form with post data
            document.getElementById('postCaption').value = post.caption;
            document.getElementById('postDescription').value = post.description;
            document.getElementById('postRequiredSkills').value = skills;
            document.getElementById('postLocation').value = post.location;
            document.getElementById('postEstimatedTime').value = post.estimatedTime;
            document.getElementById('postRate').value = post.rate;

            // Show the form
            postFormContainer.classList.remove('hidden');
            postFormContainer.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error fetching post for edit:', error);
        showAlert('Error loading post data', 'error');
    }
}

async function updatePost(postId) {
    const formData = {
        id: postId,
        caption: document.getElementById('postCaption').value,
        description: document.getElementById('postDescription').value,
        requiredSkills: JSON.stringify(
            document.getElementById('postRequiredSkills').value
                .split(',')
                .map(skill => skill.trim())
        ),
        location: document.getElementById('postLocation').value,
        estimatedTime: parseInt(document.getElementById('postEstimatedTime').value),
        rate: parseInt(document.getElementById('postRate').value),
        customerId: customerId
    };

    try {
        const response = await fetch(`${API_BASE_URL}/post.php`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.status === 'success') {
            showAlert('Post updated successfully', 'success');
            resetForm();
            fetchPosts();
        } else {
            showAlert(result.message || 'Failed to update post', 'error');
        }
    } catch (error) {
        console.error('Error updating post:', error);
        showAlert('Error updating post', 'error');
    }
}


function handleUpdateResponse(result) {
  if (result.status === "success") {
    showAlert("Post updated successfully", "success");
    postForm.classList.add("hidden");
    postForm.reset();
    fetchPosts();
  } else {
    showAlert(result.message || "Failed to update post", "error");
  }
}

function showAlert(message, type) {
  const alertDiv = document.createElement("div");
  alertDiv.className = `fixed top-4 right-4 p-4 rounded-lg ${
    type === "success" ? "bg-green-500" : "bg-red-500"
  } text-white`;
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
}
