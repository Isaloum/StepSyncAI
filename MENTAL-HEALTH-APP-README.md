# Mental Health Support App - Full Stack Application

A comprehensive mental health support application designed to help individuals track and manage their mental health journey, particularly after workplace accidents or traumatic events.

## Features

### Core Functionality

- **User Authentication**: Secure registration and login system
- **Mood Tracking**: Log daily moods with notes and visualize trends over time
- **Journal**: Write and categorize journal entries (general, incident, therapy, progress)
- **Symptom Monitoring**: Track symptoms like anxiety, depression, PTSD indicators with severity levels
- **Trigger Management**: Identify and log trigger occurrences with intensity tracking
- **Coping Strategies**: Save and rate the effectiveness of coping techniques
- **Goals**: Set and track recovery and wellness goals with target dates
- **Emergency Contacts**: Quick access to support network and crisis resources
- **Dashboard**: Comprehensive overview with charts and statistics
- **Data Visualization**: Interactive charts showing mood trends and symptom patterns

### Technical Features

- **Full Stack Architecture**: React frontend with Express.js backend
- **RESTful API**: Clean API design with proper authentication
- **SQLite Database**: Persistent data storage
- **JWT Authentication**: Secure token-based authentication
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Instant data synchronization

## Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite3** for database
- **bcryptjs** for password hashing
- **jsonwebtoken** for authentication
- **express-validator** for input validation
- **CORS** enabled for cross-origin requests

### Frontend
- **React 18** with hooks
- **Vite** for fast development and building
- **React Router** for navigation
- **Axios** for API calls
- **Recharts** for data visualization
- **date-fns** for date formatting

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database:
```bash
npm run init-db
```

4. Start the backend server:
```bash
npm start
```

The backend API will be running on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be running on `http://localhost:3000`

## Usage

1. **Register**: Create a new account with your name, email, and password
2. **Login**: Sign in to access your personal dashboard
3. **Dashboard**: View your mental health overview with stats and charts
4. **Track Daily**:
   - Log your mood with a 1-10 scale
   - Write journal entries
   - Record any symptoms
   - Note trigger occurrences
5. **Manage Tools**:
   - Add coping strategies and rate their effectiveness
   - Set recovery goals with target dates
   - Save emergency contacts for quick access
6. **Monitor Progress**: View historical data and trends over time

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile

### Moods
- `GET /api/moods?days=7` - Get mood entries
- `GET /api/moods/stats?days=7` - Get mood statistics
- `POST /api/moods` - Create mood entry
- `DELETE /api/moods/:id` - Delete mood entry

### Journal
- `GET /api/journal?days=7&type=general` - Get journal entries
- `POST /api/journal` - Create journal entry
- `PUT /api/journal/:id` - Update journal entry
- `DELETE /api/journal/:id` - Delete journal entry

### Symptoms
- `GET /api/symptoms?days=7` - Get symptoms
- `GET /api/symptoms/stats` - Get symptom statistics
- `POST /api/symptoms` - Log symptom
- `DELETE /api/symptoms/:id` - Delete symptom

### Triggers
- `GET /api/triggers` - Get all triggers
- `POST /api/triggers` - Add trigger
- `POST /api/triggers/:id/occurrence` - Log trigger occurrence
- `PUT /api/triggers/:id` - Update trigger
- `DELETE /api/triggers/:id` - Delete trigger

### Coping Strategies
- `GET /api/coping` - Get all strategies
- `POST /api/coping` - Add strategy
- `POST /api/coping/:id/use` - Use strategy with rating
- `PUT /api/coping/:id` - Update strategy
- `DELETE /api/coping/:id` - Delete strategy

### Emergency Contacts
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Add contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Goals
- `GET /api/goals?completed=false` - Get goals
- `POST /api/goals` - Create goal
- `PATCH /api/goals/:id/complete` - Complete goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

## Database Schema

The app uses SQLite with the following tables:
- `users` - User accounts
- `user_profiles` - User profile information
- `mood_entries` - Mood logs
- `journal_entries` - Journal entries
- `symptoms` - Symptom logs
- `triggers` - Trigger tracking
- `coping_strategies` - Coping techniques
- `strategy_ratings` - Effectiveness ratings
- `emergency_contacts` - Emergency contact information
- `goals` - Recovery goals

## Security

- Passwords are hashed using bcrypt
- JWT tokens for secure authentication
- Protected API routes requiring authentication
- CORS configuration for frontend-backend communication
- Input validation on all endpoints

## Crisis Resources

The app includes quick access to:
- **988 Suicide & Crisis Lifeline**: Call or Text 988
- **Crisis Text Line**: Text HOME to 741741
- **SAMHSA Helpline**: 1-800-662-4357
- **Emergency**: 911

## Important Notes

- This is a **personal tracking tool** to support recovery
- Always consult with mental health professionals for proper care
- In crisis situations, contact emergency services immediately
- All data is stored locally and securely
- Regular backups recommended

## Development

### Backend Development Mode
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development Mode
```bash
cd frontend
npm run dev  # Hot reload enabled
```

### Building for Production

Frontend:
```bash
cd frontend
npm run build
```

## Project Structure

```
mental-health-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── initDatabase.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── profile.js
│   │   │   ├── moods.js
│   │   │   ├── journal.js
│   │   │   ├── symptoms.js
│   │   │   ├── triggers.js
│   │   │   ├── coping.js
│   │   │   ├── contacts.js
│   │   │   └── goals.js
│   │   └── server.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MoodTracker.jsx
│   │   │   ├── Journal.jsx
│   │   │   ├── Symptoms.jsx
│   │   │   ├── Triggers.jsx
│   │   │   ├── CopingStrategies.jsx
│   │   │   ├── Goals.jsx
│   │   │   ├── EmergencyContacts.jsx
│   │   │   └── Profile.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   └── App.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Future Enhancements

- Export data to PDF/CSV
- Data backup and restore
- Medication tracking integration
- Appointment reminders
- Weekly/monthly reports
- Mobile app (React Native)
- Offline support with sync
- Multi-language support
- Dark mode

## License

MIT

## Support

This tool is designed to complement professional mental health care, not replace it. If you're experiencing a mental health crisis, please reach out to:

- **National Suicide Prevention Lifeline**: 988
- **Crisis Text Line**: Text HOME to 741741
- **Emergency Services**: 911

## Contributing

This is a personal wellness tool. For improvements or bug fixes, feel free to fork and modify for your own use.

---

**Remember**: Your mental health matters. This tool is here to support your journey, but professional help is invaluable. Take care of yourself. 💙
