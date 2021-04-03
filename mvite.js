const Koa = require('koa')
const app = new Koa()
const fs = require('fs')
const path = require('path')
const compilerSfc = require('@vue/compiler-sfc')
const compilerDom = require('@vue/compiler-dom')

function rewriteImport (content) {
    return content.replace(/ from ['"](.*)['"]/g, function (s0, s1) {
        // is relative path
        if (s1.startsWith('/') || s1.startsWith('./') || s1.startsWith('../')) {
            return s0
        } else {
            return ` from '/@modules/${s1}'`
        }
    })
} 

app.use(async ctx => {
    const { url, query } = ctx.request
    if (url === '/') {
        const p = path.join(__dirname, './index.html')
        ctx.type = 'text/html'
        ctx.body = fs.readFileSync(p, 'utf-8')
    } else if (url.endsWith('.js')) {
        const p = path.join(__dirname, url)
        ctx.type = 'text/javascript'
        ctx.body = rewriteImport(fs.readFileSync(p, 'utf-8'))
    } else if (url.startsWith('/@modules/')) {
        const moduleName = url.replace('@modules', '')
        const prefix = path.join(__dirname, '/node_modules', moduleName)
        const module = require(prefix + '/package.json').module
        const filePath = path.join(prefix, module)
        const ret = fs.readFileSync(filePath, 'utf-8')

        ctx.type = 'text/javascript'
        ctx.body = rewriteImport(ret)
    } else if (url.indexOf('.vue') > -1) {
        const p = path.join(__dirname, url.split('?')[0])
        // compile vue sfc
        const ret = compilerSfc.parse(fs.readFileSync(p, 'utf-8'))
        // console.log(ret);

        if (!query.type) {
            // converts the default export to a constant
            const scriptContent = ret.descriptor.script.content;
            const script = scriptContent.replace(
                'export default', 
                'const __script = '
            )
            ctx.type = 'text/javascript'
            ctx.body = `
                ${rewriteImport(script)}
                // converts the template processing to another request
                import { render as __render } from '${url}?type=template'
                __script.render = __render
                export default __script
            `
        } else if (query.type === 'template'){
            const tpl = ret.descriptor.template.content
            const renderModule = compilerDom.compile(tpl, { mode: 'module' }).code
            // console.log('@@@render', render)
            ctx.type = 'text/javascript'
            ctx.body = rewriteImport(renderModule)
        }
    } else if (url.endsWith('.png')) {
        ctx.body = fs.readFileSync('src' + url)
    }
})

app.listen(3000, () => {
    console.log('mvite start!');
})