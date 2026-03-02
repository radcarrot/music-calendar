const fs = require('fs');

let html = fs.readFileSync('C:/Users/91704/music-calendar/foragent/dashb.html', 'utf8');

const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
if (!bodyMatch) {
    console.error('No body tag found');
    process.exit(1);
}
let content = bodyMatch[1];

// Convert classes
content = content.replace(/class=/g, 'className=');

// Convert self-closing tags
content = content.replace(/<img(.*?)>/g, '<img$1 />');
content = content.replace(/<input(.*?)>/g, '<input$1 />');
content = content.replace(/<hr(.*?)>/g, '<hr$1 />');
content = content.replace(/<br(.*?)>/g, '<br />');

// Convert inline styles
content = content.replace(/style="background-image:\s*url\('([^']+)'\);?"/gi, "style={{ backgroundImage: `url('$1')` }}");

// Convert SVG attributes
content = content.replace(/stroke-linecap/g, 'strokeLinecap');
content = content.replace(/stroke-linejoin/g, 'strokeLinejoin');
content = content.replace(/stroke-width/g, 'strokeWidth');

// Convert HTML comments to JSX comments if any exist
content = content.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');

const jsx = `import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = () => {
    const { user, logout } = useAuth();
    
    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen flex flex-col overflow-hidden">
${content}
        </div>
    );
};

export default Dashboard;
`;

fs.writeFileSync('C:/Users/91704/music-calendar/frontend/src/pages/Dashboard.jsx', jsx);
console.log('Script completed');
