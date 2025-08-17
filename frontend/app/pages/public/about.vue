<template>
  <div class="container overflow-y-scroll h-full w-full">
    <h1 class="text-3xl font-bold mb-8">Mock Code Editor Scenarios</h1>

    <!-- Scenario 1: Tesla Project with Code Report -->
    <h2 class="text-2xl font-semibold mt-8 mb-4">Scenario 1: Code Report</h2>
    <mock-code-editor :files="scenario1.files" :startLineNumber="1" :darkMode="false" :showGrid="false"
      rightPanelTitle="">

      <!-- Right Panel: Tesla Preview -->
      <template #right-panel>
        <div class="relative flex flex-1 bg-gray-100 opacity-100">
          <img
            src="https://wsrv.nl/?url=https%3A%2F%2Fcodedamn.com%2Fassets%2Flanding-page-assets%2Ftesla.png&amp;w=388&amp;q=82&amp;output=webp"
            alt="Tesla landing page clone featuring the model-3" loading="lazy" class="w-auto object-cover"
            style="color: transparent;">
        </div>
      </template>

      <!-- Floating Bottom Left: Code Report -->
      <template #floating-bottom-left>
        <mock-code-report />
      </template>
    </mock-code-editor>

    <!-- Scenario 2: Challenges Completed & Video Overlay -->
    <h2 class="text-2xl font-semibold mt-12 mb-4">Scenario 2: Challenges & Video</h2>
    <mock-code-editor :files="scenario2.files" :startLineNumber="5" :darkMode="true" :showGrid="true"
      rightPanelTitle="Learn + Practice">
      <!-- Floating Top Right: Video Overlay -->
      <template #floating-top-right>
        <mock-video />
      </template>

      <!-- Floating Bottom Left: Challenge Progress -->
      <template #floating-bottom-left>
        <mock-challenge-progress :completedChallenges="6" :totalChallenges="6" />
      </template>
    </mock-code-editor>

    <!-- Scenario 3: AI Chat Help -->
    <h2 class="text-2xl font-semibold mt-12 mb-4">Scenario 3: AI Chat</h2>
    <mock-code-editor :files="scenario3.files" :startLineNumber="1" :darkMode="false" :showGrid="false"
      rightPanelTitle="">
      <!-- Right Panel: Output and Checklist -->
      <template #right-panel>
        <mock-output />
      </template>

      <!-- Floating Top Right: Incoming Chat -->
      <template #floating-top-right>
        <mock-ai-chat message="I'm stuck, please help me with this challenge." user="Sarah" time="10:20 PM" isIncoming
          profilePic="https://wsrv.nl/?url=https%3A%2F%2Fcodedamn.com%2Fassets%2Flanding-page-assets%2Fprofiles%2Fthumb-3.png&amp;w=64&amp;q=82&amp;output=webp" />
      </template>

      <!-- Floating Bottom Left: Outgoing Chat -->
      <template #floating-bottom-left>
        <mock-ai-chat message="Sure, Convert the params using the `str()` function." user="Jarvis" time="10:20 PM"
          profilePic="https://wsrv.nl/?url=https%3A%2F%2Fcodedamn.com%2Fassets%2Flanding-page-assets%2Fprofiles%2Fjarvis.png&amp;w=64&amp;q=82&amp;output=webp" />
      </template>
    </mock-code-editor>
  </div>
</template>

<script lang="ts" setup>
const scenario1 = reactive({
  files: [
    {
      name: 'Tesla.jsx',
      content: `// Tesla clone project
....
<Layout>
  <Container>
    <Hero feature="model-3"/>
  </Container>
</Layout>
....`,
      language: 'jsx'
    },
    {
      name: 'globals.css',
      content: `body {
  margin: 0;
  font-family: sans-serif;
}`,
      language: 'css'
    }
  ]
});

const scenario2 = reactive({
  files: [
    {
      name: 'index.jsx',
      content: `export function ({ data }) => {
  return <Layout>
    <Game details={data} />
  </Layout>
}`,
      language: 'jsx'
    }
  ]
});

const scenario3 = reactive({
  files: [
    {
      name: 'main.py',
      content: `# Concatenate the parameters
def concat(p1,p2):
  return str(p1) + str(p2)

param_1 = 13
param_2 = 37
print(concat(param_1,param_2))
`,
      language: 'python'
    }
  ]
});

definePageMeta({
  alias: ["/about"],
})
</script>
