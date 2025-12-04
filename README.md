# Muhammad Sarmad Sohail - Portfolio

Personal portfolio website showcasing data engineering and machine learning projects.

**Live Site:** https://msarmadsohail.github.io

## Features

- ✨ Modern, interactive design with smooth animations
- 🎨 Dark theme with navy/burgundy color scheme
- 📱 Fully responsive (desktop, tablet, mobile)
- 🚀 GSAP scroll animations
- 💼 Professional project showcase
- 📄 Publications section
- 🔗 Social media integration

## Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom styling with animations
- **JavaScript** - Interactive features
- **GSAP** - Scroll animations
- **Google Fonts** - Space Grotesk & Inter

## File Structure

```
msarmadsohail.github.io/
├── index.html              # Main HTML structure
├── css/
│   └── style.css           # All styling
├── js/
│   └── main.js             # All interactions & animations
├── assets/
│   ├── profile.png         # Profile photo
│   └── M_SARMAD_SOHAIL_CV.pdf  # Resume
└── README.md
```

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/msarmadsohail/msarmadsohail.github.io.git
```

2. Open `index.html` in your browser or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

## Deployment

This site is deployed using **GitHub Pages**.

To deploy your own:
1. Push code to repository named `username.github.io`
2. Enable GitHub Pages in repository settings
3. Site will be live at `https://username.github.io`

## Adding New Projects

To add a new project, copy this template in `index.html`:

```html
<div class="project-card">
    <div class="project-glow"></div>
    <div class="project-header">
        <span class="project-badge">Your Tag</span>
    </div>
    <h3>Project Title</h3>
    <p>Project description goes here...</p>
    <div class="project-tech">
        <span class="tech-tag">Tech1</span>
        <span class="tech-tag">Tech2</span>
    </div>
    <div class="project-links">
        <a href="#" target="_blank">💻 Code</a>
        <a href="#" target="_blank">🎥 Demo</a>
    </div>
</div>
```

## Customization

### Colors
Edit CSS variables in `css/style.css`:
```css
:root {
    --navy: #1e40af;
    --burgundy: #dc2626;
    --accent-blue: #3b82f6;
}
```

### Content
Update HTML sections in `index.html`:
- Hero section: Change tagline, description
- About section: Update bio text
- Projects: Add/remove project cards
- Contact: Update email and social links

## Performance

- ⚡ Minimal external dependencies
- 🎯 Optimized animations
- 📦 Lightweight assets
- 🌐 Fast loading times

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

© 2025 Muhammad Sarmad Sohail. All rights reserved.

## Contact

- **LinkedIn:** [msarmadsohail](https://linkedin.com/in/msarmadsohail)
- **GitHub:** [msarmadsohail](https://github.com/msarmadsohail)
