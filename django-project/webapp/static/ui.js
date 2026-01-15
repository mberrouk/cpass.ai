// UI module - handles all DOM manipulation and rendering
const UI = {
  // Screen management
  showScreen(screenId) {
    // Hide all main screens
    document.getElementById("dashboard-screen").classList.add("hidden");
    document.getElementById("registration-screen").classList.add("hidden");
    document.getElementById("loading-screen").classList.add("hidden");

    // Hide all views inside main-screen
    document.getElementById("tasks-view").classList.add("hidden");
    document.getElementById("profile-view").classList.add("hidden");
    document.getElementById("create-task-view").classList.add("hidden");
    document.getElementById("workers-view").classList.add("hidden");
    document.getElementById("my-tasks-view").classList.add("hidden");
    document.getElementById("task-detail-view").classList.add("hidden");
    document.getElementById("manage-tasks-view").classList.add("hidden");

    // Show the main-screen container if showing a view inside it
    const viewsInMainScreen = [
      "tasks-view",
      "profile-view",
      "create-task-view",
      "workers-view",
      "my-tasks-view",
      "task-detail-view",
      "manage-tasks-view",
    ];
    if (viewsInMainScreen.includes(screenId)) {
      document.getElementById("main-screen").classList.remove("hidden");
    } else {
      document.getElementById("main-screen").classList.add("hidden");
    }

    // Show the requested screen/view
    document.getElementById(screenId).classList.remove("hidden");
    document.getElementById("bottom-menu").classList.add("hidden");
  },

  // Dashboard rendering
  renderDashboard(currentUser, menuItems) {
    const titleEl = document.getElementById("dashboard-title");
    const subtitleEl = document.getElementById("dashboard-subtitle");
    const badgeContainer = document.getElementById("user-badge-container");
    const menuGrid = document.getElementById("menu-grid");

    // Update header
    if (currentUser) {
      titleEl.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        Welcome, ${currentUser.full_name || "User"}!
      `;
      subtitleEl.textContent = `Your ${currentUser.role} Dashboard`;

      const badgeClass =
        currentUser.role === "worker" ? "badge-worker" : "badge-supervisor";
      badgeContainer.innerHTML = `<span class="user-badge ${badgeClass}">${currentUser.role}</span>`;
    } else {
      titleEl.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        Dashboard
      `;
      subtitleEl.textContent = "Welcome! Please sign up to get started";
      badgeContainer.innerHTML =
        '<span class="user-badge badge-guest">Guest</span>';
    }

    // Render menu items
    menuGrid.innerHTML = "";

    Object.keys(menuItems).forEach((key) => {
      const item = menuItems[key];

      // Check if item should be displayed
      if (item.requiresAuth && !currentUser) return;
      if (item.requiresGuest && currentUser) return;
      if (item.roles && currentUser && !item.roles.includes(currentUser.role))
        return;

      const menuCard = document.createElement("div");
      menuCard.className = "menu-card";
      menuCard.onclick = item.action;
      menuCard.innerHTML = `
        <div class="menu-icon">${item.icon}</div>
        <div class="menu-title">${item.title}</div>
        <div class="menu-subtitle">${item.subtitle}</div>
      `;

      menuGrid.appendChild(menuCard);
    });
  },

  // Task list rendering
  renderTaskList(tasks, listElementId, userType, onTaskClick) {
    const listEl = document.getElementById(listElementId);

    if (tasks.length === 0) {
      listEl.innerHTML = '<div class="card"><p>No tasks yet</p></div>';
      return;
    }

    listEl.innerHTML = tasks
      .map((task) => {
        const statusClass = task.status.toLowerCase().replace("_", "-");
        return `
        <div class="task-item" onclick="window.appHandlers.showTaskDetail(${
          task.id
        }, '${userType}')">
          <h3>${task.title}</h3>
          <p>${task.description.substring(0, 100)}${
          task.description.length > 100 ? "..." : ""
        }</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <span class="task-status status-${statusClass}">${task.status.replace(
          "_",
          " "
        )}</span>
            <span style="font-size: 12px; color: var(--tg-theme-hint-color, #999);">
              ${task.category}
            </span>
          </div>
        </div>
      `;
      })
      .join("");
  },

  // Task detail rendering
  renderTaskDetail(task, userType) {
    document.getElementById("task-detail-title").textContent = task.title;

    const detailContent = document.getElementById("task-detail-content");
    detailContent.innerHTML = `
      <div class="task-detail-section">
        <h3>Description</h3>
        <p>${task.description}</p>
      </div>
      <div class="task-detail-section">
        <h3>Category</h3>
        <p>${task.category}</p>
      </div>
      <div class="task-detail-section">
        <h3>Status</h3>
        <p><span class="task-status status-${task.status
          .toLowerCase()
          .replace("_", "-")}">${task.status.replace("_", " ")}</span></p>
      </div>
      ${
        task.assigned_to_name
          ? `
        <div class="task-detail-section">
          <h3>Assigned To</h3>
          <p>${task.assigned_to_name}</p>
        </div>
      `
          : ""
      }
      ${
        task.created_by_name
          ? `
        <div class="task-detail-section">
          <h3>Created By</h3>
          <p>${task.created_by_name}</p>
        </div>
      `
          : ""
      }
      ${
        task.deadline
          ? `
        <div class="task-detail-section">
          <h3>Deadline</h3>
          <p>${new Date(task.deadline).toLocaleDateString()}</p>
        </div>
      `
          : ""
      }
      ${this.renderTaskActions(task, userType)}
      ${
        task.rating && userType === "worker"
          ? `
        <div class="task-detail-section" style="margin-top: 20px; padding: 16px; background: var(--tg-theme-secondary-bg-color, #f8fafc); border-radius: 12px;">
          <h3>Rating</h3>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
            <div style="color: #fbbf24; font-size: 20px;">${"★".repeat(
              task.rating.score
            )}${"☆".repeat(5 - task.rating.score)}</div>
            <span style="font-weight: 600; color: var(--tg-theme-text-color, #1e293b);">${
              task.rating.score
            }/5</span>
          </div>
          ${
            task.rating.comment
              ? `<p style="margin-top: 12px; font-style: italic; color: var(--tg-theme-hint-color, #64748b);">"${task.rating.comment}"</p>`
              : ""
          }
        </div>
      `
          : ""
      }
    `;
  },

  renderTaskActions(task, userType) {
    let actions = '<div class="task-actions">';

    if (userType === "worker") {
      // Worker actions
      if (task.status === "ASSIGNED") {
        actions +=
          '<button class="button" onclick="window.appHandlers.updateTaskStatus(\'IN_PROGRESS\')">Start Task</button>';
      } else if (task.status === "IN_PROGRESS") {
        actions +=
          '<button class="button" onclick="window.appHandlers.updateTaskStatus(\'SUBMITTED\')">Submit for Review</button>';
      }
    } else if (userType === "supervisor") {
      // Supervisor actions
      if (task.status === "SUBMITTED") {
        actions +=
          '<button class="button" onclick="window.appHandlers.updateTaskStatus(\'COMPLETED\')">Mark as Completed</button>';
      }

      if (task.status === "COMPLETED" && !task.rating) {
        actions +=
          '<button class="button" onclick="window.appHandlers.showRatingForm()">Rate Task</button>';
      }
    }

    actions += "</div>";
    return actions;
  },

  // Rating form rendering
  renderRatingForm(task) {
    const detailContent = document.getElementById("task-detail-content");

    detailContent.innerHTML += `
      <div class="rating-form">
        <h3>Rate this task</h3>
        <p>How did ${task.assigned_to_name} perform?</p>
        <div class="rating-stars" id="rating-stars">
          ${[1, 2, 3, 4, 5]
            .map(
              (star) =>
                `<span onclick="window.appHandlers.selectRating(${star})">☆</span>`
            )
            .join("")}
        </div>
        <div class="form-group">
          <label>Comment (optional)</label>
          <textarea id="rating-comment" rows="3" placeholder="Share your feedback..."></textarea>
        </div>
        <div style="display: flex; gap: 12px;">
          <button class="button" onclick="window.appHandlers.submitRating()">Submit Rating</button>
          <button class="button secondary" onclick="window.appHandlers.showTaskDetail(${
            task.id
          }, 'supervisor')">Cancel</button>
        </div>
      </div>
    `;
  },

  // Worker list rendering
  renderWorkerList(workers) {
    const listEl = document.getElementById("workers-list");

    if (workers.length === 0) {
      listEl.innerHTML =
        '<div class="card"><p>No workers found. They need to complete CPASS registration.</p></div>';
      return;
    }

    listEl.innerHTML = workers
      .map((worker) => {
        const profile = worker.worker_profile || {};
        return `
        <div class="worker-card" onclick="window.appHandlers.showWorkerDetail(${
          worker.id
        })">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--tg-theme-button-color, #2563eb); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600;">
              ${worker.full_name.charAt(0).toUpperCase()}
            </div>
            <h3 style="margin: 0;">${worker.full_name}</h3>
          </div>
          <p style="color: var(--tg-theme-hint-color, #999); margin: 4px 0 12px 0;">
            ${worker.email || "No email"}
          </p>
          <div class="worker-stats" style="display: flex; gap: 16px; font-size: 14px;">
            <span style="display: flex; align-items: center; gap: 4px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              ${profile.total_tasks_assigned || 0} tasks
            </span>
            <span style="display: flex; align-items: center; gap: 4px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              ${profile.total_tasks_completed || 0} completed
            </span>
          </div>
        </div>
      `;
      })
      .join("");
  },

  // Categories rendering
  renderCategories(categories) {
    const container = document.getElementById("categories-list");
    container.innerHTML = "";

    if (categories.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: #6b7280;">No categories available</p>';
      return;
    }

    categories.forEach((category) => {
      const card = document.createElement("div");
      card.className = "task-card";
      card.onclick = () => window.appHandlers.selectCategory(category);
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="margin: 0 0 4px 0; font-size: 16px;">${
              category.name
            }</h3>
            <p style="margin: 0; font-size: 13px; color: #6b7280;">${
              category.description || ""
            }</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af;">${
              category.jobs_count || 0
            } jobs available</p>
          </div>
          <span style="font-size: 24px;">→</span>
        </div>
      `;
      container.appendChild(card);
    });
  },

  // Jobs rendering
  renderJobs(jobs) {
    const container = document.getElementById("jobs-list");
    container.innerHTML = "";

    if (jobs.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: #6b7280;">No jobs available in this category</p>';
      return;
    }

    jobs.forEach((job) => {
      const card = document.createElement("div");
      card.className = "task-card";
      card.onclick = () => window.appHandlers.selectJob(job);
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="margin: 0 0 4px 0; font-size: 16px;">${job.title}</h3>
            <p style="margin: 0; font-size: 13px; color: #6b7280;">${
              job.description || ""
            }</p>
          </div>
          <span style="font-size: 24px;">→</span>
        </div>
      `;
      container.appendChild(card);
    });
  },

  // Profile rendering
  renderProfile(currentUser) {
    document.getElementById("profile-name").textContent = currentUser.full_name;
    document.getElementById("profile-role").textContent = "SUPERVISOR";
    document.getElementById("profile-avatar").textContent = "👔";

    if (currentUser.supervisor_profile) {
      const profile = currentUser.supervisor_profile;
      document.getElementById("profile-stats").innerHTML = `
        <div class="stat">
          <div class="value">${profile.total_tasks_created || 0}</div>
          <div class="label">Tasks Created</div>
        </div>
        <div class="stat">
          <div class="value">${profile.total_workers_supervised || 0}</div>
          <div class="label">Workers</div>
        </div>
      `;
    }
  },
};
