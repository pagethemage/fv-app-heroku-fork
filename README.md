# Football Victoria Referee Management Platform

This project is a React-based web application for managing referee appointments and availability for Football Victoria. The FV Referees department aims to provide a better experience for referees when appointing to football matches by improving their semi-automatic process. This platform complements the current use of Schedula, adding graphical visualization to the existing Referees Appointment System.

## Project Overview

The main goals of this platform are:

- Match referees to appointments based on location, experience, maturity, and appropriate age
- Improve accuracy, timing, and flexibility in the appointment process
- Address the issue of mass declines in age groups of U12, 13, and 14's fixtures
- Ensure higher acceptance of appointments

## Frontend Setup

1. Clone the repository and navigate to the root directory:

    ```bash
    git clone git@github.com:kyledenis/fv-appt-platform.git
    cd fv-appt-platform
    ```

2. Install dependencies:

    ```npm
    npm install
    ```

3. Create an `.env` file in the root directory and add the necessary environment variables. (See `.env.template` for reference):

   ```plaintext
   REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

4. Start the development server:

    ```npm
    npm run dev
    ```

    > Note:
    > - Keep the frontend and backend servers running in separate terminals.
    > - The backend server must be running for the frontend to work properly.

5. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Backend Setup

1. In a separate terminal from the project's root directory, navigate to the `backend` directory:

    ```bash
    cd backend
    ```

2. Create a virtual environment:

    ```python3
    python3 -m venv venv
    ```

3. Activate the virtual environment:
    - On Windows:

        ```cmd
        venv\Scripts\activate
        ```

    - On macOS and Linux:

        ```bash
        source venv/bin/activate
        ```

4. Install the required packages:

    ```pip
    pip install -r requirements.txt
    ```

5. Set up your database:

    ```python3
    python3 manage.py migrate
    ```

6. Create a superuser for admin access (optional):

    ```python3
    python3 manage.py createsuperuser
    ```

7. Run the development server:

    ```python3
    python3 manage.py runserver
    ```

The backend will be available at `http://localhost:8000`.

## Available Scripts

- `npm run dev`: Runs both the React app and the Express server concurrently
- `npm start`: Runs the React app in development mode
- `npm run server`: Runs the Express server
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production

## Project Structure

- `src/`: React application source code
  - `components/`: Reusable UI components
  - `pages/`: Main page components
  - `contexts/`: React Context for state management
  - `services/`: API service for backend communication
  - `utils/`: Utility functions
- `server.js`: Express server for proxying Google Maps API requests
