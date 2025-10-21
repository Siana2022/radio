# SGP - Rendering Engine

This is the dedicated Node.js server responsible for rendering videos for the SGP project.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

This server communicates with the main Next.js application. While it doesn't require a `.env` file for its basic operation, you should ensure the frontend application is configured to point to this server's URL.

The following environment variables can be used to configure the server:

- `PORT`: The port the server will listen on. Defaults to `3001`.
- `NEXT_PUBLIC_BASE_URL`: The base URL of the Next.js frontend application, which hosts the rendering page. Defaults to `http://localhost:3000`.

### 3. Run the Server

To start the rendering engine, run:

```bash
npm start
```

The server will be available at [http://localhost:3001](http://localhost:3001) (or the port you configured).
