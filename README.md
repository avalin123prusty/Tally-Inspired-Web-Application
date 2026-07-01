# Tally-Inspired Web Application

This project is being built day by day with the following milestones:

- Day 1: Requirement analysis and database design
- Day 2: Backend setup and PostgreSQL configuration
- Day 3: Authentication module
- Day 4: Company management
- Day 5: Dashboard UI
- Day 6: Ledger management
- Day 7: Group management
- Day 8: Stock management
- Day 9: Purchase voucher
- Day 10: Sales voucher
- Day 11: Billing system
- Day 12: Reports module
- Day 13: Keyboard shortcut integration
- Day 14: Testing and deployment

## Run locally

1. Install dependencies with `npm install`
2. Start the server with `npm start`
3. Open `http://localhost:3000`
4. Optional PostgreSQL container: `docker compose up -d`

## Deployment

This project can be deployed using Docker or a Node.js host.

### Deploy with Docker

1. Build the container:
   ```bash
   docker build -t tally-app .
   ```
2. Run the container:
   ```bash
   docker run -p 3000:3000 --env JWT_SECRET=super-secret-tally-key tally-app
   ```

### Deploy with Render

1. Create a new Web Service on Render.
2. Connect your GitHub repository: `avalin123prusty/Tally-Inspired-Web-Application`.
3. Set the build command to:
   ```bash
   npm install
   ```
4. Set the start command to:
   ```bash
   npm start
   ```
5. Add the environment variable `JWT_SECRET`.

### GitHub Actions

A GitHub Actions workflow is provided at `.github/workflows/deploy.yml`.
It installs dependencies and prepares the repository for deployment on pushes to `main`.
