/**
 * Add Navigation Bar to All Pages
 * 
 * This script adds the Xrypt navigation bar to all HTML pages
 * in the public directory for consistent navigation across the site.
 */

const fs = require('fs');
const path = require('path');

// Pages to add navigation to
const pages = [
    'public/index.html',
    'public/signals.html',
    'public/trade-analyzer.html',
    'public/signal-performance.html',
    'public/notifications.html',
    'public/get-paid-for-data.html',
    'public/admin.html'
];

// Navigation HTML to inject
const navigationHTML = `
<!-- Xrypt Navigation Bar -->
<style>
    .xrypt-nav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: rgba(3, 7, 18, 0.95);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(74, 222, 128, 0.2);
        z-index: 1000;
        padding: 15px 0;
    }
    
    .xrypt-nav-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .xrypt-nav-logo {
        font-size: 24px;
        font-weight: 700;
        color: #4ade80;
        text-decoration: none;
        font-family: 'JetBrains Mono', monospace;
    }
    
    .xrypt-nav-logo::before {
        content: '> ';
        color: #22c55e;
    }
    
    .xrypt-nav-links {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
    }
    
    .xrypt-nav-link {
        padding: 8px 16px;
        background: rgba(3, 7, 18, 0.6);
        border: 1px solid #374151;
        border-radius: 8px;
        color: #f3f4f6;
        text-decoration: none;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.3s;
        font-family: 'JetBrains Mono', monospace;
        white-space: nowrap;
    }
    
    .xrypt-nav-link:hover {
        border-color: #4ade80;
        background: rgba(74, 222, 128, 0.1);
        box-shadow: 0 0 20px rgba(74, 222, 128, 0.2);
    }
    
    .xrypt-nav-link.active {
        border-color: #22c55e;
        background: #16a34a;
        color: #030712;
    }
    
    .xrypt-nav-mobile-toggle {
        display: none;
        background: none;
        border: 1px solid #374151;
        color: #4ade80;
        font-size: 24px;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
    }
    
    @media (max-width: 1024px) {
        .xrypt-nav-links {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(3, 7, 18, 0.98);
            flex-direction: column;
            padding: 20px;
            border-bottom: 1px solid rgba(74, 222, 128, 0.2);
        }
        
        .xrypt-nav-links.active {
            display: flex;
        }
        
        .xrypt-nav-mobile-toggle {
            display: block;
        }
        
        .xrypt-nav-link {
            width: 100%;
            text-align: center;
        }
    }
    
    /* Add padding to body to account for fixed nav */
    body {
        padding-top: 80px !important;
    }
</style>

<nav class="xrypt-nav">
    <div class="xrypt-nav-container">
        <a href="/" class="xrypt-nav-logo">Xrypt</a>
        
        <button class="xrypt-nav-mobile-toggle" onclick="toggleMobileNav()">☰</button>
        
        <div class="xrypt-nav-links" id="xryptNavLinks">
            <a href="/" class="xrypt-nav-link">🏠 Home</a>
            <a href="/signals.html" class="xrypt-nav-link">📊 Signals</a>
            <a href="/trade-analyzer.html" class="xrypt-nav-link">📈 Analyzer</a>
            <a href="/signal-performance.html" class="xrypt-nav-link">🎯 Performance</a>
            <a href="/notifications.html" class="xrypt-nav-link">🔔 Alerts</a>
            <a href="/get-paid-for-data.html" class="xrypt-nav-link">💰 Get Paid</a>
            <a href="/admin.html" class="xrypt-nav-link">⚙️ Admin</a>
        </div>
    </div>
</nav>

<script>
    function toggleMobileNav() {
        const navLinks = document.getElementById('xryptNavLinks');
        navLinks.classList.toggle('active');
    }
    
    // Highlight active page
    document.addEventListener('DOMContentLoaded', function() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.xrypt-nav-link');
        
        navLinks.forEach(link => {
            const linkPath = new URL(link.href).pathname;
            if (currentPath === linkPath || (currentPath === '/' && linkPath === '/') || (currentPath === '/index.html' && linkPath === '/')) {
                link.classList.add('active');
            }
        });
    });
</script>
`;

function addNavigationToPage(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if navigation already exists
        if (content.includes('class="xrypt-nav"')) {
            console.log(`✅ Navigation already exists in ${filePath}`);
            return;
        }
        
        // Add navigation right after <body> tag
        content = content.replace(/<body([^>]*)>/, `<body$1>\n${navigationHTML}`);
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Added navigation to ${filePath}`);
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
    }
}

console.log('🚀 Adding navigation to all pages...\n');

pages.forEach(page => {
    if (fs.existsSync(page)) {
        addNavigationToPage(page);
    } else {
        console.log(`⚠️  File not found: ${page}`);
    }
});

console.log('\n✅ Navigation addition complete!');
