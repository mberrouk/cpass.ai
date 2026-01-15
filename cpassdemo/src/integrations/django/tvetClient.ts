/**
 * TVET Dashboard API client
 * 
 * This client connects to the TVET Dashboard backend (separate from CPASS).
 * The TVET Dashboard backend handles:
 * - Staff authentication
 * - Local operational data (batches, contacts, notes, assessments)
 * - Integration with CPASS Public API for worker data
 */

// TVET Dashboard runs on port 8001 (separate from CPASS on 8000)
const TVET_API_URL = import.meta.env.VITE_TVET_API_URL || 'http://localhost:8001/api';

// ============================================================================
// TYPES
// ============================================================================

export interface TVETInstitution {
  id: string;
  institution_name: string;
  institution_code: string;
  institution_type: string;
  location: string;
  country: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  created_at: string | null;
}

export interface DashboardStats {
  rpl_candidates: number;
  verified_graduates: number;
  active_students: number;
  total_batches: number;
  skill_distribution: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  institution: {
    name: string;
    code: string;
    location: string;
  };
}

export interface RPLCandidate {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  location: string;
  tier: string;
  total_skills: number;
  bronze_skills: number;
  silver_skills: number;
  gold_skills: number;
  platinum_skills: number;
  average_rating: number;
  total_tasks_completed: number;
  certification_match: number;
  assessment_status: string;
  batch_id: string;
  created_at: string | null;
}

export interface RPLCandidateDetail extends RPLCandidate {
  skills: any[];
}

export interface UploadBatch {
  batch_id: string;
  source_file_name: string;
  worker_count: number;
  upload_mode: string;
  created_at: string | null;
}

export interface AnalyticsData {
  total_candidates: number;
  certification_ready: number;
  in_progress: number;
  early_stage: number;
  tier_distribution: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  status_distribution: Array<{
    assessment_status: string;
    count: number;
  }>;
  monthly_trend: Array<{
    month: string;
    count: number;
  }>;
}

export interface ApiResponse<T> {
  data: T | null;
  error: any;
}

// ============================================================================
// CLIENT CLASS
// ============================================================================

class DjangoTVETClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('tvet_access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`
      }));
      return { data: null, error };
    }

    const result = await response.json();
    return { data: result.data, error: null };
  }

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================

  async login(email: string, password: string): Promise<ApiResponse<{
    access_token: string;
    refresh_token: string;
    user: { id: string; email: string; full_name: string; role: string };
    institution: { id: string; name: string; code: string };
  }>> {
    try {
      const response = await fetch(`${TVET_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        return { data: null, error };
      }

      const result = await response.json();
      
      // Store tokens
      localStorage.setItem('tvet_access_token', result.access_token);
      localStorage.setItem('tvet_refresh_token', result.refresh_token);
      localStorage.setItem('tvet_user', JSON.stringify(result.user));
      localStorage.setItem('tvet_institution', JSON.stringify(result.institution));
      
      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  logout(): void {
    localStorage.removeItem('tvet_access_token');
    localStorage.removeItem('tvet_refresh_token');
    localStorage.removeItem('tvet_user');
    localStorage.removeItem('tvet_institution');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('tvet_access_token');
  }

  // ==========================================================================
  // INSTITUTION ENDPOINTS
  // ==========================================================================

  async getCurrentInstitution(): Promise<ApiResponse<TVETInstitution>> {
    try {
      const response = await fetch(`${TVET_API_URL}/tvet/institution`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<TVETInstitution>(response);
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response = await fetch(`${TVET_API_URL}/tvet/dashboard-stats`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<DashboardStats>(response);
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  // ==========================================================================
  // RPL CANDIDATES ENDPOINTS
  // ==========================================================================

  async getRPLCandidates(params?: {
    status?: string;
    min_match?: number;
    max_match?: number;
  }): Promise<ApiResponse<{ candidates: RPLCandidate[]; count: number }>> {
    try {
      const queryParams = new URLSearchParams();
      // Only pass status if it's not 'all'
      if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params?.min_match !== undefined) queryParams.append('min_match', params.min_match.toString());
      if (params?.max_match !== undefined) queryParams.append('max_match', params.max_match.toString());

      const url = `${TVET_API_URL}/tvet/rpl-candidates${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        return { data: null, error };
      }

      const result = await response.json();
      return { 
        data: { 
          candidates: result.data || [], 
          count: result.count || 0 
        }, 
        error: null 
      };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async getRPLCandidateDetail(candidateId: string): Promise<ApiResponse<RPLCandidateDetail>> {
    try {
      const response = await fetch(`${TVET_API_URL}/tvet/rpl-candidates/${candidateId}`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<RPLCandidateDetail>(response);
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async logCandidateContact(
    candidateId: string,
    contactMethod: 'sms' | 'whatsapp' | 'email',
    notes?: string
  ): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${TVET_API_URL}/tvet/rpl-candidates/${candidateId}/contact`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ contact_method: contactMethod, notes }),
      });
      return this.handleResponse<any>(response);
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async updateCandidateStatus(
    candidateId: string,
    assessmentStatus: string
  ): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${TVET_API_URL}/tvet/rpl-candidates/${candidateId}/status`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ assessment_status: assessmentStatus }),
      });
      return this.handleResponse<any>(response);
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  // ==========================================================================
  // BULK UPLOAD ENDPOINTS
  // ==========================================================================

  async createUploadBatch(
    sourceFileName: string,
    uploadMode: 'demo' | 'production' = 'demo'
  ): Promise<ApiResponse<UploadBatch>> {
    try {
      const response = await fetch(`${TVET_API_URL}/tvet/upload/batch`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ source_file_name: sourceFileName, upload_mode: uploadMode }),
      });
      return this.handleResponse<UploadBatch>(response);
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async parseCSV(file: File): Promise<ApiResponse<{
    headers: string[];
    preview_rows: any[];
    total_rows: number;
  }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('tvet_access_token');
      const response = await fetch(`${TVET_API_URL}/tvet/upload/parse-csv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData
        },
        body: formData,
      });
      return this.handleResponse<{
        headers: string[];
        preview_rows: any[];
        total_rows: number;
      }>(response);
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async processBulkUpload(
    batchId: string,
    workers: any[],
    columnMapping: Record<string, string>
  ): Promise<ApiResponse<{
    batch_id: string;
    created_count: number;
    errors: any[];
  }>> {
    try {
      const response = await fetch(`${TVET_API_URL}/tvet/upload/process`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ batch_id: batchId, workers, column_mapping: columnMapping }),
      });
      return this.handleResponse<{
        batch_id: string;
        created_count: number;
        errors: any[];
      }>(response);
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async getUploadBatches(mode: 'all' | 'demo' | 'production' = 'all'): Promise<ApiResponse<{
    batches: UploadBatch[];
    count: number;
  }>> {
    try {
      const url = `${TVET_API_URL}/tvet/upload/batches${mode !== 'all' ? '?mode=' + mode : ''}`;
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        return { data: null, error };
      }

      const result = await response.json();
      return { 
        data: { 
          batches: result.data || [], 
          count: result.count || 0 
        }, 
        error: null 
      };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async deleteUploadBatch(batchId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${TVET_API_URL}/tvet/upload/batches/${batchId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<any>(response);
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  // ==========================================================================
  // ANALYTICS ENDPOINTS
  // ==========================================================================

  async getAnalytics(): Promise<ApiResponse<AnalyticsData>> {
    try {
      const response = await fetch(`${TVET_API_URL}/tvet/analytics`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<AnalyticsData>(response);
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }
}

// Export singleton instance
export const tvetClient = new DjangoTVETClient();
