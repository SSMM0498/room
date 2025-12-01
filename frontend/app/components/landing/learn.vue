<template>
    <section id="learn" class="flex w-full items-center justify-center overflow-hidden">
        <div class="relative w-full text-center flex items-center justify-center p-10">
            <div class="flex flex-wrap justify-center items-center gap-8 w-full">
                <widget-tag v-for="tag in customTags" :key="tag.name" :link="tag.link" :size="'xl'">
                    {{ tag.name }}
                </widget-tag>
            </div>
            <div
                class="absolute flex flex-col items-end justify-center before:content-[''] before:absolute before:inset-0 before:bg-white/95 dark:before:bg-gray-900/95 before:transition hover:before:translate-x-[100%] top-0 bottom-0 left-0 before:translate-x-[50%] right-0 before:w-full before:h-full hover:backdrop-blur-none transition-5">
                <h2 class="text-gray-950 dark:text-white text-4xl lg:text-5xl font-bold tracking-tighter z-10 bg-white dark:bg-gray-900 text-right py-2 pr-10">{{ $t('learn.title') }}</h2>
                <p class="text-gray-950 dark:text-white text-lg max-w-2xl pr-10 text-right z-10 bg-white dark:bg-gray-900 py-5">{{ $t('learn.subtitle') }}</p>
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
    { name: 'HTML', link: 'html' },
    { name: 'CSS', link: 'css' },
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