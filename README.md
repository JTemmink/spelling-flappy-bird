
## Setup Instructies

1. **Installeer dependencies:**
   ```bash
   npm install
   ```

2. **Configureer environment variabelen:**
   - Kopieer `env.local.example` naar `.env.local`
   - Vul je Supabase credentials in:
     - `VITE_SUPABASE_URL` - Je Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` - Je Supabase anonymous key
     - `VITE_ADMIN_EMAIL` - Admin email voor autorisatie checks

3. **Database setup:**
   - Voer `supabase/schema.sql` uit in de Supabase SQL editor
   - Stel de admin email in via: `ALTER DATABASE postgres SET app.admin_email = 'jouw-admin@email.com';`

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Build voor productie:**
   ```bash
   npm run build
   ```

## Technologie Stack

- **Phaser.js 3.x** - Game engine
- **Vite** - Bundling en development server
- **Supabase** - Database en authenticatie

## Project Structuur

```
src/
├── scenes/          # Phaser scene classes
├── entities/        # Game entity classes (Bird, Pipe, etc.)
├── managers/        # Manager classes voor database en auth
├── utils/           # Utility functies en constants
└── main.js          # Entry point

assets/              # Game assets (sprites, sounds, fonts)
supabase/            # Database schema en migrations
```

## Development

- Het spel gebruikt responsive scaling (Phaser.Scale.FIT) voor mobiel en desktop
- Controls: Spatiebalk of tap om te springen
- Admin toegang wordt gecontroleerd via VITE_ADMIN_EMAIL environment variable

## Features

### Core Gameplay
- **Adaptive Learning**: Words you get wrong appear more frequently until mastered (3 consecutive correct answers)
- **Difficulty Levels**: Easy, Medium, Hard with different speeds, gap sizes, and word lengths
- **Scoring System**: Earn points for correct choices, lose points for wrong choices (score can go negative)
- **Progress Tracking**: All stats saved per player - correct streak, mastery level, last wrong date

### User Interface
- **Main Menu**: Difficulty selection, leaderboard, login/register
- **Game Over Screen**: Session stats, highscore detection, play again option
- **Admin Panel**: Word management (CRUD), bulk CSV import, statistics dashboard

### Accessibility
- **Color-Blind Friendly**: Blue/orange color scheme instead of green/red (deuteranopia/protanopia friendly)
- **Large Fonts**: Minimum 32px for game text, high contrast with text shadows
- **Responsive Design**: Works on desktop and mobile (touch controls + keyboard)
- **Target Age**: 8-11 years old

### Technical Features
- **Phaser.js 3**: Modern HTML5 game engine with arcade physics
- **Supabase**: Real-time database with Row Level Security (RLS)
- **Adaptive Algorithm**: Weighted word selection based on performance history
- **Object Pooling**: Efficient pipe recycling for smooth performance

## Admin Panel

Access the admin panel at `/admin.html` (requires admin authentication).

**Features:**
- Add/edit/delete words with correct and wrong spellings
- Bulk import via CSV (format: `correct,wrong,difficulty`)
- View word statistics (most difficult, most practiced)
- Only accessible to admin email configured in Supabase

**Setup Admin Access:**
1. In Supabase SQL Editor, run:
   ```sql
   ALTER DATABASE postgres SET app.admin_email = 'your@email.com';
   ```
2. Replace `'your@email.com'` with your actual admin email
3. Login with that email to access admin panel

## Assets

The game works with placeholder graphics (generated textures). To add real assets:

1. **Download Kenney.nl Flappy Bird Pack** (free CC0 license):
   - Visit: https://kenney.nl/assets/flappy-bird-pack
   - Extract to `/assets/sprites/`

2. **Add Sound Effects** (optional):
   - Download from freesound.org, jsfxr.com, or zapsplat.com
   - Place in `/assets/sounds/`: `jump.mp3`, `correct.mp3`, `wrong.mp3`, `crash.mp3`

3. **Uncomment Asset Loading**:
   - In `src/scenes/GameScene.js` preload() method, uncomment the asset load calls
   - In `src/entities/Bird.js` and `src/entities/Pipe.js`, update to use loaded sprites instead of generated textures

## Deployment to Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/spelling-flappy-bird.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - Add Environment Variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
     - `VITE_ADMIN_EMAIL`: Your admin email
   - Click "Deploy"

3. **Update Supabase Settings**:
   - In Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel URL to "Site URL" and "Redirect URLs"

## Mobile Testing

**Desktop:**
- Use spacebar to jump
- ESC to end game
- Responsive canvas scales to window size

**Mobile:**
- Tap anywhere to jump
- Touch controls automatically work (Phaser pointerdown event)
- Test in Chrome DevTools device emulator before deploying

**Testing Checklist:**
- [ ] Touch input works (tap to jump)
- [ ] Canvas scales correctly on different screen sizes
- [ ] Text is readable on small screens (minimum 32px)
- [ ] Buttons are large enough for touch (minimum 44x44px)
- [ ] Game runs at 60 FPS on mobile devices

## Browser Compatibility

- **Chrome/Edge**: Full support ✅
- **Firefox**: Full support ✅
- **Safari**: Full support ✅ (iOS 12+)
- **Mobile browsers**: Full support ✅

## License

MIT License (or specify your license)

## Credits

- Game assets: Kenney.nl (CC0 license)
- Game engine: Phaser.js
- Database: Supabase
- Target audience: Children ages 8-11 learning Dutch spelling

