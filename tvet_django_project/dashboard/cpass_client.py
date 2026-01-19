"""
CPASS API Client Service.

This service handles all communication with the CPASS Public API.
TVET Dashboard uses this to:
- Fetch worker data
- Create workers (bulk upload)
- Verify worker affiliations
- Get institution stats

All worker data lives in CPASS. This dashboard just consumes it.
"""

import requests
from typing import Optional, Dict, List, Any
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class CPASSAPIError(Exception):
    """Exception raised when CPASS API returns an error."""

    def __init__(self, message: str, status_code: int = None, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class CPASSClient:
    """
    Client for interacting with CPASS Public API.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        print("API KEY".format(api_key))
        self.base_url = getattr(
            settings, "CPASS_API_URL", "http://django-app:8000/api/users"
        )
        self.timeout = 30

    def _get_headers(self) -> Dict[str, str]:
        return {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json",
        }

    def _request(
        self, method: str, endpoint: str, data: dict = None, params: dict = None
    ) -> dict:
        """Make a request to CPASS API."""
        url = f"{self.base_url}/public{endpoint}"

        try:
            response = requests.request(
                method=method,
                url=url,
                headers=self._get_headers(),
                json=data,
                params=params,
                timeout=self.timeout,
            )

            if response.status_code == 401:
                raise CPASSAPIError("Invalid API key", status_code=401)

            if response.status_code == 403:
                raise CPASSAPIError("Access denied", status_code=403)

            if response.status_code == 404:
                raise CPASSAPIError("Resource not found", status_code=404)

            if response.status_code >= 400:
                error_data = response.json() if response.text else {}
                raise CPASSAPIError(
                    message=error_data.get("error", f"HTTP {response.status_code}"),
                    status_code=response.status_code,
                    details=error_data,
                )

            return response.json()

        except requests.RequestException as e:
            logger.error(f"CPASS API request failed: {e}")
            raise CPASSAPIError(f"Connection error: {str(e)}")

    # WORKERS
    def list_workers(
        self,
        status: str = None,
        tier: str = None,
        search: str = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """
        List workers affiliated with the institution.
        """
        params = {
            "page": page,
            "page_size": page_size,
        }
        if status:
            params["status"] = status
        if tier:
            params["tier"] = tier
        if search:
            params["search"] = search

        return self._request("GET", "/workers/", params=params)

    def get_worker(self, worker_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific worker.
        """
        return self._request("GET", f"/workers/{worker_id}/")

    def bulk_create_workers(self, workers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Bulk create workers with institution affiliation.
        """
        return self._request("POST", "/workers/bulk/", data={"workers": workers})

    def verify_worker(
        self, worker_id: str, action: str, notes: str = None
    ) -> Dict[str, Any]:
        """
        Verify, reject, or revoke a worker's affiliation.
        """
        data = {"action": action}
        if notes:
            data["notes"] = notes

        return self._request("POST", f"/workers/{worker_id}/verify/", data=data)

    # =========================================================================
    # STATISTICS
    # =========================================================================

    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics for the institution.
        """
        return self._request("GET", "/stats/")


def get_cpass_client(institution) -> Optional[CPASSClient]:
    """
    Factory function to get a CPASS client for an institution.
    """
    if not institution.cpass_api_key or not institution.cpass_api_active:
        return None

    return CPASSClient(api_key=institution.cpass_api_key)
