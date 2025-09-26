# 🌸 BloomDays - Menstrual Cycle Tracker

A modern, privacy-focused menstrual cycle tracking app built with Next.js, Firebase, and beautiful UI components.

## ✨ Features

- 📅 **Cycle Tracking** - Track your menstrual cycles with beautiful calendar visualization
- 🔮 **Predictions** - AI-powered cycle predictions based on your data
- 🔐 **Secure Authentication** - Sign in with Google or email/password
- ☁️ **Real-time Sync** - Your data syncs across all devices instantly
- 📱 **Mobile-First** - Responsive design that works perfectly on all devices
- 🌙 **Dark Mode** - Beautiful dark/light theme support
- 🔒 **Privacy-First** - Your data is encrypted and only accessible by you

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Authentication**: Firebase Auth (Google + Email/Password)
- **Database**: Firebase Realtime Database
- **Real-time**: Socket.IO
- **Deployment**: Vercel

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/bloomdays.git
   cd bloomdays
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Firebase**

   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password + Google)
   - Enable Realtime Database
   - Get your Firebase config

4. **Environment Variables**
   Create a `.env` file in the root directory:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 📱 Usage

1. **Sign Up/Login** - Create an account or sign in with Google
2. **Add Period Entry** - Click the + button to log your period
3. **View Calendar** - See your cycle phases on the beautiful calendar
4. **Track Symptoms** - Add symptoms and notes for each entry
5. **Get Predictions** - View predicted cycle phases and upcoming periods

## 🔒 Privacy & Security

- All data is encrypted and stored securely in Firebase
- Only you can access your personal data
- No data is shared with third parties
- Open source and transparent

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy!

### Environment Variables for Production

Add these in your Vercel dashboard:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Authentication powered by [Firebase](https://firebase.google.com/)
- Icons by [Lucide](https://lucide.dev/)

---

Made with ❤️ for women's health and privacy.
