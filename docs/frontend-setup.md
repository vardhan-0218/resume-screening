# AI Resume Scout Frontend Setup

## How to Run the Frontend

The React TypeScript frontend is located in the `frontend/` directory.

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Setup Steps

```bash
# Step 1: Navigate to the frontend directory
cd frontend

# Step 2: Install dependencies
npm install

# Step 3: Start the development server
npm run dev
```

The frontend will be available at **http://localhost:3000**

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components  
│   ├── lib/           # Utilities and helpers
│   ├── hooks/         # Custom React hooks
│   └── integrations/  # API integrations
├── public/           # Static assets
└── package.json      # Dependencies and scripts
```

## Technologies Used

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing

## Key Features

- **Dashboard** - Resume upload and analysis
- **ATS Scoring** - Real-time resume evaluation
- **Batch Processing** - Multiple resume analysis
- **Results Display** - Detailed scoring breakdowns
- **Responsive Design** - Works on all devices

## Environment Variables

No frontend environment variables are required. The frontend communicates with the backend at `http://localhost:8000`.

## Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.
