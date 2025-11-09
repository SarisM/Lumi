// src/vite-env.d.ts (o similar)

/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PROJECTID: string
    readonly VITE_PUBLICANONKEY: string
    // Añade cualquier otra variable VITE_... aquí
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }