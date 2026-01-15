# Civic AI Web App

A modern React web application for reporting and managing civic issues using AI-powered detection.

## 🚀 Quick Start

### Prerequisites
- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation

1. **Navigate to the web directory**
   ```bash
   cd web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the `.env.example` file to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_KEY=your_supabase_anon_public_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## 📱 Features

- **AI-Powered Issue Detection**: Automatic categorization and description generation using Gemini Vision API
- **Real-Time Tracking**: Live updates on issue status
- **Interactive Map**: View all reported issues on an interactive map
- **Officer Dashboard**: Manage and update issue status
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark Mode**: Full dark mode support

## 🛠️ Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Supabase (Backend)
- Google Gemini AI
- Leaflet (Maps)

## 📖 Usage

1. **Sign Up/Login**: Create an account or sign in
2. **Report Issue**: Upload a photo of a civic issue
3. **AI Analysis**: The AI will automatically categorize and describe the issue
4. **Submit**: Add location and submit the report
5. **Track**: Monitor the status of your reports on the dashboard
6. **View Map**: See all issues on an interactive map

## 🔗 Backend

This web app uses the same Supabase backend as the mobile app. Make sure you have:
- Created a Supabase project
- Run the database schema setup
- Configured storage bucket for images
- Set up Row Level Security policies

Refer to the main [README.md](../README.md) for detailed backend setup instructions.

## 📝 License

Same as the main project.

