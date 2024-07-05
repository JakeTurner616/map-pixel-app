
# Fullstack Application Overview

## Overview

This document provides a detailed rundown of the stack used for this application, including the frontend, backend, and hosting configurations.

## Stack Components

### Frontend

- **React Application**: The frontend is built using React.
- **Frontend Hosting**: The React application is hosted on GitHub Pages.

### Backend

- **Flask Application**: The backend is built using Flask.
- **SQLite Database**: The backend uses SQLite for database management.
- **User Authentication**: Handled by Flask, including session management and password hashing.

### Hosting

- **Docker Container**: The Flask application runs inside a Docker container using gunicorn.
- **Reverse Proxy**: The Docker container is reverse proxied to a subdomain using ngninx and cloudflare name servers.

### CORS

- **Cross-Origin Resource Sharing (CORS)**: CORS is configured to allow the React application hosted on GitHub Pages to interact with the Flask backend hosted on my subdomain.

## Mermaid Diagram

```mermaid
graph TD;
  subgraph Frontend
    A[React Application] -->|GitHub Pages| B[Frontend Hosting]
  end

  subgraph Backend
    C[Flask Application] -->|Database Access| F[SQLite Database]
    C --> G[User Authentication]
  end

  subgraph Hosting
    C -->|Docker Container| D[Backend Container]
    D -->|Reverse Proxy| E[example.com]
  end

  A -->|CORS| C
```
