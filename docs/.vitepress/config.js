/*
 * @Author: mao 936137804@qq.com
 * @Date: 2023-01-30 09:04:15
 * @LastEditors: mao 936137804@qq.com
 * @LastEditTime: 2023-01-30 11:40:36
 * @FilePath: /myBlog/docs/.vitepress/config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export default {
    title: 'BestMao',
    base: '/MyBlog/',
    appearance: true,
    themeConfig: {
        logo: '/img/icon.png',
        nav: [
            {
                text: '框架学习',
                items: [
                    { text: 'Vue', link: '/item-1' },
                    { text: 'React', link: '/item-2' },
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
            { text: '算法', link: '/guide' },
            { text: '面试资料', link: '/guide' },
        ],
        sidebar: [
            {
                text: 'Guide',
                items: [
                    { text: 'Introduction', link: '/introduction' },
                    { text: 'Getting Started', link: '/getting-started' },
                ]
            }
        ],
        socialLinks: [
            { icon: 'github', link: 'https://github.com/vuejs/vitepress' },
        ]
    }
}