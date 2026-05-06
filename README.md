# MD-Notes v2.0

A premium, e-book inspired Markdown sanctuary. MD-Notes is a distraction-free writing environment designed for those who appreciate beautiful typography and creative freedom.

## ✨ The Dual-Mode Experience

MD-Notes simplifies the writing workflow into two powerful, distinct modes:

- **Markdown Mode**: A high-performance, structured WYSIWYG editor with full LaTeX support via KaTeX. Perfect for documentation, technical notes, and long-form writing.
- **Free Mode**: An infinite creative canvas where notes are objects. Drag, rotate, and layer text and images to create visual designs, mood boards, or spatial brainstorms.

## 🌟 Key Features

- **Immersive Onboarding**: A cinematic, full-screen visual tour that introduces you to the sanctuary’s features with vibrant gradients and smooth transitions.
- **Free-Form Canvas**: Draggable and rotatable elements with a smart text-wrapping engine that allows text to flow organically around images.
- **Mathematical Mastery**: High-performance LaTeX typesetting support for complex formulas, both inline ($E=mc^2$) and in blocks ($$ ... $$).
- **Dynamic Design System**: Personalize your workspace with curated accent colors. Features a fluid "LavaLamp" background in light mode that adapts to your chosen theme.
- **Notch Nook Toolbar**: A floating, minimalist navigation capsule that gives you instant access to formatting tools while staying out of your way.
- **Premium E-Book Aesthetics**: A refined UI inspired by high-end e-readers, featuring a warm "paper" light theme and a deep, immersive dark mode.
- **Staggered Entry Animations**: Every interaction is choreographed. From the library grid to the creation menu, items reveal themselves with smooth, sequential transitions.
- **Responsive & Mobile Ready**: Built for the palm of your hand. Fully optimized for Android via Capacitor with fluid gestures and native-feeling interactions.

## 🛠 Tech Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Editor Core**: [Tiptap](https://tiptap.dev/) (ProseMirror based)
- **Math Engine**: [KaTeX](https://katex.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & Tailwind CSS Animate
- **Native Bridge**: [Capacitor](https://capacitorjs.com/) (Android)
- **Database**: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via a custom wrapper)

## 🚀 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rajsriv/MD-Notes.git
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Launch the sanctuary**:
   ```bash
   npm run dev
   ```

## 📱 Mobile Deployment

Sync and open the project in Android Studio:
```bash
npx cap sync
npx cap open android
```

## 📄 License

Crafted with care by [Raj Sriv](https://github.com/rajsriv). Released under the [MIT License](LICENSE).
