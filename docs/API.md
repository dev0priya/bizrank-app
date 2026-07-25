# API Documentation

## Endpoints

### `/api/search`
- **Method:** GET
- **Request:** `?q={query}`
- **Response:** `{ businesses: [...], jobs: [...] }`

### `/api/businesses`
- **Method:** GET
- **Request:** `?jobId={id}&limit=100`
- **Response:** `{ data: [...] }`

### `/api/businesses/[id]`
- **Method:** PATCH
- **Request:** `{ discovery_status: 'Qualified' }`
- **Response:** `{ success: true }`

### `/api/jobs`
- **Method:** POST
- **Request:** `{ city: 'Delhi', category: 'Restaurant', maxResults: 20 }`
- **Response:** `{ jobId: 123 }`
