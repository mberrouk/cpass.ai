// Main application logic
// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let currentUser = null;
let currentTaskContext = null;
let selectedRatingValue = 0;

let phoneNumber = "";

// Task creation state
let taskCreationState = {
  categoryId: null,
  categoryName: null,
  jobId: null,
  jobTitle: null,
  currentStep: 1,
};

// Get Telegram user info
const telegramUser = tg.initDataUnsafe?.user;
console.log("Telegram user:", telegramUser);

// Menu items configuration
const MENU_ITEMS = {
  // Unauthenticated actions
  signup_worker: {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
    title: "Register as Worker",
    subtitle: "Complete CPASS onboarding",
    requiresAuth: false,
    requiresGuest: true,
    action: async () => {
      try {
        // Generate auth token for secure access
        const token = await API.generateAuthToken(telegramUser.id, phoneNumber);
        tg.showAlert(`Redirecting to CPASS registration... ${token}`);
        window.location.href = `${API.CPASS_URL}/signup/basic-info-telegram?token=${token}`;
      } catch (error) {
        console.error("Failed to generate token:", error);
        tg.showAlert("Failed to start registration. Please try again.");
      }
    },
  },
  signup_supervisor: {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>`,
    title: "Register as Supervisor",
    subtitle: "Create supervisor account",
    requiresAuth: false,
    requiresGuest: true,
    action: () => {
      showRegistrationForm("supervisor");
    },
  },

  // Worker-only actions
  view_profile: {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    title: "My Profile",
    subtitle: "View your career passport",
    requiresAuth: true,
    roles: ["worker"],
    action: async () => {
      try {
        // Generate auth token for secure access
        // const token = await API.generateAuthToken(
        //   currentUser.telegram_id,
        //   phoneNumber
        // );
        const userId = await API.getUser(currentUser.telegram_id).then(
          (data) => data.user_id
        );
        window.location.href = `${API.CPASS_URL}/worker-profile/${userId}`;
      } catch (error) {
        console.error("Failed to generate token:", error);
        tg.showAlert("Failed to open profile. Please try again.");
      }
    },
  },
  my_tasks: {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1"></rect></svg>`,
    title: "My Tasks",
    subtitle: "View assigned tasks",
    requiresAuth: true,
    roles: ["worker"],
    action: () => {
      showTasksView("worker");
    },
  },
  my_skills: {
    // TODO: Update name
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    title: "Opportunities",
    subtitle: "Jobs You Can Apply For",
    requiresAuth: true,
    roles: ["worker"],
    action: async () => {
      const userId = await API.getUser(currentUser.telegram_id).then(
        (data) => data.user_id
      );
      window.location.href = `${API.CPASS_URL}/worker-profile/${userId}?tab=opportunities`;
      // window.location.href = `${API.CPASS_URL}/profile/roadmap?telegram_id=${currentUser.telegram_id}`;
    },
  },

  progress: {
    // TODO: Update name
    icon: `  <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
       xmlns="http://www.w3.org/2000/svg">
    <circle
      cx="12" cy="12" r="10"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-dasharray="30 70">
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 12 12"
        to="360 12 12"
        dur="1.2s"
        repeatCount="indefinite" />
    </circle>

    <path
      d="M8.5 12.5L11 15L16 9.5"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round" />
  </svg>`,
    title: "Progress",
    subtitle: "Verification History",
    requiresAuth: true,
    roles: ["worker"],
    action: async () => {
      const userId = await API.getUser(currentUser.telegram_id).then(
        (data) => data.user_id
      );
      window.location.href = `${API.CPASS_URL}/worker-profile/${userId}?tab=progress`;
      // window.location.href = `${API.CPASS_URL}/profile/roadmap?telegram_id=${currentUser.telegram_id}`;
    },
  },
  roadmap: {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>`,
    title: "Roadmap",
    subtitle: "View career path",
    requiresAuth: true,
    roles: ["worker"],
    action: async () => {
      const userId = await API.getUser(currentUser.telegram_id).then(
        (data) => data.user_id
      );
      window.location.href = `${API.CPASS_URL}/worker-profile/${userId}?tab=pathways`;
      // window.location.href = `${API.CPASS_URL}/profile/roadmap?telegram_id=${currentUser.telegram_id}`;
    },
  },

  // Supervisor-only actions
  create_task: {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    title: "Create Task",
    subtitle: "Post new work task",
    requiresAuth: true,
    roles: ["supervisor"],
    action: () => {
      showCreateTaskForm();
    },
  },
  manage_tasks: {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
    title: "Manage Tasks",
    subtitle: "View all your tasks",
    requiresAuth: true,
    roles: ["supervisor"],
    action: () => {
      showTasksView("supervisor");
    },
  },
  manage_workers: {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    title: "Workers",
    subtitle: "View supervised workers",
    requiresAuth: true,
    roles: ["supervisor"],
    action: () => {
      showWorkersView();
    },
  },
  supervisor_profile: {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    title: "My Profile",
    subtitle: "View supervisor profile",
    requiresAuth: true,
    roles: ["supervisor"],
    action: () => {
      showSupervisorProfile();
    },
  },

  // Common authenticated actions
  // logout: {
  //   icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
  //   title: "Logout",
  //   subtitle: "Sign out",
  //   requiresAuth: true,
  //   roles: ["worker", "supervisor"],
  //   action: () => {
  //     handleLogout();
  //   },
  // },
};

// Initialize app
async function init() {
  if (!telegramUser) {
    tg.showAlert("Please open this app from Telegram");
    return;
  }

  // Try to get existing user
  try {
    const data = await API.getUser(telegramUser.id);
    console.log("User data:", data);
    phoneNumber = data.phone_number;

    if (data.exists) {
      // User exists - check if they have shared contact
      // TODO: This can be removed once CPASS integration is complete!
      if (!data.phone_number) {
        tg.showAlert(
          "⚠️ Please share your contact with the bot first.\n\nUse /start in the bot to share your contact."
        );
        return;
      }

      currentUser = data;
      // MENU_ITEMS.phone_number = data.phone_number;
      // console.log("MENU_ITEMS.phone_number", MENU_ITEMS.phone_number);
      currentUser.telegram_id = telegramUser.id;
      document.getElementById("loading-screen").classList.add("hidden");
      renderDashboard();
    } else if (!data.phone_number) {
      // User doesn't exist - they must share contact first
      tg.showAlert(
        "⚠️ ! Please start the bot first and share your contact.\n\nSend /start to the bot to begin."
      );
      return;
    } else {
      console.log("MENU_ITEMS.phone_number", phoneNumber);
      renderDashboard();
    }
  } catch (error) {
    console.error("Error loading user:", error);
    tg.showAlert("Failed to load user data. Please try again.");
    return;
  }
}

// Render dashboard based on user state
function renderDashboard() {
  UI.renderDashboard(currentUser, MENU_ITEMS);
}

// Show registration form for supervisors
function showRegistrationForm(role) {
  document.getElementById("role-label").textContent = "👔 Supervisor Profile";
  document.getElementById("skills-group").classList.add("hidden");
  document.getElementById("bio-group").classList.add("hidden");
  document.getElementById("organization-group").classList.remove("hidden");

  UI.showScreen("registration-screen");
}

// Handle supervisor registration
document
  .getElementById("registration-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      telegram_id: telegramUser.id,
      telegram_username: telegramUser.username || "",
      full_name: document.getElementById("full-name").value,
      role: "supervisor",
      organization: document.getElementById("organization").value,
    };

    try {
      currentUser = await API.registerUser(formData);
      currentUser.telegram_id = telegramUser.id;
      tg.showAlert("Registration successful!");
      UI.showScreen("dashboard-screen");
      renderDashboard();
    } catch (error) {
      console.error("Registration error:", error);
      tg.showAlert("Registration failed: " + error.message);
    }
  });

// View functions for different actions
async function showTasksView(type) {
  try {
    const tasks = await API.getTasks(type, currentUser.user_id);

    const viewId = type === "worker" ? "my-tasks-view" : "manage-tasks-view";
    const listId = type === "worker" ? "my-tasks-list" : "manage-tasks-list";

    UI.showScreen(viewId);
    UI.renderTaskList(tasks, listId, type);
  } catch (error) {
    console.error("Error loading tasks:", error);
    tg.showAlert("Failed to load tasks");
  }
}

async function showTaskDetail(taskId, userType) {
  try {
    const task = await API.getTask(taskId);

    currentTaskContext = { task, userType };

    UI.showScreen("task-detail-view");
    UI.renderTaskDetail(task, userType);
  } catch (error) {
    console.error("Error loading task:", error);
    tg.showAlert("Failed to load task details");
  }
}

async function updateTaskStatus(newStatus) {
  const { task } = currentTaskContext;

  try {
    await API.updateTaskStatus(task.id, newStatus);

    tg.showAlert("✅ Task status updated!", () => {
      showTaskDetail(task.id, currentTaskContext.userType);
    });
  } catch (error) {
    console.error("Error updating task:", error);
    tg.showAlert("❌ Failed to update task status");
  }
}

function showRatingForm() {
  const { task } = currentTaskContext;
  UI.renderRatingForm(task);
}

function selectRating(rating) {
  selectedRatingValue = rating;
  const stars = document.querySelectorAll("#rating-stars span");
  stars.forEach((star, index) => {
    if (index < rating) {
      star.textContent = "★";
      star.classList.add("selected");
    } else {
      star.textContent = "☆";
      star.classList.remove("selected");
    }
  });
}

async function submitRating() {
  const { task } = currentTaskContext;

  if (selectedRatingValue === 0) {
    tg.showAlert("Please select a rating");
    return;
  }

  try {
    await API.rateTask(task.id, {
      supervisor: currentUser.user_id,
      score: selectedRatingValue,
      comment: document.getElementById("rating-comment").value,
    });

    tg.showAlert("✅ Rating submitted!", () => {
      selectedRatingValue = 0;
      showTaskDetail(task.id, "supervisor");
    });
  } catch (error) {
    console.error("Error submitting rating:", error);
    tg.showAlert("❌ Failed to submit rating");
  }
}

function goBackFromTask() {
  if (currentTaskContext.userType === "worker") {
    showTasksView("worker");
  } else {
    showTasksView("supervisor");
  }
}

function resetTaskCreation() {
  taskCreationState = {
    categoryId: null,
    categoryName: null,
    jobId: null,
    jobTitle: null,
    currentStep: 1,
  };
}

function taskCreationGoBack(fromStep) {
  document.getElementById(`task-step-${fromStep}`).classList.add("hidden");
  document
    .getElementById(`task-step-${fromStep - 1}`)
    .classList.remove("hidden");
  taskCreationState.currentStep = fromStep - 1;
}

async function showCreateTaskForm() {
  resetTaskCreation();
  UI.showScreen("create-task-view");

  // Show step 1
  document.getElementById("task-step-1").classList.remove("hidden");
  document.getElementById("task-step-2").classList.add("hidden");
  document.getElementById("task-step-3").classList.add("hidden");

  // Load categories and workers
  await loadCategories();
  await loadWorkersForAssignment();

  // Setup form submission
  const form = document.getElementById("create-task-form");
  form.onsubmit = async (e) => {
    e.preventDefault();

    if (!currentUser || !currentUser.user_id) {
      tg.showAlert("❌ You must be logged in as a supervisor to create tasks.");
      return;
    }

    if (!taskCreationState.categoryId || !taskCreationState.jobId) {
      tg.showAlert("❌ Please select a category and job first.");
      return;
    }

    const taskData = {
      created_by: currentUser.user_id,
      category: taskCreationState.categoryId,
      job: taskCreationState.jobId,
      title: document.getElementById("task-title").value,
      description: document.getElementById("task-description").value,
      deadline: document.getElementById("task-deadline").value || null,
    };

    const workerId = document.getElementById("task-worker").value;
    // tg.showAlert(workerId);

    try {
      const task = await API.createTask(taskData);

      // Assign to worker if selected
      if (workerId) {
        await API.assignTask(task.id, workerId);
      }

      tg.showAlert("✅ Task created successfully!", () => {
        form.reset();
        UI.showScreen("dashboard-screen");
      });
    } catch (error) {
      console.error("Error creating task:", error);
      tg.showAlert(
        "❌ Failed to create task. " + (error.message || "Please try again.")
      );
    }
  };
}

async function loadWorkersForAssignment() {
  try {
    const workers = await API.getWorkers();

    const select = document.getElementById("task-worker");
    select.innerHTML = '<option value="">Leave unassigned</option>';

    workers.forEach((worker) => {
      const option = document.createElement("option");
      option.value = worker.id;
      option.textContent = `${worker.full_name} (${
        worker.worker_profile?.total_tasks_assigned || 0
      } tasks)`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading workers:", error);
  }
}

async function loadCategories() {
  try {
    const categories = await API.getCategories();
    UI.renderCategories(categories);
  } catch (error) {
    console.error("Error loading categories:", error);
    document.getElementById("categories-list").innerHTML =
      '<p style="color: #ef4444;">Failed to load categories</p>';
  }
}

async function selectCategory(category) {
  taskCreationState.categoryId = category.id;
  taskCreationState.categoryName = category.name;

  // Show step 2
  document.getElementById("task-step-1").classList.add("hidden");
  document.getElementById("task-step-2").classList.remove("hidden");
  taskCreationState.currentStep = 2;

  // Update step 2 title
  document.getElementById("step2-title").textContent = `🔧 ${category.name}`;
  document.getElementById("step2-subtitle").textContent =
    "Choose specific task";

  // Load jobs for this category
  await loadJobs(category.id);
}

async function loadJobs(categoryId) {
  try {
    const jobs = await API.getJobs(categoryId);
    UI.renderJobs(jobs);
  } catch (error) {
    console.error("Error loading jobs:", error);
    document.getElementById("jobs-list").innerHTML =
      '<p style="color: #ef4444;">Failed to load jobs</p>';
  }
}

function selectJob(job) {
  taskCreationState.jobId = job.id;
  taskCreationState.jobTitle = job.title;

  // Show step 3
  document.getElementById("task-step-2").classList.add("hidden");
  document.getElementById("task-step-3").classList.remove("hidden");
  taskCreationState.currentStep = 3;

  // Pre-fill task title with job title
  document.getElementById("task-title").value = job.title;
  document.getElementById("task-description").value = job.description || "";

  // Update step 3 subtitle
  document.getElementById(
    "step3-subtitle"
  ).textContent = `${taskCreationState.categoryName} → ${job.title}`;
}

async function showWorkersView() {
  UI.showScreen("workers-view");

  try {
    const workers = await API.getWorkers();
    UI.renderWorkerList(workers);
  } catch (error) {
    console.error("Error loading workers:", error);
    tg.showAlert("Failed to load workers");
  }
}

function showWorkerDetail(workerId) {
  tg.showAlert("Worker detail view coming soon!");
}

function showSupervisorProfile() {
  UI.showScreen("profile-view");
  UI.renderProfile(currentUser);
}

function handleLogout() {
  tg.showConfirm("Are you sure you want to logout?", (confirmed) => {
    if (confirmed) {
      currentUser = null;
      UI.showScreen("dashboard-screen");
      renderDashboard();
      tg.showAlert("You have been logged out");
    }
  });
}

// Expose handlers to window for onclick attributes
window.appHandlers = {
  showTaskDetail,
  updateTaskStatus,
  showRatingForm,
  selectRating,
  submitRating,
  showWorkerDetail,
  selectCategory,
  selectJob,
};

// Expose additional functions for HTML onclick handlers
// window.logout = handleLogout;
window.showScreen = UI.showScreen;
window.taskCreationGoBack = taskCreationGoBack;
window.goBackFromTask = goBackFromTask;

// Initialize app on load
init();
