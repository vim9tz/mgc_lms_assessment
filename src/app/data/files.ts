// Sample file contents for demonstration
export const fileContents: Record<string, string> = {
  'src/components/CodeEditor.tsx': `import React from 'react';
import Editor from "@monaco-editor/react";

export function CodeEditor({ code, onChange }) {
  return (
    <Editor
      height="100%"
      defaultLanguage="typescript"
      value={code}
      onChange={onChange}
    />
  );
}`,
  'src/components/ProjectStructure.tsx': `import React from 'react';
import { Folder, FileCode } from 'lucide-react';

export function ProjectStructure({ files }) {
  return (
    <div className="file-tree">
      {files.map(file => (
        <div key={file.path}>
          {file.name}
        </div>
      ))}
    </div>
  );
}`,
  'src/pages/index.tsx': `import { useState } from 'react';
import { CodeEditor } from '../components/CodeEditor';

export default function Home() {
  return (
    <div>
      <h1>Code Editor</h1>
      <CodeEditor />
    </div>
  );
}`,
  'src/pages/_app.tsx': `import type { AppProps } from 'next/app';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}`,
  'src/utils/api.ts': `export async function fetchData() {
  const response = await fetch('/api/data');
  return response.json();
}`,
  'backend/src/controllers/challenge.controller.ts': `import { Request, Response } from 'express';

export const getChallenges = async (req: Request, res: Response) => {
  // Implementation
};`,
  'backend/src/models/Challenge.ts': `import mongoose from 'mongoose';

const ChallengeSchema = new mongoose.Schema({
  title: String,
  description: String,
  // Other fields
});`,
  'backend/src/routes/api.ts': `import express from 'express';
import { getChallenges } from '../controllers/challenge.controller';

const router = express.Router();
router.get('/challenges', getChallenges);

export default router;`,
  'backend/src/middleware/auth.ts': `export const authenticate = (req, res, next) => {
  // Authentication logic
  next();
};`,
  'database/schemas/challenge.schema.js': `const challengeSchema = {
  title: String,
  description: String,
  testCases: Array,
  // Other fields
};`,
  'database/migrations/initial.js': `// Initial database setup
db.createCollection('challenges');`,
  'README.md': `# MERN Code Challenge Platform

A platform for coding challenges using the MERN stack.`,
  'docker-compose.yml': `version: '3'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
  backend:
    build: ./backend
    ports:
      - "5000:5000"`
}