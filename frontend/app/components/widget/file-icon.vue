<template>
  <UIcon :name="iconName" :class="iconClass" />
</template>

<script setup lang="ts">
const props = defineProps({
  path: {
    type: String,
    required: true,
  },
  isDirectory: {
    type: Boolean,
    default: false,
  },
  isDirectoryOpen: {
    type: Boolean,
    default: false,
  },
});

// File extension to icon mapping
const fileIconMap: Record<string, string> = {
  // JavaScript/TypeScript
  'js': 'i-vscode-icons:file-type-js-official',
  'jsx': 'i-vscode-icons:file-type-reactjs',
  'ts': 'i-vscode-icons:file-type-typescript-official',
  'tsx': 'i-vscode-icons:file-type-reactts',
  'mjs': 'i-vscode-icons:file-type-js-official',
  'cjs': 'i-vscode-icons:file-type-js-official',

  // Vue
  'vue': 'i-vscode-icons:file-type-vue',

  // HTML/CSS
  'html': 'i-vscode-icons:file-type-html',
  'htm': 'i-vscode-icons:file-type-html',
  'css': 'i-vscode-icons:file-type-css',
  'scss': 'i-vscode-icons:file-type-scss',
  'sass': 'i-vscode-icons:file-type-sass',
  'less': 'i-vscode-icons:file-type-less',

  // Python
  'py': 'i-vscode-icons:file-type-python',
  'pyc': 'i-vscode-icons:file-type-python',
  'pyo': 'i-vscode-icons:file-type-python',
  'pyw': 'i-vscode-icons:file-type-python',

  // Go
  'go': 'i-vscode-icons:file-type-go',

  // Rust
  'rs': 'i-vscode-icons:file-type-rust',

  // C/C++
  'c': 'i-vscode-icons:file-type-c',
  'h': 'i-vscode-icons:file-type-c',
  'cpp': 'i-vscode-icons:file-type-cpp',
  'cc': 'i-vscode-icons:file-type-cpp',
  'cxx': 'i-vscode-icons:file-type-cpp',
  'hpp': 'i-vscode-icons:file-type-cpp',

  // Java
  'java': 'i-vscode-icons:file-type-java',
  'class': 'i-vscode-icons:file-type-java',
  'jar': 'i-vscode-icons:file-type-jar',

  // JSON/YAML/TOML
  'json': 'i-vscode-icons:file-type-json',
  'yaml': 'i-vscode-icons:file-type-yaml',
  'yml': 'i-vscode-icons:file-type-yaml',
  'toml': 'i-vscode-icons:file-type-toml',

  // Markdown/Text
  'md': 'i-vscode-icons:file-type-markdown',
  'txt': 'i-vscode-icons:file-type-text',
  'log': 'i-vscode-icons:file-type-log',

  // Images
  'png': 'i-vscode-icons:file-type-image',
  'jpg': 'i-vscode-icons:file-type-image',
  'jpeg': 'i-vscode-icons:file-type-image',
  'gif': 'i-vscode-icons:file-type-image',
  'svg': 'i-vscode-icons:file-type-svg',
  'webp': 'i-vscode-icons:file-type-image',
  'ico': 'i-vscode-icons:file-type-favicon',

  // Docker/Config
  'dockerfile': 'i-vscode-icons:file-type-docker',
  'dockerignore': 'i-vscode-icons:file-type-docker',
  'env': 'i-vscode-icons:file-type-dotenv',

  // Git
  'gitignore': 'i-vscode-icons:file-type-git',
  'gitattributes': 'i-vscode-icons:file-type-git',

  // Package managers
  'lock': 'i-vscode-icons:file-type-npm',

  // Shell
  'sh': 'i-vscode-icons:file-type-shell',
  'bash': 'i-vscode-icons:file-type-shell',
  'zsh': 'i-vscode-icons:file-type-shell',

  // Database
  'sql': 'i-vscode-icons:file-type-sql',
  'db': 'i-vscode-icons:file-type-sqlite',

  // Archives
  'zip': 'i-vscode-icons:file-type-zip',
  'tar': 'i-vscode-icons:file-type-zip',
  'gz': 'i-vscode-icons:file-type-zip',
  '7z': 'i-vscode-icons:file-type-zip',

  // PDF/Docs
  'pdf': 'i-vscode-icons:file-type-pdf',
  'doc': 'i-vscode-icons:file-type-word',
  'docx': 'i-vscode-icons:file-type-word',
  'xls': 'i-vscode-icons:file-type-excel',
  'xlsx': 'i-vscode-icons:file-type-excel',
};

// Special filename mappings (exact match)
const specialFileMap: Record<string, string> = {
  'package.json': 'i-vscode-icons:file-type-node',
  'package-lock.json': 'i-vscode-icons:file-type-npm',
  'yarn.lock': 'i-vscode-icons:file-type-yarn',
  'pnpm-lock.yaml': 'i-vscode-icons:file-type-pnpm',
  'tsconfig.json': 'i-vscode-icons:file-type-tsconfig',
  'nuxt.config.ts': 'i-vscode-icons:file-type-nuxt',
  'nuxt.config.js': 'i-vscode-icons:file-type-nuxt',
  'vite.config.ts': 'i-vscode-icons:file-type-vite',
  'vite.config.js': 'i-vscode-icons:file-type-vite',
  'tailwind.config.js': 'i-vscode-icons:file-type-tailwind',
  'tailwind.config.ts': 'i-vscode-icons:file-type-tailwind',
  'README.md': 'i-vscode-icons:file-type-readme',
  'LICENSE': 'i-vscode-icons:file-type-license',
  'Dockerfile': 'i-vscode-icons:file-type-docker',
  '.dockerignore': 'i-vscode-icons:file-type-docker',
  '.env': 'i-vscode-icons:file-type-dotenv',
  '.env.local': 'i-vscode-icons:file-type-dotenv',
  '.env.development': 'i-vscode-icons:file-type-dotenv',
  '.env.production': 'i-vscode-icons:file-type-dotenv',
  '.gitignore': 'i-vscode-icons:file-type-git',
  '.gitattributes': 'i-vscode-icons:file-type-git',
  'go.mod': 'i-vscode-icons:file-type-go-mod',
  'go.sum': 'i-vscode-icons:file-type-go-mod',
  'Cargo.toml': 'i-vscode-icons:file-type-cargo',
  'Cargo.lock': 'i-vscode-icons:file-type-cargo',
};

const getFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return filename.slice(lastDotIndex + 1).toLowerCase();
};

const iconName = computed(() => {
  if (props.isDirectory) {
    return props.isDirectoryOpen
      ? 'i-vscode-icons:default-folder-opened'
      : 'i-vscode-icons:default-folder';
  }

  // Check for special filename matches first
  const fileName = props.path.split('/').pop() || props.path;
  if (specialFileMap[fileName]) {
    return specialFileMap[fileName];
  }

  // Check for extension-based icons
  const extension = getFileExtension(fileName);
  if (fileIconMap[extension]) {
    return fileIconMap[extension];
  }

  // Default file icon
  return 'i-heroicons:document';
});

const iconClass = computed(() => {
  return 'w-4 h-4';
});
</script>
