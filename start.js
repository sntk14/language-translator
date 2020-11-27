let program = "main {\n\
float a = 5+2;\n\
}"

let lex_debug = 0
let sync_debug = 0
let post_debug = 0
let polis_debug = 0

try {
    setTimeout(() => {
        let p = new LexAnalizer(program, 0, lex_debug)//<--------------- 1 FILE -------- 0 let Program
        p.lexAnal()
        let r = new SyncAnalizer(p.getTokenStreamTable(), p.getConstsTable(), sync_debug)
        r.parseProgram()
        let post = new PostFixAnalizer(r.getPostfixCode(), p.getConstsTable(), post_debug)
        post.postfixProcess()
        let polis = PolisProgram(polis_debug)
        polis.runPolis()
    }, 50)
} catch (e) {
    console.log(e)
}
