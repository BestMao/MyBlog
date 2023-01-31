/*
 * @Author: mao 936137804@qq.com
 * @Date: 2023-01-30 09:04:15
 * @LastEditors: mao 936137804@qq.com
 * @LastEditTime: 2023-01-31 17:11:02
 * @FilePath: /myBlog/docs/.vitepress/config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export default {
    title: 'BestMao',
    base: '/MyBlog/',
    appearance: true,
    head: [
        [
            'meta',
            { name: 'referrer', content: 'no-referrer' }
        ]
        // would render: <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    ],
    themeConfig: {
        logo: '/img/icon.png',
        nav: [
            {
                text: '框架学习',
                items: [
                    { text: 'React', link: '/frame/react/React 进阶实践指南(笔记)' },
                    { text: 'Vue', link: '/frame/vue/准备工作（源码）' },
                ]
            },
            {
                text: '工作积累',
                items: [
                    { text: 'nodejs', link: '/item-1' },
                    { text: 'Typescript', link: '/item-2' },
                    { text: '项目综合', link: '/item-2' },
                    { text: 'webgl', link: '/item-2' },
                    { text: 'gis', link: '/item-2' },
                    { text: '计算机网络', link: '/item-2' },
                ]
            },
            { text: '算法', link: '/arithmetic/算法与数据结构' },
            { text: '面试资料', link: '/guide' },
        ],
        sidebar: {
            "/frame/react": [
                {
                    text: "React 进阶实践指南(笔记)",
                    link: "/frame/react/React 进阶实践指南(笔记)",
                },
                {
                    text: "react整体流程",
                    link: "/frame/react/react整体流程",
                },
            ],
            "/frame/vue": [
                {
                    text: '准备工作（源码）',
                    link: "/frame/vue/准备工作（源码）"
                }
            ]
        },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/BestMao' },
        ],
    }
}