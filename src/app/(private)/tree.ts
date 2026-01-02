export type TreeNode = {
  name: string;
  type: "folder" | "file";
  path?: string;
  content?: string;
  children?: TreeNode[];
};

export const folderTree: TreeNode = {
  name: "root",
  type: "folder",
  children: [
    {
      name: "package.json",
      type: "file",
      path: "package.json",
      content: `{
  "name": "react-webcontainer",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}`,
    },
    {
      name: "vite.config.js",
      type: "file",
      path: "vite.config.js",
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});`,
    },
    {
      name: "index.html",
      type: "file",
      path: "index.html",
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React WebContainer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
    },
    {
      name: "src",
      type: "folder",
      children: [
        {
          name: "main.jsx",
          type: "file",
          path: "src/main.jsx",
          content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
        },
        {
          name: "App.jsx",
          type: "file",
          path: "src/App.jsx",
          content: `import React from 'react';

export default function App() {
  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      🚀 Hello from React in WebContainer!
    </div>
  );
}`,
        },
      ],
    },
  ],
};
