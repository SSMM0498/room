<template>
    <section id="learn" class="flex w-full items-center justify-center">
        <div class="relative w-full bg-black text-center flex items-center justify-center p-10">
            <div class="flex flex-wrap justify-center items-center gap-8 w-full">
                <widget-tag v-for="tag in customTags" :key="tag.name" :link="tag.link" :size="'xl'">
                    {{ tag.name }}
                </widget-tag>
            </div>
            <div class="absolute flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-md p-5">
                <h2 class="text-white text-4xl lg:text-5xl font-bold tracking-tighter">{{ $t('learn.title') }}</h2>
                <p class="text-white mt-4 text-lg max-w-2xl mx-auto">{{ $t('learn.subtitle') }}</p>
                <UButton color="neutral" variant="subtle" class="mt-8" :to="$localePath('/catalog/')" size="lg">
                    {{ $t('community.start_learning') }}
                </UButton>
            </div>
        </div>
    </section>
</template>
<script setup lang="ts">
const { tags } = useTags();
const customTags = [
    ...tags.value.map(tag => ({
        name: tag.name,
        link: tag.name.toLowerCase()
    })),
    { name: 'C++', link: 'cpp' },
    { name: 'Python', link: 'python' },
    { name: 'JavaScript', link: 'javascript' },
    { name: 'Java', link: 'java' },
    { name: 'Ruby', link: 'ruby' },
    { name: 'Go', link: 'go' },
    { name: 'Rust', link: 'rust' },
    { name: 'PHP', link: 'php' },
    { name: 'Swift', link: 'swift' },
    { name: 'Kotlin', link: 'kotlin' },
    { name: 'TypeScript', link: 'typescript' },
    { name: 'HTML/CSS', link: 'html-css' },
    { name: 'SQL', link: 'sql' },
    { name: 'Shell Scripting', link: 'shell-scripting' },
    { name: 'Dart', link: 'dart' },
    { name: 'R', link: 'r' },
    { name: 'MATLAB', link: 'matlab' },
    { name: 'Scala', link: 'scala' },
    { name: 'Perl', link: 'perl' },
    { name: 'Lua', link: 'lua' },
    { name: 'Haskell', link: 'haskell' },
    { name: 'Elixir', link: 'elixir' },
    { name: 'C#', link: 'csharp' },
    { name: 'Objective-C', link: 'objective-c' },
    { name: 'Visual Basic', link: 'visual-basic' },
    { name: 'Assembly', link: 'assembly' },
    { name: 'Erlang', link: 'erlang' },
    { name: 'F#', link: 'fsharp' },
    { name: 'Clojure', link: 'clojure' },
    { name: 'Groovy', link: 'groovy' },
    { name: 'Crystal', link: 'crystal' },
    { name: 'OCaml', link: 'ocaml' },
    { name: 'Scheme', link: 'scheme' },
    { name: 'Solidity', link: 'solidity' },
    { name: 'VHDL', link: 'vhdl' },
    { name: 'Verilog', link: 'verilog' },
    { name: 'Ada', link: 'ada' },
    { name: 'Fortran', link: 'fortran' },
    { name: 'COBOL', link: 'cobol' },
    { name: 'Pascal', link: 'pascal' },
    { name: 'Web', link: 'web' },
    { name: 'Mobile', link: 'mobile' },
    { name: 'Game Development', link: 'game-development' },
    { name: 'Data Science', link: 'data-science' },
    { name: 'Machine Learning', link: 'machine-learning' },
    { name: 'DevOps', link: 'devops' },
    { name: 'Cybersecurity', link: 'cybersecurity' },
    { name: 'Blockchain', link: 'blockchain' },
    { name: 'Cloud Computing', link: 'cloud-computing' },
    { name: 'AR/VR', link: 'ar-vr' },
    { name: 'AI', link: 'ai' },
    { name: 'IoT', link: 'iot' },
    { name: 'Quantum Computing', link: 'quantum-computing' },
    { name: 'Robotics', link: 'robotics' },
    { name: 'Embedded Systems', link: 'embedded-systems' },
    { name: 'Big Data', link: 'big-data' },
    { name: 'Software Engineering', link: 'software-engineering' },
    { name: 'Web Development', link: 'web-development' },
    { name: 'Mobile Development', link: 'mobile-development' },
    { name: 'UI/UX Design', link: 'ui-ux-design' },
    { name: 'OAuth', link: 'oauth' },
    { name: 'GraphQL', link: 'graphql' },
    { name: 'REST APIs', link: 'rest-apis' },
    { name: 'Microservices', link: 'microservices' },
    { name: 'Serverless', link: 'serverless' },
    { name: 'CI/CD', link: 'ci-cd' },
    { name: 'Testing', link: 'testing' },
    { name: 'Version Control', link: 'version-control' },
    { name: 'Git', link: 'git' },
    { name: 'Kafka', link: 'kafka' },
    { name: 'Redis', link: 'redis' },
    { name: 'Docker', link: 'docker' },
    { name: 'Kubernetes', link: 'kubernetes' },
    { name: 'Terraform', link: 'terraform' },
    { name: 'Ansible', link: 'ansible' },
    { name: 'Prometheus', link: 'prometheus' },
    { name: 'Grafana', link: 'grafana' },
    { name: 'ELK Stack', link: 'elk-stack' },
    { name: 'Splunk', link: 'splunk' },
    { name: 'Nagios', link: 'nagios' },
    { name: 'Zabbix', link: 'zabbix' },
    { name: 'Jenkins', link: 'jenkins' },
    { name: 'CircleCI', link: 'circleci' },
    { name: 'Travis CI', link: 'travis-ci' },
    { name: 'GitHub Actions', link: 'github-actions' },
    { name: 'Backend Development', link: 'backend-development' },
    { name: 'Frontend Development', link: 'frontend-development' },
    { name: 'Full Stack Development', link: 'full-stack-development' },
    { name: 'API Development', link: 'api-development' },
    { name: 'Database Management', link: 'database-management' },
    { name: 'Data Visualization', link: 'data-visualization' },
    { name: 'Data Engineering', link: 'data-engineering' },
    { name: 'Data Analytics', link: 'data-analytics' }
]
</script>