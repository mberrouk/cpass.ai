// API module - handles all backend communication
const API = {
  BASE_URL: window.location.origin + "/api",
  CPASS_URL: CPASS_URL || "http://localhost:8080",

  // Generate auth token for CPASS integration
  async generateAuthToken(telegramId, phoneNumber) {
    const response = await fetch(`${this.BASE_URL}/telegram/generate-token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegram_id: telegramId,
        phone_number: phoneNumber,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate auth token");
    }

    const data = await response.json();
    return data.token;
  },

  // User endpoints
  async getUser(telegramId) {
    const response = await fetch(`${this.BASE_URL}/cpass/user/${telegramId}/`);
    return await response.json();
  },

  async registerUser(userData) {
    const response = await fetch(`${this.BASE_URL}/users/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    return await response.json();
  },

  // Task endpoints
  async getTasks(type, userId) {
    const endpoint =
      type === "worker"
        ? `${this.BASE_URL}/tasks/worker/${userId}/`
        : `${this.BASE_URL}/tasks/supervisor/${userId}/`;

    const response = await fetch(endpoint);
    return await response.json();
  },

  async getTask(taskId) {
    const response = await fetch(`${this.BASE_URL}/tasks/${taskId}/`);
    return await response.json();
  },

  async createTask(taskData) {
    const response = await fetch(`${this.BASE_URL}/tasks/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    return await response.json();
  },

  async assignTask(taskId, workerId) {
    alert(workerId);
    console.log("TASK ID:", taskId, "WORKER ID:", workerId);
    const response = await fetch(`${this.BASE_URL}/tasks/${taskId}/assign/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ worker_id: workerId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    return await response.json();
  },

  async updateTaskStatus(taskId, newStatus) {
    const response = await fetch(
      `${this.BASE_URL}/tasks/${taskId}/update-status/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    return await response.json();
  },

  async rateTask(taskId, ratingData) {
    const response = await fetch(`${this.BASE_URL}/tasks/${taskId}/rate/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ratingData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    return await response.json();
  },

  // Category and Job endpoints
  async getCategories() {
    const response = await fetch(`${this.BASE_URL}/tasks/categories/`);
    return await response.json();
  },

  async getJobs(categoryId) {
    const response = await fetch(
      `${this.BASE_URL}/tasks/jobs/category/${categoryId}/`
    );
    return await response.json();
  },

  // Worker endpoints
  async getWorkers() {
    const response = await fetch(`${this.BASE_URL}/users/workers/`);
    return await response.json();
  },
};

// Debug: Verify API object is loaded
console.log("API object loaded:", Object.keys(API));
console.log("generateAuthToken available:", typeof API.generateAuthToken);
