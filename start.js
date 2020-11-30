function translate (program, lexDebug = 1, syncDebug = 1, postDebug = 1) {
    //============ CONFIG ============
    let lex_debug = lexDebug        //
    let sync_debug = syncDebug      //
    let post_debug = postDebug      //
    //================================

    try {
        setTimeout(() => {
            let p = new LexAnalizer(program, 0, lex_debug)//<--------------- 1 FILE -------- 0 const Program
            p.lexAnal()
            let r = new SyncAnalizer(p.getTokenStreamTable(), p.getConstsTable(), sync_debug)
            r.parseProgram()
            let post = new PostFixAnalizer(r.getPostfixCode(), p.getConstsTable(), r.getLabels(), post_debug)
            post.postfixProcess()
        }, 150)
    } catch (e) {
        console.log(e)
    }
}
