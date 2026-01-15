/**
 * Django API client to replace Supabase client.
 * Provides the same interface as Supabase for minimal code changes.
 */

const API_URL =
  import.meta.env.VITE_DJANGO_API_URL || "http://localhost:8000/api";

interface AuthResponse {
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    user: any;
  };
  access_code?: string;
  email?: string;
}

interface AuthError {
  error: {
    message: string;
    status: number;
  };
}

class DjangoAuthClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage
    this.accessToken = localStorage.getItem("access_token");
    this.refreshToken = localStorage.getItem("refresh_token");
  }

  private saveTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  async signUp(credentials: {
    email?: string;
    password?: string; // TODO: Not used yet!
    phone?: string;
    access_code?: string;
    telegram_id?: string;
    data?: {
      full_name?: string;
      phone_number?: string;
      location?: string;
      experience_duration?: string;
      invited_by_org?: string; // TODO: Organization should be an ID or name and type this is not handle it yet on backend consider changing later
      invitation_code?: string;
      skills?: any[];
      tvet_institution_id?: string | null;
    };
  }) {
    const body = JSON.stringify({
      email: credentials.email,
      telegram_id: credentials.telegram_id,
      password: credentials.access_code, // TODO: password handling not implemented yet
      phone_number: credentials.phone || credentials.data?.phone_number,
      full_name: credentials.data?.full_name,
      location: credentials.data?.location,
      experience_duration: credentials.data?.experience_duration,
      invited_by_org: credentials.data?.invited_by_org,
      invitation_code: credentials.data?.invitation_code,
      skills: credentials.data?.skills,
      tvet_institution_id: credentials.data?.tvet_institution_id,
    });

    console.log('Signing up with body:', body);

    try {
      const response = await fetch(`${API_URL}/users/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body,
      });

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data.error };
      }

      this.saveTokens(data.data.access_token, data.data.refresh_token);

      return {
        data: {
          user: data.data.user,
          session: {
            access_token: data.data.access_token,
            refresh_token: data.data.refresh_token,
          },
        },
        error: null,
        access_code: data.access_code,
        email: data.email,
      };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async signInWithPassword(credentials: { email: string; password: string }) {
    try {
      const response = await fetch(`${API_URL}/users/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data.error };
      }

      this.saveTokens(data.data.access_token, data.data.refresh_token);

      return {
        data: {
          user: data.data.user,
          session: {
            access_token: data.data.access_token,
            refresh_token: data.data.refresh_token,
          },
        },
        error: null,
      };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async signInWithOtp(credentials: { phone: string }) {
    try {
      const response = await fetch(`${API_URL}/users/auth/signin-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data.error };
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async getUser() {
    if (!this.accessToken) {
      return { data: { user: null }, error: { message: "Not authenticated" } };
    }

    try {
      const response = await fetch(`${API_URL}/users/auth/user`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { data: { user: null }, error: data.error };
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: { user: null }, error: { message: error.message } };
    }
  }

  async signOut() {
    try {
      if (this.accessToken) {
        await fetch(`${API_URL}/users/auth/signout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: this.refreshToken }),
        });
      }

      this.clearTokens();
      return { error: null };
    } catch (error: any) {
      this.clearTokens();
      return { error: { message: error.message } };
    }
  }

  getSession() {
    if (!this.accessToken) {
      return { data: { session: null }, error: null };
    }

    return {
      data: {
        session: {
          access_token: this.accessToken,
          refresh_token: this.refreshToken,
        },
      },
      error: null,
    };
  }
}

class DjangoTableClient {
  constructor(private tableName: string, private auth: DjangoAuthClient) {}

  private getHeaders() {
    const headers: any = {
      "Content-Type": "application/json",
    };

    const session = this.auth.getSession();
    if (session.data.session?.access_token) {
      headers["Authorization"] = `Bearer ${session.data.session.access_token}`;
    }

    return headers;
  }

  private buildQueryString(params: any) {
    const queryParams = new URLSearchParams();

    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });

    return queryParams.toString();
  }

  select(columns: string = "*") {
    return new DjangoQueryBuilder(this.tableName, this.auth, columns);
  }

  async insert(data: any | any[]) {
    try {
      const endpoint = `${API_URL}/${this.tableName.replace("_", "-")}/`;
      const isArray = Array.isArray(data);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(isArray ? data : [data]),
      });

      const result = await response.json();

      if (!response.ok) {
        return { data: null, error: result.error };
      }

      return { data: isArray ? result : result[0], error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async update(data: any) {
    return new DjangoQueryBuilder(this.tableName, this.auth, "*").update(data);
  }

  async delete() {
    return new DjangoQueryBuilder(this.tableName, this.auth, "*").delete();
  }
}

class DjangoQueryBuilder {
  private filters: any = {};
  private orderBy: string | null = null;
  private limitValue: number | null = null;
  private singleResult: boolean = false;

  constructor(
    private tableName: string,
    private auth: DjangoAuthClient,
    private columns: string
  ) {}

  private getHeaders() {
    const headers: any = {
      "Content-Type": "application/json",
    };

    const session = this.auth.getSession();
    if (session.data.session?.access_token) {
      headers["Authorization"] = `Bearer ${session.data.session.access_token}`;
    }

    return headers;
  }

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  neq(column: string, value: any) {
    this.filters[`${column}__ne`] = value;
    return this;
  }

  gt(column: string, value: any) {
    this.filters[`${column}__gt`] = value;
    return this;
  }

  lt(column: string, value: any) {
    this.filters[`${column}__lt`] = value;
    return this;
  }

  gte(column: string, value: any) {
    this.filters[`${column}__gte`] = value;
    return this;
  }

  lte(column: string, value: any) {
    this.filters[`${column}__lte`] = value;
    return this;
  }

  like(column: string, value: string) {
    this.filters[`${column}__icontains`] = value;
    return this;
  }

  in(column: string, values: any[]) {
    this.filters[`${column}__in`] = values.join(",");
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const ascending = options?.ascending !== false;
    this.orderBy = ascending ? column : `-${column}`;
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  async execute() {
    try {
      const endpoint = `${API_URL}/${this.tableName.replace("_", "-")}/`;
      const queryParams = new URLSearchParams();

      // Add filters
      Object.keys(this.filters).forEach((key) => {
        queryParams.append(key, this.filters[key]);
      });

      // Add ordering
      if (this.orderBy) {
        queryParams.append("ordering", this.orderBy);
      }

      // Add limit
      if (this.limitValue) {
        queryParams.append("limit", this.limitValue.toString());
      }

      const url = queryParams.toString()
        ? `${endpoint}?${queryParams.toString()}`
        : endpoint;

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        return { data: null, error: result.error };
      }

      // Handle single result
      if (this.singleResult) {
        const data = Array.isArray(result.data) ? result.data[0] : result;
        return { data, error: null };
      }

      return { data: result.data || result, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async update(data: any) {
    try {
      // For updates, we need the ID from filters
      const id = this.filters.id;
      if (!id) {
        return { data: null, error: { message: "ID required for update" } };
      }

      const endpoint = `${API_URL}/${this.tableName.replace("_", "-")}/${id}/`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { data: null, error: result.error };
      }

      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async delete() {
    try {
      const id = this.filters.id;
      if (!id) {
        return { data: null, error: { message: "ID required for delete" } };
      }

      const endpoint = `${API_URL}/${this.tableName.replace("_", "-")}/${id}/`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const result = await response.json();
        return { data: null, error: result.error };
      }

      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }
}

class DjangoClient {
  auth: DjangoAuthClient;

  constructor() {
    this.auth = new DjangoAuthClient();
  }

  from(tableName: string) {
    return new DjangoTableClient(tableName, this.auth);
  }
}

// Create singleton instance
export const djangoClient = new DjangoClient();

// Export for compatibility
export default djangoClient;
